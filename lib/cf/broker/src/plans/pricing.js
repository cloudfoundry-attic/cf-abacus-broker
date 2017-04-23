'use strict';

module.exports = (planId = '') => {
  return {
    plan_id: planId,
    metrics: [
      {
        name: 'sampleName',
        prices: [
          {
            country: 'sampleCountry',
            price: 0
          }
        ]
      }
    ]
  };
};
