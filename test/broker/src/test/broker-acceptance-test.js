'use strict';

/* eslint-disable no-unused-expressions */

const _ = require('underscore');
const findWhere = _.findWhere;

const oauth = require('abacus-oauth');
const moment = require('abacus-moment');
const yieldable = require('abacus-yieldable');

const testUtils = require('abacus-ext-test-utils');
const appUtils = require('abacus-ext-test-app-utils')();

const TestApp = appUtils.App;
const TestService = appUtils.Service;

const testEnv = testUtils.envConfig;
const abacusUtils = testUtils(testEnv.provisioningUrl, testEnv.collectorUrl,
  testEnv.reportingUrl);

const abacusPrefix = process.env.ABACUS_PREFIX;

const totalTimeout = process.env.TOTAL_TIMEOUT || 300000;

const testPlan = {
  measures: [
    {
      name: 'storage',
      unit: 'BYTE'
    }],
  metrics: [
    {
      name: 'storage',
      unit: 'GIGABYTE',
      type: 'discrete',
      meter: ((m) => new BigNumber(m.storage)
        .div(1073741824).toNumber()).toString(),
      accumulate: ((a, qty, start, end, from, to, twCell) =>
        end < from || end >= to ? null : Math.max(a, qty))
        .toString()
    }]
};

const sampleMeteringPlan = {
  plans: [{ plan: testPlan }]
};

const complexMeteringPlan = {
  plans: [
    {
      plan: {
        plan_id: 'standard-object-storage',
        measures: [
          {
            name: 'storage',
            unit: 'BYTE'
          },
          {
            name: 'light_api_calls',
            unit: 'CALL'
          },
          {
            name: 'heavy_api_calls',
            unit: 'CALL'
          }],
        metrics: [
          {
            name: 'storage',
            unit: 'GIGABYTE',
            type: 'discrete',
            meter: ((m) => new BigNumber(m.storage)
              .div(1073741824).toNumber()).toString(),
            accumulate: ((a, qty, start, end, from, to, twCell) =>
              end < from || end >= to ? null :
                Math.max(a, qty)).toString()
          },
          {
            name: 'thousand_light_api_calls',
            unit: 'THOUSAND_CALLS',
            type: 'discrete',
            meter: ((m) => new BigNumber(m.light_api_calls)
              .div(1000).toNumber()).toString(),
            aggregate: ((a, prev, curr, aggTwCell, accTwCell) =>
              new BigNumber(a || 0).add(curr).sub(prev).toNumber())
              .toString()
          },
          {
            name: 'heavy_api_calls',
            unit: 'CALL',
            type: 'discrete',
            meter: ((m) => m.heavy_api_calls).toString()
          }]
      }
    }
  ]
};

const testServiceName = 'test-service';
const testServicePlanName = 'test-service-plan-name';

const serviceMappingMeteringPlan = {
  plans: [
    {
      plan: testPlan,
      resource_provider: {
        service_name: testServiceName,
        service_plan_name: testServicePlanName
      }
    }
  ]
};

