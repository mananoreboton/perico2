require('dotenv').config();
const express = require('express');
const mqtt = require('mqtt');
const { exec } = require('child_process');

const app = express();

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
const MQTT_TOPIC = process.env.MQTT_TOPIC;
const REST_PORT = process.env.REST_PORT;

let client = mqtt.connect(MQTT_BROKER_URL);
let isBusy = false;

const actionCommands = {
    list: 'ls',
    currentDir: 'pwd',
    diskUsage: 'df -h',
    // Add more actions and their corresponding commands here
};

const languageMappings = {
    en: '--lang=en',
    es: '--lang=es',
    // Add more language mappings here
};

const voiceMappings = {
    male: '--voice=male',
    female: '--voice=female',
    // Add more voice mappings here
};

// Publish status
const publishStatus = (status) => {
    client.publish(`${MQTT_TOPIC}/status`, JSON.stringify({ status }));
};

client.on('connect', () => {
    publishStatus('connected');
    console.log('MQTT connected');
    client.subscribe(MQTT_TOPIC, (err) => {
        if (!err) {
            publishStatus('subscribed');
            console.log(`Subscribed to topic ${MQTT_TOPIC}`);
        }
    });
});

client.on('message', (topic, message) => {
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
});

app.get('/execute', (req, res) => {
    if (isBusy) {
        return res.status(423).send('Server is busy');
    }

    const { action, language, voice, text } = req.query;
    executeCommand(action, language, voice, text);
    res.send('Command received');
});

const executeCommand = (action, language, voice, text) => {
    const command = actionCommands[action];
    if (!command) {
        console.error('Invalid action');
        publishStatus('error');
        isBusy = false;
        return;
    }

    const langOption = languageMappings[language];
    const voiceOption = voiceMappings[voice];

    if (!langOption || !voiceOption) {
        console.error('Invalid language or voice');
        publishStatus('error');
        isBusy = false;
        return;
    }

    const fullCommand = `${command} ${langOption} ${voiceOption} ${text || ''}`;

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

app.listen(REST_PORT, () => {
    publishStatus('rest_listening');
    console.log(`REST API listening on port ${REST_PORT}`);
});
