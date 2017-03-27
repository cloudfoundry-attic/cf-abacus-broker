'use strict';

// A sample storage service, rating gigabytes of storage, thousand
// light API calls and heavy API calls.

/* istanbul ignore file */

module.exports = {
  plan_id: 'iot-app-rating-plan',
  metrics: [
    {
      name: 'api_write_packages',
      rate: ((price, qty) => new BigNumber(price || 0)
        .mul(qty).toNumber()).toString()
    },
    {
      name: 'api_read_packages',
      rate: ((price, qty) => new BigNumber(qty)
        .mul(price || 0).toNumber()).toString()
    }
  ]
};
