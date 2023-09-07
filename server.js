'use strict'

const express = require('express')
const mqtt = require('mqtt')
const exec = require('child_process').exec
require('dotenv').config()

// Constants
const HTTP_PORT = process.env.HTTP_PORT
const HTTP_HOST = process.env.HTTP_HOST
const MQTT_SERVER = process.env.MQTT_SERVER
const MQTT_TOPIC = process.env.MQTT_TOPIC
const MQTT_USER = process.env.MQTT_USER
const MQTT_PASSWORD = process.env.MQTT_PASSWORD
const ALSA_INTERFACE = process.env.ALSA_INTERFACE
const langModels = new Map()
const langEnModels = new Map()
const langEsModels = new Map()
langEnModels.set('f', 'en_US-libritts-high.onnx')
langEnModels.set('m', 'en_US-ryan-high.onnx')
langEsModels.set('f', 'es_ES-mls_10246-low.onnx')
langEsModels.set('m', 'es_ES-sharvard-medium.onnx')
langModels.set('en_US', langEnModels)
langModels.set('es_ES', langEsModels)
var status = "AVAILABLE";

const mqttClient = mqtt.connect(`mqtt://${MQTT_SERVER}`, {
    username: `${MQTT_USER}`,
    password: `${MQTT_PASSWORD}`
})
mqttClient.on("connect", function () {
    mqttClient.subscribe(MQTT_TOPIC)
    console.log(`Connected to topic ${MQTT_TOPIC} of MQTT server at ${MQTT_SERVER}: ` + mqttClient.connected)
    updateStatus("AVAILABLE");
})
mqttClient.on('error', function(err) {
    console.log(err)
})

mqttClient.on('message', (topic, message) => {
    //console.log(`Received message on topic ${topic}: ${message}`)
    procesPayload(message)
})

const httpServer = express()
httpServer.listen(HTTP_PORT, HTTP_HOST, () => {
    console.log(`Running HTTP server on http://${HTTP_HOST}:${HTTP_PORT}`)
})

httpServer.post('/', (req, res) => {
    res.send('Received message')
    procesPayload(req.body)
})

function procesPayload(message) {
    const json = JSON.parse(message)
    if (json.action === 'speak') {
        speak(json.lang, json.voice, clean(json.text));
    } else if (json.action === 'play') {
        play(clean(json.text));
    } else {
        console.log(`ERROR: Message received with invalid action: ${json.action}`)
    }
}

function speak(lang, voice, text) {
    if (text.length > 0) {
        const modelLang = langModels.get(lang)
        if (modelLang) {
            const modelVoice = modelLang.get(voice)
            if (modelVoice) {
                if (voice) {
                    console.log(`Speaking [${lang}][${voice}]: ${text}`)
                    const speakCmd = `echo '${text}' | ./piper/piper --model voices/${modelVoice} --output_raw | aplay --channels=1 --file-type raw --rate=22050 -f S16_LE -D plughw:${ALSA_INTERFACE}`
                    executeCommand(speakCmd);
                }
            }
        }
    } else {
        console.log(`ERROR: Message received with empty text`)
    }
}

function play(text) {
    if (text.length > 0) {
        const playCmd = `mpg123 -a hw:${ALSA_INTERFACE},0 songs/${text}`
        executeCommand(playCmd);
    } else {
        console.log(`ERROR: Message received with empty text`)
    }
}

function clean(text) {
    if (text) {
        text = text.replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ0-9,.!;_\s]+/g, '');
    }
    return text;
}

function updateStatus(newStatus) {
    status = newStatus;
    mqttClient.publish(`${MQTT_TOPIC}/status`, status)
}

function executeCommand(speakCmd) {
    console.log(speakCmd)
    if (status === "AVAILABLE") {
        updateStatus("BUSY");
        exec(speakCmd,
            (error, stdout, stderr) => {
                if (error !== null) {
                    console.log('exec error: ', error)
                    if (error.signal !== null) {
                        console.log('signal: ', error.signal)
                    }
                }
                updateStatus("AVAILABLE");
            }
        )
    } else {
        console.log("DEVICE NOT AVAILABLE")
    }
}
