'use strict';
/* eslint-disable no-unused-expressions */
require('./lib/index.js');
const nock = require('nock');
const config = require('../lib/config');
const plan = require('./fixtures/plan.json');
const app = require('../application');

describe('lib', () => {
  describe('Routes', () => {
    describe('Abacus Routes', () => {
      describe('GET metering plan success', () => {
        before(() => {
          nock.cleanAll();
          nock(config.cf.abacus_provisioning_endpoint)
            .get('/v1/metering/plans/test-metering-plan')
            .reply(function() {
              return [200, plan];
            });
        });
        after(() => {
          nock.cleanAll();
        });

        it('should call the /metering/plans/test-metering-plan route',
          (done) => {
            chai
              .request(app)
              .get('/v1/metering/plans/test-metering-plan')
              .send({})
              .catch((err) => err.response)
              .then((res) => {
                expect(nock.isDone()).to.be.true;
                expect(res).to.have.status(200);
                done();
              });
          });
      });

      describe('GET metering plan failure', () => {
        before(() => {
          nock(config.cf.abacus_provisioning_endpoint)
            .get('/v1/metering/plans/test-metering-plan')
            .reply(() => {
              return [401, 'Unauthorized', {}];
            });
        });
        after(() => {
          nock.cleanAll();
        });

        it('should call the /metering/plans/test-metering-plan route',
          (done) => {
            chai
              .request(app)
              .get('/v1/metering/plans/test-metering-plan')
              .send({})
              .catch((err) => err.response)
              .then((res) => {
                expect(nock.isDone()).to.be.true;
                expect(res).to.have.status(401);
                done();
              });
          });

      });

      describe('PUT metering plan success', () => {
        before(() => {
          nock(config.cf.abacus_provisioning_endpoint)
            .put('/v1/metering/plan/test-metering-plan')
            .reply(() => {
              return [201, {}];
            });
        });
        after(() => {
          nock.cleanAll();
        });
        it('should call /metering/plan/test-metering-plan', (done) => {
          chai.request(app)
            .put('/v1/metering/plan/test-metering-plan')
            .send({})
            .catch((err) => err.response)
            .then((res) => {
              expect(nock.isDone()).to.be.true;
              expect(res).to.have.status(201);
              done();
            });
        });
      });

      describe('PUT metering plan failure', () => {
        before(() => {
          nock(config.cf.abacus_provisioning_endpoint)
            .put('/v1/metering/plan/test-metering-plan')
            .reply(() => {
              return [401, {}];
            });
        });
        after(() => {
          nock.cleanAll();
        });
        it('should call /metering/plan/test-metering-plan', (done) => {
          chai.request(app)
            .put('/v1/metering/plan/test-metering-plan')
            .send({})
            .catch((err) => err.response)
            .then((res) => {
              expect(nock.isDone()).to.be.true;
              expect(res).to.have.status(401);
              done();
            });
        });
      });
    });
  });
});
