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

describe('Abacus Broker Smoke test', () => {
  const app = TestApp();
  const standardInstance = TestService();

  const now = moment.utc().valueOf();
  const resourceInstanceId = `${now}-151-413-121-110987654321d`;
  const consumerId = `app:${resourceInstanceId}`;
  const orgId = app.orgGuid();
  const spaceId = app.spaceGuid();
  const expectedQuantity = 512;

  before(() => app.deploy());

  it('should successfully create standard service instance', () => {
    const createResult = standardInstance.create().trim();
    expect(createResult.endsWith('OK')).to.equal(true);

    const status = standardInstance.status();
    expect(status).to.equal('create succeeded');
  });

  context('when test app tries to use the instance', () => {
    let resourceId;
    let usageToken;

    before(() => {
      standardInstance.bind(app.appName);
      app.restart();
    });

    it('should set proper variables in the application environment', (done) => {
      app.getCredentials((err, credentials) => {
        expect(credentials).to.have.property('client_id');
        const clientId = credentials.client_id;
        expect(credentials).to.have.property('client_secret');
        const clientSecret = credentials.client_secret;
        expect(credentials).to.have.property('resource_id');
        resourceId = credentials.resource_id;
        expect(credentials.collector_url).to.contain('abacus-usage-collector');

        usageToken = oauth.cache(testEnv.api, clientId, clientSecret,
          `abacus.usage.${resourceId}.write,abacus.usage.${resourceId}.read`);
        usageToken.start((err) => {
          expect(err).to.equal(undefined);
          done();
        });
      });
    });

    it('should successfully submit usage document', (done) => {
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

      app.postUsage(usageBody, (err, val) => {
        expect(err).to.equal(undefined);
        expect(val.statusCode).to.be.oneOf([201, 409]);
        done();
      });
    });

    it('should successfully get usage with resource specific token', (done) => {
      abacusUtils.getOrganizationUsage(usageToken, orgId,
        (err, response) => {
          expect(err).to.equal(undefined);
          expect(response.statusCode).to.equal(200);
          expect(response.body.resources.length).to.equal(1);

          const expectedSpace = findWhere(
            response.body.spaces, { space_id: spaceId });
          const expectedConsumer = findWhere(
            expectedSpace.consumers, { consumer_id: consumerId });
          const expectedResources = findWhere(
            response.body.resources, { resource_id: resourceId });
          expect(expectedResources.resource_id).to.equal(resourceId);
          expect(expectedSpace.resources.length).to.equal(1);
          expect(expectedConsumer.resources.length).to.equal(1);

          const monthlyQty = (first(last(first(first(expectedResources.plans)
            .aggregated_usage).windows))).quantity;
          expect(monthlyQty).to.equal(expectedQuantity);
          done();
        });
    });
  });
}).timeout(totalTimeout);
