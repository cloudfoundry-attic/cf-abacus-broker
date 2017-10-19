'use strict';

/* eslint-disable no-unused-expressions */

const _ = require('underscore');
const extend = _.extend;

const request = require('abacus-request');
const oauth = require('abacus-oauth');
const urienv = require('abacus-urienv');

const cluster = require('abacus-cluster');
require.cache[require.resolve('abacus-cluster')].exports =
  extend((app) => app, cluster);

describe('Abacus healthchecker', () => {
  let sandbox;
  let server;
  let healthchecker;

  const startHealthcheckServer = () => {
    healthchecker = require('..');
    const app = healthchecker();
    server = app.listen(0);
    // restore all fakes for the suite
    sandbox.restore();
  };

  const stopHealthcheckServer = () => {
    if (server)
      server.close();
    delete require.cache[require.resolve('..')];
  };

  afterEach(() => {
    sandbox.restore();
    stopHealthcheckServer();
  });

  beforeEach(() => {
    process.env.CF_API = 'http://api.localhost';
    process.env.CF_DOMAIN = 'cfapps.localhost';
    process.env.SECURED = false;
    sandbox = sinon.sandbox.create();
  });

  context('on invalid environment', () => {
    it('when invalid APPLICATION_GROUPS set', (done) => {
      process.env.APPLICATION_GROUPS = 'invalid-json';

      startHealthcheckServer();

      request.get('http://localhost::p/v1/healthcheck', {
        p: server.address().port
      }, (error, response) => {
        expect(error.statusCode).to.equal(500);
        done();
      });
    });
  });

  context('when everything is healthy', () => {
    beforeEach(() => {
      sandbox.stub(request, 'get').yields(undefined, { statusCode: 200 });
    });

    context('when APPLICATION_GROUPS have just one instance per group', () => {
      it('returns status code 200 for every app', (done) => {
        process.env.APPLICATION_GROUPS = `{
          "aggregator": 1,
          "collector": 1
        }`;

        startHealthcheckServer();

        request.get('http://localhost::p/v1/healthcheck', {
          p: server.address().port
        }, (error, response) => {
          expect(error).to.be.undefined;
          expect(response.statusCode).to.equal(200);
          expect(response.body).to.eql({
            'aggregator': {
              'http://aggregator.cfapps.localhost': 200
            },
            'collector': {
              'http://collector.cfapps.localhost': 200
            }
          });
          done();
        });
      });
    });

    context('when APPLICATION_GROUPS have multiple instances per group', () => {
      it('returns status code 200 for every app', (done) => {
        process.env.APPLICATION_GROUPS = `{
          "collector": 1,
          "aggregator": 2
        }`;

        startHealthcheckServer();

        request.get('http://localhost::p/v1/healthcheck', {
          p: server.address().port
        }, (error, response) => {
          expect(error).to.be.undefined;
          expect(response.statusCode).to.equal(200);
          expect(response.body).to.eql({
            'aggregator': {
              'http://aggregator-0.cfapps.localhost': 200,
              'http://aggregator-1.cfapps.localhost': 200
            },
            'collector': {
              'http://collector.cfapps.localhost': 200
            }
          });
          done();
        });
      });
    });
  });

  context('when an app is unhealthy', () => {
    beforeEach(() => {
      const getStub = sandbox.stub(request, 'get');
      getStub.withArgs('http://aggregator.cfapps.localhost/healthcheck')
        .yields(undefined, { statusCode: 200 });
      getStub.withArgs('http://collector.cfapps.localhost/healthcheck')
        .yields(undefined, { statusCode: 500 });
    });

    context('when APPLICATION_GROUPS have just one instance per group', () => {
      it('returns status code 200 for every app', (done) => {
        process.env.APPLICATION_GROUPS = `{
          "aggregator": 1,
          "collector": 1
        }`;

        startHealthcheckServer();

        request.get('http://localhost::p/v1/healthcheck', {
          p: server.address().port
        }, (error, response) => {
          expect(error).to.be.undefined;
          expect(response.statusCode).to.equal(200);
          expect(response.body).to.eql({
            'aggregator': {
              'http://aggregator.cfapps.localhost': 200
            },
            'collector': {
              'http://collector.cfapps.localhost': 500
            }
          });
          done();
        });
      });
    });
  });

  context('when no apps domain is exported', () => {
    beforeEach(() => {
      sandbox.stub(request, 'get').yields(undefined, { statusCode: 200 });
    });

    it('uri env is used to build domain', (done) => {
      process.env.APPLICATION_GROUPS = `{
        "aggregator": 1,
        "collector": 1
      }`;
      delete process.env.CF_DOMAIN;
      const uriUrlSpy = sandbox.spy(urienv, 'url');

      startHealthcheckServer();

      request.get('http://localhost::p/v1/healthcheck', {
        p: server.address().port
      }, (error, response) => {
        expect(error).to.be.undefined;
        expect(response.statusCode).to.equal(200);
        expect(uriUrlSpy.called).to.be.true;
        expect(uriUrlSpy.calledWith('aggregator')).to.be.true;
        expect(uriUrlSpy.calledWith('collector')).to.be.true;
        done();
      });
    });
  });

  context('when environment is SECURED', () => {
    const tokenSecret = 'secret';
    const tokenAlgorithm = 'HS256';

    beforeEach(() => {
      process.env.SECURED = true;
      process.env.JWTKEY = tokenSecret;
      process.env.JWTALGO = tokenAlgorithm;
      process.env.CLIENT_ID = 'client';
      process.env.CLIENT_SECRET = 'secret';
      process.env.APPLICATION_GROUPS = `{
        "aggregator": 1
      }`;
      process.env.CLIENT_SCOPES = 'abacus.system.read';
    });

    it('should call basic strategy validator', () => {
      const basicSpy = sandbox.spy(oauth, 'basicStrategy');

      startHealthcheckServer();

      expect(basicSpy.called).to.be.true;
      expect(basicSpy.firstCall.args).to.eql([process.env.CF_API,
        process.env.CLIENT_SCOPES, tokenSecret, tokenAlgorithm]);
    });

    it('should set basic auth header', (done) => {
      const getSpy = sandbox.spy(request, 'get');
      sandbox.stub(oauth, 'basicStrategy').callsFake(() =>
        (req, res, next) => next());


      startHealthcheckServer();

      request.get('http://localhost::p/v1/healthcheck', {
        headers: {
          authorization: 'Basic some_token'
        },
        p: server.address().port
      }, (error, response) => {
        expect(error).to.be.undefined;
        expect(response.statusCode).to.equal(200);
        expect(getSpy.called).to.be.true;
        expect(getSpy.firstCall.args[1].headers)
          .to.include({ 'Authorization': 'Basic Y2xpZW50OnNlY3JldA==' });
        done();
      });
    });

    it('should return 401 when token is invalid', (done) => {
      const getSpy = sandbox.spy(request, 'get');

      startHealthcheckServer();

      request.get('http://localhost::p/v1/healthcheck', {
        headers: {
          authorization: 'bearer invalid'
        },
        p: server.address().port
      }, (error, response) => {
        expect(error).to.be.undefined;
        expect(response.statusCode).to.equal(401);
        expect(getSpy.called).to.be.false;
        done();
      });
    });
  });


  context('when request returns an error', () => {
    it('should wrap it', (done) => {
      sandbox.stub(request, 'get').yields(new Error('error'));
      process.env.APPLICATION_GROUPS = `{
        "aggregator": 1
      }`;

      startHealthcheckServer();

      request.get('http://localhost::p/v1/healthcheck', {
        p: server.address().port
      }, (error, response) => {
        expect(error).to.be.undefined;
        expect(response.statusCode).to.equal(200);
        expect(response.body).to.eql({
          'aggregator': {
            'http://aggregator.cfapps.localhost': 500
          }
        });
        done();
      });
    });
  });
});
