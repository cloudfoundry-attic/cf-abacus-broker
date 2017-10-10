'use strict';

const _ = require('underscore');
const memoize = _.memoize;
const isEmpty = _.isEmpty;
const isArray = _.isArray;
const map = _.map;
const pick = _.pick;
const extend = _.extend;

const urienv = require('abacus-urienv');

const samplePricingPlan = require('./plans/pricing.js');

const uris = memoize(() => urienv({
  api : 9882,
  auth_server: 9883,
  provisioning: 9880,
  collector: 9080
}));

const defaultUsageCollectorPath = '/v1/metering/collected/usage';

const usageCollectorPath = process.env.USAGE_COLLECTOR_PATH
  || defaultUsageCollectorPath;

const defaultResourceProviderPrefix = 'abacus-rp-';
const prefixWithResourceProvider =
  (id = '') => defaultResourceProviderPrefix + id;

const defaultPlanName = 'standard';

const getClientId = (instanceId, bindingId) => {
  const id = `${instanceId}-${bindingId}`;
  return prefixWithResourceProvider(id);
};

const generatePlanId = (resourceProviderId, planId) => {
  return `${resourceProviderId}-${planId}`;
};

const getMappingApi = () => {
  return uris().mapping_api ? uris().mapping_api : uris().provisioning;
};

const dashboardUri = process.env.DASHBOARD_URI || '';
const dashboardUrl = (instanceId = '') => dashboardUri.endsWith('/') ?
  `${dashboardUri}${instanceId}` : `${dashboardUri}/${instanceId}`;

const isServiceConfigValid = (serviceConfig) => {
  if(serviceConfig === undefined)
    return true;

  if(isEmpty(serviceConfig))
    return false;

  const plans = serviceConfig.plans;
  if(isEmpty(plans) || !isArray(plans) || isEmpty(plans[0].plan))
    return false;

  return true;
};

const defaultPrices = samplePricingPlan().metrics[0].prices;

const buildPricingPlanMetrics = (metrics) =>
  map(metrics,
    (metric) => extend({ 'prices': defaultPrices }, pick(metric, 'name')));

const buildRatingPlanMetrics = (metrics) =>
  map(metrics, (m) => pick(m, 'name'));

module.exports.uris = uris;
module.exports.prefixWithResourceProvider = prefixWithResourceProvider;
module.exports.defaultResourceProviderPrefix =
  defaultResourceProviderPrefix;
module.exports.usageCollectorPath = usageCollectorPath;
module.exports.defaultUsageCollectorPath = defaultUsageCollectorPath;
module.exports.defaultPlanName = defaultPlanName;
module.exports.getClientId = getClientId;
module.exports.getMappingApi = getMappingApi;
module.exports.generatePlanId = generatePlanId;
module.exports.dashboardUrl = dashboardUrl;
module.exports.isServiceConfigValid = isServiceConfigValid;
module.exports.buildPricingPlanMetrics = buildPricingPlanMetrics;
module.exports.buildRatingPlanMetrics = buildRatingPlanMetrics;
