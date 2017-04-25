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

const DASHBOARD_URI = (process.env.DASHBOARD_URI || '').endsWith('/') ?
  process.env.DASHBOARD_URI : process.env.DASHBOARD_URI + '/';

const throttleLimit = process.env.THROTTLE ? parseInt(process.env.THROTTLE) :
  100;

// if a batch is throttled, then throttle limits the number of calls made to
// the batch function limiting the number of batches. In order to avoid that
// all the batch functions when throttled should have a throttle value that is
// multiplied by the batch.
const request = throttle(retry(breaker(abacusRequest)), throttleLimit);


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
  request.post(':provisioning_url/v1/provisioning/mappings/:resource_type' +
    '/resources/:resource_id/plans/basic/:plan_id', {
      provisioning_url: config.uris().provisioning,
      resource_type: resourceType,
      resource_id: instanceId,
      plan_id: instanceId,
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

const generatePlanId = (resourceProviderId, planId) => {
  return `resource_provider/${resourceProviderId}/plan/${planId}`;
};

const createMeteringPlan = (instanceId, cb) => {
  sampleMeteringPlan.plan_id = generatePlanId(instanceId, instanceId);
  createPlan('metering', sampleMeteringPlan, instanceId, cb);
};

const createPricingPlan = (instanceId, cb) => {
  samplePricingPlan.plan_id = generatePlanId(instanceId, instanceId);
  createPlan('pricing', samplePricingPlan, instanceId, cb);
};

const createRatingPlan = (instanceId, cb) => {
  sampleRatingPlan.plan_id = generatePlanId(instanceId, instanceId);
  createPlan('rating', sampleRatingPlan, instanceId, cb);
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
    if (err) {
      edebug('Error duriung plans creation %o', err);
      cb(httpStatus.INTERNAL_SERVER_ERROR);
    }
    else
      cb(httpStatus.CREATED);
  });
};

const createService = (req, res) => {
  createPlans(req.params.instance_id, req.body.instance_name, (statusCode) => {
    res.status(statusCode).send({ dashboard_url:
        `${DASHBOARD_URI}${req.params.instance_id}` });
  });
};

module.exports = createService;
module.exports.createPlans = createPlans;
