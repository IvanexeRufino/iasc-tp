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

function handleGet(msg, socket){
    console.log(JSON.stringify(msg));
    let resp = {};
    if(msg.method === "equal"){
        resp = handleGetEqual(msg);
    }
    else if(msg.method === "gt"){
        resp = handleComparison(msg,(a,b)=>{return a>b;})
    }
    else if(msg.method === "lt"){
        resp = handleComparison(msg,(a,b)=>{return a<b;})
    }else{
        resp = {error: -1, message: 'Invalid Message. Must be: {Operation:PUT/GET/DELETE, method=equal/gt/lt, key:unaKey, value:unValor(solo en el PUT)}'};
    }

    //Devuelvo el OpId en la respuesta
    resp.OpId = msg.OpId;

    socket.json(resp);
}

//No valida existencia, solo inserta y si existe sobreescribe
function handlePut(msg, socket){
    list.put(msg.key,msg.value);
    let resp ={
        OpId: msg.OpId,
        result: "OK"
    };
    socket.json(resp);
}

function handleDelete(msg, socket){
    list.delete(msg.key);
    let resp ={
        OpId: msg.OpId,
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
        return resp;
    }else{
        return {
            error: -1,
            message: "Could not find the key supplied"
        };
    }
}

function handleComparison(body,comp){
    let set = list.entrySet();
    let resp = [];
    set.forEach(e => {
        if(comp(e.key,body.key)){
            resp.push(e);
        }
    });

    return resp;
}

export default dataServer;