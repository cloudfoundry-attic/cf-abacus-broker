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

  const testUpdatePlan = (planType, plan) => {

    const planDbDoc = extend({}, plan, {
      _id: `k/test-${planType}-plan`,
      _rev: 1
    });

    context(`${planType} plans`, () => {

      it('succeeds', (done) => {
        getFromDbMock = spy(function(id, cb) {
          return cb(undefined, planDbDoc);
        });

        requestPlan(planType, plan.plan_id, plan,
          (err, response) => {
            expectStatusCodeOK(err, response, planDbDoc);
            done();
          });
      });

      it('fails with invalid request body', (done) => {
        getFromDbMock = spy(function(id, cb) {
          return cb(undefined, planDbDoc);
        });

        requestPlan(planType, plan.plan_id, {},
          (err, response) => {
            expectStatusCodeBadRequest(err, response, planDbDoc);
            done();
          });
      });

      it('fails when plan does not exist', (done) => {
        getFromDbMock = spy(function(id, cb) {
          return cb(null, undefined);
        });

        requestPlan(planType, 'non-existing-key', plan,
          (err, response) => {
            expectStatusCodeNotFound(err, response, planDbDoc);
            done();
          });
      });
    });
  };


  testUpdatePlan('metering', {
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
  });

  testUpdatePlan('pricing', {
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
  });

  testUpdatePlan('rating', {
    plan_id: 'test-rating-plan',
    metrics: [{
      name: 'classifier_instances',
      rate: ((p,qty) => p ? p * qty : 0).toString(),
      charge: ((t,cost) => cost).toString()
    }]
  });
});
