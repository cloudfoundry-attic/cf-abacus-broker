'use-strict';

const moment = require('abacus-moment');
const cmdline = require('abacus-cmdline');
const testUtils = require('abacus-ext-test-utils');
const request = require('abacus-request');

const stringifyPlan = (plan) =>
  JSON.stringify(plan).replace(/"/g,'\\"');

module.exports = (testEnvironment) => {
  const testEnv = testEnvironment || testUtils.envConfig;
  const cfUtils = cmdline.cfutils(testEnv.api, testEnv.user, testEnv.password);
  cfUtils.target(testEnv.org, testEnv.space);

  return {
    App: (name, manifest) => {
      const appName = name || `${moment.utc().valueOf()}-test-app`;
      const appManifest = manifest ||
        `${__dirname}/../test-app/manifest.yml`;

      const getUrl = () => `https://${appName}.${testEnv.appsDomain}`;

      const getEnvironment = (cb) =>
        request.get(getUrl(), cb);

      const getCredentials = (cb) =>
        getEnvironment((err, response) => {
          if (err)
            cb(err);

          cb(err, response.body[Object.keys(response.body)[0]][0].credentials);
        });

      const start = () => cfUtils.startApplication(appName);

      const restart = () => cfUtils.restartApplication(appName);

      const deploy = (opts = '--no-start') => {
        cfUtils.deployApplication(appName, `-f ${appManifest} ${opts}`);
      };

      const destroy = () => {
        cfUtils.deleteApplication(appName, true);
      };

      const orgGuid = () => cfUtils.getOrgId(testEnv.org);

      const spaceGuid = () => cfUtils.getSpaceId(testEnv.space);

      const postUsage = (usageBody, cb) =>
        request.post('https://:app_name.:app_domain/usage', {
          app_name: appName,
          app_domain: testEnv.appsDomain,
          body: usageBody
        }, cb);

      return {
        getUrl,
        getEnvironment,
        getCredentials,
        deploy,
        destroy,
        start,
        restart,
        appName,
        orgGuid,
        spaceGuid,
        postUsage
      };
    },
    Service: (instanceName, testEnvironment) => {

      const name = instanceName || `test-${moment.utc().valueOf()}`;

      const create = (parameters) =>
        cfUtils.createServiceInstance(testEnv.serviceName,
          testEnv.servicePlan, name, parameters ?
            stringifyPlan(parameters) : undefined);

      const status = () => cfUtils.getServiceStatus(name);

      const update = (parameters) =>
        cfUtils.updateServiceInstance(name, stringifyPlan(parameters));

      const bind = (app) => cfUtils.bindServiceInstance(name, app);

      const unbind = (app) => cfUtils.unbindServiceInstance(name, app);

      const destroy = () => cfUtils.deleteServiceInstance(name);

      return {
        create,
        update,
        bind,
        unbind,
        status,
        name,
        destroy
      };
    }
  };
};
