'use strict';

const express = require('express');
const mqtt = require('mqtt');
const exec = require('child_process').exec;

// Constants
const HTTP_PORT = 9001;
const HTTP_HOST = '0.0.0.0';
const MQTT_SERVER = '192.168.1.75';
const MQTT_USER = 'perico2';
const MQTT_PASSWORD = '';

const mqttClient = mqtt.connect(`mqtt://${MQTT_SERVER}`, {
    username: `${MQTT_USER}`,
    password: `${MQTT_PASSWORD}`
});
mqttClient.on("connect", function () {
    console.log("connected  " + mqttClient.connected);
})
const httpServer = express();
httpServer.listen(HTTP_PORT, HTTP_HOST, () => {
    console.log(`Running on http://${HTTP_HOST}:${HTTP_PORT}`);
});

httpServer.get('/', (req, res) => {
    res.send('Received message');
    speak("message")
});
mqttClient.subscribe('perico2');
mqttClient.on('message', (topic, message) => {
    console.log(`Received message on topic ${topic}: ${message}`);
    speak(message)
});


function speak(message) {
    exec(`echo ${message} | say`,
        (error, stdout, stderr) => {
            console.log('stdout:', stdout);
            if (error !== null) {
                console.log('exec error: ', error);
            }
        }
    );
}
