'use strict';

const _ = require('underscore');
const extend = _.extend;

const httpStatus = require('http-status-codes');

require('abacus-retry');
require.cache[require.resolve('abacus-retry')].exports = (fn) => fn;
require('abacus-breaker');
require.cache[require.resolve('abacus-breaker')].exports = (fn) => fn;
require('abacus-throttle');
require.cache[require.resolve('abacus-throttle')].exports = (fn) => fn;

describe('Bind service instance', () => {

  context('and create UAA client', () => {
    const instanceId = 'instance_id';
    let postSpy;
    let errCode;
    let errMsg;

    beforeEach(() => {
      delete require.cache[require.resolve('abacus-request')];
      delete require.cache[require.resolve('../routes/bind-service.js')];

      postSpy = spy((uri, opts, cb) => {
        cb(errMsg, {
          statusCode: errCode,
          body: {}
        });
      });

      const request = require('abacus-request');
      const requestMock = extend({}, request, {
        post: postSpy
      });

      require.cache[require.resolve('abacus-request')].exports = requestMock;
    });

    it('should pass if UAA client is created', (done) => {
      errCode = httpStatus.CREATED;
      errMsg = null;

      const bs = require('../routes/bind-service.js');
      bs.createUaaClient(instanceId, (statusCode, response) => {
        expect(statusCode).to.equal(httpStatus.CREATED);
        expect(response).not.to.equal(null);
        expect(response.credentials).not.to.equal(null);
        expect(response.credentials.client_secret).not.to.equal(null);
        expect(response.credentials.reporting).not.to.equal(null);
        expect(response.credentials.dashboard_url).not.to.equal(null);
        expect(response.credentials.client_id).to.equal('abacus-rp-' +
          instanceId);

        expect(postSpy.callCount).to.equal(1);
        const body = postSpy.args[0][1].body;
        expect(body.client_id).to.equal('abacus-rp-' + instanceId);
        expect(body.client_secret).not.to.equal(null);
        done();
      });
    });

    it('should fail if UAA server respond with error 500', (done) => {
      errCode = httpStatus.INTERNAL_SERVER_ERROR;
      errMsg = 'Error';

      const bs = require('../routes/bind-service.js');
      bs.createUaaClient(instanceId, (statusCode, credentials) => {
        expect(statusCode).to.equal(httpStatus.INTERNAL_SERVER_ERROR);
        expect(credentials).to.deep.equal({});
        done();
      });
    });

    it('should if UAA server respond with error 409', (done) => {
      errCode = httpStatus.CONFLICT;
      errMsg = null;

      const bs = require('../routes/bind-service.js');
      bs.createUaaClient(instanceId, (statusCode, credentials) => {
        expect(statusCode).to.equal(httpStatus.CONFLICT);
        expect(credentials).to.deep.equal({});
        done();
      });
    });
  });
});
