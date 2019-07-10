import "@babel/polyfill";
import dataServer from './dataServer';

dataServer.on('error', console.log);

let port = process.argv[2];
if (!port)
    port = 12345; // Default port

dataServer.listen(port, '127.0.0.1');
console.log(`Listening on port: ${port}`);
