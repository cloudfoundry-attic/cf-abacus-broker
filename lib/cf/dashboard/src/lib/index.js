'use strict';

const logger = require('./logger');
const environment = require('./environment');
const routes = require('./routes');
const middleware = require('./middleware');
const errors = require('./errors');

exports.logger = logger;
exports.bootstrap = bootstrap;
exports.environment = environment;
exports.routes = routes;
exports.middleware = middleware;
exports.errors = errors;

function bootstrap() {
  logger.info('Bootstrapping abacus resource consumption ui app');
  logger.info('Loading app environment');
  environment.loadEnvironment();
}
