'use strict';

const abacusRequest = require('abacus-request');
const generator = require('generate-password');
const httpStatus = require('http-status-codes');

const oauth = require('../auth/oauth.js');
const config = require('../config.js');

const retry = require('abacus-retry');
const throttle = require('abacus-throttle');
const breaker = require('abacus-breaker');


const throttleLimit = process.env.THROTTLE ? parseInt(process.env.THROTTLE) :
  100;

// if a batch is throttled, then throttle limits the number of calls made to
// the batch function limiting the number of batches. In order to avoid that
// all the batch functions when throttled should have a throttle value that is
// multiplied by the batch.
const request = throttle(retry(breaker(abacusRequest)), throttleLimit);

const debug = require('abacus-debug')('metering-broker');
const edebug = require('abacus-debug')('e-metering-broker');

const createClient = (instanceId, cb) => {
  const scopes = ['abacus.usage.' + instanceId + '.read',
    'abacus.usage.' + instanceId + '.write'];

  const clientId = 'abacus-rp-' + instanceId;
  const secret = generator.generate({
    length: 10,
    numbers: true
  });

  request.post(config.uris().uaa_server + '/oauth/clients', {
    headers: oauth.authHeader(),
    body: {
      scope : scopes,
      client_id : clientId,
      client_secret : secret,
      resource_ids : [ ],
      authorized_grant_types : [ 'client_credentials' ],
      authorities : scopes,
      autoapprove : true
    }
  }, (err, res) => {
    if(err) {
      edebug('Could not create UAA client %o', err);
      cb(httpStatus.INTERNAL_SERVER_ERROR, {});
    }
    else if (res.statusCode != httpStatus.CREATED) {
      debug('Could not create UAA client. UAA returned: ', res.statusCode);
      cb(res.statusCode, {});
    }
    else {
      debug('Successfully created UAA client');
      cb(res.statusCode, {
        credentials: {
          client_id: clientId,
          client_secret: secret,
          reporting_url: config.uris().collector,
          dashboard_url: ''
        }
      });
    }
  });
};

const deleteClient = (instanceId, cb) => {
  const clientId = 'abacus-rp-' + instanceId;
  debug('Deleting UAA client id %o', clientId);

  request.delete(config.uris().uaa_server + '/oauth/clients/' + clientId, {
    headers: oauth.authHeader()
  }, (err, res) => {
    if(err) {
      edebug('Could not delete UAA client from authorization server due to %o',
        err);
      cb(httpStatus.INTERNAL_SERVER_ERROR);
    }
    else if (res.statusCode == httpStatus.NOT_FOUND) {
      debug('UAA client not found on authorization server');
      cb(httpStatus.OK);
    }
    else if (res.statusCode == httpStatus.OK) {
      debug('Successfully deleted UAA client from authorization server',
        res.statusCode);
      cb(res.statusCode);
    }
    else {
      debug('Could not delete UAA client from authorization server, status ' +
        'code returned %o', res.statusCode);
      cb(res.statusCode);
    }
  });
};

module.exports.createClient = createClient;
module.exports.deleteClient = deleteClient;
