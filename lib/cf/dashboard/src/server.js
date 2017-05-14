'use strict';

const http = require('http');
const lib = require('./lib');
const logger = lib.logger;

lib.bootstrap();

const app = require('./application');

function startServer(app) {
  const port = app.get('port');

  const server = http.createServer(app);

  server.on('error', onerror);
  server.on('listening', onlistening);
  server.listen(port);

  function onerror(err) {
    if (err.syscall !== 'listen') {
      throw err;
    }
    switch (err.code) {
      case 'EACCES':
        logger.error('Port ' + port + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        logger.error('Port ' + port + ' is already in use');
        process.exit(1);
        break;
      default:
        throw err;
    }
  }

  function onlistening() {
    logger.info('Resource Consumption server successfully started listening on port ', port);
  }
}
startServer(app);
