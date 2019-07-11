import { Router } from 'express';
const router = Router();

const { crc32 } = require('crc');

var dataServers = require('./dataConnections').default;
var replicaSets = require('./dataConnections').default;

/*
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
}*/

function sendRequestToDataNode(msg,res){
    let rs = getReplicaSet(msg,res);

    rs.OpNumber++;
    rs.Operations.push(
        {
            OpId: rs.OpNumber,
            ResponsesReceived: [],
            ErrorsReceived: [],
            Response: res,
            SendResponse: function(){
                console.log('Sending response!!!');
                if(!res.headersSent){
                    if( this.ResponsesReceived.length > 0 ){
                        this.Response.json(this.ResponsesReceived[0]);
                    }else{
                        this.Response.json(
                            {
                                error: 500,
                                message:"Could not access any of the members of the replica set"
                            }
                        );
                    }
                }
            }
        }
    );
    msg.OpId = rs.OpNumber;

    console.log('Loggeo operations luego de insertarlas: ' + rs.Operations);

    rs.Nodes.forEach( (n) => {

        n.socket.removeAllListeners('data');

        //n.socket.on('error', (err) => {
        //    /*if(!res.headersSent){
        //        res.json({error:500,message:"Data server unavailable."});
        //    }*/
        //    console.log('Socket error received: ' + err);
        //    rs.Operations.forEach( (op) => {
        //        if(!op.Responded){
        //            op.ErrorsReceived.push(err);
        //        }
        //    });
        //
        //    //Envio respuesta si es la ultima
        //    rs.Operations.forEach( (op) =>{
        //        rs.SendResponseIfReady(op.OpId);
        //    });
        //    
        //    n.socket.defaultError(err);
        //    n.socket.setDefaultErrorListener();
        //});

        n.socket.on('data', (chunk) =>{
            console.log('Data received: ' + chunk);

            let resp = JSON.parse(chunk);
            rs.GetOperation(resp.OpId).ResponsesReceived.push(resp);

            //Envio respuesta si es la ultima
            rs.SendResponseIfReady(resp.OpId);
            //res.send(chunk);
        });
        if(!n.socket.isConnected){
            n.socket.defaultError();
        }else{
            n.socket.json(msg);
        }
    });
}

function getReplicaSet(msg){
    const replicaIndex = crc32(msg.key) % replicaSets.length;
    let replicaToUse = replicaSets[replicaIndex];

    return replicaToUse;
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