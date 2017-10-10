'use strict';

const defaultMetrics = [
  {
    name: 'sampleName',
    prices: [
      {
        country: 'sampleCountry',
        price: 0
      }
    ]
  }
];

module.exports = (planId = '', metrics = defaultMetrics) => {
  return {
    plan_id: planId,
    metrics: metrics
  };
};
