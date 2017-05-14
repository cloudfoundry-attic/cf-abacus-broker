'use strict';

const environment = require('./environment');

const loadCloudFoundryConfig = function() {
  let apiEndpoint = process.env.API;
  const clientId = process.env.CF_CLIENT_ID;
  const clientSecret = process.env.CF_CLIENT_SECRET || '';
  const callbackUrl = process.env.CF_CALLBACK_URL;
  const cookieSecret = process.env.CF_COOKIE_SECRET;
  const abacusProvisioningPlugin = process.env.PROVISIONING;
  const authEndpoint = process.env.AUTH_SERVER;
  const authorizationUrl = `${authEndpoint}/oauth/authorize`;
  const tokenUrl = `${authEndpoint}/oauth/token`;

  return {
    'cf_api_endpoint': apiEndpoint,
    'client_id': clientId,
    'client_secret': clientSecret,
    'callback_url': callbackUrl,
    'cookie_secret': cookieSecret,
    'abacus_provisioning_plugin': abacusProvisioningPlugin,
    'authorize_url': authorizationUrl,
    'token_url': tokenUrl
  };
};

const loadConfig = function() {
  let config = {};
  config.cf = loadCloudFoundryConfig();
  config.trust_proxy = process.env.TRUST_PROXY || true;
  return config;
};

environment.loadEnvironment();
const config = loadConfig();
module.exports = config;
