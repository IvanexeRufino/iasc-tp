var net = require("net");
require("hjson/lib/require-config");
var config = require("./config.hjson");

console.log(JSON.stringify(config));

var tcpServer = createOrquestadorServer();
var peers = connectToPeers(config.Orquestadores);

//Creo el servidor para obtener conexiones de los otros orquestadores
function createOrquestadorServer(){

    let server = net.createServer((socket) => {
        
        socket.on('data', (chunk) => {
            handleVotation(chunk,socket);
        });

        //La desconexion la va a manejar el socket de ida
        //socket.on('end', (socket) => {  } );
    });

    return server;
}

//Me conecto a los otros orquestadores
function connectToPeers(peerArray){


    let ret = []
    peerArray.forEach( (endpoint) => {
        let newSock = new net.Socket();
        newSock.connect(endpoint.port,endpoint.ip, () => {
            //Aca registro la conexion exitosa
        });

        newSock.on('data', handleVotation );
        newSock.on('end', triggerVotation );

        ret.push(newSock);
    });

    return ret;
}

function handleVotation(chunk){
    
}

function triggerVotation(){

}

export default tcpServer;