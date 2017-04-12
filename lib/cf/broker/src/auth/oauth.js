'use strict';

const oauth = require('abacus-oauth');

const config = require('../config.js');

const debug = require('abacus-debug')('metering-broker');
const edebug = require('abacus-debug')('e-metering-broker');

const systemToken = oauth.cache(config.uris().cf_api,
  process.env.METERING_BROKER_CLIENT_ID,
  process.env.METERING_BROKER_CLIENT_SECRET,
  'clients.write clients.admin');

let token;

const init = () => {
  debug('Fetching OAuth system token from %o authentication server',
    config.uris().cf_api);
  systemToken.start((err) => {
    if (err)
      edebug('Could not fetch OAuth token %o', err);
    else {
      token = systemToken();
      if (token)
        debug('Successfully fetched OAuth token');
    }
  });
};

const authHeader = () => {
  return token ? { authorization: token } : {};
};

module.exports.init = init;
module.exports.authHeader = authHeader;
