'use strict';

const cmdline = require('abacus-ext-cmdline');
const moment = require('abacus-moment');
const request = require('abacus-request');

const oauth = require('abacus-oauth');

const commander = require('commander');
const _ = require('underscore');
const extend = _.extend;
const clone = _.clone;


const testHelper = require('abacus-ext-test-utils');

const api = process.env.CF_API;
const adminUser = process.env.CF_ADMIN_USER;
const adminUserPassword = process.env.CF_ADMIN_PASSWORD;
const org = process.env.CF_ORG;
const space = process.env.CF_SPACE;
const appsDomain = process.env.APPS_DOMAIN;
const collectorUrl = process.env.COLLECTOR_URL;
const reportingUrl = process.env.REPORTING_URL;
const serviceName = process.env.SERVICE_NAME;
const servicePlan = process.env.SERVICE_PLAN;

const abacusUtils = testHelper(undefined, collectorUrl, reportingUrl);
const config = require('abacus-ext-cf-broker').config;

const argv = clone(process.argv);
argv.splice(1, 1, 'broker-smoke');
commander
  .option('-x, --total-timeout <n>',
    'test timeout in milliseconds', parseInt)
  .allowUnknownOption(true)
  .parse(argv);

// This test timeout
const totalTimeout = commander.totalTimeout || 300000;


describe('Abacus Broker Smoke test', function() {
  this.timeout(totalTimeout);
  const cfUtils = cmdline.cfutils(api, adminUser, adminUserPassword);
  const testTimestamp = moment.utc().valueOf();
  const serviceInstanceName = `test-${testTimestamp}`;
  const applicationName = `${testTimestamp}-test-app`;
  const applicationManifest = './src/test/test-app/manifest.yml';

  before((done) => {
    cfUtils.target(org, space);
    cfUtils.deployApplication(applicationName,
      `-f ${applicationManifest} --no-start`);
    done();
  });

  context('when creating service instance', () => {

    before((done) => {
      cfUtils.createServiceInstance(serviceName, servicePlan,
        serviceInstanceName);
      done();
    });

    it('should succeed', (done) => {
      const status = cfUtils.getServiceStatus(serviceInstanceName);
      expect(status).to.equal('create succeeded');
      done();
    });

    context('and binding service instance to application', () => {
      let guid;
      let bindResult;
      let clientId;
      let clientSecret;

      const getApplicationEnvironment = (cb) => {
        request.get(`https://${applicationName}.${appsDomain}`, cb);
      };

      before(() => {
        guid = cfUtils.getServiceInstanceGuid(serviceInstanceName);
        bindResult = cfUtils.bindServiceInstance(serviceInstanceName,
          applicationName);
      });

      it('should succeed', () => {
        expect(bindResult).to.contain('OK');
      });

      it('should set the proper variables in the application environment',
        (done) => {
          cfUtils.startApplication(applicationName);
          getApplicationEnvironment((err, response) => {
            const credentials = response.body[Object.keys(response.body)[0]][0]
              .credentials;

            expect(credentials.client_id).to.contain(
              config.prefixWithResourceProvider(guid));
            clientId = credentials.client_id;
            expect(credentials.client_secret).to.not.equal(null);
            clientSecret = credentials.client_secret;
            expect(credentials.collector_url)
              .to.contain('abacus-usage-collector');
            expect(credentials.dashboard_url).to.not.equal(null);
            done();
          });
        });

      context('and posting usage', () => {
        const consumerId = 'app:1fb61c1f-2db3-4235-9934-00097845b80d';
        const resourceInstanceId = '1fb61c1f-2db3-4235-9934-00097845b80d';
        const planName = 'standard';
        let planId;

        let orgId;
        let spaceId;
        let usageBody;

        before((done) => {
          orgId = cfUtils.getOrgId(org);
          spaceId = cfUtils.getSpaceId(space);
          const now = moment.utc().valueOf();
          planId = `${guid}-${guid}`;

          usageBody = {
            start: now,
            end: now,
            organization_id: orgId,
            space_id: spaceId,
            resource_id: guid,
            plan_id: planName,
            consumer_id: consumerId,
            resource_instance_id: resourceInstanceId,
            measured_usage: [{
              measure: 'sampleName',
              quantity: 512
            }]
          };

          done();
        });

        it('should succeed', (done) => {
          request.post(`https://${applicationName}.${appsDomain}/usage`, {
            body: usageBody
          }, (err, val) => {
            expect(err).to.equal(undefined);
            expect(val.statusCode).to.equal(201);
            done();
          });
        });

        context('and getting usage', () => {
          let usageToken;
          let systemToken;
          before((done) => {
            usageToken = oauth.cache(api, clientId, clientSecret,
              `abacus.usage.${guid}.write,abacus.usage.${guid}.read`);
            systemToken = oauth.cache(api,
              process.env.SYSTEM_CLIENT_ID, process.env.SYSTEM_CLIENT_SECRET,
              'abacus.usage.read');

            systemToken.start(() => {
              usageToken.start(done);
            });
          });

          it('should exist', (done) => {
            abacusUtils.getOrganizationUsage(systemToken, orgId,
              (err, response) => {
                const filter = {
                  space_id: spaceId,
                  consumer_id: consumerId,
                  resource_id: guid,
                  plan_id: planName,
                  metering_plan_id: planId,
                  rating_plan_id: planId,
                  pricing_plan_id: planId
                };
                const timeBasedKey =
                  abacusUtils.getTimeBasedKeyProperty(response.body, filter);

                extend(filter, {
                  org_id: orgId,
                  resource_instance_id: resourceInstanceId,
                  time_based_key: timeBasedKey });
                abacusUtils.getUsage(usageToken, filter, (err, response) => {
                  expect(err).to.equal(undefined);
                  expect(response.statusCode).to.equal(200);

                  const metric = response.body.accumulated_usage[0].metric;
                  expect(metric).to.equal('sampleName');

                  const windows = response.body.accumulated_usage[0].windows;
                  const lastMonthQuantity =
                    windows[windows.length - 1][0].quantity;
                  expect(lastMonthQuantity).to.equal(512);
                  done();
                });
              });
          });
        });
      });
    });
  });
});
