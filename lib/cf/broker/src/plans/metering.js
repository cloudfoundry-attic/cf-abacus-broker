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
        type: 'discrete',
        meter : (m) => {
          return m.name;
        },
        accumulate: (a, qty, start, end, from, to, twCell) => {
          return end < from || end >= to ? null : new BigNumber(a || 0).add(qty || 0).toNumber();
        },
        aggregate: (a, prev, curr, aggTwCell, accTwCell) => {
          return new BigNumber(a || 0).add(curr || 0).sub(prev || 0).toNumber();
        },
        summarize: (t, qty) => {
          return qty ? qty : 0;
        }
      }
    ]
  };
};
