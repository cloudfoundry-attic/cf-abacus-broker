'use strict';

const express = require('express');
const controller = require('../../controllers').cfAbacusApi;
const router = express.Router();
const authenticate = require('../../middleware/authmiddleware');

router.get('/healthcheck', (req, res) => {
  res.status(200).send({
    'healthy': true
  });
});

router.get('/metering/plans/:plan_id',
  authenticate.ensureAuthenticated, (request, response) => {
    controller.getMeteringPlan(request).then((data) => {
      response.status(data.statusCode).send(data.body);
    }).catch((error) => {
      response.status(error.status).send(error);
    });
  });

router.put('/metering/plan/:plan_id',
  authenticate.ensureAuthenticated, (request, response) => {
    controller.updateMeteringPlan(request).then((data) => {
      response.status(data.statusCode).send(data.body);
    }).catch((error) => {
      response.status(error.status).send(error);
    });
  });

module.exports = router;
