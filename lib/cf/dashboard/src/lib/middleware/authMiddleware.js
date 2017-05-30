'use strict';
const passport = require('passport');
const authController = require('../auth').authConfigCtrl;

const authenticate = {
  ensureAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      if (authController.checkAccessTokenExpired(req))
        return res.render('notfound', {
          message: 'Session expired. Refresh the page to continue'
        });
      return next();
    }
    return passport.authenticate(
      'oauth2', {
        successReturnToOrRedirect: req.originalUrl,
        callbackURL: req.originalUrl
      }
    )(req, res, next);
  },
  isAuthenticated: (req) => {
    return req.isAuthenticated();
  }
};

module.exports = authenticate;
