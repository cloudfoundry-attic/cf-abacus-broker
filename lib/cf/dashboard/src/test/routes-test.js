'use strict';
/* eslint-disable no-unused-expressions, max-var, max-len*/
require('./lib/index.js');
const nock = require('nock');
const config = require('../utils/config');
const plan = require('./fixtures/plan.json');
const pricing = require('./fixtures/pricing_plan.json');
const rating = require('./fixtures/rating_plan.json');
const app = require('../index')();

describe('lib', () => {
  describe('Routes', () => {
    describe('Abacus Routes', () => {
      describe('GET metering plan success', () => {
        before(() => {
          nock.cleanAll();
          nock(config.cf.abacus_provisioning_endpoint)
            .get('/v1/metering/plans/test-metering-plan')
            .reply(() => {
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
        it('should call /metering/plans/test-metering-plan', (done) => {
          chai.request(app)
            .put('/v1/metering/plans/test-metering-plan')
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
            .put('/v1/metering/plans/test-metering-plan')
            .send({})
            .catch((err) => err.response)
            .then((res) => {
              expect(nock.isDone()).to.be.true;
              expect(res).to.have.status(401);
              done();
            });
        });
      });

      describe('Update all plans success', () => {
        before(() => {
          nock(config.cf.abacus_provisioning_endpoint)
            .get('/v1/rating/plans/test-metering-plan')
            .reply(() => {
              return [200, rating];
            });
          nock(config.cf.abacus_provisioning_endpoint)
            .get('/v1/pricing/plans/test-metering-plan')
            .reply(() => {
              return [200, pricing];
            });
          nock(config.cf.abacus_provisioning_endpoint)
            .put('/v1/pricing/plan/test-metering-plan')
            .reply(() => {
              return [201, {}];
            });
          nock(config.cf.abacus_provisioning_endpoint)
            .put('/v1/rating/plan/test-metering-plan')
            .reply(() => {
              return [201, {}];
            });
          nock(config.cf.abacus_provisioning_endpoint)
            .put('/v1/metering/plan/test-metering-plan')
            .reply(() => {
              return [201, {}];
            });
        });

        after(() => {
          nock.cleanAll();
        });

        it('should call get/put rating, get/put pricing and put metering', (done) => {
          chai.request(app)
            .put('/v1/plans/test-metering-plan/metrics/test')
            .send({})
            .catch((err) => err.response)
            .then((res) => {
              expect(nock.isDone()).to.be.true;
              expect(res).to.have.status(201);
              done();
            });

        });
      });

      describe('update all plans with  get rating failure', () => {
        before(() => {
          nock(config.cf.abacus_provisioning_endpoint)
            .get('/v1/rating/plans/test-metering-plan')
            .reply(() => {
              return [401, {}];
            });
          nock(config.cf.abacus_provisioning_endpoint)
            .get('/v1/pricing/plans/test-metering-plan')
            .reply(() => {
              return [200, pricing];
            });
        });

        after(() => {
          nock.cleanAll();
        });

        it('should fail update metering with error', (done) => {
          chai.request(app)
            .put('/v1/plans/test-metering-plan/metrics/test')
            .send({})
            .catch((err) => err.response)
            .then((res) => {
              expect(nock.isDone()).to.be.true;
              expect(res).to.have.status(401);
              done();
            });
        });
      });

      describe('update all plans call with  get pricing failure', () => {
        before(() => {
          nock(config.cf.abacus_provisioning_endpoint)
            .get('/v1/rating/plans/test-metering-plan')
            .reply(() => {
              return [200, rating];
            });
          nock(config.cf.abacus_provisioning_endpoint)
            .get('/v1/pricing/plans/test-metering-plan')
            .reply(() => {
              return [403, {}];
            });
        });

        after(() => {
          nock.cleanAll();
        });

        it('should fail update metering with error', (done) => {
          chai.request(app)
            .put('/v1/plans/test-metering-plan/metrics/test')
            .send({})
            .catch((err) => err.response)
            .then((res) => {
              expect(nock.isDone()).to.be.true;
              expect(res).to.have.status(403);
              done();
            });
        });
      });

      describe('update all plans call with update pricing failure', () => {
        before(() => {
          nock(config.cf.abacus_provisioning_endpoint)
            .get('/v1/rating/plans/test-metering-plan')
            .reply(() => {
              return [200, rating];
            });
          nock(config.cf.abacus_provisioning_endpoint)
            .get('/v1/pricing/plans/test-metering-plan')
            .reply(() => {
              return [200, pricing];
            });
          nock(config.cf.abacus_provisioning_endpoint)
            .put('/v1/pricing/plan/test-metering-plan')
            .reply(() => {
              return [400, {}];
            });
          nock(config.cf.abacus_provisioning_endpoint)
            .put('/v1/rating/plan/test-metering-plan')
            .reply(() => {
              return [201, {}];
            });
        });

        after(() => {
          nock.cleanAll();
        });

        it('should fail update plans with 400', (done) => {
          chai.request(app)
            .put('/v1/plans/test-metering-plan/metrics/test')
            .send({})
            .catch((err) => err.response)
            .then((res) => {
              expect(nock.isDone()).to.be.true;
              expect(res).to.have.status(400);
              done();
            });
        });

      });

      describe('update all plans call with update rating failure', () => {
        before(() => {
          nock(config.cf.abacus_provisioning_endpoint)
            .get('/v1/rating/plans/test-metering-plan')
            .reply(() => {
              return [200, rating];
            });
          nock(config.cf.abacus_provisioning_endpoint)
            .get('/v1/pricing/plans/test-metering-plan')
            .reply(() => {
              return [200, pricing];
            });
          nock(config.cf.abacus_provisioning_endpoint)
            .put('/v1/pricing/plan/test-metering-plan')
            .reply(() => {
              return [201, {}];
            });
          nock(config.cf.abacus_provisioning_endpoint)
            .put('/v1/rating/plan/test-metering-plan')
            .reply(() => {
              return [400, {}];
            });
        });

        after(() => {
          nock.cleanAll();
        });

        it('should fail update plans with 400', (done) => {
          chai.request(app)
            .put('/v1/plans/test-metering-plan/metrics/test')
            .send({})
            .catch((err) => err.response)
            .then((res) => {
              expect(nock.isDone()).to.be.true;
              expect(res).to.have.status(400);
              done();
            });
        });

      });

      describe('update all plans call with update rating failure', () => {
        before(() => {
          nock(config.cf.abacus_provisioning_endpoint)
            .get('/v1/rating/plans/test-metering-plan')
            .reply(() => {
              return [200, rating];
            });
          nock(config.cf.abacus_provisioning_endpoint)
            .get('/v1/pricing/plans/test-metering-plan')
            .reply(() => {
              return [200, pricing];
            });
          nock(config.cf.abacus_provisioning_endpoint)
            .put('/v1/pricing/plan/test-metering-plan')
            .reply(() => {
              return [201, {}];
            });
          nock(config.cf.abacus_provisioning_endpoint)
            .put('/v1/rating/plan/test-metering-plan')
            .reply(() => {
              return [201, {}];
            });
          nock(config.cf.abacus_provisioning_endpoint)
            .put('/v1/metering/plan/test-metering-plan')
            .reply(() => {
              return [400, {}];
            });
        });

        after(() => {
          nock.cleanAll();
        });

        it('should fail update plans with 400', (done) => {
          chai.request(app)
            .put('/v1/plans/test-metering-plan/metrics/test')
            .send({})
            .catch((err) => err.response)
            .then((res) => {
              expect(nock.isDone()).to.be.true;
              expect(res).to.have.status(400);
              done();
            });
        });

      });
    });
  });
});
