import "@babel/polyfill";
import app from './server';
import tcpServer from './tcpServer';

const port = app.get('port');

async function main() {
    await app.listen(port);
    console.log('Master Node:', app.get('master'));
    console.log('Server on port', port);
}

main();
tcpServer.listen(port + 1000);
