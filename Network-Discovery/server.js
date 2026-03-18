const mdns = require("multicast-dns");
const findDevices = require("local-devices");
const engine = require("./fingerprint-engine");

const express = require('express');
const http = require('http');
const {Server} = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static('public'));

mdns.on("response", (response) => {
    response.answers.forEach((answer) => {
        if (answer.type === "PTR" || answer.type === "SRV") {
            const networkDevice = {
                id: answer.data,
                name: answer.name,
                type: answer.type,
                timestamp: new Date()
            };
            io.emit("device-spotted", networkDevice);
        }
    });
});