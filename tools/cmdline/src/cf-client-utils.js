'use strict';

const execute = require('./cmdline.js').execute;

const getOrgId = (orgName) => {
  return execute('cf org ' + orgName + ' --guid').toString().trim();
};

const getSpaceId = (orgName, spaceName) => {
  execute('cf target -o ' + orgName);
  return execute('cf space ' + spaceName + ' --guid').toString().trim();
};

const login = (apiEndpoint, user, password) => {
  execute('cf api ' + apiEndpoint + ' --skip-ssl-validation');
  execute('cf auth ' + user + ' ' + password);
  return {
    getOrgId: getOrgId,
    getSpaceId: getSpaceId
  };
};

module.exports = login;
