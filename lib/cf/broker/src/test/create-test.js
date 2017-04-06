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

describe.only('Create service instance', () => {
  context('and plans', () => {
    let postSpy;
    let errCode;
    let errMsg;
    let createService;

    beforeEach(() => {
      delete require.cache[require.resolve('abacus-request')];
      delete require.cache[require.resolve('../routes/create-service.js')];

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
      createService = require('../routes/create-service.js');
    });

    it('should fail when 500 error occurs during plan creation', (done) => {
      errCode = httpStatus.INTERNAL_SERVER_ERROR;
      errMsg = 'Error';

      createService.createPlans('2342345', 'sdfgsdfg', (statusCode) => {
        expect(statusCode).to.equal(httpStatus.INTERNAL_SERVER_ERROR);
        expect(postSpy.callCount).to.equal(1);
        done();
      });
    });

    it('should pass when metering, rating and pricing plans are created',
      (done) => {
        errCode = httpStatus.CREATED;
        errMsg = null;

        createService.createPlans('2342345', 'sdfgsdfg', (statusCode) => {
          expect(statusCode).to.equal(httpStatus.CREATED);
          expect(postSpy.callCount).to.equal(6);
          done();
        });
      });

    it('should fail when 409 error occurs during plan creation', (done) => {
      errCode = httpStatus.CONFLICT;
      errMsg = 'Error';

      createService.createPlans('2342345', 'sdfgsdfg', (statusCode) => {
        expect(statusCode).to.equal(httpStatus.INTERNAL_SERVER_ERROR);
        expect(postSpy.callCount).to.equal(1);
        done();
      });
    });
  });
});
