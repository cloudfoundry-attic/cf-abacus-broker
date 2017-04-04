'use strict';

const request = require('abacus-request');

const async = require('async');
const httpStatus = require('http-status-codes');

const config = require('../config.js');
const oauth = require('../auth/oauth.js');

const sampleMeteringPlan = require('../plans/metering.js');
const samplePricingPlan = require('../plans/pricing.js');
const sampleRatingPlan = require('../plans/rating.js');

const debug = require('abacus-debug')('metering-broker');
const edebug = require('abacus-debug')('e-metering-broker');

const createPlan = (resourceType, planBody, instanceId, cb) => {
  request.post(':provisioning_url/v1/:resource_type/plans', {
    provisioning_url: config.uris().provisioning,
    resource_type: resourceType,
    headers: oauth.authHeader(),
    body: planBody
  }, (err) => {
    if (err) {
      edebug('Failed to create %s plan with id %s due to %o',
        resourceType, instanceId, err);
      cb(err);
    }
    else {
      debug('Created %s plan with id %s', resourceType, instanceId);
      cb(null, instanceId);
    }
  });
};

const createMeteringPlan = (instanceId, cb) => {
  sampleMeteringPlan.plan_id = instanceId;
  createPlan('metering', sampleMeteringPlan, instanceId, cb);
};

const createPricingPlan = (instanceId, cb) => {
  samplePricingPlan.plan_id = instanceId;
  createPlan('pricing', samplePricingPlan, instanceId, cb);
};

const createRatingPlan = (instanceId, cb) => {
  sampleRatingPlan.plan_id = instanceId;
  createPlan('rating', sampleRatingPlan, instanceId, cb);
};

const createPlans = (instanceId, instanceName, cb) => {
  debug('Creating service instance %o with id %o', instanceName, instanceId);

  async.waterfall([
    async.apply(createMeteringPlan, instanceId),
    createPricingPlan,
    createRatingPlan
  ], (err) => {
    if (err)
      cb(httpStatus.INTERNAL_SERVER_ERROR);
    else
      cb(httpStatus.CREATED);
  });
};

const createService = (req, res) => {
  createPlans(req.params.instance_id, req.body.instance_name, (statusCode) => {
    res.status(statusCode).send({});
  });
};

module.exports = createService;
module.exports.createPlans = createPlans;
