import express, { urlencoded, json } from 'express'
import bodyParser from 'body-parser';

const app = express(bodyParser.json());

// Importing Routes
import HomeRoutes from './routes/home'
import DBRoutes from './routes/db'

// settings
app.set('port', process.env.PORT || 4000);

// Middlewares
app.use(urlencoded({ extended: false }));
app.use(json());

// Routes
app.use(HomeRoutes);
app.use('/db', DBRoutes);

export default app;