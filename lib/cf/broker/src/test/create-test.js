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
  const formattedPlanId = `resource_provider/${testPlanId}/plan/${testPlanId}`;

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

  context('when 500 error occurs during plan creation', (done) => {
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

    it('metering plan should be created', () => {
      expect(postSpy.getCalls()[0].args[1].body)
        .to.deep.equal(sampleMeteringPlan);
    });

    it('pricing plan should be created', () => {
      expect(postSpy.getCalls()[1].args[1].body)
        .to.deep.equal(samplePricingPlan);
    });

    it('rating plan should be created', () => {
      expect(postSpy.getCalls()[2].args[1].body)
        .to.deep.equal(sampleRatingPlan);
    });

    it('metering mapping should be created', () => {
      expect(postSpy.getCalls()[3].args[1].resource_id)
        .to.equal(testPlanId);
      expect(postSpy.getCalls()[3].args[1].plan_id).to.equal(testPlanId);
    });

    it('metering pricing should be created', () => {
      expect(postSpy.getCalls()[4].args[1].resource_id)
        .to.equal(testPlanId);
      expect(postSpy.getCalls()[4].args[1].plan_id).to.equal(testPlanId);
    });

    it('metering rating should be created', () => {
      expect(postSpy.getCalls()[5].args[1].resource_id)
        .to.equal(testPlanId);
      expect(postSpy.getCalls()[5].args[1].plan_id).to.equal(testPlanId);
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

  context('when create service is called', () => {
    const instanceId = 'test-instance-uid';
    const instanceName = 'test-instance';
    let statusCode;
    let responseBody;
    const req = {
      params: { instance_id: instanceId },
      body: { instance_name: instanceName }
    };
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          send:  (res) => {
            responseBody = res;
          }
        };
      }
    };

    before(() => {
      process.env.DASHBOARD_URI = 'https://url.com/manage/providers/';
      errorCode = httpStatus.CREATED;
      errorMessage = null;
    });

    it('correct dashboard uri should be returned', (done) => {
      createService(req, res);
      expect(statusCode).to.equal(httpStatus.CREATED);
      expect(responseBody.dashboard_url).to
        .equal(process.env.DASHBOARD_URI + instanceId);
      done();
    });
  });
});
