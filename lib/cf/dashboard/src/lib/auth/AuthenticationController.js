'use strict';

const config = require('../config');
const logger = require('../logger');

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
    return function(req, accessToken, refreshToken, uaa_response, profile, done) {
      logger.debug('succcessfully generated oauth token');
      req.session.uaa_response = uaa_response;
      done(null, profile);
    };
  }
}

module.exports = AuthenticationController;
