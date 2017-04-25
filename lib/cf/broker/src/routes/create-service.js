'use strict';

const abacusRequest = require('abacus-request');

const async = require('async');
const httpStatus = require('http-status-codes');

const config = require('../config.js');
const oauth = require('../auth/oauth.js');

const sampleMeteringPlan = require('../plans/metering.js');
const samplePricingPlan = require('../plans/pricing.js');
const sampleRatingPlan = require('../plans/rating.js');

const debug = require('abacus-debug')('metering-broker');
const edebug = require('abacus-debug')('e-metering-broker');

const retry = require('abacus-retry');
const throttle = require('abacus-throttle');
const breaker = require('abacus-breaker');


const throttleLimit = process.env.THROTTLE ? parseInt(process.env.THROTTLE) :
  100;

// if a batch is throttled, then throttle limits the number of calls made to
// the batch function limiting the number of batches. In order to avoid that
// all the batch functions when throttled should have a throttle value that is
// multiplied by the batch.
const request = throttle(retry(breaker(abacusRequest)), throttleLimit);

const generatePlanId = (resourceProviderId, planId) => {
  return `${resourceProviderId}-${planId}`;
};

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

const createMapping = (resourceType, instanceId, cb) => {
  const planId = generatePlanId(instanceId, instanceId);
  request.post(':provisioning_url/v1/provisioning/mappings/:resource_type' +
    '/resources/:resource_id/plans/:plan_name/:plan_id', {
      provisioning_url: config.uris().provisioning,
      resource_type: resourceType,
      resource_id: instanceId,
      plan_id: planId,
      plan_name: planId,
      headers: oauth.authHeader()
    }, (err) => {
      if (err) {
        edebug('Failed to create %s mapping with id %s due to %o',
          resourceType, instanceId, err);
        cb(err);
      }
      else {
        debug('Created %s mapping with id %s', resourceType, instanceId);
        cb(null, instanceId);
      }
    });
};

const createMeteringPlan = (instanceId, cb) => {
  createPlan('metering', sampleMeteringPlan(generatePlanId(instanceId,
    instanceId)), instanceId, cb);
};

const createPricingPlan = (instanceId, cb) => {
  createPlan('pricing', samplePricingPlan(generatePlanId(instanceId,
    instanceId)), instanceId, cb);
};

const createRatingPlan = (instanceId, cb) => {
  createPlan('rating', sampleRatingPlan(generatePlanId(instanceId,
    instanceId)), instanceId, cb);
};

const createMeteringPlanMapping = (instanceId, cb) => {
  createMapping('metering', instanceId, cb);
};

const createPricingPlanMapping = (instanceId, cb) => {
  createMapping('pricing', instanceId, cb);
};

const createRatingPlanMapping = (instanceId, cb) => {
  createMapping('rating', instanceId, cb);
};

const createPlans = (instanceId, instanceName, cb) => {
  debug('Creating service instance %o with id %o', instanceName, instanceId);

  async.waterfall([
    async.apply(createMeteringPlan, instanceId),
    createPricingPlan,
    createRatingPlan,
    createMeteringPlanMapping,
    createPricingPlanMapping,
    createRatingPlanMapping
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
module.exports.generatePlanId = generatePlanId;
