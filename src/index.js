import "@babel/polyfill";
import app from './server';
import tcpServer from './tcpServer';

async function main() {
    await app.listen(app.get('port'));
    console.log('Server on port', app.get('port'));
}

main();

/*
// Esto es lo que haria el servidor TCP del Nodo de datos 
function createDataServer(){

    let server = net.createServer((socket) => {
        
        socket.on('data', (chunk) => {
            handleMessage(chunk,socket);
        });

        socket.on('end', (socket) => { handleDisconnect(socket); } );
    });

    server.listen(1234,'127.0.0.1');
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
        default:
            socket.write("Flasheaste amigo. Tenes que poner una operacion");
            break;
    }

}

function handleGet(msg, socket){

}

function handlePut(msg, socket){

}

function handleDisconnect(socket){

}*/