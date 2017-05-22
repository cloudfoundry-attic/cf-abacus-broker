'use strict';
const passport = require('passport');

const authenticate = {
  ensureAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) 
      // TODO add expires token logic
      next();
    else 
      if (req.params.instance_id) 
        res.redirect(`${req.baseUrl}/${req.params.instance_id}`);
       else 
        passport.authenticate(
          'oauth2', {
            successReturnToOrRedirect: '/',
            callbackURL: '/'
          }
        )(req, res, next);
      

    
  }
};

module.exports = authenticate;
