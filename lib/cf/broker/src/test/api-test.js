'use strict';

const _ = require('underscore');
const extend = _.extend;

// Mock the cluster module
const cluster = require('abacus-cluster');
require.cache[require.resolve('abacus-cluster')].exports =
  extend((app) => app, cluster);

// Mock the batch module
require('abacus-batch');
require.cache[require.resolve('abacus-batch')].exports = spy((fn) => fn);

const request = require('abacus-request');

describe('API', () => {
  let server;
  let broker;

  const secured = process.env.SECURED;

  const deleteModules = () => {
    // Delete cached modules exports
    // delete require.cache[require.resolve('abacus-batch')];
    // delete require.cache[require.resolve('abacus-dbclient')];
    // delete require.cache[require.resolve('abacus-breaker')];
    // delete require.cache[require.resolve('abacus-request')];
    // delete require.cache[require.resolve('abacus-retry')];
    // delete require.cache[require.resolve('abacus-throttle')];
    // delete require.cache[require.resolve('abacus-yieldable')];
    delete require.cache[require.resolve('..')];
  };

  beforeEach(() => {
    deleteModules();
  });

  afterEach(() => {
    if (server)
      server.close();

    deleteModules();

    process.env.SECURED = secured;

    server = undefined;
    broker = undefined;
  });

  const authHeader = (user, password) => ({
    authorization: 'Basic ' +
      new Buffer(user + ':' + password).toString('base64')
  });

  const user = 'borked';
  const password = 'secretly';

  before(() => {
    process.env.BROKER_USER = user;
    process.env.BROKER_PASSWORD = password;
  });

  beforeEach(() => {
    broker = require('..');

    // Create a test broker app
    const app = broker();

    // Listen on an ephemeral port
    server = app.listen(0);
  });

  it('responds to OPTIONS request', (done) => {
    request.options('http://localhost::p', {
      p: server.address().port
    }, (err, response) => {
      expect(err).to.equal(undefined);
      expect(response.statusCode).to.equal(200);
      expect(response.headers).to.not.equal(undefined);
      expect(response.body).to.equal(undefined);

      done();
    });
  });

  it('returns catalog', (done) => {
    request.get('http://localhost::p/v2/catalog', {
      p: server.address().port,
      headers: authHeader(user, password)
    }, (err, response) => {
      expect(err).to.equal(undefined);
      expect(response.statusCode).to.equal(200);
      expect(response.headers).to.include.keys('content-type');
      expect(response.headers['content-type']).to.contain('application/json');
      expect(response.body).to.deep.equal(require('../catalog/catalog.json'));

      done();
    });
  });

});
