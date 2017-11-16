'use strict';

const _ = require('underscore');
const extend = _.extend;
const omit = _.omit;

const request = require('abacus-request');
const cluster = require('abacus-cluster');
const dbclient = require('abacus-dbclient');
const urienv = require('abacus-urienv');
const yieldable = require('abacus-yieldable');
const partition = require('abacus-partition');
const utils = require('./utils.js');

process.env.DB = process.env.DB || 'test';

let provisioning;
let server;

const uris = urienv({
  db: 5984
});

let meteringdb;
let pricingdb;
let ratingdb;

require.cache[require.resolve('abacus-cluster')].exports =
  extend((app) => app, cluster);

const setupDbConnections = () => {
  meteringdb = yieldable(dbclient(partition.singleton,
    dbclient.dburi(uris.db, 'abacus-metering-plans')));
  pricingdb = yieldable(dbclient(partition.singleton,
    dbclient.dburi(uris.db, 'abacus-pricing-plans')));
  ratingdb = yieldable(dbclient(partition.singleton,
    dbclient.dburi(uris.db, 'abacus-rating-plans')));
};

const startProvisioning = () => {
  delete require.cache[require.resolve('..')];
  delete require.cache[require.resolve('../lib/plan-db.js')];

  provisioning = require('..');
  server = provisioning().listen(0);
};

const postRequest = (headers, planType, plan, verifyCb) => {
  request.post(
    'http://localhost::p/v1/:plan_type/plans', {
      p: server.address().port,
      plan_type: planType,
      body: plan,
      headers: headers
    }, (err, val) => {
      expect(err).to.equal(undefined);
      verifyCb(val);
    });
};

const meteringPlan = {
  plan_id: 'test-metering-plan-id',
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
  plan_id: 'test-pricing-plan-id',
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
  plan_id: 'test-rating-plan-id',
  metrics: [
    {
      name: 'classifier',
      rate: ((price, qty) => new BigNumber(price || 0)
        .mul(qty).toNumber()).toString()
    }
  ]
};

const testUnauthorizedPostOfPlan = (headers, planType, plan) => {
  it(`should returns Unauthorized when creating of new ${planType} plan`,
    (done) => {
      postRequest(headers, planType, plan, (val) => {
        expect(val.statusCode).to.equal(403);
        done();
      });
    });
};

const testPostOfPlan = (headers, planType, plan, db) => {

  it(`validates creation of new ${planType} plan`, (done) => {
    postRequest(headers, planType, plan, (val) => {
      expect(val.statusCode).to.equal(201);

      yieldable.functioncb(function *() {
        const planInDb = yield db.get(['k', plan.plan_id].join('/'));
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
      yield db.put(extend({}, plan, { _id: id }));
    })((error) => {
      if(error)
        throw error;
      postRequest(headers, planType, plan, (val) => {
        expect(val.statusCode).to.equal(409);
        done();
      });
    });
  });

  it(`validate post of empty ${planType} plan`, (done) => {
    postRequest(headers, planType, {}, (val) => {
      expect(val.statusCode).to.equal(400);
      done();
    });
  });

};

describe('Test plans', () => {

  beforeEach((done) => {
    dbclient.drop(process.env.DB,
      /^abacus-rating-plan|^abacus-pricing-plan|^abacus-metering-plan/,
      done);
  });

  context('when not secured', () => {

    setupDbConnections();

    before(() => {
      process.env.SECURED = false;

      startProvisioning();
    });

    context('abacus-ext-provisioning-plugin create metering plan',
      () => testPostOfPlan({}, 'metering', meteringPlan, meteringdb));

    context('abacus-ext-provisioning-plugin create pricing plan',
      () => testPostOfPlan({}, 'pricing', pricingPlan, pricingdb));

    context('abacus-ext-provisioning-plugin create rating plan',
      () => testPostOfPlan({}, 'rating', ratingPlan, ratingdb));

  });

  context('when secured', () => {

    setupDbConnections();

    before(() => {
      process.env.SECURED = true;
      process.env.JWTKEY = utils.TOKEN_SECRET;
      process.env.JWTALGO = 'HS256';

      startProvisioning();
    });

    context('and system scope is provided', () => {

      context('abacus-ext-provisioning-plugin create metering plan',
        () => testPostOfPlan(utils.getSystemWriteAuthorization(), 'metering',
          meteringPlan, meteringdb));

      context('abacus-ext-provisioning-plugin create pricing plan',
        () => testPostOfPlan(utils.getSystemWriteAuthorization(), 'pricing',
          pricingPlan, pricingdb));

      context('abacus-ext-provisioning-plugin create rating plan',
        () => testPostOfPlan(utils.getSystemWriteAuthorization(), 'rating',
          ratingPlan, ratingdb));

    });

    context('and system scope is not provided', () => {

      context('metering plan',
        () => testUnauthorizedPostOfPlan(utils.getDummyWriteAuthorization(),
          'metering', meteringPlan));

    });

  });

});
