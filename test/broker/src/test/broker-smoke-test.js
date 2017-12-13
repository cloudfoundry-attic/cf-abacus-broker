'use strict';

const moment = require('abacus-moment');
const oauth = require('abacus-oauth');

const commander = require('commander');
const _ = require('underscore');
const clone = _.clone;
const findWhere = _.findWhere;
const first = _.first;
const last = _.last;

const testHelper = require('abacus-ext-test-utils');
const yieldable = require('abacus-yieldable');
const appUtils = require('abacus-ext-test-app-utils')();

const TestApp = appUtils.App;
const TestService = appUtils.Service;

const testEnv = testHelper.envConfig;
const abacusUtils = testHelper(undefined, testEnv.collectorUrl,
  testEnv.reportingUrl);

const argv = clone(process.argv);
argv.splice(1, 1, 'broker-smoke');
commander
  .option('-x, --total-timeout <n>',
    'test timeout in milliseconds', parseInt)
  .allowUnknownOption(true)
  .parse(argv);

const totalTimeout = commander.totalTimeout || 300000;

describe('Abacus Broker Smoke test', function() {
  this.timeout(totalTimeout);

  const app = TestApp();
  const standardInstance = TestService();

  before(() => app.deploy());

  it('should validate standard metering service instance',
    yieldable.functioncb(function*() {
      const createResult = standardInstance.create().trim();
      expect(createResult.endsWith('OK')).to.equal(true,
        'service instance was not created successfully');

      const status = standardInstance.status();
      expect(status).to.equal('create succeeded',
        'service status was not create succeeded');

      standardInstance.bind(app.appName);
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

      const now = moment.utc().valueOf();
      const resourceInstanceId = `${now}-151-413-121-110987654321d`;
      const consumerId = `app:${resourceInstanceId}`;
      const orgId = app.orgGuid();
      const spaceId = app.spaceGuid();
      const expectedQuantity = 512;

      const usageBody = {
        start: now,
        end: now,
        organization_id: orgId,
        space_id: spaceId,
        resource_id: resourceId,
        plan_id: 'standard',
        consumer_id: consumerId,
        resource_instance_id: resourceInstanceId,
        measured_usage: [{
          measure: 'sampleName',
          quantity: expectedQuantity
        }]
      };

      const postResponse = yield yieldable(app.postUsage)(usageBody);
      expect(postResponse.statusCode).to.be.oneOf([201, 409],
        'usage was not submitted successfully');

      const getResponse =
      yield yieldable(abacusUtils.getOrganizationUsage)(usageToken, orgId);
      expect(getResponse.statusCode).to.equal(200,
        'usage was not retrieved successfully');
      expect(getResponse.body.resources.length).to.equal(1,
        'number of resources was not the expected');

      const expectedSpace = findWhere(
        getResponse.body.spaces, { space_id: spaceId });
      expect(expectedSpace.resources.length).to.equal(1,
        'number of spaces was not the expected');

      const expectedConsumer = findWhere(
        expectedSpace.consumers, { consumer_id: consumerId });
      expect(expectedConsumer.resources.length).to.equal(1,
        'number of consumers was not the expected');

      const expectedResources = findWhere(
        getResponse.body.resources, { resource_id: resourceId });
      expect(expectedResources.resource_id).to.equal(resourceId,
        'resource provider was different than expected');

      const monthlyQty = first(last(first(first(expectedResources.plans)
        .aggregated_usage).windows)).quantity;
      expect(monthlyQty).to.equal(expectedQuantity,
        'monthly quantity was not the expected one');

      standardInstance.unbind(app.appName);
      standardInstance.destroy();
    }));
});
