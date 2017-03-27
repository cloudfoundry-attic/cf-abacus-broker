'use strict';

// A sample container service metered by memory consumption over time

/* istanbul ignore file */

module.exports = {
  plan_id: 'iot-app-pricing-basic',
  metrics: [
    {
      name: 'api_write_packages',
      prices: [
        {
          country: 'USA',
          price: 0.00014
        },
        {
          country: 'EUR',
          price: 0.00010
        },
        {
          country: 'CAN',
          price: 0.00015
        }]
    },{
      name: 'api_read_packages',
      prices: [
        {
          country: 'USA',
          price: 0.00014
        },
        {
          country: 'EUR',
          price: 0.00010
        },
        {
          country: 'CAN',
          price: 0.00015
        }]
    }]
};
