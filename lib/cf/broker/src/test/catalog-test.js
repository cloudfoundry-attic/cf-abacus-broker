'use strict';

const _ = require('underscore');
const extend = _.extend;

// Mock the cluster module
const cluster = require('abacus-cluster');
require.cache[require.resolve('abacus-cluster')].exports =
  extend((app) => app, cluster);


const request = require('abacus-request');
const httpStatus = require('http-status-codes');

describe('Catalog', () => {
  let server;
  let broker;

  const redirectUrl = 'http//localhost:3000/dashboard';
  const dashboardClient = 'client';
  const dashboardSecret = 'secret';

  const secured = process.env.SECURED;

  const deleteModules = () => {
    delete require.cache[require.resolve('..')];
  };

  const authHeader = (user, password) => ({
    authorization: 'Basic ' +
    new Buffer(user + ':' + password).toString('base64')
  });

  afterEach(() => {
    if (server)
      server.close();

    process.env.SECURED = secured;
  });

  beforeEach(() => {
    deleteModules();

    broker = require('..');
    const app = broker();
    server = app.listen(0);
  });

  context('with correct credentials', () => {
    const user = 'borked';
    const password = 'secretly';

    before(() => {
      process.env.BROKER_USER = user;
      process.env.BROKER_PASSWORD = password;
      process.env.DASHBOARD_REDIRECT_URL = redirectUrl;
      process.env.DASHBOARD_CLIENT_ID = dashboardClient;
      process.env.DASHBOARD_CLIENT_SECRET = dashboardSecret;
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
        expect(response.body).to.deep.equal(require('../catalog/catalog.js'));

        done();
      });
    });

    it('returns catalog with proper dashboard details', (done) => {
      request.get('http://localhost::p/v2/catalog', {
        p: server.address().port,
        headers: authHeader(user, password)
      }, (err, response) => {
        expect(err).to.equal(undefined);
        expect(response.statusCode).to.equal(200);
        expect(response.headers).to.include.keys('content-type');
        expect(response.headers['content-type']).to.contain('application/json');
        expect(response.body).to.include.keys('services');
        expect(response.body.services[0].dashboard_client).to.deep.equal({
          id: dashboardClient,
          secret: dashboardSecret,
          redirect_uri: redirectUrl
        });

        done();
      });
    });
  });

  context('with incorrect credentials', () => {
    const user = 'someone';
    const password = 'withwrongpassword';

    before(() => {
      process.env.BROKER_USER = 'user';
      process.env.BROKER_PASSWORD = 'password';
    });

    it('fails with proper error', (done) => {
      request.get('http://localhost::p/v2/catalog', {
        p: server.address().port,
        headers: authHeader(user, password)
      }, (err, response) => {
        expect(err).to.equal(undefined);
        expect(response.statusCode).to.equal(401);
        expect(response.body).to.equal(
          httpStatus.getStatusText(httpStatus.UNAUTHORIZED)
        );

        done();
      });
    });
  });
});
