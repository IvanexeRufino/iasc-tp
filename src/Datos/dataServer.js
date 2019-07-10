var net = require('net');
var SkipList = require("dsjslib/lib/SkipList");//.SkipList;
var list = new SkipList();

var dataServer = createDataServer();

function createDataServer() {

    let server = net.createServer(socket => {
        console.log('New Connection!');
        socket.json = (obj) => socket.write(JSON.stringify(obj));
        socket.on('data', chunk => {
            console.log('Data arrived: ' + chunk);
            handleMessage(chunk, socket);
        });
        socket.on('error', err => {
            console.log('socket error :' + JSON.stringify(err));
        });
        socket.on('end', handleDisconnect);
    });

    return server;
}

function handleMessage(chunk, socket) {
    let msg = JSON.parse(chunk);
    switch (msg.operation) {
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

function handleGet(msg, socket) {
    console.log(msg);
    let resp = list.get(msg.key) || {
        result: "ERROR",
        message: "Could not find the key supplied"
    };
    socket.json(resp);
}

// Si no se especifica gt ni lt devuelve todas las keys
function handleRange(msg, socket) {
    console.log(msg);
    let gt = msg.gt;
    let lt = msg.lt;
    let set = list.entrySet();
    let range = [];
    set.forEach(entry => {
        if (
            (!gt || entry.value > gt)
            &&
            (!lt || entry.value < lt)
        )
            range.push(entry);
    });
    socket.json(range);
}

// No valida existencia, solo inserta y si existe sobreescribe
function handlePut(msg, socket) {
    list.put(msg.key, msg.value);
    socket.json(
        {
            result: "OK",
            message: "Key Updated."
        }
    );
}

function handleDelete(msg, socket) {
    list.delete(msg.key);
    socket.json(
        {
            result: "OK",
            message: "Key Deleted."
        }
    );
}

function handleDisconnect() {
    //No hago nada
}

export default dataServer;
