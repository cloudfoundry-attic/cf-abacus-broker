'use strict';

const _ = require('underscore');
const memoize = _.memoize;

const urienv = require('abacus-urienv');

const uris = memoize(() => urienv({
  cf_api: 9882,
  uaa_server: 9883,
  provisioning: 9880,
  collector: 9080
}));

const DEFAULT_USAGE_COLLECTOR_PATH = '/v1/metering/collected/usage';

const usageCollectorPath = process.env.USAGE_COLLECTOR_PATH
  || DEFAULT_USAGE_COLLECTOR_PATH;

const DEFAULT_RESOURCE_PROVIDER_PREFIX = 'abacus-rp-';
const prefixWithResourceProvider =
  (id = '') => DEFAULT_RESOURCE_PROVIDER_PREFIX + id;

const DEFAULT_PLAN_NAME = 'standard';

module.exports.uris = uris;
module.exports.prefixWithResourceProvider = prefixWithResourceProvider;
module.exports.DEFAULT_RESOURCE_PROVIDER_PREFIX =
  DEFAULT_RESOURCE_PROVIDER_PREFIX;
module.exports.usageCollectorPath = usageCollectorPath;
module.exports.DEFAULT_USAGE_COLLECTOR_PATH = DEFAULT_USAGE_COLLECTOR_PATH;
module.exports.DEFAULT_PLAN_NAME = DEFAULT_PLAN_NAME;
