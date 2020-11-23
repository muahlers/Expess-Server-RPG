const express = require('express'); // Requiro Paquetes Express en node_modules
const bodyParser = require('body-parser'); // Requiro Paquetes Body Parser en node_modules
const cors = require('cors'); // Requiro Paquetes de Cors en node_modules
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const passport = require('passport');

// routes
const routes = require('./routes/main');
const passwordRoutes = require('./routes/password');
const secureRoutes = require('./routes/secure');

// Variables en Archivo .env
require('dotenv').config();

// setup mongo connections
const uri = process.env.MONGO_CONNECTION_URL;
const mongoConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
};
if (process.env.MONGO_USER && process.env.MONGO_PASSWORD) {
  mongoConfig.auth = { authSource: 'admin' };
  mongoConfig.user = process.env.MONGO_USER;
  mongoConfig.pass = process.env.MONGO_PASSWORD;
}

mongoose.connect(uri, mongoConfig);

// if there is no connection to db we exit the app!
mongoose.connection.on('error', (error) => {
  console.log(error);
  console.log('Base de Datos no encontrada');
  process.exit(1);
});

// setup Express App
const app = express(); // Abro una instancia Express y la llamo app!
const port = process.env.PORT || 3000; // Defino un Puerto a Usar por el Server.

// update Express Settings
app.use(bodyParser.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded.
app.use(bodyParser.json()); // parse application/json
app.use(cookieParser());
// Allow requests from other servers.
app.use(cors({ credentials: true, origin: process.env.CORS_ORIGIN }));

// require  passport autho
require('./auth/auth');

// Game.html no quiero que sea publica sin un Token, la pongo antes de la carpeta public.
app.get('/game.html', passport.authenticate('jwt', { session: false }), (request, response) => {
  response.status(200).json(request.user);
});

// Make folder public be aviable as public content
app.use(express.static(`${__dirname}/public`));

// setup routes
app.use('/', routes);
app.use('/', passwordRoutes);
app.use('/', passport.authenticate('jwt', { session: false }), secureRoutes);

// Catch all other routes. Use() catch all that wasn't catch by the upper code.
app.use((request, response) => {
  response.status(404).json({ message: '404 - Not Found', status: '404' });
});

// If a Error Pop ups from another End Point this middlewaer catch it!
app.use((error, request, response, next) => {
  console.log(error);
  response.status(error.status || 500).json({ error: error.message, status: '500' });
});

// server start listening when bd connection is establish.
mongoose.connection.on('connected', () => {
  console.log('connected to mongo');
  app.listen(port, () => {
    console.log(`Server is Running in Port: ${port}`);
  });
});
