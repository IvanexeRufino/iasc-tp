import "@babel/polyfill";
import app from './server';
import tcpServer from './tcpServer';

async function main() {
    await app.listen(app.get('port'));
    console.log('Server on port', app.get('port'));
}

main();
tcpServer.listen(1234);
