'use strict';
/* eslint-disable max-len*/
require('./lib/index.js');
const nock = require('nock');
const config = require('../utils/config');
const serviceBindings = require('./fixtures/service_bindings.json');
const sharedDomains = require('./fixtures/shared_domains.json');
const authenticate = require('../middleware/authMiddleware');
const app = require('../index')();


describe('lib module', () => {
  describe('UI Routes success', () => {
    let routeAuthStub;
    before(() => {
      config.cf.abacus_provisioning_endpoint = '';
      nock.cleanAll();
      routeAuthStub = sinon.stub(authenticate, 'isAuthenticated', (req) => {
        req.session.uaa_response = {};
        req.session.uaa_response.access_token = 'token';
        return true;
      });
      nock(config.cf.cf_api_endpoint)
        .get('/v2/service_instances/test-instance/permissions')
        .reply(() => {
          return [200, { manage: true }];
        });
      nock(config.cf.cf_api_endpoint)
        .get('/v2/service_instances/test-instance/service_bindings')
        .reply(() => {
          return [200, serviceBindings];
        });
      nock(config.cf.token_url)
        .post('').reply(() => {
          return [200, {
            'access_token': 'accessToken'
          }];
        });
      nock(config.cf.cf_api_endpoint)
        .get('/v2/shared_domains')
        .reply(() => {
          return [200, sharedDomains];
        });
    });

    after(() => {
      routeAuthStub.restore();
      nock.cleanAll();
    });

    it('should call the /manage/instances/test-instance route',
      (done) => {
        chai
          .request(app)
          .get('/manage/instances/test-instance')
          .send({})
          .catch((err) => err.response)
          .then((res) => {
            chai.assert(res.type, 'html');
            expect(nock.isDone,true);
            done();
          });
      });
  });

  describe('UI Routes permission failure', () => {
    let routeAuthStub;
    before(() => {
      config.cf.abacus_provisioning_endpoint = '';
      nock.cleanAll();
      routeAuthStub = sinon.stub(authenticate, 'isAuthenticated', (req) => {
        req.session.uaa_response = {};
        req.session.uaa_response.access_token = 'token';
        return true;
      });
      nock(config.cf.cf_api_endpoint)
        .get('/v2/service_instances/test-instance/permissions')
        .reply(() => {
          return [200, { manage: false }];
        });
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
    });

    after(() => {
      routeAuthStub.restore();
      nock.cleanAll();
    });

    it('should call the /manage/instances/test-instance route',
      (done) => {
        chai
          .request(app)
          .get('/manage/instances/test-instance')
          .send({})
          .catch((err) => err.response)
          .then((res) => {
            chai.assert(res.type, 'html');
            expect(nock.isDone,true);
            done();
          });
      });
  });

  describe('UI Routes no bindings', () => {
    let routeAuthStub;
    before(() => {
      config.cf.abacus_provisioning_endpoint = '';
      routeAuthStub = sinon.stub(authenticate, 'isAuthenticated', (req) => {
        req.session.uaa_response = {};
        req.session.uaa_response.access_token = 'token';
        return true;
      });
      nock(config.cf.cf_api_endpoint)
        .get('/v2/service_instances/test-instance/permissions')
        .reply(() => {
          return [200, { manage: true }];
        });
      nock(config.cf.cf_api_endpoint)
        .get('/v2/service_instances/test-instance/service_bindings')
        .reply(() => {
          return [200, { 'resources' : [] }];
        });
      nock(config.cf.token_url)
        .post('').reply(() => {
          return [200, {
            'access_token': 'accessToken'
          }];
        });
      nock(config.cf.cf_api_endpoint)
        .get('/v2/shared_domains')
        .reply(() => {
          return [200, sharedDomains];
        });
    });

    after(() => {
      routeAuthStub.restore();
      nock.cleanAll();
    });

    it('should call the /manage/instances/test-instance route',
      (done) => {
        chai
          .request(app)
          .get('/manage/instances/test-instance')
          .send({})
          .catch((err) => err.response)
          .then((res) => {
            chai.assert(res.type, 'html');
            expect(nock.isDone,true);
            done();
          });
      });
  });  
});

