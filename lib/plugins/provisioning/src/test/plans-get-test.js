'use strict';

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

const generateMeteringPlan = (suffix) => {
  return {
    plan_id: 'test',
    measures: [
      {
        name: `classifiers${suffix}`,
        unit: `INSTANCE${suffix}`
      }
    ],
    metrics: [
      {
        name: `classifier_instances${suffix}`,
        unit: `INSTANCE${suffix}`,
        type: 'discrete',
        formula: 'AVG({classifier})'
      }
    ]
  };
};

const generatePricingPlan = (suffix) => {
  return {
    plan_id: 'test-db-basic',
    metrics: [
      {
        name: `classifier${suffix}`,
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
};

const generateRatingPlan = (suffix) => {
  return {
    plan_id: 'test',
    metrics: [
      {
        name: `classifier${suffix}`,
        rate: ((price, qty) => new BigNumber(price || 0)
          .mul(qty).toNumber()).toString()
      }
    ]
  };
};

const insertPlanInDB = (plan, db, cb) => {
  yieldable.functioncb(function *() {
    const id = ['k', plan.plan_id].join('/');
    yield db.put(extend({}, plan, {
      _id: id
    }));
  })((error) => {
    if(error)
      throw error;
    cb();
  });
};

const updatePlanInDB = (plan, db, cb) => {
  yieldable.functioncb(function *() {
    const id = ['k', plan.plan_id].join('/');
    const doc = yield db.get(id);

    yield db.put(extend({}, plan, {
      _id: id,
      _rev: doc._rev
    }));
  })((error) => {
    if(error)
      throw error;
    cb();
  });
};

const getRequest = (planType, planId, headers, verifyCb) => {
  request.get(
       'http://localhost::p/v1/:plan_type/plans/:plan_id', {
         p: server.address().port,
         plan_id: planId,
         plan_type: planType,
         headers: headers
       }, (err, val) => {
         expect(err).to.equal(undefined);
         verifyCb(val);
       });
};

const testGetOfPlan = (planType, planGenerator, db) => {
  context(`When ${planType} plan is in DB`, () => {

    const noCache = { 'cache-control': 'no-cache' };
    const useCache = {};

    const originalPlan = planGenerator('-original');
    const updatedPlan = planGenerator('-updated');

    before((done) => {
      insertPlanInDB(originalPlan, db, done);
    });

    it('it should return the plan', (done) => {
      getRequest(planType, originalPlan.plan_id, useCache, (val) => {
        expect(val.statusCode).to.equal(200);
        expect(omit(val.body, 'id')).to.deep.equal(originalPlan);
        done();
      });
    });

    context('when plan changed, verify', () => {

      before((done) => {
        updatePlanInDB(updatedPlan, db, done);
      });

      it('read from cache', (done) => {
        getRequest(planType, originalPlan.plan_id, useCache, (val) => {
          expect(val.statusCode).to.equal(200);
          expect(omit(val.body, 'id')).to.deep.equal(originalPlan);
          done();
        });
      });

      it('read with no cache', (done) => {
        getRequest(planType, originalPlan.plan_id, noCache, (val) => {
          expect(val.statusCode).to.equal(200);
          expect(omit(val.body, 'id')).to.deep.equal(updatedPlan);
          done();
        });
      });
    });
  });
};

describe('abacus-ext-provisioning-plugin plans get metering',
  () => testGetOfPlan('metering', generateMeteringPlan, meteringdb));

describe('abacus-ext-provisioning-plugin plans get pricing',
  () => testGetOfPlan('pricing', generatePricingPlan, pricingdb));

describe('abacus-ext-provisioning-plugin plans get rating',
  () => testGetOfPlan('rating', generateRatingPlan, ratingdb));
