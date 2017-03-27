'use strict';

// const _ = require('underscore');
// const memoize = _.memoize;

// const batch = require('abacus-batch');
// const breaker = require('abacus-breaker');
const cluster = require('abacus-cluster');
// const oauth = require('abacus-oauth');
// const request = require('abacus-request');
// const retry = require('abacus-retry');
const router = require('abacus-router');
// const throttle = require('abacus-throttle');
// const urienv = require('abacus-urienv');
const webapp = require('abacus-webapp');

// TODO: Needed to access provisioning plugin
//
// const throttleLimit = process.env.THROTTLE ? parseInt(process.env.THROTTLE) :
//   100;
// const batchSize = process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE) :
//   100;
//
// // if a batch is throttled, then throttle limits the number of calls made to
// // the batch function limiting the number of batches. In order to avoid that
// // all the batch functions when throttled have a throttle value that is
// // multiplied by the batch.
// const reliableRequest = throttle(retry(breaker(batch(request))),
//   batchSize * throttleLimit);

// Setup debug log
const debug = require('abacus-debug')('abacus-cf-broker');
// const edebug = require('abacus-debug')('e-abacus-cf-broker');

// Create an express router
const routes = router();

// Build Passport middleware for basic auth
const basicAuth = require('./auth/basic.js');

// const dbalias = process.env.DBALIAS || 'db';
//
// // Resolve service URIs
// const uris = memoize(() => urienv({
//   auth_server : 9882,
//   [dbalias]   : 5984,
//   provisioning: 9880
// }));
//
// // Use secure routes or not
// const secured = process.env.SECURED === 'true';
//
// // Abacus system token
// const systemToken = secured ? oauth.cache(uris().auth_server,
//   process.env.ABACUS_CLIENT_ID, process.env.ABACUS_CLIENT_SECRET,
//   'abacus.usage.write abacus.usage.read') :
//   undefined;
//
// const authHeader = (token) => token ? { authorization: token() } : {};

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
  debug('Starting broker ...');

  // Start token functions
  if (secured)
    systemToken.start();
};

// Create a CF broker app
const broker = () => {
  debug('Starting broker app ...');
  cluster.singleton();

  if (cluster.isWorker()) {
    debug('Starting broker worker');
    startBroker();
  }

  // Create the Webapp
  const app = webapp();

  // Attach our routes
  app.use(routes);

  return app;
};

// Command line interface, create the broker app and listen
const runCLI = () => broker().listen();

// Export our public functions
module.exports = broker;
module.exports.runCLI = runCLI;
