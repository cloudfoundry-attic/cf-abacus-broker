'use strict';

const _ = require('underscore');
const extend = _.extend;

const httpStatus = require('http-status-codes');

describe('Create service instance', () => {

  context('and plans', () => {
    let postSpy;
    let errCode;
    let errMsg;

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
    });

    it('should pass when metering, rating and pricing plans are created',
      (done) => {
        errCode = httpStatus.CREATED;
        errMsg = null;

        const cs = require('../routes/create-service.js');
        cs.createPlans('2342345', 'sdfgsdfg', (statusCode) => {
          expect(statusCode).to.equal(httpStatus.CREATED);
          expect(postSpy.callCount).to.equal(3);
          done();
        });
      });

    it('should fail when 500 error occurs during plan creation', (done) => {
      errCode = httpStatus.INTERNAL_SERVER_ERROR;
      errMsg = 'Error';

      const cs = require('../routes/create-service.js');
      cs.createPlans('2342345', 'sdfgsdfg', (statusCode) => {
        expect(statusCode).to.equal(httpStatus.INTERNAL_SERVER_ERROR);
        expect(postSpy.callCount).to.equal(1);
        done();
      });
    });

    it('should fail when 409 error occurs during plan creation', (done) => {
      errCode = httpStatus.CONFLICT;
      errMsg = 'Error';

      const cs = require('../routes/create-service.js');
      cs.createPlans('2342345', 'sdfgsdfg', (statusCode) => {
        expect(statusCode).to.equal(httpStatus.INTERNAL_SERVER_ERROR);
        expect(postSpy.callCount).to.equal(1);
        done();
      });
    });
  });
});
