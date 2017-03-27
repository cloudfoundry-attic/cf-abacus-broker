'use strict';


/* istanbul ignore file */

module.exports = {
  plan_id: 'baas-pricing-basic',
  metrics: [
    {
      name: 'instances',
      prices: [
        {
          country: 'USA',
          price: 500
        },
        {
          country: 'EUR',
          price: 500
        },
        {
          country: 'CAN',
          price: 500
        }]
    },
    {
      name: 'api_calls',
      prices: [
        {
          country: 'USA',
          price: 0.10
        },
        {
          country: 'EUR',
          price: 0.10
        },
        {
          country: 'CAN',
          price: 0.10
        }]
    }]
};

