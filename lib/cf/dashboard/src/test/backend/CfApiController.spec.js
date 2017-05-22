'use strict';
require('./lib/index.js');
const controller = require('../../lib/controllers').cfApi;
const config = require('../../lib/config');
const sharedDomains = require('../fixtures/shared_domains.json');
const serviceBindings = require('../fixtures/service_bindings.json');
const req = {
  'params': {
    'instance_id': 'test-instance'
  },
  'session': {
    'uaa_response': {
      'access_token': 'abcd1234'
    }
  },
  'sessionStore': {
    'refreshToken': 'abcd'
  },
  'query': {
    'quota_def_url': '/test',
    'key': 'test'
  }
};
const res = {
  'setHeader': () => {},
  'send': () => {},
  'status': () => {},
  'redirect': () => {}
};

let controllerSpy;
describe('lib', () => {
  describe('controllers', () => {
    describe('cfApiController', () => {
      describe('get service bindings call', () => {
        beforeEach(() => {
          nock(config.cf.cf_api_endpoint)
            .get('/v2/service_instances/test-instance/service_bindings')
            .reply(() => {
              return [200, serviceBindings];
            });
          nock(config.cf.cf_api_endpoint)
            .get('/v2/shared_domains')
            .reply(() => {
              return [200, sharedDomains];
            });
          nock(config.cf.token_url)
            .post('').reply(() => {
              return [200, {
                'access_token': 'accessToken'
              }];
            });
          controllerSpy = sinon.spy(controller, 'getServiceBinding');
        });
        afterEach(() => {
          controllerSpy.restore();
        });
        it('calls cloud controller to get service bindings', (done) => {
          controller.getServiceBinding(req, res);
          expect(controllerSpy.calledOnce).to.equal(true);
          done();
        });
      });
    });
  });
});
