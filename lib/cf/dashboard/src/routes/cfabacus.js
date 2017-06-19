'use strict';

const express = require('express');
const controller = require('../controllers').cfAbacusApi;
const router = express.Router();
const authenticator = require('../middleware/authMiddleware');

router.get('/metering/plans/:plan_id',
  authenticator.ensureAuthenticated, (request, response) => {
    controller.getMeteringPlan(request).then((data) => {
      response.status(data.statusCode).send(data.body);
    }).catch((error) => {
      response.status(error.status).send(error);
    });
  });

router.put('/metering/plans/:plan_id',
  authenticator.ensureAuthenticated, (request, response) => {
    controller.updateMeteringPlan(request).then((data) => {
      response.status(data.statusCode).send(data.body);
    }).catch((error) => {
      response.status(error.status).send(error);
    });
  });

router.put('/plans/:plan_id/metrics/:metric_id',
  authenticator.ensureAuthenticated, (request, response) => {
    controller.updateAllPlans(request).then((data) => {
      response.status(data.statusCode).send(data.body);
    }).catch((error) => {
      response.status(error.status).send(error);
    });
  });

module.exports = router;
