'use strict';

/* istanbul ignore file */

module.exports = {
  plan_id: 'baas-metering-plan',
  measures: [
    {
      name: 'instances',
      unit: 'INSTANCE'
    },
    {
      name: 'api_calls',
      unit: 'CALL'
    }],
  metrics: [
    {
      name: 'instances',
      unit: 'INSTANCE',
      type: 'discrete',
      meter: ((m) => m.instances).toString(),
      aggregate: ((a, prev, curr, aggTwCell, accTwCell) =>
        new BigNumber(a || 0).add(curr).sub(prev).toNumber()).toString()
    },
    {
      name: 'api_calls',
      unit: 'CALL',
      type: 'discrete',
      meter: ((m) => m.api_calls).toString()
    }]
};
