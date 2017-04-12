'use strict';

const execute = require('./cmdline.js').execute;

const getOrgId = (orgName) => {
  return execute(`cf org ${orgName} --guid`).toString().trim();
};

const getSpaceId = (orgName, spaceName) => {
  execute(`cf target -o ${orgName}`);
  return execute(`cf space ${spaceName} --guid`).toString().trim();
};

const deployApplication = (orgName, spaceName, name, manifestPath, options) => {
  execute(`cf target -o ${orgName} -s ${spaceName}`);
  execute(`cf push  ${name} -f ${manifestPath} ${options}`);
};

const startApplication = (orgName, spaceName, name) => {
  execute(`cf target -o ${orgName} -s ${spaceName}`);
  execute(`cf start  ${name}`);
};

const deleteApplication = (orgName, spaceName, name, manifestPath) => {
  execute(`cf target -o ${orgName} -s ${spaceName}`);
  execute(`cf delete -f  ${name}`);
};

const createServiceInstance = (orgName, spaceName, serviceName) => {
  execute(`cf target -o ${orgName} -s ${spaceName}`);
  execute(`cf create-service metering default ${serviceName}`);
};

const getServiceInstanceGuid = (orgName, spaceName, serviceName) => {
  execute(`cf target -o ${orgName} -s ${spaceName}`);
  return execute(`cf service ${serviceName} --guid`).toString().trim();
};

const getServiceStatus = (orgName, spaceName, serviceName) => {
  execute(`cf target -o ${orgName} -s ${spaceName}`);
  const serviceInfo = execute(`cf service ${serviceName}`).toString().trim();
  return serviceInfo.match(/.*Status: (.*)/)[1];
};

const bindServiceInstance = (orgName, spaceName, serviceName, appName) => {
  execute(`cf target -o ${orgName} -s ${spaceName}`);
  return execute(`cf bind-service ${appName} ${serviceName}`)
    .toString().trim();
};

const unbindServiceInstance = (orgName, spaceName, serviceName, appName) => {
  execute(`cf target -o ${orgName} -s ${spaceName}`);
  execute(`cf unbind-service ${appName} ${serviceName}`);
};

const deleteServiceInstance = (orgName, spaceName, serviceName) => {
  execute(`cf target -o ${orgName} -s ${spaceName}`);
  execute(`cf delete-service -f ${serviceName}`);
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
    deleteServiceInstance: deleteServiceInstance
  };
};

module.exports = login;
