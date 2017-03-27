'use strict';

/* istanbul ignore file */

module.exports = {
  plan_id: 'dc-rating-plan',
  metrics: [
    {
      name: 'data_in_thousand',
      rate: ((p, qty) => p ? p * qty : 0).toString(),
      charge: ((t, cost) => cost).toString()
    },
    {
      name: 'api_calls',
      rate: ((p, qty) => p ? p * qty : 0).toString(),
      charge: ((t, cost) => cost).toString()
    }]
};
