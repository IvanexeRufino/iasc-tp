import express, { urlencoded, json } from 'express'
import bodyParser from 'body-parser';
const app = express(bodyParser.json());


require("hjson/lib/require-config");
const config = require("./config.hjson");
console.log(config);

const nodeNumber = process.argv[2];
if (!nodeNumber) {
  console.error(`You must specify a node number between 0 and ${config.Orquestadores.length - 1} as a parameter.`);
  process.exit();
}
if (!config.Orquestadores[nodeNumber]) {
  console.error(`Invalid node number, try with a number below ${config.Orquestadores.length}.`);
    process.exit();

}
const port = config.Orquestadores[nodeNumber].port
app.set('port', port);
app.set('master', port === config.Orquestadores[0].port);
app.set('nodeNumber', nodeNumber);

// Middlewares
app.use(urlencoded({ extended: false }));
app.use(json());


// Importing Routes
import HomeRoutes from './routes/home'
import DBRoutes from './routes/db'
// Routes
app.use(HomeRoutes);
app.use('/db', DBRoutes);



// Chequeo de Master por prioridad según la configuración
setInterval(checkForMaster, config.MasterCheckInterval);

function checkForMaster() {
  if (nodeNumber > 0)
    fetchForAMaster(0);
}

const http = require('http');
function fetchForAMaster(i) {
  if (i < nodeNumber)
    http.get(`http://${config.Orquestadores[i].ip}:${config.Orquestadores[i].port}/alive`,
      makeMeMaster(false))
      .on('error', () => fetchForAMaster(i + 1));
  else
    makeMeMaster(true);
}


function makeMeMaster(bool) {
  app.set('master', bool);
  console.log('Master:', bool)
}

export default app;
