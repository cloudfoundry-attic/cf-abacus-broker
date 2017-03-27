'use strict';

// A test metering plan for a resource metered by max storage, API calls,
// and memory consumption over time

// Memory consumption over time

// This formula will resolve out of order submission by submitting current
//   usage and previous usage.

// To start A, an instance of 1 gb:
//   current_running_instances: 1,
//   current_instance_memory: 1073741824,
//   previous_running_instances: 0,
//   previous_instance_memory: 0

// To update A, an instance from 1 gb to 2 instance of 2 gb:
//   current_running_instances: 2,
//   current_instance_memory: 2147483648,
//   previous_running_instances: 1,
//   previous_instance_memory: 1073741824

// To stop A,
//   current_running_instances: 0,
//   current_instance_memory: 0,
//   previous_running_instances: 2,
//   previous_instance_memory: 2147483648

// The requirement to use this formula is to also submit the previous usage.

// The algorithm works like this:
// When the app consumes memory, in the past before it is stopped / in the
//   future after it is started, the app will add negative consumption.
// When the app does not consumes memory, in the past before it is started /
//   in the future after it is stopped, the app will add positive consumption.

/* istanbul ignore file */

module.exports = {
  plan_id: 'iot-app-metering-plan',
  measures: [
    {
      name: 'api_write_packages',
      unit: 'CALL'
    },
    {
      name: 'api_read_packages',
      unit: 'CALL'
    }],
  metrics: [
    {
      name: 'api_write_packages',
      unit: 'CALL',
      type: 'discrete',
      meter: ((m) => m.api_write_packages).toString()
    },
    {
      name: 'api_read_packages',
      unit: 'CALL',
      type: 'discrete',
      meter: ((m) => m.api_read_packages).toString()
    }]
};

