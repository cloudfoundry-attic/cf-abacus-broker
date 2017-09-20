'use strict';

const execute = require('./cmdline.js').execute;

const getOrgId = (orgName) => {
  return execute(`cf org ${orgName} --guid`).toString().trim();
};

const getSpaceId = (spaceName) => {
  return execute(`cf space ${spaceName} --guid`).toString().trim();
};

const createSpace = (org, space) => {
  return execute(`cf create-space -o ${org} ${space}`);
};

const deployApplication = (name, options = '') => {
  return execute(`cf push ${name} ${options}`);
};

const startApplication = (name) => {
  return execute(`cf start  ${name}`);
};

const deleteApplication = (name, deleteRoute) => {
  return execute(`cf delete -f ${deleteRoute ? '-r' : ''} ${name}`);
};

const createServiceInstance = (service, plan, serviceName, parameters) => {
  let cmd = `cf create-service ${service} ${plan} ${serviceName}`;
  if(parameters)
    cmd += ` -c ${parameters}`;
  return execute(cmd);
};

const getServiceInstanceGuid = (serviceName) => {
  return execute(`cf service ${serviceName} --guid`).toString().trim();
};

const getServiceStatus = (serviceName) => {
  const serviceInfo = execute(`cf service ${serviceName}`).toString().trim();
  return serviceInfo.match(/Last Operation\nStatus: (.*)/)[1];
};

const bindServiceInstance = (serviceName, appName) => {
  return execute(`cf bind-service ${appName} ${serviceName}`).toString().trim();
};

const unbindServiceInstance = (serviceName, appName) => {
  return execute(`cf unbind-service ${appName} ${serviceName}`);
};

const deleteServiceInstance = (serviceName) => {
  return execute(`cf delete-service -f ${serviceName}`);
};

const target = (org, space) => {
  return execute(`cf target -o ${org} -s ${space}`);
};

const login = (apiEndpoint, user, password) => {
  execute(`cf api ${apiEndpoint} --skip-ssl-validation`);
  execute(`cf auth ${user} ${password}`);
  return {
    getOrgId: getOrgId,
    getSpaceId: getSpaceId,
    deployApplication: deployApplication,
    startApplication: startApplication,
    deleteApplication: deleteApplication,
    createServiceInstance: createServiceInstance,
    getServiceInstanceGuid: getServiceInstanceGuid,
    getServiceStatus: getServiceStatus,
    bindServiceInstance: bindServiceInstance,
    unbindServiceInstance: unbindServiceInstance,
    deleteServiceInstance: deleteServiceInstance,
    target: target,
    createSpace: createSpace
  };
};

module.exports = login;
