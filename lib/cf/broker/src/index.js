'use strict';

const cluster = require('abacus-cluster');
const router = require('abacus-router');
const webapp = require('abacus-webapp');
const oauth = require('./auth/oauth.js');
const basicAuth = require('./auth/basic.js');

const debug = require('abacus-debug')('abacus-broker');

const routes = router();

routes.get('/v2/catalog',
  basicAuth, require('./routes/get-catalog.js'));
routes.put('/v2/service_instances/:instance_id',
  basicAuth, require('./routes/create-service.js'));
routes.delete('/v2/service_instances/:instance_id',
  basicAuth, require('./routes/delete-service.js'));
routes.put('/v2/service_instances/:instance_id/service_bindings/:binding_id',
  basicAuth, require('./routes/bind-service.js'));
routes.delete('/v2/service_instances/:instance_id/service_bindings/:binding_id',
  basicAuth, require('./routes/unbind-service.js'));
routes.patch('/v2/service_instances/:id',
  basicAuth, require('./routes/update-service.js'));

const startBroker = () => {
  debug('Starting broker');
  oauth.init();
};

const broker = () => {
  debug('Starting broker app');
  cluster.singleton();

  if (cluster.isWorker()) {
    debug('Starting broker worker');
    startBroker();
  }

  const app = webapp();
  app.use(routes);

  return app;
};

// Command line interface, create the broker app and listen
const runCLI = () => broker().listen();

// Export our public functions
module.exports = broker;
module.exports.runCLI = runCLI;
