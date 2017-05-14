'use strict';
require('./lib/index.js');
const environment = require('../../lib/environment');

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
    it("should test load environment for development ", (done) => {
        expect(process.env.CF_CLIENT_ID).to.equal("test_client");
        sinon.stub(environment, "getCurrentEnvironment").returns("development");
        environment.loadEnvironment();
        expect(process.env.CF_CLIENT_ID).to.equal("cf-cockpit");
        done();
    })

});