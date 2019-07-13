import { Socket } from 'net';
require("hjson/lib/require-config");
var config = require("../config.hjson");

var replicaSets = generateReplicaSets();

//Timer para reintentar conexion
setTimeout( retryReplicaSets, config.RetryTimeout)

function retryReplicaSets(){
    console.log('Retrying connections');
    replicaSets.forEach( (rs) =>{
        rs.Nodes.forEach( (n) => {
            if(!n.socket.isConnected){
                n.socket.setDefaultErrorListener();
                n.socket.connectEndpoint(n.socket.remoteEndpoint);
            }
        });
    });
    setTimeout(retryReplicaSets,config.RetryTimeout);
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
            dataNode.socket = initSocket(endpoint, replicaSet);

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
        //Elimino la op del array
        let index = this.Operations.indexOf(op);
        this.Operations.splice(index,1);
    }
}

function initSocket(endpoint, replicaSet){
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
        
        replicaSet.Operations.forEach( (op) => {
            if(!op.Responded){
                //Solo pusheo el error si ya no pushee un error de este socket
                if( op.ErrorsReceived.every(element => element !== this) ){
                    op.ErrorsReceived.push(this);
                }
            }
        });

        //Envio respuesta si es la ultima
        replicaSet.Operations.forEach( (op) =>{
            replicaSet.SendResponseIfReady(op.OpId);
        });
        
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

    socket.setDefaultErrorListener = function(){
        this.removeAllListeners('error');
        this.on('error',this.defaultError);
    };

    socket.MaxConnectionRetries = config.MaxConnectionRetries;
    socket.retries = 0;

    return socket;
}

function reconnect() {
    console.log('Reconnected to data Node');
    this.retries = 0;
    this.isConnected = true;
}

export default replicaSets;