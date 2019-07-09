import { Router } from 'express';
const router = Router();

const { crc32 } = require('crc');

//import { dataServers } from './dataConnections';
var dataServers = require('./dataConnections').default;

function sendRequestToDataNode(msg,res){
    let socket = getSocket(msg, res);
    //Setteo un handler que responda este request en particular
    socket.removeAllListeners();
    socket.on('error', (err) => {
        if(!res.headersSent){
            res.json({error:500,message:"Data server unavailable."});
        }
        socket.defaultError(err);
    });
    socket.on('data', (chunk) => {
        console.log('data recieved: ' + chunk);
        res.send(chunk);
    });
    socket.json(msg);
}

//Aca tenemos que decidir a que socket le vamos a pasar el request
function getSocket(msg, res){
    const serverIndex = crc32(msg.key) % dataServers.length;
    return dataServers[serverIndex];
}

router.get('/:key', async(req,res) => {
    console.log(JSON.stringify(req.query));

    if( req.query.method === undefined || 
        (req.query.method !== "equal" && req.query.method !== "gt" 
        && req.query.method !== "lt" ) 
    ){
        res.json({error: 400, message: 'Bad request, specify a valid method as a queryparam'});
    }else {
        sendRequestToDataNode({
            operation: "GET",
            key: req.params.key,
            method: req.query.method,
        }, res);
    }
});

router.put('/:key', async(req,res) => {

    console.log(req.body);

    if( req.body.value === undefined){
        res.json({error: 400, message: 'Bad request, Post a json with value property on it'});
    }else{
        sendRequestToDataNode({
            operation: "PUT",
            key: req.params.key,
            value: req.body.value
        }, res);
    }
});

router.delete('/:key', async(req,res) => {
    sendRequestToDataNode({
        operation: "DELETE",
        key: req.params.key
    }, res);
});

export default router;