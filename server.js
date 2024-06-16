require('dotenv').config();
const express = require('express');
const mqtt = require('mqtt');
const { exec } = require('child_process');
const { downloadResources } = require('./resource_downloader');
const fs = require('fs');

const app = express();

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.error('Error: .env file not found. Exiting.');
  process.exit(1);
}

// Check required environment variables
const requiredEnvVars = ['MQTT_BROKER_URL', 'MQTT_TOPIC', 'REST_PORT', 'MQTT_USERNAME', 'MQTT_PASSWORD'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Error: Missing required environment variables: ${missingEnvVars.join(', ')}. Exiting.`);
  process.exit(1);
}

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
const MQTT_TOPIC = process.env.MQTT_TOPIC;
const REST_PORT = process.env.REST_PORT;
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;
const MQTT_PORT = process.env.MQTT_PORT || 1883; // Default to 1883 if not specified

let isBusy = false;
let client;
let selectedCard = '';
let selectedDevice = '';

const actionCommands = {
  speak: `echo {{text}} | ./piper/piper --model voices/{{options}} --output_raw | aplay --channels=1 --file-type raw --rate=22050 -f S16_LE -D plughw:{{selectedCard}}`,
  play: `mpg123 -a hw:{{selectedCard}},{{selectedDevice}} songs/{{text}}`,
  // Add more actions and their corresponding commands here
};

const commandOptions = {
  'en-US_male': 'en_US-ryan-high.onnx',
  'en-US_female': 'en_US-libritts-high.onnx',
  'es-ES_male': 'es_ES-sharvard-medium.onnx',
  'es-ES_female': 'es_ES-mls_10246-low.onnx'
};

const mqttOptions = {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  port: MQTT_PORT
};

// Function to extract ALSA output interfaces
const getAlsaOutputInterfaces = () => {
  return new Promise((resolve, reject) => {
    exec('aplay -l', (error, stdout, stderr) => {
      if (error) {
        reject(stderr);
      } else {
        const interfaces = [];
        const lines = stdout.split('\n');
        for (const line of lines) {
          const match = line.match(/card (\d+):.*device (\d+):/);
          if (match) {
            interfaces.push({ card: match[1], device: match[2] });
          }
        }
        resolve(interfaces);
      }
    });
  });
};

// Function to test ALSA output interface using speaker-test
const testAlsaOutput = ({ card, device }) => {
  return new Promise((resolve, reject) => {
    exec(`speaker-test -c 2 -D plughw:${card},${device} -t wav -l 1`, (error, stdout, stderr) => {
      if (!error) {
        resolve();
      } else {
        reject(stderr);
      }
    });
  });
};

// Function to connect to MQTT broker
const connectToMqttBroker = () => {
  return new Promise((resolve, reject) => {
    client = mqtt.connect(MQTT_BROKER_URL, mqttOptions);

    client.on('connect', () => {
      publishStatus('connected');
      console.log('MQTT connected');
      client.subscribe(MQTT_TOPIC, (err) => {
        if (!err) {
          publishStatus('subscribed');
          console.log(`Subscribed to topic ${MQTT_TOPIC}`);
          resolve();
        } else {
          reject(err);
        }
      });
    });

    client.on('error', (err) => {
      reject(err);
    });
  });
};

// Function to publish status
const publishStatus = (status) => {
  client.publish(`${MQTT_TOPIC}/status`, status);
};

// Function to handle incoming messages
const handleMessage = (topic, message) => {
  if (isBusy) {
    publishStatus('busy');
    return;
  }

  try {
    isBusy = true;
    publishStatus('received');

    const { action, language, voice, text } = JSON.parse(message.toString());
    executeCommand(action, language, voice, text);
  } catch (error) {
    console.error('Failed to process message', error);
    publishStatus('error');
    isBusy = false;
  }
};

// Function to execute command
const executeCommand = (action, language, voice, text) => {

  const key = `${language}_${voice}`;
  const options = commandOptions[key];

  if (!options) {
    throw new Error(`Invalid language and voice combination: ${key}`);
  }

  if (!selectedCard || !selectedDevice) {
    console.error('No ALSA output interface selected');
    publishStatus('error');
    isBusy = false;
    return;
  }

  const commandTemplate = actionCommands[action];
  if (!commandTemplate) {
    console.error('Invalid action');
    publishStatus('error');
    isBusy = false;
    return;
  }

  const fullCommand = commandTemplate
    .replace('{{options}}', options)
    .replace('{{text}}', text || '')
    .replace('{{selectedCard}}', selectedCard)
    .replace('{{selectedDevice}}', selectedDevice);

  console.log(`Command:\t ${fullCommand}`);

  exec(fullCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${stderr}`);
      publishStatus('error');
    } else {
      console.log(`Output: ${stdout}`);
      publishStatus('completed');
    }
    isBusy = false;
  });
};

// Function to start the application
const startApp = async () => {
  try {
    // Download resources
    await downloadResources();

    // Connect to MQTT broker
    await connectToMqttBroker();

    // Get ALSA output interfaces
    const alsaOutputInterfaces = await getAlsaOutputInterfaces();

    // Loop through each ALSA output interface and test
    let alsaOutputFound = false;
    for (const iface of alsaOutputInterfaces) {
      try {
        publishStatus('interface_testing');
        await testAlsaOutput(iface);
        console.log(`ALSA output interface card ${iface.card}, device ${iface.device} found.`);
        publishStatus('interface_found');
        
        // Save selected card and device
        selectedCard = iface.card;
        selectedDevice = iface.device;

        alsaOutputFound = true;
        break;
      } catch (error) {
        console.error(`Error testing ALSA output interface card ${iface.card}, device ${iface.device}: ${error}`);
        publishStatus('interface_error');
      }
    }

    if (!alsaOutputFound) {
      // If no ALSA output interface is found, publish fatal error and exit
      publishStatus('fatal_error');
      console.error('No ALSA output interface found. Exiting.');
      process.exit(1);
    }

    // If ALSA output interface is found, start the REST server
    app.listen(REST_PORT, () => {
      publishStatus('rest_listening');
      console.log(`REST API listening on port ${REST_PORT}`);
    });

    // Set up MQTT message handler
    client.on('message', handleMessage);

    // Set up REST endpoint after successful initialization
    app.get('/execute', (req, res) => {
      if (isBusy) {
        return res.status(423).send('Server is busy processing another request');
      }

      const { action, language, voice, text } = req.query;

      if (!action || !language || !voice) {
        return res.status(400).send('Missing required parameters');
      }

      try {
        isBusy = true;
        publishStatus('received');
        executeCommand(action, language, voice, text);
        res.status(200).send('Command executed successfully');
      } catch (error) {
        console.error('Failed to execute command', error);
        publishStatus('error');
        isBusy = false;
        res.status(500).send('Failed to execute command');
      }
    });
  } catch (error) {
    console.error('Failed to start the application.', error);
    publishStatus('fatal_error');
    process.exit(1);
  }
};

// Start the application
startApp();
