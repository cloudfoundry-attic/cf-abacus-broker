'use strict';

const config = require('../config');
const logger = require('../dashboardLogger');

class AuthenticationController {
  constructor() {}

  getConfigurationOptions() {
    return {
      authorizationURL: config.cf.authorize_url,
      tokenURL: config.cf.token_url,
      clientID: config.cf.client_id,
      clientSecret: config.cf.client_secret,
      proxy: config.trust_proxy,
      passReqToCallback: true
    };
  }

  getAuthCallbackFn() {
    return function(req, accessToken, refreshToken, uaaResponse, profile, done) {
      logger.debug('succcessfully generated oauth token');
      req.session.uaa_response = uaaResponse;
      done(null, profile);
    };
  }
}

module.exports = AuthenticationController;
