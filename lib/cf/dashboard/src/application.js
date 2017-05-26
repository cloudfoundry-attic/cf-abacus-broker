'use strict';
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const passport = require('passport');
const lib = require('./lib');
const routes = lib.routes;
const middleware = lib.middleware;
const config = require('./lib/config');
const auth = require('./lib/auth');
const port = process.env.PORT || 5000;
const createApp = function() {
  const app = express();
  app.set('case sensitive routing', true);
  app.set('env', process.env.NODE_ENV || 'development');
  app.set('port', port);
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(bodyParser.json());
  app.use(express.static(__dirname + '/webapp'));
  app.use(require('express-session')({
    saveUninitialized: false,
    resave: false,
    secret: config.cf.cookie_secret,
    key: 'JSESSIONID'
  }));
  app.enable('trust proxy');
  app.get('/healthcheck', (req, res) => {
	  res.status(200).send({
	    'healthy': true
	  });
  });
  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(auth.strategy);
  app.set('views', path.join(__dirname, 'webapp/views'));
  app.set('view engine', 'pug');
  app.use('/v1', routes.cfAbacus);
  app.use('/manage/instances', routes.ui);
  app.use(middleware.notFound());
  // error handler
  app.use(middleware.error({
    formats: [
      'json',
      'text',
      'html'
    ]
  }));
  return app;
};
const app = createApp();
module.exports = app;
