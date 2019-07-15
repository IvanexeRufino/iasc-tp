import "@babel/polyfill";
import dataServer from './dataServer';
require("hjson/lib/require-config");
const config = require("../Orquestador/config.hjson");

dataServer.on('error', console.log);

let port = process.argv[2];
let correctPorts = [];

for(let rs of config.ReplicaSets){
    for(let nodo of rs.Set){
        correctPorts.push(nodo.Port);
    }
}

if(!correctPorts.includes(port)){
    console.error('Yoy must specify one of the following ports: (' + correctPorts.reduce( (p1,p2) => p1 + ',' + p2) + ')');
}

dataServer.listen(port);
console.log('Listening on port:', port);
