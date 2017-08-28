'use strict';
/* eslint-disable max-len*/
const index = require('./lib/index.js');
const nock = require('nock');
const config = require('../config');
const serviceBindings = require('./fixtures/service_bindings.json');
const authenticate = require('../middleware/authMiddleware');
delete require.cache[require.resolve('..')];

index.mockDbSettings();
const app = require('../application')();

describe('UI Routes', () => {

  before(() => {
    index.deleteModules();
  });

  describe('UI Routes success', () => {
    let routeAuthStub;
    before(() => {
      nock.cleanAll();
      routeAuthStub = sinon.stub(authenticate, 'isAuthenticated', (req) => {
        req.session.uaa_response = {};
        req.session.uaa_response.access_token = 'token';
        return true;
      });
      nock(config.uris().api)
        .get('/v2/service_instances/test-instance/permissions')
        .reply(() => {
          return [200, { manage: true }];
        });
      nock(config.uris().api)
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
            expect(nock.isDone, true);
            done();
          });
      });
  });

  describe('UI Routes permission failure', () => {
    let routeAuthStub;
    before(() => {
      nock.cleanAll();
      routeAuthStub = sinon.stub(authenticate, 'isAuthenticated', (req) => {
        req.session.uaa_response = {};
        req.session.uaa_response.access_token = 'token';
        return true;
      });
      nock(config.uris().api)
        .get('/v2/service_instances/test-instance/permissions')
        .reply(() => {
          return [200, { manage: false }];
        });
      nock(config.uris().api)
        .get('/v2/service_instances/test-instance/service_bindings')
        .reply(() => {
          return [200, serviceBindings];
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
            expect(nock.isDone, true);
            done();
          });
      });
  });

  describe('UI Routes no bindings', () => {
    let routeAuthStub;
    before(() => {
      routeAuthStub = sinon.stub(authenticate, 'isAuthenticated', (req) => {
        req.session.uaa_response = {};
        req.session.uaa_response.access_token = 'token';
        return true;
      });
      nock(config.uris().api)
        .get('/v2/service_instances/test-instance/permissions')
        .reply(() => {
          return [200, { manage: true }];
        });
      nock(config.uris().api)
        .get('/v2/service_instances/test-instance/service_bindings')
        .reply(() => {
          return [200, { 'resources': [] }];
        });
      nock(config.cf.token_url)
        .post('').reply(() => {
          return [200, {
            'access_token': 'accessToken'
          }];
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
            expect(nock.isDone, true);
            done();
          });
      });
  });
});
