var net = require('net');
var SkipList = require("dsjslib/lib/SkipList");
var list = new SkipList();

var dataServer = createDataServer();

function createDataServer() {
    let server = net.createServer(socket => {
        let chunkData;
        let originalValue;
        console.log('New Connection!');
        socket.json = obj => socket.write(JSON.stringify(obj));
        socket.on('data', chunk => {
            chunkData = JSON.parse(chunk);
            originalValue = list.get(chunkData.key);
            console.log(`Data arrived: ${chunk}`);
            handleMessage(chunk, socket);
        });
        socket.on('error', err => {
            console.error(`Socket error: ${JSON.stringify(err)}`);
            handleError(chunkData, originalValue);
        });
        socket.on('end', handleDisconnect);
    });
    return server;
}

function handleError(msg, originalValue) {
    switch (msg.operation) {
        case "PUT":
            list.delete(msg.key);
            break;
        case "DELETE":
            list.put(msg.key, originalValue.value);
            break;
        default:
            break;
    }
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
    console.log(JSON.stringify(msg));
    let entry = list.get(msg.key);
    let resp = entry ? {
        value: entry.value,
        LastModificationDate: entry.LastModificationDate
    } : {
        error: -1,
        message: "Could not find the key supplied"
    };
    resp.OpId = msg.OpId;
    console.log(`Sending Response: ${JSON.stringify(resp)}`);
    socket.json(resp);
}

function handleRange(msg, socket) {
    console.log(msg);
    let gt = msg.gt;
    let lt = msg.lt;
    let range = [];
    list.entrySet().forEach(entry => {
        if ((!gt || entry.value.value > gt)
            &&
            (!lt || entry.value.value < lt))
            range.push({
                key: entry.key,
                value: entry.value.value,
                LastModificationDate: entry.value.LastModificationDate
            });
    });
    let resp = { values: range };
    resp.OpId = msg.OpId;
    console.log(`Sending Response:`, resp);
    socket.json(resp);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//No valida existencia, solo inserta y si existe sobreescribe
function handlePut(msg, socket) {
    setTimeout(function()  {
        list.put(msg.key,
            {
                value: msg.value,
                LastModificationDate: msg.LastModificationDate
            });
        let resp = {
            OpId: msg.OpId,
            LastModificationDate: msg.LastModificationDate,
            result: "OK"
        };
        socket.json(resp);

    }, 5500);

}

function handleDelete(msg, socket) {
    list.delete(msg.key);
    let resp = {
        OpId: msg.OpId,
        LastModificationDate: msg.LastModificationDate,
        result: "OK"
    };
    socket.json(resp);
}

function handleDisconnect() {
    //No hago nada
    //
}

export default dataServer;
