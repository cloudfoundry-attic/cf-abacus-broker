'use strict';

const logger = require('./dashboardLogger');
const _ = require('lodash');

class Environment {
  constructor() {
    this.loaded = false;
  }

  getLocalOptions() {
    let defaultAppName = 'abacus-resourceprovider-ui';

    let opts = {};
    opts.name = defaultAppName;
    opts.vcap = {
      'application': 'localApplication',
      'services': 'localServices'
    };
    return opts;
  }

  getCurrentEnvironment() {
    return process.env.NODE_ENV || 'development';
  }

  loadEnvironment() {
    logger.info('Current Environment:', process.env.NODE_ENV);
    if (this.getCurrentEnvironment() === 'development') {
      logger.info('Setting environment variables');
      let vars = require('../env/local-environment.json');
      let keys = Object.keys(vars);
      keys.forEach((k) => {
        let val = vars[k];
        if (_.isObject(val)) 
          process.env[k] = JSON.stringify(val);
        else 
          process.env[k] = val;
        
      });
    }
    this.loaded = true;
  }
}

module.exports = new Environment();
