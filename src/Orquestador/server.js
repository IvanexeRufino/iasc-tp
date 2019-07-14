import express, { urlencoded, json } from 'express'
import bodyParser from 'body-parser';
const app = express(bodyParser.json());

require("hjson/lib/require-config");
const config = require("./config.hjson");

let nodeNumber = process.argv[2];
if (!nodeNumber) {
  console.error(`You must specify a node number beetwen 0 and ${config.Orquestadores.length - 1} as a parameter.`);
  process.exit();
}
if (!config.Orquestadores[nodeNumber]) {
  console.error(`Invalid node number try with a number below ${config.Orquestadores.length}.`);
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

function makeMeMaster(bool) {
  app.set('master', bool);
  console.log('Master:', bool)
}

setInterval(checkForMaster, config.masterCheckInterval);

const http = require('http');

function checkForMaster() {
  if (nodeNumber > 0)
    fetchForAMaster(0);
}

function fetchForAMaster(i) {
  if (i < nodeNumber) {
    let url = config.Orquestadores[i].ip
    let port = config.Orquestadores[i].port
    http.get(`http://${url}:${port}/alive`,
      () => makeMeMaster(false))
      .on('error', () => fetchForAMaster(i + 1));
  } else
    makeMeMaster(true);
}

export default app;
