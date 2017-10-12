'use strict';

// Minimal example implementation of an Abacus provisioning plugin.

const _ = require('underscore');
const request = require('abacus-request');
const cluster = require('abacus-cluster');
const oauth = require('abacus-oauth');
const dbclient = require('abacus-dbclient');
const urienv = require('abacus-urienv');
const yieldable = require('abacus-yieldable');
const partition = require('abacus-partition');
const extend = _.extend;
const omit = _.omit;

// Configure test db URL prefix
process.env.DB = process.env.DB || 'test';

const uris = urienv({
  db: 5984
});
const meteringdb = yieldable(dbclient(partition.singleton,
  dbclient.dburi(uris.db, 'abacus-metering-plans')));
const pricingdb = yieldable(dbclient(partition.singleton,
  dbclient.dburi(uris.db, 'abacus-pricing-plans')));
const ratingdb = yieldable(dbclient(partition.singleton,
  dbclient.dburi(uris.db, 'abacus-rating-plans')));

// Mock the cluster module
require.cache[require.resolve('abacus-cluster')].exports =
  extend((app) => app, cluster);

// Mock the oauth module with a spy
const oauthspy = spy((req, res, next) => next());
const oauthmock = extend({}, oauth, {
  validator: () => oauthspy
});
require.cache[require.resolve('abacus-oauth')].exports = oauthmock;



delete require.cache[require.resolve('..')];
const provisioning = require('..');
const server = provisioning().listen(0);

const postRequest = (planType, plan, verifyCb) => {
  request.post(
    'http://localhost::p/v1/:plan_type/plans', {
      p: server.address().port,
      plan_type: planType,
      body: plan
    }, (err, val) => {
      expect(err).to.equal(undefined);
      verifyCb(val);
    });
};

const meteringPlan = {
  plan_id: 'test',
  measures: [
    {
      name: 'classifiers',
      unit: 'INSTANCE'
    }
  ],
  metrics: [
    {
      name: 'classifier_instances',
      unit: 'INSTANCE',
      type: 'discrete',
      formula: 'AVG({classifier})'
    }
  ]
};

const pricingPlan = {
  plan_id: 'test-db-basic',
  metrics: [
    {
      name: 'classifier',
      prices: [
        {
          country: 'USA',
          price: 0.00015
        },
        {
          country: 'EUR',
          price: 0.00011
        },
        {
          country: 'CAN',
          price: 0.00016
        }]
    }
  ]
};

const ratingPlan = {
  plan_id: 'test',
  metrics: [
    {
      name: 'classifier',
      rate: ((price, qty) => new BigNumber(price || 0)
        .mul(qty).toNumber()).toString()
    }
  ]
};

const testPostOfPlan = (planType, plan, db) => {

  beforeEach((done) => {
    // Delete test dbs (plan and mappings) on the configured db server
    dbclient.drop(process.env.DB,
      /^abacus-rating-plan|^abacus-pricing-plan|^abacus-metering-plan/,
      done);
  });

  it(`validates creation of new ${planType} plan`, (done) => {
    postRequest(planType, plan, (val) => {
      expect(val.statusCode).to.equal(201);

      yieldable.functioncb(function *() {
        const planInDb = yield db.get(['k',
          plan.plan_id].join('/'));
        expect(omit(planInDb, 'id', '_id', '_rev')).to.deep.equal(plan);
      })((error) => {
        if(error)
          throw error;
        done();
      });
    });
  });

  it(`errors on create of already existing ${planType} plan`, (done) => {
    yieldable.functioncb(function *() {
      const id = ['k', plan.plan_id].join('/');
      yield db.put(extend({}, plan, {
        _id: id
      }));
    })((error) => {
      if(error)
        throw error;
      postRequest(planType, plan, (val) => {
        expect(val.statusCode).to.equal(409);
        done();
      });
    });
  });

  it(`validate post of empty ${planType} plan`, (done) => {
    postRequest(planType, {}, (val) => {
      expect(val.statusCode).to.equal(400);
      done();
    });
  });

};

describe('abacus-ext-provisioning-plugin plans creation metering',
  () => testPostOfPlan('metering', meteringPlan, meteringdb));
describe('abacus-ext-provisioning-plugin plans creation pricing',
  () => testPostOfPlan('pricing', pricingPlan, pricingdb));
describe('abacus-ext-provisioning-plugin plans creation metering',
  () => testPostOfPlan('rating', ratingPlan, ratingdb));
