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

      const start = () => cfUtils.application.start(appName).trim();
      const restart = () => cfUtils.application.restart(appName).trim();
      const deploy = () => cfUtils.application.deploy(appName, {
        manifest: appManifest,
        noStart: true
      }).trim();
      const destroy = () => cfUtils.application.delete(appName, true).trim();
      const orgGuid = () => cfUtils.org.getId(testEnv.org).trim();
      const spaceGuid = () => cfUtils.space.getId(testEnv.space).trim();

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
        cfUtils.serviceInstance.create(testEnv.serviceName,
          testEnv.servicePlan, name,
          parameters ? stringifyPlan(parameters) : undefined).trim();
      const status = () => cfUtils.serviceInstance.getStatus(name).trim();
      const update = (parameters) => cfUtils.serviceInstance.update(name, stringifyPlan(parameters)).trim();
      const bind = (app) => cfUtils.serviceInstance.bind(name, app).trim();
      const unbind = (app) => cfUtils.serviceInstance.unbind(name, app).trim();
      const destroy = () => cfUtils.serviceInstance.delete(name).trim();

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
