'use strict';

const environment = require('./environment');

function loadCloudFoundryConfig() {
  let apiEndpoint = process.env.CF_API_ENDPOINT;
  const clientId = process.env.CF_CLIENT_ID;
  const clientSecret = process.env.CF_CLIENT_SECRET || '';
  const callbackUrl = process.env.CF_CALLBACK_URL;
  const cookieSecret = process.env.CF_COOKIE_SECRET;
  const abacus_provisioning_plugin = process.env.CF_ABACUS_PROVISIONING_PLUGIN;
  const authEndpoint = process.env.CF_AUTHORIZATION_ENDPOINT;
  const authorizationUrl = `${authEndpoint}/oauth/authorize`;
  const tokenUrl = `${authEndpoint}/oauth/token`;

  return {
    'cf_api_endpoint': apiEndpoint,
    'client_id': clientId,
    'client_secret': clientSecret,
    'callback_url': callbackUrl,
    'cookie_secret': cookieSecret,
    'abacus_provisioning_plugin': abacus_provisioning_plugin,
    'authorize_url': authorizationUrl,
    'token_url': tokenUrl
  };
}

function loadConfig() {
  let config = {};
  config.cf = loadCloudFoundryConfig();
  config.trust_proxy = process.env.TRUST_PROXY || true;
  return config;
}

environment.loadEnvironment();
const config = loadConfig();
module.exports = config;
