import "@babel/polyfill";
import dataServer from './dataServer';
require("hjson/lib/require-config");
const config = require("../Orquestador/config.hjson");

const port = process.argv[2];
let correctPorts = [];

for (let rs of config.ReplicaSets)
    for (let nodo of rs.Set)
        correctPorts.push(nodo.Port.toString());

if (!correctPorts.includes(port)) {
    console.error(`Yoy must specify one of the following ports: ${correctPorts}`);
    process.exit();
}

dataServer.on('error', console.error);
dataServer.listen(port);
console.log('Listening on port:', port);
