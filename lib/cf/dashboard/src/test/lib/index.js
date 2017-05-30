'use strict';

const vars = require('./test_settings.json');
const _ = require('lodash');
global.Promise = require('bluebird');
global.sinon = require('sinon');
global.chai = require('chai');
global.expect = global.chai.expect;
global.nock = require('nock');

/* !
 * Chai Plugins
 */
global.chai.use(require('chai-http'));

const loadSettings = function() {
  console.log('Setting environment variables for tests');
  let keys = Object.keys(vars);
  keys.forEach((k) => {
    let val = vars[k];
    if (_.isObject(val))
      process.env[k] = JSON.stringify(val);
    else
      process.env[k] = val;

  });
  let config = require('../../lib/config');
  const auth = require('../../lib/middleware/authMiddleware');
  config.cf.authorize_url = 'https://login/oauth/authorize';
  config.cf.token_url = 'https://uaa/oauth/token';

  config.cf.abacus_provisioning_endpoint = 'https://abacus-provisioning-plugin';
  global.authStub = sinon.stub(auth, 'ensureAuthenticated');
  nock(config.cf.cf_api_endpoint)
    .get('/v2/info')
    .reply(function() {
      return [200, {
        authorization_endpoint: 'https://login',
        token_endpoint: 'https://uaa'
      }];
    });
  global.authStub.callsArg(2);
};

process.env.NODE_ENV = 'test';
loadSettings();
