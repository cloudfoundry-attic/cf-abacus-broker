'use strict';

module.exports = (planId = '') => {
  return {
    plan_id: planId,
    measures: [
      {
        name: 'sampleName',
        unit: 'sampleUnit'
      }
    ],
    metrics: [
      {
        name: 'sampleName',
        unit: 'sampleUnit',
        type: 'sampleType'
      }
    ]
  };
};
