'use strict';

const oauth = require('abacus-oauth');

const config = require('../config.js');

const debug = require('abacus-debug')('abacus-broker');
const edebug = require('abacus-debug')('e-abacus-broker');

const systemToken = oauth.cache(config.uris().api,
  process.env.SERVICE_BROKER_CLIENT_ID,
  process.env.SERVICE_BROKER_CLIENT_SECRET, 'clients.write clients.admin');

const init = () => {
  if(!process.env.SERVICE_BROKER_CLIENT_ID &&
    !process.env.SERVICE_BROKER_CLIENT_SECRET)
    throw new Error('SERVICE_BROKER credentials are not supplied');

  debug('Fetching OAuth system token from server %o', config.uris().cf_api);
  systemToken.start((err) => {
    if (err)
      edebug('Could not fetch OAuth token %o', err);
    else
      debug('Successfully fetched OAuth token from %s', config.uris().cf_api);
  });
  debug('Started OAuth system token from %o authentication server',
    config.uris().api);
};

const authHeader = () => {
  let token = systemToken();
  return token ? { authorization: token } : undefined;
};

module.exports.init = init;
module.exports.authHeader = authHeader;
