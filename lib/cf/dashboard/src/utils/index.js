'use strict';

const logger = require('./dashboardLogger');
const environment = require('./environment');
const routes = require('../routes');
const middleware = require('../middleware/errorMiddleware');
const errors = require('./errors');

const bootstrap = function() {
	  logger.info('Bootstrapping abacus resource consumption ui app');
	  logger.info('Loading app environment');
	  environment.loadEnvironment();
};

exports.logger = logger;
exports.bootstrap = bootstrap;
exports.environment = environment;
exports.routes = routes;
exports.middleware = middleware;
exports.errors = errors;
