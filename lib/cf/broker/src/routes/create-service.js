'use strict';

const _ = require('underscore');
const extend = _.extend;

const async = require('async');
const httpStatus = require('http-status-codes');

const config = require('../config.js');
const oauth = require('../auth/oauth.js');

const sampleMeteringPlan = require('../plans/metering.js');
const samplePricingPlan = require('../plans/pricing.js');
const sampleRatingPlan = require('../plans/rating.js');

const abacusRequest = require('abacus-request');
const retry = require('abacus-retry');
const throttle = require('abacus-throttle');
const breaker = require('abacus-breaker');

const debug = require('abacus-debug')('abacus-broker');
const edebug = require('abacus-debug')('e-abacus-broker');

const throttleLimit = process.env.THROTTLE ? parseInt(process.env.THROTTLE) :
  100;

// if a batch is throttled, then throttle limits the number of calls made to
// the batch function limiting the number of batches. In order to avoid that
// all the batch functions when throttled should have a throttle value that is
// multiplied by the batch.
const request = throttle(retry(breaker(abacusRequest)), throttleLimit);

const createPlan = (resourceType, planBody, planId, cb) => {
  request.post(':provisioning_url/v1/:resource_type/plans', {
    provisioning_url: config.uris().provisioning,
    resource_type: resourceType,
    headers: oauth.authHeader(),
    body: planBody
  }, (err, response) => {
    if (err || response.statusCode !== httpStatus.CREATED) {
      const failure = err ? err : response;
      edebug('Failed to create %s plan with id %s due to %o',
        resourceType, planId, failure);
      cb(failure);
    }
    else {
      debug('Created %s plan with id %s', resourceType, planId);
      cb(null, planId);
    }
  });
};

const createMapping = (resourceType, planId, instanceId, cb) => {
  request.post(':provisioning_url/v1/provisioning/mappings/:resource_type' +
    '/resources/:resource_id/plans/:plan_name/:plan_id', {
      provisioning_url: config.uris().provisioning,
      resource_type: resourceType,
      resource_id: instanceId,
      plan_id: planId,
      plan_name: config.defaultPlanName,
      headers: oauth.authHeader()
    }, (err, response) => {
      if (err || response.statusCode !== httpStatus.OK) {
        const failure = err ? err : response;
        edebug('Failed to create %s mapping with id %s due to %o',
          resourceType, planId, failure);
        cb(failure);
      }
      else {
        debug('Created %s mapping with id %s', resourceType, planId);
        cb(null, instanceId, planId);
      }
    });
};

const createMeteringPlan = (planId, plans, cb) => {
  let meteringPlan;
  if(plans && plans.length > 0)
    meteringPlan = extend({}, plans[0].plan, { plan_id: planId });
  else
    meteringPlan = sampleMeteringPlan(planId);

  createPlan('metering', meteringPlan, planId, cb);
};

const createPricingPlan = (planId, cb) => {
  createPlan('pricing', samplePricingPlan(planId), planId, cb);
};

const createRatingPlan = (planId, cb) => {
  createPlan('rating', sampleRatingPlan(planId), planId, cb);
};

const createMeteringPlanMapping = (instanceId, planId, cb) => {
  createMapping('metering', planId, instanceId, cb);
};

const createPricingPlanMapping = (instanceId, planId, cb) => {
  createMapping('pricing', planId, instanceId, cb);
};

const createRatingPlanMapping = (instanceId, planId, cb) => {
  createMapping('rating', planId, instanceId, cb);
};

const createPlans = (planConfig, cb) => {
  const serviceId = planConfig.service_id;
  const instanceId = planConfig.instance_id;
  const plans = planConfig.parameters ? planConfig.parameters.plans : undefined;

  debug('Creating service instance %o with id %o', serviceId, instanceId);
  const planId = config.generatePlanId(instanceId, instanceId);
  async.waterfall([
    async.apply(createMeteringPlan, planId, plans),
    createPricingPlan,
    createRatingPlan,
    async.apply(createMeteringPlanMapping, instanceId),
    createPricingPlanMapping,
    createRatingPlanMapping
  ], (err) => {
    if (err) {
      edebug('Error during plans creation %o', err);
      cb(httpStatus.INTERNAL_SERVER_ERROR);
    }
    else
      cb(httpStatus.CREATED);
  });
};

const createService = (req, res) => {
  const planConfig = {
    'instance_id': req.params.instance_id,
    'service_id': req.body.service_id,
    'parameters': req.body.parameters
  };

  createPlans(planConfig, (statusCode) => {
    res.status(statusCode).send({
      dashboard_url: config.dashboardUrl(req.params.instance_id)
    });
  });
};

module.exports = createService;
module.exports.createPlans = createPlans;
