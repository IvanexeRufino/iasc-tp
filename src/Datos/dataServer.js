var net = require('net');
var SkipList = require("dsjslib/lib/SkipList");//.SkipList;
var list = new SkipList();

var dataServer = createDataServer();

function createDataServer(){

    let server = net.createServer((socket) => {
        console.log('New Connection!');
        
        socket.json = function(obj){
            this.write(JSON.stringify(obj));
        }
        socket.on('data', (chunk) => {
            console.log('Data arrived: ' + chunk);
            handleMessage(chunk,socket);
        });
        socket.on('error', (err) => {
            console.log('socket error :' + JSON.stringify(err));
        });

        socket.on('end', () => { handleDisconnect(); } );
    });

    return server;
}

function handleMessage(chunk, socket){
    let msg = JSON.parse(chunk);

    switch(msg.operation){
        case "GET":
            handleGet(msg, socket);
            break;
        case "RANGE":
            handleRange(msg, socket);
            break;
        case "PUT":
            handlePut(msg, socket);
            break;
        case "DELETE":
            handleDelete(msg, socket);
            break;
        default:
            socket.write("Flasheaste amigo. Tenes que poner una operacion");
            break;
    }
}

function handleRange(msg, socket){
    console.log(JSON.stringify(msg));

    let resp = handleComparison(msg, (elem) => {
        if(msg.gt === undefined && msg.lt === undefined){
            return false;
        }
        if(msg.gt === undefined){
            return elem < msg.lt;
        }else if(msg.lt === undefined){
            return elem > msg.gt;
        }else{
            return (elem > msg.gt) && (elem < msg.lt);
        }
    });

    resp.OpId = msg.OpId;
    
    console.log('Sending Response: ' + JSON.stringify(resp));

    socket.json(resp);
}

function handleGet(msg, socket){
    console.log(JSON.stringify(msg));

    let resp = handleGetEqual(msg);
    
    resp.OpId = msg.OpId;
    
    console.log('Sending Response: ' + JSON.stringify(resp));

    socket.json(resp);
}

//No valida existencia, solo inserta y si existe sobreescribe
function handlePut(msg, socket){
    list.put(msg.key,
        {
            value: msg.value,
            LastModificationDate: msg.LastModificationDate
        });
    let resp ={
        OpId: msg.OpId,
        LastModificationDate: msg.LastModificationDate,
        result: "OK"
    };
    socket.json(resp);
}

function handleDelete(msg, socket){
    list.delete(msg.key);
    let resp ={
        OpId: msg.OpId,
        LastModificationDate: msg.LastModificationDate,
        result: "OK"
    };
    socket.json(resp);
}

function handleDisconnect(){
    //No hago nada
}

function handleGetEqual(body){
    let resp = list.get(body.key);
    if(resp != null){
        return { 
                value: resp.value,
                LastModificationDate: resp.LastModificationDate
            };
    }else{
        return {
            error: -1,
            message: "Could not find the key supplied"
        };
    }
}

function handleComparison(body,comp){
    let set = list.entrySet();
    let resp = { values: [] };
    set.forEach(e => {
        if(comp(e.key)){
            resp.values.push({
                key: e.key,
                value: e.value.value,
                LastModificationDate: e.value.LastModificationDate
            });
        }
    });

    return resp;
}

export default dataServer;