describe('Abacus Broker Acceptance test', function() {
  this.timeout(totalTimeout);

  const app = TestApp();
  const createdInstance = TestService(`created-${moment.utc().valueOf()}`);
  const updatedInstance = TestService(`updated-${moment.utc().valueOf()}`);

  const orgId = app.orgGuid();
  const spaceId = app.spaceGuid();
  let now = moment.utc().valueOf();

  before(() => app.deploy());
  afterEach(() => {
    createdInstance.unbind(app.appName);
    createdInstance.destroy();
  });

  const validateInstance = function *(instance, measuredUsage) {
    instance.bind(app.appName);
    app.restart();

    const credentials = yield yieldable(app.getCredentials);

    expect(credentials).to.have.property('client_id');
    expect(credentials).to.have.property('client_secret');
    expect(credentials).to.have.property('resource_id');
    expect(credentials).to.have.property('plans');

    const resourceId = credentials.resource_id;
    const clientId = credentials.client_id;
    const clientSecret = credentials.client_secret;

    const usageToken = oauth.cache(testEnv.api, clientId, clientSecret,
      `abacus.usage.${resourceId}.write,abacus.usage.${resourceId}.read`);

    yield yieldable(usageToken.start);

    now++;
    const resourceInstanceId = `${now}-151-413-121-110987654321d`;
    const consumerId = `app:${resourceInstanceId}`;
    const usageBody = {
      start: now,
      end: now,
      organization_id: orgId,
      space_id: spaceId,
      resource_id: resourceId,
      plan_id: 'standard',
      consumer_id: consumerId,
      resource_instance_id: resourceInstanceId,
      measured_usage: measuredUsage
    };

    const postResponse = yield yieldable(app.postUsage)(usageBody);
    expect(postResponse.statusCode).to.equal(201);

    const getResponse =
      yield yieldable(abacusUtils.getOrganizationUsage)(usageToken, orgId);
    expect(getResponse.statusCode).to.equal(200);
    expect(getResponse.body.resources.length).to.equal(1);

    const expectedSpace = findWhere(
      getResponse.body.spaces, { space_id: spaceId });
    expect(expectedSpace.resources.length).to.equal(1);

    const expectedConsumer = findWhere(
      expectedSpace.consumers, { consumer_id: consumerId });
    expect(expectedConsumer.resources.length).to.equal(1);

    const expectedResources = findWhere(
      getResponse.body.resources, { resource_id: resourceId });
    expect(expectedResources.resource_id).to.equal(resourceId);

  };

  const validateMapping = function *(instance, resourceProvider) {
    const getResponse =
      yield yieldable(testUtils.mappingApi().getServiceMappings);
    expect(getResponse.statusCode).to.equal(200);

    const data = getResponse.body;
    expect(data.length).to.be.above(0);

    const mappingKey = data[0][0];
    const mappingValue = data[0][1];

    expect(mappingKey.resource).to.equal(`${abacusPrefix}metering`);

    const plans = mappingKey.plan.split('/');
    expect(plans.length).to.equal(4);
    expect(plans[0]).to.equal('standard');

    expect(mappingValue).to.deep.equal({
      'organization_guid': orgId,
      'space_guid': spaceId,
      'service_name': testServiceName,
      'service_plan_name': testServicePlanName
    });
  };

  context('when service configuration parameters are provided', () => {
    after(() => {
      updatedInstance.unbind(app.appName);
      updatedInstance.destroy();
    });

    it('should execute the steps needed to validate the instances',
      yieldable.functioncb(function *() {
        const createResult = createdInstance.create(sampleMeteringPlan).trim();
        expect(createResult.endsWith('OK')).to.be.true;
        let status = createdInstance.status();
        expect(status).to.equal('create succeeded');

        updatedInstance.create(sampleMeteringPlan);
        const updateResult = updatedInstance.update(complexMeteringPlan).trim();
        expect(updateResult.endsWith('OK')).to.be.true;
        status = updatedInstance.status();
        expect(status).to.equal('update succeeded');

        yield validateInstance(createdInstance,
          [{
            measure: 'storage',
            quantity: 1073741824
          }]);

        yield validateInstance(updatedInstance,
          [{
            measure: 'storage',
            quantity: 1073741824
          }, {
            measure: 'light_api_calls',
            quantity: 1000
          }, {
            measure: 'heavy_api_calls',
            quantity: 100
          }]);

      }));
  });

  context('when service configuration parameters are provided', () => {

    let mappingApp;

    before(() => {
      mappingApp = appUtils.App('service-mapping-test-app',
        `${__dirname}/app-utils/test-mapping-app/manifest.yml`);
      mappingApp.deploy();
      mappingApp.start();
    });

    after(() => {
      mappingApp.destroy();
    });

    it('should create metering plan and service mapping',
      yieldable.functioncb(function *() {
        const createResult =
          createdInstance.create(serviceMappingMeteringPlan).trim();
        expect(createResult.endsWith('OK')).to.be.true;
        const status = createdInstance.status();
        expect(status).to.equal('create succeeded');

        yield validateMapping(createdInstance,
          serviceMappingMeteringPlan.resource_provider);
      }));
  });
});
