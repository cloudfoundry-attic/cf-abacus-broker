'use strict';

/* istanbul ignore file */

module.exports = {
  plan_id: 'dc-pricing-basic',
  metrics: [
    {
      name: 'data_in_thousand',
      prices: [
        {
          country: 'USA',
          price: 2000
        },
        {
          country: 'EUR',
          price: 1700
        },
        {
          country: 'CAN',
          price: 2050
        }]
    },
    {
      name: 'api_calls',
      prices: [
        {
          country: 'USA',
          price: 10.0
        },
        {
          country: 'EUR',
          price: 9.0
        },
        {
          country: 'CAN',
          price: 10.1
        }]
    }]
};
