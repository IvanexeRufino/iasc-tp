import { Router } from 'express';
const router = Router();
const { crc32 } = require('crc');
require("hjson/lib/require-config");
const config = require("../config.hjson");

//import { dataServers } from './dataConnections';
var dataServers = require('./dataConnections').default;

function sendRequestToDataNode(msg, res) {
    let socket = getSocket(msg, res);
    //Setteo un handler que responda este request en particular
    socket.removeAllListeners();
    socket.on('error', err => {
        if (!res.headersSent) {
            res.statusCode = 500;
            res.json({ error: 500, message: "Data server unavailable." });
        }
        socket.defaultError(err);
    });
    socket.on('data', chunk => {
        console.log(`Data recieved: ${chunk}`);
        res.send(chunk);
    });
    socket.json(msg);
}

function sendRequestToAllDataNodes(msg, res) {
    let data = [];
    dataServers.forEach((socket, idx, list) => {
        socket.removeAllListeners();
        socket.on('data', chunk => {
            data = data.concat(JSON.parse(chunk));
            // Si es el ultimo mando el response
            if (idx === list.length - 1) {
                console.log(`Data recieved: ${JSON.stringify(data)}`);
                res.send(data);
            }
        });
        socket.json(msg);
    });
}

//Aca tenemos que decidir a que socket le vamos a pasar el request
function getSocket(msg, res) {
    const serverIndex = crc32(msg.key) % dataServers.length;
    return dataServers[serverIndex];
}

router.get('/:key', async (req, res) => {
    console.log(req.query);
    sendRequestToDataNode({
        operation: "GET",
        key: req.params.key,
        method: req.query.method,
    }, res);
});

router.get('/', async (req, res) => {
    console.log(req.query);
    sendRequestToAllDataNodes({
        operation: "RANGE",
        gt: req.query.gt,
        lt: req.query.lt
    }, res);
});

router.put('/:key', async (req, res) => {
    console.log(req.body);
    let key = req.params.key;
    let value = req.body.value;
    if (!value) {
        res.statusCode = 400;
        res.json({ error: 400, message: 'Bad request, Post a json with value property on it.' });
    }
    else if (!checkKeyLength(key)) {
        res.statusCode = 400;
        res.json({
            error: 400,
            message: `Bad request, Key length can not exceed ${config.MaxKeyLength} characters.`
        });
    }
    else if (!checkValueLength(value)) {
        res.statusCode = 400;
        res.json({
            error: 400,
            message: `Bad request, Value length can not exceed ${config.MaxValueLength} characters.`
        });
    }
    else {
        sendRequestToDataNode({
            operation: "PUT",
            key: key,
            value: value
        }, res);
    }
});

router.delete('/:key', async (req, res) =>
    sendRequestToDataNode({
        operation: "DELETE",
        key: req.params.key
    }, res)
);

function checkKeyLength(key) {
    return key.length <= config.MaxKeyLength;
}

function checkValueLength(value) {
    return value.length <= config.MaxValueLength;
}

export default router;
