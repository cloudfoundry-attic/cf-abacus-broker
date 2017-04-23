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

describe('Create service instance', () => {
  let postSpy;
  let errorCode;
  let errorMessage;
  let createService;

  const testPlanId = 'testPlanId';
  const instanceName = 'testInstanceName';
  const formattedPlanId = require('../routes/create-service.js')
    .generatePlanId(testPlanId, testPlanId);

  beforeEach(() => {
    delete require.cache[require.resolve('abacus-request')];
    delete require.cache[require.resolve('../routes/create-service.js')];

    postSpy = spy((uri, opts, cb) => {
      cb(errorMessage, {
        statusCode: errorCode,
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

  context('when error code 500 is retured during plan creation', (done) => {
    beforeEach(() => {
      errorCode = httpStatus.INTERNAL_SERVER_ERROR;
      errorMessage = 'Error';
    });

    it('should fail', (done) => {
      createService.createPlans(testPlanId, instanceName, (statusCode) => {
        expect(statusCode).to.equal(httpStatus.INTERNAL_SERVER_ERROR);
        expect(postSpy.callCount).to.equal(1);
        done();
      });
    });
  });

  context('when metering, rating and pricing plans are created', () => {

    beforeEach((done) => {
      errorCode = httpStatus.CREATED;
      errorMessage = null;

      createService.createPlans(testPlanId, instanceName, (statusCode) => {
        expect(statusCode).to.equal(httpStatus.CREATED);
        expect(postSpy.callCount).to.equal(6);
        done();
      });
    });

    const meteringRequestParameters = {
      plan_id: formattedPlanId,
      resource_id: formattedPlanId
    };

    const sampleMeteringPlan = {
      plan_id: formattedPlanId,
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
      plan_id: formattedPlanId,
      metrics: [{
        name: 'sampleName',
        prices: [{
          country: 'sampleCountry',
          price: 0
        }]
      }]
    };

    const sampleRatingPlan = {
      plan_id: formattedPlanId,
      metrics: [{
        name: 'sampleName'
      }]
    };

    const itShouldCreate = (name, callIndex, requestParameters) => {
      it(`${name} should be created`, () => {
        expect(postSpy.getCall(callIndex).calledWithMatch(sinon.match.any,
          requestParameters)).to.equal(true);
      });
    };

    [ { 'metering plan': { body: sampleMeteringPlan } },
      { 'pricing plan': { body: samplePricingPlan } },
      { 'rating plan': { body: sampleRatingPlan } },
      { 'metering mapping': meteringRequestParameters },
      { 'pricing mapping': meteringRequestParameters },
      { 'rating mapping': meteringRequestParameters }
    ].forEach((value, idx) => {
      let name = Object.keys(value)[0];
      itShouldCreate(name, idx, value[name]);
    });
  });

  context('when 409 error occurs during plan creation', () => {
    beforeEach(() => {
      errorCode = httpStatus.CONFLICT;
      errorMessage = 'Error';
    });

    it('should fail', (done) => {
      createService.createPlans(testPlanId, instanceName, (statusCode) => {
        expect(statusCode).to.equal(httpStatus.INTERNAL_SERVER_ERROR);
        expect(postSpy.callCount).to.equal(1);
        done();
      });
    });
  });
});
