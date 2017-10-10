'use strict';

const defaultMetrics = [
  {
    name: 'sampleName'
  }
];

module.exports = (planId = '', metrics = defaultMetrics) => {
  return {
    plan_id: planId,
    metrics: metrics
  };
};
