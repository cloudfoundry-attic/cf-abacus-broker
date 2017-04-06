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

    const testPlanId = 'testPlanId';
    const instanceName = 'testInstanceName';

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
    const sampleMeteringPlan = {
      plan_id: testPlanId,
      measures:[{
        name:'sampleName',
        unit:'sampleUnit'
      }],
      metrics:[{
        name: 'sampleName',
        unit:'sampleUnit',
        type:'sampleType'
      }]
    };

    const samplePricingPlan = {
      plan_id: testPlanId,
      metrics: [{
        name: 'sampleName',
        prices: [{
          country: 'sampleCountry',
          price: 0
        }]
      }]
    };

    const sampleRatingPlan = {
      plan_id: testPlanId,
      metrics: [{
        name: 'sampleName'
      }]
    };

    it('should fail when 500 error occurs during plan creation', (done) => {
      errCode = httpStatus.INTERNAL_SERVER_ERROR;
      errMsg = 'Error';

      createService.createPlans(testPlanId, instanceName, (statusCode) => {
        expect(statusCode).to.equal(httpStatus.INTERNAL_SERVER_ERROR);
        expect(postSpy.callCount).to.equal(1);
        done();
      });
    });

    it('should pass when metering, rating and pricing plans are created',
      (done) => {
        errCode = httpStatus.CREATED;
        errMsg = null;

        createService.createPlans(testPlanId, instanceName, (statusCode) => {
          expect(statusCode).to.equal(httpStatus.CREATED);
          expect(postSpy.callCount).to.equal(6);

          expect(postSpy.getCalls()[0].args[1].body)
            .to.deep.equal(sampleMeteringPlan);

          expect(postSpy.getCalls()[1].args[1].body)
            .to.deep.equal(samplePricingPlan);

          expect(postSpy.getCalls()[2].args[1].body)
            .to.deep.equal(sampleRatingPlan);

          expect(postSpy.getCalls()[3].args[1].resource_id)
            .to.equal(testPlanId);
          expect(postSpy.getCalls()[3].args[1].plan_id).to.equal(testPlanId);

          expect(postSpy.getCalls()[4].args[1].resource_id)
            .to.equal(testPlanId);
          expect(postSpy.getCalls()[4].args[1].plan_id).to.equal(testPlanId);

          expect(postSpy.getCalls()[5].args[1].resource_id)
            .to.equal(testPlanId);
          expect(postSpy.getCalls()[5].args[1].plan_id).to.equal(testPlanId);

          done();
        });
      });

    it('should fail when 409 error occurs during plan creation', (done) => {
      errCode = httpStatus.CONFLICT;
      errMsg = 'Error';

      createService.createPlans(testPlanId, instanceName, (statusCode) => {
        expect(statusCode).to.equal(httpStatus.INTERNAL_SERVER_ERROR);
        expect(postSpy.callCount).to.equal(1);
        done();
      });
    });
  });
});
