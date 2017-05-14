'use strict';

const express = require('express');
const passport = require('passport');
const authenticate = require('../../middleware/authmiddleware');
const controller = require('../../controllers').cfApi;
const router = express.Router();

router.get('/:instance_id', (req, res, next) => {
  if (req.isAuthenticated()) 
    controller.getServiceBinding(req).then(() => {
      res.redirect(`/manage/instances/${req.params.instance_id}/bindings/${req.sessionStore.guid}/${req.sessionStore.creds.plans[0]}`);
    })
        .catch((error) => {
          res.render('notfound', {
            'message': error.message
          });
        });
  else {
    let successRedirect = `${req.baseUrl}/${req.params.instance_id}`;
    passport.authenticate(
            'oauth2', {
              successReturnToOrRedirect: successRedirect,
              callbackURL: `${req.baseUrl}/${req.params.instance_id}`
            }
        )(req, res, next);
  }
});


router.get('/:instance_id/bindings/:binding_id/:plan_id', authenticate.ensureAuthenticated, (req, res) => {
  res.sendFile('home.html', {
    root: __dirname + '/../../../webapp/'
  });
});

router.get('/:instance_id/bindings/:binding_id/metering/:plan_id*', authenticate.ensureAuthenticated, (req, res) => {
  res.redirect(`${req.baseUrl}/${req.params.instance_id}/bindings/${req.params.binding_id}/${req.params.plan_id}`);
});

module.exports = router;
