'use strict';

const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const authController = require('../auth').authConfigCtrl;
const HttpsProxyAgent = require('https-proxy-agent');

passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});

let configOptions = authController.getConfigurationOptions();

let callbackFn = authController.getAuthCallbackFn();

//passport.use(configOptions,callbackFn);
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const strategy = new OAuth2Strategy(configOptions, callbackFn);
if (proxy) {
    let httpsProxyAgent = new HttpsProxyAgent(proxy);
    strategy._oauth2.setAgent(httpsProxyAgent);
}

module.exports = strategy;