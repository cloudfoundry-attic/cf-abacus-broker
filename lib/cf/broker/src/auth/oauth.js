'use strict';

const oauth = require('abacus-oauth');

const config = require('../config.js');

const debug = require('abacus-debug')('metering-broker');
const edebug = require('abacus-debug')('e-metering-broker');

const systemToken = oauth.cache(config.uris().cf_api,
  process.env.SERVICE_BROKER_CLIENT_ID,
  process.env.SERVICE_BROKER_CLIENT_SECRET,
  'clients.write clients.admin');

const init = () => {
  systemToken.start((err) => {
    if (err)
      edebug('Could not fetch OAuth token %o', err);
  });
  debug('Started OAuth system token from %o authentication server',
    config.uris().cf_api);
};

const authHeader = () => {
  return { authorization: systemToken() };
};

module.exports.init = init;
module.exports.authHeader = authHeader;
