'use strict';

const vars = require('./test_settings.json');
const _ = require('lodash');
const auth = require('../../lib/middleware/authmiddleware');
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
  config.cf.authorization_endpoint = process.env.CF_AUTHORIZATION_URL;
  config.cf.token_endpoint = process.env.CF_TOKEN_URL;
  config.cf.abacus_provisioning_endpoint = 'https://abacus-provisioning-plugin';
  global.authStub = sinon.stub(auth, 'ensureAuthenticated');
  global.authStub.callsArg(2);
};

process.env.NODE_ENV = 'test';
loadSettings();
/* !
 * Common modules
 */
