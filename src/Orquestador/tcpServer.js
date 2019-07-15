var net = require("net");
require("hjson/lib/require-config");

const tcpServer = net.createServer((socket) => {
    console.log('New connection!');
    socket.on('data', console.log(`Data arrived: ${chunk}`));
    socket.on('end', console.log('Connection closed'));
});

export default tcpServer;
