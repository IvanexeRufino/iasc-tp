import { Socket } from 'net';
require("hjson/lib/require-config");
var config = require("../config.hjson");

var dataServers = generateDataConnections();

function generateDataConnections(){
    let dataServers = [];
    config.Datos.forEach((d) => {
        let socket = new Socket();
        socket.json = function(obj){
            console.log('Sending data: ' + JSON.stringify(obj));
            this.write(JSON.stringify(obj));
        }
        socket.on('error', (err) => {
            console.log('socket error 1: ' + JSON.stringify(err));
        });
        socket.connect(d.Port,d.IP, () => {
            console.log('Connected to ' + d.IP + ':' + d.Port);
        });

        socket.MaxConnectionRetries = config.MaxConnectionRetries;
        socket.retries = 0;
        
        dataServers.push(socket);
    });

    return dataServers;
}

export default dataServers;