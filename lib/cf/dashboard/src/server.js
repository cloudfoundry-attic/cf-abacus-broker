'use strict';

const http = require('http');
const lib = require('./lib');
const logger = lib.logger;

lib.bootstrap();

const app = require('./application');

const startServer = function(app) {
  const port = app.get('port');
  const server = http.createServer(app);
  
  const onerror = function(err) {
	    if (err.syscall !== 'listen') 
	      throw err;
	    
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
	  };
  const onlistening = function() {
	  logger.info('Application successfully started listening on port ', port);
	  };
  
  server.on('error', onerror);
  server.on('listening', onlistening);
  server.listen(port);
};
startServer(app);
