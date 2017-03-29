'use strict';

const _ = require('underscore');
const request = require('abacus-request');
const cluster = require('abacus-cluster');
const extend = _.extend;

// Configure test db URL prefix
process.env.DB = process.env.DB || 'test';

// Mock the cluster module
require.cache[require.resolve('abacus-cluster')].exports =
  extend((app) => app, cluster);

describe('abacus-ext-provisioning-plugin updating of', () => {
  let server;
  let dbclient;
  let getFromDbMock;
  let putToDbMock = spy((doc, cb) => {
    return cb(undefined, {});
  });

  const mockDbClient = () => {
    dbclient = require('abacus-dbclient');
    const dbclientModule = require.cache[require.resolve('abacus-dbclient')];
    dbclientModule.exports = extend(() => {
      return {
        fname: 'test-mock',
        get: (id, cb) => {
          return getFromDbMock(id, cb);
        },
        put: putToDbMock
      };
    }, dbclient);
  };

  before(() => {
    delete require.cache[require.resolve('..')];

    mockDbClient();
    const provisioning = require('..');
    server = provisioning().listen(0);
  });

  beforeEach(() => {
    putToDbMock.reset();
  });

  after(() => {
    delete require.cache[require.resolve('abacus-dbclient')];
  });

  const requestPlan = (resourceType, planId, requestBody, expectation) => {
    request.put('http://localhost::port/v1/:resource_type/plan/:plan_id', {
      port: server.address().port,
      resource_type: resourceType,
      plan_id: planId,
      body: requestBody
    }, function(err, response) {
      expectation(err, response);
    });
  };

  const expectStatusCodeOK = (err, response, dbDoc) => {
    expect(err).to.equal(undefined);
    expect(response.statusCode).to.equal(200);
    expect(getFromDbMock.callCount).to.equal(1);
    expect(putToDbMock.callCount).to.equal(1);
    sinon.assert.calledWith(putToDbMock, dbDoc);
  };

  const expectStatusCodeBadRequest = (err, response, dbDoc) => {
    expect(err).to.equal(undefined);
    expect(response.statusCode).to.equal(400);
    expect(getFromDbMock.callCount).to.equal(0);
    expect(putToDbMock.callCount).to.equal(0);
  };

  const expectStatusCodeNotFound = (err, response, dbDoc) => {
    expect(err).to.equal(undefined);
    expect(response.statusCode).to.equal(404);
    expect(response.body.message).to.equal('Plan not found');
    expect(putToDbMock.callCount).to.equal(0);
  };

  context('metering plans', () => {
    const meteringPlan = {
      plan_id: 'test-metering-plan',
      measures: [{
        name: 'classifiers-updated',
        unit: 'INSTANCE'
      }],
      metrics: [{
        name: 'classifier_instances',
        unit: 'INSTANCE',
        type: 'discrete',
        formula: 'AVG({classifier})'
      }]
    };

    const meteringPlanDbDoc = extend({}, meteringPlan, {
      _id: 'k/test-metering-plan',
      _rev: 1
    });

    it('succeeds', (done) => {
      getFromDbMock = spy(function(id, cb) {
        return cb(undefined, meteringPlanDbDoc);
      });

      requestPlan('metering', meteringPlan.plan_id, meteringPlan,
        (err, response) => {
          expectStatusCodeOK(err, response, meteringPlanDbDoc);
          done();
        });
    });

    it('fails with invalid request body', (done) => {
      getFromDbMock = spy(function(id, cb) {
        return cb(undefined, meteringPlanDbDoc);
      });

      requestPlan('metering', meteringPlan.plan_id, {},
        (err, response) => {
          expectStatusCodeBadRequest(err, response, meteringPlanDbDoc);
          done();
        });
    });

    it('fails when plan does not exist', (done) => {
      getFromDbMock = spy(function(id, cb) {
        return cb(null, undefined);
      });

      requestPlan('metering', 'non-existing-key', meteringPlan,
        (err, response) => {
          expectStatusCodeNotFound(err, response, meteringPlanDbDoc);
          done();
        });
    });
  });

  context('pricing plans', () => {
    const pricingPlan = {
      plan_id: 'test-pricing-plan',
      metrics: [{
        name: 'classifier_instances',
        prices: [{
          country: 'USA',
          price: 0.00015
        }, {
          country: 'EUR',
          price: 0.00011
        }, {
          country: 'CAN',
          price: 0.00016
        }]
      }]
    };

    const pricingPlanDbDoc = extend({}, pricingPlan, {
      _id: 'k/test-pricing-plan',
      _rev: 1
    });

    it('succeeds', (done) => {
      getFromDbMock = spy(function(id, cb) {
        return cb(undefined, pricingPlanDbDoc);
      });

      requestPlan('pricing', pricingPlan.plan_id, pricingPlan,
        (err, response) => {
          expectStatusCodeOK(err, response, pricingPlanDbDoc);
          done();
        });
    });

    it('fails with invalid request body', (done) => {
      getFromDbMock = spy(function(id, cb) {
        return cb(undefined, pricingPlanDbDoc);
      });

      requestPlan('pricing', pricingPlan.plan_id, {},
        (err, response) => {
          expectStatusCodeBadRequest(err, response, pricingPlanDbDoc);
          done();
        });
    });

    it('fails when plan does not exist', (done) => {
      getFromDbMock = spy(function(id, cb) {
        return cb(null, undefined);
      });

      requestPlan('pricing', 'non-existing-key', pricingPlan,
        (err, response) => {
          expectStatusCodeNotFound(err, response, pricingPlanDbDoc);
          done();
        });
    });
  });

  context('rating plans', () => {
    const ratingPlan = {
      plan_id: 'test-rating-plan',
      metrics: [{
        name: 'classifier_instances',
        rate: ((p,qty) => p ? p * qty : 0).toString(),
        charge: ((t,cost) => cost).toString()
      }]
    };

    const ratingPlanDbDoc = extend({}, ratingPlan, {
      _id: 'k/test-rating-plan',
      _rev: 1
    });

    it('succeeds', (done) => {
      getFromDbMock = spy(function(id, cb) {
        return cb(undefined, ratingPlanDbDoc);
      });

      requestPlan('rating', ratingPlan.plan_id, ratingPlan,
        (err, response) => {
          expectStatusCodeOK(err, response, ratingPlanDbDoc);
          done();
        });
    });

    it('fails with invalid request body', (done) => {
      getFromDbMock = spy(function(id, cb) {
        return cb(undefined, ratingPlanDbDoc);
      });

      requestPlan('rating', ratingPlan.plan_id, {},
        (err, response) => {
          expectStatusCodeBadRequest(err, response, ratingPlanDbDoc);
          done();
        });
    });

    it('fails when plan does not exist', (done) => {
      getFromDbMock = spy(function(id, cb) {
        return cb(null, undefined);
      });

      requestPlan('rating', 'non-existing-key', ratingPlan,
        (err, response) => {
          expectStatusCodeNotFound(err, response, ratingPlanDbDoc);
          done();
        });
    });
  });
});
