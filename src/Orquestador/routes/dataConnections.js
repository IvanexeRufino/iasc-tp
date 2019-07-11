import { Socket } from 'net';
import dataServer from '../../Datos/dataServer';
require("hjson/lib/require-config");
var config = require("../config.hjson");

//var dataServers = generateDataConnections();
var replicaSets = generateReplicaSets();

//Timer para reintentar conexion
setTimeout( retryReplicaSets, config.RetryTimeout)

function retryConnections(){
    console.log('Retrying connections');
    dataServers.forEach( (s) => {
        if(!s.isConnected){
            s.connect(s.remoteEndpoint.Port,s.remoteEndpoint.IP);
        }
    });
    setTimeout(retryConnections,config.RetryTimeout);
}

function retryReplicaSets(){
    console.log('Retrying connections');
    replicaSets.forEach( (rs) =>{
        rs.Nodes.forEach( (n) => {
            if(!n.socket.isConnected){
                n.socket.connectEndpoint(n.socket.remoteEndpoint);
            }
        });
    });
    setTimeout(retryReplicaSets,config.RetryTimeout);
}

function generateDataConnections(){
    let dataServers = [];

    config.Datos.forEach((d) => {
        let socket = new Socket();

        //Me guardo a donde apunta este socket
        socket.remoteEndpoint = {
            Port: d.Port,
            IP: d.IP
        };
        socket.json = function(obj){
            console.log('Sending data: ' + JSON.stringify(obj));
            this.write(JSON.stringify(obj));
        }
        socket.connect(d.Port,d.IP, () => {
            console.log('Connected to ' + d.IP + ':' + d.Port);
            socket.retries = 0;
            socket.isConnected = true;
        });

        //Setteo el defaultHandler
        socket.defaultError = function(err){
            console.log('Socket error: ' + JSON.stringify(err) + ' - Retries: ' + this.retries + " MaxRetries: " + this.MaxConnectionRetries);
            
            //Marco el socket como no conectado
            this.isConnected = false;

            if(this.retries < this.MaxConnectionRetries){
                this.removeAllListeners('connect');
                this.connect(this.remotePort,this.remoteAddress,reconnect);
                this.retries++;
            }else{
                console.log('Dropping connection definitively due to excesive retries');
                this.retries = 0;
            }
        };
        socket.on('error', socket.defaultError);

        socket.MaxConnectionRetries = config.MaxConnectionRetries;
        socket.retries = 0;

        dataServers.push(socket);
    });

    return dataServers;
}

function generateReplicaSets(){
    let replicaSets = [];

    config.ReplicaSets.forEach( (rs) => {
        
        let replicaSet = {
            Operations: [],
            OpNumber: 0,
            Nodes: [],
            GetOperation: getOperation,
            SendResponseIfReady: CheckAndSendResp,
            Responded: false
        };
        rs.Set.forEach( (endpoint) => {
            //Creo dataNode y le asocio un socket
            let dataNode = {};
            dataNode.socket = initSocket(endpoint);

            replicaSet.Nodes.push(dataNode);
        });

        replicaSets.push(replicaSet);
    });

    return replicaSets;
}

function getOperation(opNum){
    for(let op of this.Operations){
        if(op.OpId === opNum){
            return op;
        }
    }
    console.log('Could not find operation');
}

function CheckAndSendResp(opNum){
    let op = this.GetOperation(opNum);

    console.log('Nodes length: ' + this.Nodes.length);
    console.log('RespReceived length: ' + op.ResponsesReceived.length);
    console.log('ErrorsReceived length: ' + op.ErrorsReceived.length);
    //Ya respondieron todos los nodos (con error o con respuestas)
    if(this.Nodes.length === (op.ResponsesReceived.length + op.ErrorsReceived.length) ){
        op.Responded = true;
        op.SendResponse();
        //TODO: Eliminar esta op del array
    }
}

function initSocket(endpoint){
    let socket = new Socket();

    //Me guardo a donde apunta este socket
    socket.remoteEndpoint = {
        Port: endpoint.Port,
        IP: endpoint.IP
    };
    socket.json = function(obj){
        console.log('Sending data: ' + JSON.stringify(obj));
        this.write(JSON.stringify(obj));
    }
    socket.connect(endpoint.Port,endpoint.IP, () => {
        console.log('Connected to ' + endpoint.IP + ':' + endpoint.Port);
        socket.retries = 0;
        socket.isConnected = true;
    });
    socket.connectEndpoint = function(endpoint){
        this.connect(endpoint.Port,endpoint.IP);
    }
    //Setteo el defaultHandler
    socket.defaultError = function(err){
        console.log('Socket error: ' + JSON.stringify(err) + ' - Retries: ' + this.retries + " MaxRetries: " + this.MaxConnectionRetries);

        //Marco el socket como no conectado
        this.isConnected = false;

        if(this.retries < this.MaxConnectionRetries){
            this.removeAllListeners('connect');
            this.connect(this.remotePort,this.remoteAddress,reconnect);
            this.retries++;
        }else{
            console.log('Dropping connection definitively due to excesive retries');
            this.retries = 0;
        }
    };
    socket.on('error', socket.defaultError);

    socket.MaxConnectionRetries = config.MaxConnectionRetries;
    socket.retries = 0;

    return socket;
}

function reconnect(){
    console.log('Reconnected to data Node');
    this.retries = 0;
    this.isConnected = true;
}

export default replicaSets;