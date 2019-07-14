import "@babel/polyfill";
import dataServer from './dataServer';
require("hjson/lib/require-config");
const config = require("../Orquestador/config.hjson");

dataServer.on('error', console.log);

let port = process.argv[2];
const start = config.Datos[0].Port;
const end = config.Datos[config.Datos.length - 1].Port;
if (!port || port > end || port < start) {
    console.error(`You must specify a port number between ${start} and ${end} as a parameter.`);
    process.exit();
}

dataServer.listen(port);
console.log('Listening on port:', port);
