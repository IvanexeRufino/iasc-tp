import "@babel/polyfill";
import dataServer from './dataServer';

dataServer.on('error', (err) => {
    console.log(JSON.stringify(err));
})

dataServer.listen(12345,'127.0.0.1');
console.log('listening on port 23405');