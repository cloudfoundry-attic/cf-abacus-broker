'use strict';

const async = require('async');
const httpStatus = require('http-status-codes');

const _ = require('underscore');
const extend = _.extend;

const request = require('abacus-request');

const config = require('../config.js');

describe('Create service instance', () => {
  let postSpy;
  let errorCode;
  let errorMessage;
  let createService;

  const testInstanceId = 'testInstanceId';
  const testServiceId = 'testServiceId';
  const planConfig = {
    'instance_id': testInstanceId,
    'service_id': testServiceId
  };

  const formattedPlanId = config.generatePlanId(testInstanceId, testInstanceId);

  before(() => {
    require('abacus-retry');
    require.cache[require.resolve('abacus-retry')].exports = (fn) => fn;
    require('abacus-breaker');
    require.cache[require.resolve('abacus-breaker')].exports = (fn) => fn;
    require('abacus-throttle');
    require.cache[require.resolve('abacus-throttle')].exports = (fn) => fn;
  });

  beforeEach(() => {
    delete require.cache[require.resolve('abacus-request')];
    delete require.cache[require.resolve('../routes/create-service.js')];
    delete require.cache[require.resolve('../config.js')];

    postSpy = spy((uri, opts, cb) => {
      if(uri.includes('mappings'))
        cb(errorMessage, {
          statusCode: httpStatus.OK,
          body: {}
        });
      else
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

  context('when error code', () => {

    context('500 is retured during plan creation', (done) => {
      beforeEach(() => {
        errorCode = httpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = 'Error';
      });

      it('should fail', (done) => {
        createService.createPlans(planConfig, (statusCode) => {
          expect(statusCode).to.equal(httpStatus.INTERNAL_SERVER_ERROR);
          expect(postSpy.callCount).to.equal(1);
          done();
        });
      });
    });

    context('404 is retured from providsioning during plan creation',
      (done) => {
        beforeEach(() => {
          errorCode = httpStatus.NOT_FOUND;
          errorMessage = undefined;
        });

        it('should fail', (done) => {
          createService.createPlans(planConfig, (statusCode) => {
            expect(statusCode).to.equal(httpStatus.INTERNAL_SERVER_ERROR);
            expect(postSpy.callCount).to.equal(1);
            done();
          });
        });
      });

    context('409 error occurs during plan creation', () => {
      beforeEach(() => {
        errorCode = httpStatus.CONFLICT;
        errorMessage = 'Error';
      });

      it('should fail', (done) => {
        createService.createPlans(planConfig, (statusCode) => {
          expect(statusCode).to.equal(httpStatus.INTERNAL_SERVER_ERROR);
          expect(postSpy.callCount).to.equal(1);
          done();
        });
      });
    });
  });

  context('when createService is called', () => {

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

    const resProvider = {
      service_name: 'test_service_name',
      service_plan_name: 'test_plan_name'
    };

    context('plans and mappings are created', () => {

      beforeEach((done) => {
        errorCode = httpStatus.CREATED;
        errorMessage = null;

        createService.createPlans(planConfig, (statusCode) => {
          expect(statusCode).to.equal(httpStatus.CREATED);
          expect(postSpy.callCount).to.equal(6);
          done();
        });
      });

      const meteringRequestParameters = {
        plan_id: formattedPlanId,
        resource_id: testInstanceId,
        plan_name: config.defaultPlanName
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

    context('custom configuration is provided', () => {

      const meteringPlan = {
        plan_id: 'test',
        measures: [
          {
            name: 'classifiers',
            unit: 'INSTANCE'
          }
        ],
        metrics: [
          {
            name: 'classifier_instances',
            unit: 'INSTANCE',
            type: 'discrete',
            formula: 'AVG({classifier})'
          }
        ]
      };

      const generateCustomPlans = (resourceProvider) => {
        const result = {
          plan: meteringPlan
        };

        if (resourceProvider)
          extend(result, { resource_provider: resourceProvider });

        return { plans: [result] };
      };

      before(() => {
        planConfig.parameters = generateCustomPlans();

        errorCode = httpStatus.CREATED;
        errorMessage = null;
      });

      afterEach(() => {
        postSpy.reset();
      });

      it('should succeed', (done) => {
        createService.createPlans(planConfig, (statusCode) => {
          expect(statusCode).to.equal(httpStatus.CREATED);
          const expectedPlan = extend({}, meteringPlan, {
            plan_id: config.generatePlanId(planConfig.instance_id,
              planConfig.instance_id) });
          assert.calledWith(postSpy.firstCall, sinon.match.any,
            sinon.match({ body: expectedPlan }));

          done();
        });
      });

      context('and resource provider property is supplied', () => {

        const testOrgGuid = '34kj34kj-0be6-45f3-a1f0-1d3fe41db4dd';
        const testSpaceGuid = '12hg12hg-c3cb-4bc1-ac74-f9bf4d9df83c';

        before(() => {
          planConfig.parameters = generateCustomPlans(resProvider);
          planConfig.organization_guid = testOrgGuid;
          planConfig.space_guid = testSpaceGuid;
          errorCode = httpStatus.CREATED;
          errorMessage = null;
        });


        it('should succeed', (done) => {
          createService.createPlans(planConfig, (statusCode) => {
            expect(statusCode).to.equal(httpStatus.CREATED);

            const expectedBody = {
              organization_guid: testOrgGuid,
              space_guid: testSpaceGuid,
              service_name: 'test_service_name',
              service_plan_name: 'test_plan_name'
            };
            assert.calledWith(postSpy.firstCall, sinon.match.any,
              sinon.match({ body: expectedBody }));
            done();
          });
        });

      });

    });

    context('custom configuration is not provided', () => {

      const testCreatePlans = (planConfig, done) => {
        createService.createPlans(planConfig, (statusCode) => {
          expect(statusCode).to.equal(httpStatus.INTERNAL_SERVER_ERROR);
          expect(postSpy.callCount).to.equal(0);
          done();
        });
      };

      beforeEach(() => {
        planConfig.parameters = {};
      });

      it('should fail when parameters is empty', (done) => {
        testCreatePlans(planConfig, done);
      });

      it('should fail when plans is empty', (done) => {
        planConfig.parameters.plans = [];
        testCreatePlans(planConfig, done);
      });

      it('should fail when plan is not provided', (done) => {
        planConfig.parameters.plans = [{}];
        testCreatePlans(planConfig, done);
      });

      it('should fail when only resourceProvider is available', (done) => {
        planConfig.parameters.plans = [{ resource_provider: resProvider }];
        testCreatePlans(planConfig, done);
      });

    });

  });

  context('validating dashboard url', () => {

    const testInstanceId = 'f659d315-953c-4ab3-9e64-14b53ea7214a';
    const testBrokerUser = 'broker_user';
    const testBrokerPassword = 'broker_password';
    let server;

    before(() => {
      const cluster = require('abacus-cluster');
      require.cache[require.resolve('abacus-cluster')].exports =
        extend((app) => app, cluster);

      process.env.BROKER_USER = testBrokerUser;
      process.env.BROKER_PASSWORD = testBrokerPassword;

      const broker = require('..');
      const app = broker();
      server = app.listen(0);
    });

    after(() => {
      delete process.env.BROKER_USER;
      delete process.env.BROKER_PASSWORD;

      if (server)
        server.close();
    });

    afterEach(() => {
      async.waterfall.restore();
    });

    const requestConfig = (port) => {
      return {
        p: port,
        instance_id: testInstanceId,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization:
            'Basic ' + new Buffer(testBrokerUser + ':' + testBrokerPassword)
              .toString('base64')
        }
      };
    };

    context('when plans are not created', () => {

      beforeEach(() => {
        stub(async, 'waterfall').yields('Failed to create plans');
      });

      it('should not return dashborad url', (done) => {

        request.put('http://localhost::p/v2/service_instances/:instance_id',
          requestConfig(server.address().port), (err, res) => {
            expect(err.statusCode).to.equals(500);
            expect(res).to.equal(undefined);

            done();
          });
      });
    });

    context('when plans are created', () => {

      beforeEach(() => {
        stub(async, 'waterfall').yields(undefined);
      });

      it('should return dashborad url', (done) => {

        request.put('http://localhost::p/v2/service_instances/:instance_id',
          requestConfig(server.address().port), (err, res) => {
            expect(res.statusCode).to.equals(201);
            expect(err).to.equal(undefined);

            const expectedBody = { dashboard_url: `/${testInstanceId}` };
            expect(res.body).to.deep.equal(expectedBody);

            done();
          });
      });
    });

  });

});
