'use strict'

const express = require('express')
const mqtt = require('mqtt')
const exec = require('child_process').exec

// Constants
const HTTP_PORT = 9051
const HTTP_HOST = '0.0.0.0'
const MQTT_SERVER = '192.168.1.26'
const MQTT_USER = 'perico2'
const MQTT_PASSWORD = ''
const langModels = new Map()
const langEnModels = new Map()
const langEsModels = new Map()
langEnModels.set('f', 'en_US-libritts-high.onnx')
langEnModels.set('m', 'en_US-ryan-high.onnx')
langEsModels.set('f', 'es_ES-mls_10246-low.onnx')
langEsModels.set('m', 'es_ES-sharvard-medium.onnx')
langModels.set('en_US', langEnModels)
langModels.set('es_ES', langEsModels)

const mqttClient = mqtt.connect(`mqtt://${MQTT_SERVER}`, {
    username: `${MQTT_USER}`,
    password: `${MQTT_PASSWORD}`
})
mqttClient.on("connect", function () {
    console.log("MQTT connected  " + mqttClient.connected)
})
mqttClient.on('error', function(err) {
    console.log(err)
})
mqttClient.subscribe('perico2')

mqttClient.on('message', (topic, message) => {
    //console.log(`Received message on topic ${topic}: ${message}`)
    procesPayload(message)
})

const httpServer = express()
httpServer.listen(HTTP_PORT, HTTP_HOST, () => {
    console.log(`Running on http://${HTTP_HOST}:${HTTP_PORT}`)
})

httpServer.post('/', (req, res) => {
    res.send('Received message')
    procesPayload(req.body)
})

function procesPayload(message) {
    const json = JSON.parse(message)
    if (json.payload.action === 'speak') {
        speak(json.payload.lang, json.payload.voice, json.payload.text);
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
                    const speakCmd = `echo '${text}' | ./piper/piper --model voices/${modelVoice} --output_raw | aplay --channels=1 --file-type raw --rate=22050 -f S16_LE -D plughw:1`
                    console.log(speakCmd)
                    exec(speakCmd,
                        (error, stdout, stderr) => {
                            console.log('stdout:', stdout)
                            if (error !== null) {
                                console.log('exec error: ', error)
                                if (error.signal !== null) {
                                    console.log('signal: ', error.signal)
                                }
                            }
                        }
                    )
                }
            }
        }
    }
}
