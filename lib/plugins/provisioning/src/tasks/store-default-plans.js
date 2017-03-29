'use strict';

const debug = require('abacus-debug')('abacus-ext-provisioning-plugin');
const provisioning = require('..');

provisioning.storeAllDefaultPlans(() => {
  debug('Default plans have been imported');
  process.exit();
});
