import { Socket } from 'net';
import dataServer from '../../Datos/dataServer';
require("hjson/lib/require-config");
var config = require("../config.hjson");

var dataServers = generateDataConnections();

//Timer para reintentar conexion
setTimeout(retryConnections, config.RetryTimeout)

function retryConnections() {
    console.log('Retrying connections');
    dataServers.forEach(s => {
        if (!s.isConnected) {
            s.connect(s.remoteEndpoint.Port, s.remoteEndpoint.IP);
        }
    });
    setTimeout(retryConnections, config.RetryTimeout);
}

function generateDataConnections() {
    let dataServers = [];
    config.Datos.forEach(d => {
        let socket = new Socket();

        //Me guardo a donde apunta este socket
        socket.remoteEndpoint = {
            Port: d.Port,
            IP: d.IP
        };
        socket.json = obj => {
            console.log(`Sending data: ${JSON.stringify(obj)}`);
            socket.write(JSON.stringify(obj));
        }
        socket.connect(d.Port, d.IP, () => {
            console.log(`Connected to ${d.IP}:${d.Port}`);
            socket.retries = 0;
            socket.isConnected = true;
        });

        //Setteo el defaultHandler
        socket.defaultError = err => {
            console.log(`Socket error: ${JSON.stringify(err)} - Retries: ${this.retries} MaxRetries: ${this.MaxConnectionRetries}`);
            //Marco el socket como no conectado
            this.isConnected = false;

            if (this.retries < this.MaxConnectionRetries) {
                this.removeAllListeners('connect');
                this.connect(this.remotePort, this.remoteAddress, reconnect);
                this.retries++;
            } else {
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

function reconnect() {
    console.log('Reconnected to data Node');
    this.retries = 0;
    this.isConnected = true;
}

export default dataServers;
