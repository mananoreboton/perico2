'use strict';

const express = require('express');
const mqtt = require('mqtt');

// Constants
const HTTP_PORT = 9001;
const HTTP_HOST = '0.0.0.0';
const MQTT_SERVER = '192.168.1.75';
const MQTT_USER = 'perico2';
const MQTT_PASSWORD = '053552';

// App
const httpServer = express();
const mqttClient = mqtt.connect(`mqtt://${MQTT_SERVER}`, {
    username: `${MQTT_USER}`,
    password: `${MQTT_PASSWORD}`
});

httpServer.get('/', (req, res) => {
    res.send('Hello World');
});

httpServer.listen(HTTP_PORT, HTTP_HOST, () => {
    console.log(`Running on http://${HTTP_HOST}:${HTTP_PORT}`);
});

mqttClient.on('message', (topic, message) => {
    console.log(`Received message on topic ${topic}: ${message}`);
});
