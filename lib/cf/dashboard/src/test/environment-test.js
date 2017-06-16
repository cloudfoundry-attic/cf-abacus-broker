'use strict';
require('./lib/index.js');
const environment = require('../utils/environment');

describe('environment', () => {
  it('should get correct local options', (done) => {
    const opts = environment.getLocalOptions();
    expect(opts.name).to.equal('abacus-resourceprovider-ui');
    done();
  });
  it('should get current environment', (done) => {
    const env = environment.getCurrentEnvironment();
    expect(env).to.equal('test');
    done();
  });
});
