'use strict';

const _ = require('underscore');
const extend = _.extend;
const isEmpty = _.isEmpty;

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
const xdebug = require('abacus-debug')('x-abacus-broker');

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
      return;
    }

    debug('Created %s plan with id %s', resourceType, planId);
    cb(null, planId);
  });
};

const createPlanMapping =
  (resourceType, planId, instanceId, cb) => {
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
          return;
        }

        debug('Created %s mapping with id %s', resourceType, planId);
        cb(null, instanceId, planId);
      });
  };

const createServiceMapping = (body, serviceId, instanceId, planId, cb) => {
  const generatedPlanId = [config.defaultPlanName, planId, planId, planId]
    .join('/');
  request.post(':url/v1/provisioning/mappings/services/' +
  'resource/:resource/plan/:plan', {
    url: config.getMappingApi(),
    resource: serviceId,
    plan: generatedPlanId,
    headers: oauth.authHeader(),
    body: body
  }, (err, response) => {
    if (err || response.statusCode !== httpStatus.OK) {
      const failure = err ? err : response;
      edebug('Failed to create resource provider mapping due to %o', failure);
      cb(failure);
      return;
    }

    debug('Created resource provider mapping');
    cb(null, planId);
  });
};

const createMeteringPlan = (plans, planId, cb) => {
  let meteringPlan;
  if(!isEmpty(plans)) {
    debug('Creating external metering plan');
    meteringPlan = extend({}, plans[0].plan, { plan_id: planId });
  }
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
  createPlanMapping('metering', planId, instanceId, cb);
};

const createPricingPlanMapping = (instanceId, planId, cb) => {
  createPlanMapping('pricing', planId, instanceId, cb);
};

const createRatingPlanMapping = (instanceId, planId, cb) => {
  createPlanMapping('rating', planId, instanceId, cb);
};

const resourceProviderMappingBody = (planConfig) => {
  return {
    organization_guid: planConfig.organization_guid,
    space_guid: planConfig.space_guid,
    service_name: planConfig.parameters.plans[0].resource_provider
      .service_name,
    service_plan_name: planConfig.parameters.plans[0].resource_provider
      .service_plan_name
  };
};

const getResourceProvider = (plans) =>
  isEmpty(plans) ? undefined : plans[0].resource_provider;

const isCustomConfigValid = (parameters) => {
  if(parameters === undefined)
    return true;

  if(isEmpty(parameters))
    return false;

  const plans = parameters.plans;
  if(isEmpty(plans) || isEmpty(plans[0].plan))
    return false;

  return true;
};

const tasks = (planConfig) => {
  const instanceId = planConfig.instance_id;
  const planId = config.generatePlanId(instanceId, instanceId);
  const plans = planConfig.parameters ? planConfig.parameters.plans : undefined;
  const resourceProvider = getResourceProvider(plans);

  let tasks = resourceProvider ? [
    async.apply(createServiceMapping, resourceProviderMappingBody(planConfig),
      planConfig.service_id, planConfig.instance_id, planId),
    async.apply(createMeteringPlan, plans)
  ] : [
    async.apply(createMeteringPlan, plans, planId)
  ];

  return tasks.concat([
    createPricingPlan,
    createRatingPlan,
    async.apply(createMeteringPlanMapping, planConfig.instance_id),
    createPricingPlanMapping,
    createRatingPlanMapping
  ]);
};

const createPlans = (planConfig, cb) => {
  debug('Creating service instance with config %o', planConfig);

  if(!isCustomConfigValid(planConfig.parameters)) {
    edebug('Custom metering plan is not provided');
    cb(httpStatus.INTERNAL_SERVER_ERROR);
    return;
  }

  async.waterfall(tasks(planConfig), (err) => {
    if (err) {
      edebug('Error during plans creation %o', err);
      cb(httpStatus.INTERNAL_SERVER_ERROR);
      return;
    }

    cb(httpStatus.CREATED);
  });
};

const createService = (req, res) => {
  xdebug('Create service request %o', req.body);
  const planConfig = {
    instance_id: req.params.instance_id,
    service_id: req.body.service_id,
    parameters: req.body.parameters,
    organization_guid: req.body.organization_guid,
    space_guid: req.body.space_guid
  };

  createPlans(planConfig, (statusCode) => {
    res.status(statusCode).send({
      dashboard_url: config.dashboardUrl(req.params.instance_id)
    });
  });
};

module.exports = createService;
module.exports.createPlans = createPlans;
