'use strict';

const oauth = require('abacus-oauth');

const config = require('../config.js');

const debug = require('abacus-debug')('abacus-broker');

const systemToken = oauth.cache(config.uris().api,
  process.env.SERVICE_BROKER_CLIENT_ID,
  process.env.SERVICE_BROKER_CLIENT_SECRET, 'clients.write clients.admin');

const init = (cb) => {
  debug('Fetching OAuth system token from server %o', config.uris().api);
  systemToken.start(cb);
};

const authHeader = () => {
  let token = systemToken();
  return token ? { authorization: token } : undefined;
};

module.exports.init = init;
module.exports.authHeader = authHeader;
