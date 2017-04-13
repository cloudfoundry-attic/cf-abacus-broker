'use strict';

const cmdline = require('abacus-ext-cmdline');
const moment = require('abacus-moment');
const request = require('abacus-request');

const api = process.env.CF_API;
const adminUser = process.env.CF_ADMIN_USER;
const adminUserPassword = process.env.CF_ADMIN_PASSWORD;
const org = process.env.CF_ORG;
const space = process.env.CF_SPACE;
const appsDomain = process.env.APPS_DOMAIN;

describe('Abacus Broker Smoke test', () => {
  const cfUtils = cmdline.cfutils(api, adminUser, adminUserPassword);
  const testTimestamp = moment.utc().valueOf();
  const serviceInstanceName = `test-${testTimestamp}`;
  const applicationName = `${testTimestamp}-test-app`;
  const applicationManifest = './src/test/test-app/manifest.yml';

  before((done) => {
    cfUtils.deployApplication(org, space, applicationName,
      applicationManifest, '--no-start');
    done();
  });

  after((done) => {
    cfUtils.unbindServiceInstance(org, space,
      serviceInstanceName, applicationName);
    cfUtils.deleteServiceInstance(org, space, serviceInstanceName);
    cfUtils.deleteApplication(org, space, applicationName);
    done();
  });

  context('when creating service instance', () => {

    before((done) => {
      cfUtils.createServiceInstance(org, space, serviceInstanceName);
      done();
    });

    it('should succeed', (done) => {
      const status = cfUtils.getServiceStatus(org, space, serviceInstanceName);
      expect(status).to.equal('create succeeded');
      done();
    });

    context('and binding service instance to application', () => {
      let guid;
      let bindResult;

      const getApplicationEnvironment = (cb) => {
        request(`https://${applicationName}.${appsDomain}`, cb);
      };

      before(() => {
        guid = cfUtils.getServiceInstanceGuid(org, space, serviceInstanceName);
        bindResult = cfUtils.bindServiceInstance(org, space,
          serviceInstanceName, applicationName);
      });

      it('should succeed', () => {
        expect(bindResult).to.contain('OK');
      });

      it('should set the proper variables in the application environment',
        (done) => {
          cfUtils.startApplication(org, space, applicationName);
          getApplicationEnvironment((err, response) => {
            const credentials = response.body.metering[0].credentials;

            expect(credentials.client_id).to.equal(`abacus-rp-${guid}`);
            expect(credentials.client_secret).to.not.equal(null);
            expect(credentials.collector_url)
              .to.contain('abacus-usage-collector');
            expect(credentials.dashboard_url).to.not.equal(null);
            done();
          });
        });
      context('and posting usage', () => {
        const consumerId = 'app:1fb61c1f-2db3-4235-9934-00097845b80d';
        const resourceInstanceId = '1fb61c1f-2db3-4235-9934-00097845b80d';

        let orgId;
        let spaceId;
        let usageBody;

        let postError;
        let postValue;

        before((done) => {
          orgId = cfUtils.getOrgId(org);
          spaceId = cfUtils.getSpaceId(org, space);
          const now = moment.utc().valueOf();
          usageBody = {
            start: now,
            end: now,
            organization_id: orgId,
            space_id: spaceId,
            resource_id: guid,
            plan_id: 'basic',
            consumer_id: consumerId,
            resource_instance_id: resourceInstanceId,
            measured_usage: [
              {
                measure: 'sampleName',
                quantity: 512
              }
            ]
          };

          request.post(`https://${applicationName}.${appsDomain}/usage`, {
            body: usageBody
          }, (err, val) => {
            postError = err;
            postValue = val;
            done();
          });
        });

        it('should succeed', () => {
          expect(postError).to.equal(undefined);
          expect(postValue.statusCode).to.equal(201);
        });
      });
    });
  });
});
