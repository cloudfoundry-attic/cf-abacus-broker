'use strict';

const _ = require('underscore');
const memoize = _.memoize;

const urienv = require('abacus-urienv');

const uris = memoize(() => urienv({
  api : 9882,
  auth_server: 9883,
  provisioning: 9880,
  collector: 9080
}));

module.exports.uris = uris;
