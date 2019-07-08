import { Router } from 'express'
import { Socket } from 'net';

const router = Router();

var net = require('net');

function sendRequestToDataNode(msg,res){
    let socket = getSocket(msg, res);
    //Setteo un handler que responda este request REST
    socket.on('data', (chunk) => {
        console.log('data recieved: ' + chunk);
        res.send(chunk);
        socket.close();
    });
    socket.json(msg);
}

//Aca tenemos que decidir a que socket le vamos a pasar el request
function getSocket(msg, res){
    //Por ahora solo devolvemos un socket recien conectado
    let socket = new Socket();
    socket.json = function(data){
        console.log('Sending data: ' + JSON.stringify(data));
        socket.write(JSON.stringify(data));
    }
    socket.connect(12345,'127.0.0.1',() =>{
        console.log("Connect to client Node Successful");
    });

    return socket;
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