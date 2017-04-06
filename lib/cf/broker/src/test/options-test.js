'use strict';

const _ = require('underscore');
const extend = _.extend;

// Mock the cluster module
const cluster = require('abacus-cluster');
require.cache[require.resolve('abacus-cluster')].exports =
  extend((app) => app, cluster);

const request = require('abacus-request');

describe('Options', () => {
  let server;
  let broker;

  const secured = process.env.SECURED;

  const deleteModules = () => {
    delete require.cache[require.resolve('..')];
  };

  afterEach(() => {
    if (server)
      server.close();

    deleteModules();

    process.env.SECURED = secured;
  });

  beforeEach(() => {
    deleteModules();

    broker = require('..');
    const app = broker();
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
});
