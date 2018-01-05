'use-strict';

const moment = require('abacus-moment');
const cmdline = require('abacus-cmdline');
const testUtils = require('abacus-ext-test-utils');
const request = require('abacus-request');

const stringifyPlan = (plan) => JSON.stringify(plan).replace(/"/g,'\\"');
const trim = (value) => value ? value.trim() : undefined;



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

      const start = () => trim(cfUtils.application.start(appName));
      const restart = () => trim(cfUtils.application.restart(appName));
      const deploy = () => trim(cfUtils.application.deploy(appName, {
        manifest: appManifest,
        noStart: true
      }));
      const destroy = () => trim(cfUtils.application.delete(appName, true));
      const orgGuid = () => trim(cfUtils.org.getId(testEnv.org));
      const spaceGuid = () => trim(cfUtils.space.getId(testEnv.space));

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
        trim(cfUtils.serviceInstance.create(testEnv.serviceName,
          testEnv.servicePlan, name,
          parameters ? stringifyPlan(parameters) : undefined));
      const status = () => trim(cfUtils.serviceInstance.getStatus(name));
      const update = (parameters) => trim(cfUtils.serviceInstance.update(name, stringifyPlan(parameters)));
      const bind = (app) => trim(cfUtils.serviceInstance.bind(name, app));
      const unbind = (app) => trim(cfUtils.serviceInstance.unbind(name, app));
      const destroy = () => trim(cfUtils.serviceInstance.delete(name));

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
