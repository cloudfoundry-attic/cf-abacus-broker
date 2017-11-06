'use strict';

// Minimal example implementation of an Abacus provisioning plugin.

const _ = require('underscore');
const extend = _.extend;
const omit = _.omit;

const request = require('abacus-request');
const cluster = require('abacus-cluster');
const dbclient = require('abacus-dbclient');
const urienv = require('abacus-urienv');
const yieldable = require('abacus-yieldable');
const partition = require('abacus-partition');

const jwt = require('jsonwebtoken');

// Configure test db URL prefix
process.env.DB = process.env.DB || 'test';

let provisioning;
let server;

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

const testPostOfPlan = (headers, planType, plan, db) => {

  beforeEach((done) => {
    dbclient.drop(process.env.DB,
      /^abacus-rating-plan|^abacus-pricing-plan|^abacus-metering-plan/,
      done);
  });

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

describe('When not secured', () => {

  before(() => {
    delete require.cache[require.resolve('..')];

    process.env.SECURED = false;

    provisioning = require('..');
    server = provisioning().listen(0);
  });

  context('abacus-ext-provisioning-plugin plans creation metering',
    () => testPostOfPlan({}, 'metering', meteringPlan, meteringdb));
  context('abacus-ext-provisioning-plugin plans creation pricing',
    () => testPostOfPlan({}, 'pricing', pricingPlan, pricingdb));
  context('abacus-ext-provisioning-plugin plans creation rating',
    () => testPostOfPlan({},'rating', ratingPlan, ratingdb));
});

describe('When secured', () => {

  const tokenSecret = 'secret';
  const tokenPayload = {
    jti: '254abca5-1c25-40c5-99d7-2cc641791517',
    sub: 'abacus-provisioning-plugin',
    authorities: [
      'abacus.usage.write'
    ],
    scope: [
      'abacus.usage.write'
    ],
    client_id: 'abacus-provisioning-plugin',
    cid: 'abacus-provisioning-plugin',
    azp: 'abacus-provisioning-plugin',
    grant_type: 'client_credentials',
    rev_sig: '2cf89595',
    iat: 1456147679,
    exp: 1456190879,
    iss: 'https://localhost:1234/oauth/token',
    zid: 'uaa',
    aud: [
      'abacus-provisioning-plugin',
      'abacus.usage'
    ]
  };

  const sign = (payload, secret) => {
    return jwt.sign(payload, secret, { expiresIn: 43200 });
  };

  const authorization = (signedToken) => {
    return 'bearer ' + signedToken;
  };

  before(() => {
    delete require.cache[require.resolve('..')];

    process.env.SECURED = true;
    process.env.JWTKEY = tokenSecret;
    process.env.JWTALGO = 'HS256';

    provisioning = require('..');
    server = provisioning().listen(0);
  });

  describe('abacus-ext-provisioning-plugin plans creation metering',
    () => testPostOfPlan({
      authorization: authorization(sign(tokenPayload, tokenSecret))
    }, 'metering', meteringPlan, meteringdb));
});


