import { Router } from 'express';
const router = Router();

const { crc32 } = require('crc');

//import { dataServers } from './dataConnections';
var dataServers = require('./dataConnections').default;

function sendRequestToDataNode(msg, res) {
    let socket;

    // TODO Por ahora solo funciona el rango en un solo nodo de datos
    if (msg.key)
        socket = getSocket(msg, res);
    else
        socket = dataServers[0];

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
        console.log('data recieved: ' + chunk);
        res.send(chunk);
    });
    socket.json(msg);
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
    sendRequestToDataNode({
        operation: "RANGE",
        gt: req.query.gt,
        lt: req.query.lt
    }, res);
});

router.put('/:key', async (req, res) => {
    console.log(req.body);
    if (req.body.value === undefined) {
        res.statusCode = 400;
        res.json({ error: 400, message: 'Bad request, Post a json with value property on it' });
    } else {
        sendRequestToDataNode({
            operation: "PUT",
            key: req.params.key,
            value: req.body.value
        }, res);
    }
});

router.delete('/:key', async (req, res) =>
    sendRequestToDataNode({
        operation: "DELETE",
        key: req.params.key
    }, res)
);

export default router;
