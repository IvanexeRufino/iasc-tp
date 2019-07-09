import "@babel/polyfill";
import dataServer from './dataServer';

dataServer.on('error', (err) => {
    console.log(JSON.stringify(err));
})

let port = process.argv[2];
if(port === undefined){
    //Default port
    port = 12345;
}

dataServer.listen(port,'127.0.0.1');
console.log('listening on port ' + port);