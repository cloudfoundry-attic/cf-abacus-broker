'use strict';

const _ = require('underscore');
const memoize = _.memoize;

const urienv = require('abacus-urienv');

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

module.exports.uris = uris;
module.exports.prefixWithResourceProvider = prefixWithResourceProvider;
module.exports.defaultResourceProviderPrefix =
  defaultResourceProviderPrefix;
module.exports.usageCollectorPath = usageCollectorPath;
module.exports.defaultUsageCollectorPath = defaultUsageCollectorPath;
module.exports.defaultPlanName = defaultPlanName;
