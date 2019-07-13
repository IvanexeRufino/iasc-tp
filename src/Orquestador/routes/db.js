import { Router } from 'express';
import { timingSafeEqual } from 'crypto';
const router = Router();

const { crc32 } = require('crc');
var replicaSets = require('./dataConnections').default;

//Las busquedas por rango van a acceder a toda la bd
function needsFullDbAccess(msg){
    return msg.operation === "GET" && (msg.method === "lt" || msg.method === "gt");
}

function sendRequestToReplicaSets(msg,res){

    if(!needsFullDbAccess(msg)){
        sendRequestToReplicaSet(msg,res,getReplicaSet(msg),directlySendResponse);
        return;
    }

    let dbOperation = {
        ReplicaSuccess: [],
        ReplicaErrors: [],
        Response: res,
        SendResponse: function() {
            if(!this.Response.headersSent){
                if(this.ReplicaSuccess.length > 0){
                    //Sumarizo todos los valores que devolvieron los rs
                    let clientResponse = { values: [] };
                    for(let resp of this.ReplicaSuccess){
                        for(let v of resp.values){
                            clientResponse.values.push(v);
                        }
                    }
                    
                    res.json(clientResponse);
                }else{
                    res.json({error: 500, message: "Whole Database is down!"});
                }
            }
        },
        SendIfReady: function() {
            if( (this.ReplicaSuccess.length + this.ReplicaErrors.length) === replicaSets.length ){
                this.SendResponse();
            }
        }
    };

    let callback = getDbOperationCallback(dbOperation);
    replicaSets.forEach( (rs) => {
        sendRequestToReplicaSet(msg,res,rs,callback);
    });
}

function sendRequestToReplicaSet(msg,res,rs,operationCallback){
    rs.OpNumber++;
    rs.Operations.push(
        {
            OpId: rs.OpNumber,
            ResponsesReceived: [],
            ErrorsReceived: [],
            Response: res,
            SendResponse: operationCallback
        }
    );
    msg.OpId = rs.OpNumber;
    msg.LastModificationDate = new Date();

    rs.Nodes.forEach( (n) => {

        n.socket.removeAllListeners('data');

        n.socket.on('data', (chunk) =>{
            console.log('Data received: ' + chunk);

            let resp = JSON.parse(chunk);
            rs.GetOperation(resp.OpId).ResponsesReceived.push(resp);

            //Envio respuesta si es la ultima
            rs.SendResponseIfReady(resp.OpId);
        });

        if(!n.socket.isConnected){
            n.socket.defaultError();
        }else{
            n.socket.json(msg);
        }
    });
}

function directlySendResponse(){
    if(!this.Response.headersSent){
        if( this.ResponsesReceived.length > 0 ){

            //Elijo la respuesta mas actualizada
            let mostUpdatedValue = this.ResponsesReceived[0];
            for(let r of this.ResponsesReceived){
                if(r.LastModificationDate > mostUpdatedValue.LastModificationDate){
                    mostUpdatedValue = r;
                }
            }

            this.Response.json(mostUpdatedValue);
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

function getDbOperationCallback(dbOperation){
    return function(){
        if( this.ResponsesReceived.length > 0 ){
            let values = [];

            for(let r of this.ResponsesReceived){
                console.log('Response: ' + JSON.stringify(r));
                for(let v of r.values){
                    let found = values.find(a => a.value === v.value && a.key == v.key);

                    if(found === undefined){
                        //No se encuentra el valor, simplemente lo inserto
                        values.push(v);
                    }else{
                        //Verifico cual es el mas actualizado
                        if(v.LastModificationDate > found.LastModificationDate){
                            values[values.indexOf(found)] = v;
                        }
                    }
                }
            }

            dbOperation.ReplicaSuccess.push({
                values: values//.map( v => { return {key:v.key, value:v.value} } )
            });
        }else{
            dbOperation.ReplicaErrors.push({
                message: "Could not access any of the members of the replica set"
            });
        }

        dbOperation.SendIfReady();
    }
}

function getReplicaSet(msg){
    const replicaIndex = crc32(msg.key) % replicaSets.length;
    let replicaToUse = replicaSets[replicaIndex];

    return replicaToUse;
}

router.get('/:key', async(req,res) => {
    console.log(JSON.stringify(req.query));

    if( req.query.method === undefined || 
        (req.query.method !== "equal" && req.query.method !== "gt" 
        && req.query.method !== "lt" ) 
    ){
        res.json({error: 400, message: 'Bad request, specify a valid method as a queryparam'});
    }else {
        sendRequestToReplicaSets({
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
        sendRequestToReplicaSets({
            operation: "PUT",
            key: req.params.key,
            value: req.body.value
        }, res);
    }
});

router.delete('/:key', async(req,res) => {
    sendRequestToReplicaSets({
        operation: "DELETE",
        key: req.params.key
    }, res);
});

export default router;