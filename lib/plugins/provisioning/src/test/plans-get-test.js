'use strict';

const _ = require('underscore');
const extend = _.extend;

const request = require('abacus-request');
const cluster = require('abacus-cluster');
const dbclient = require('abacus-dbclient');
const urienv = require('abacus-urienv');
const yieldable = require('abacus-yieldable');
const partition = require('abacus-partition');

const jwt = require('jsonwebtoken');

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

let provisioning;
let server;

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

const testGetOfPlan = (planType, planGenerator, db, authHeader = {}) => {
  context(`when ${planType} plan is in DB`, () => {

    const noCache = { 'cache-control': 'no-cache' };
    const useCache = {};

    const originalPlan = planGenerator('-original');
    const updatedPlan = planGenerator('-updated');

    before((done) => {
      insertPlanInDB(originalPlan, db, done);
    });

    it('returns the plan', (done) => {
      const headers = extend({}, useCache, authHeader);
      getRequest(planType, originalPlan.plan_id, headers, (val) => {
        expect(val.statusCode).to.equal(200);
        expect(val.body).to.deep.equal(originalPlan);
        done();
      });
    });

    context('when plan changed, verify', () => {
      before((done) => {
        updatePlanInDB(updatedPlan, db, done);
      });

      it('read from cache', (done) => {
        const headers = extend({}, useCache, authHeader);
        getRequest(planType, originalPlan.plan_id, headers, (val) => {
          expect(val.statusCode).to.equal(200);
          expect(val.body).to.deep.equal(originalPlan);
          done();
        });
      });

      it('read with no cache', (done) => {
        const headers = extend({}, noCache, authHeader);
        getRequest(planType, originalPlan.plan_id, headers, (val) => {
          expect(val.statusCode).to.equal(200);
          expect(val.body).to.deep.equal(updatedPlan);
          done();
        });
      });
    });
  });
};

const dropDbs = (done) => dbclient.drop(process.env.DB,
  /^abacus-rating-plan|^abacus-pricing-plan|^abacus-metering-plan/,
  done);

describe('When not secured', () => {

  before((done) => {
    delete require.cache[require.resolve('..')];

    process.env.SECURED = false;

    provisioning = require('..');
    server = provisioning().listen(0);

    dropDbs(done);
  });

  context('abacus-ext-provisioning-plugin plans get metering',
    () => testGetOfPlan('metering', generateMeteringPlan, meteringdb));

  context('abacus-ext-provisioning-plugin plans get pricing',
    () => testGetOfPlan('pricing', generatePricingPlan, pricingdb));

  context('abacus-ext-provisioning-plugin plans get rating',
    () => testGetOfPlan('rating', generateRatingPlan, ratingdb));
});

describe('When secured', () => {

  const tokenSecret = 'secret';
  const systemTokenPayload = {
    jti: '254abca5-1c25-40c5-99d7-2cc641791517',
    sub: 'abacus-provisioning-plugin',
    authorities: [
      'abacus.usage.read'
    ],
    scope: [
      'abacus.usage.read'
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

  before((done) => {
    delete require.cache[require.resolve('..')];

    process.env.SECURED = true;
    process.env.JWTKEY = tokenSecret;
    process.env.JWTALGO = 'HS256';

    provisioning = require('..');
    server = provisioning().listen(0);

    dropDbs(done);
  });

  context('with system scope abacus-ext-provisioning-plugin get metering plan',
    () => testGetOfPlan('metering', generateMeteringPlan, meteringdb,
      { authorization: authorization(sign(systemTokenPayload, tokenSecret)) }));

  context('with system scope abacus-ext-provisioning-plugin get pricing plan',
    () => testGetOfPlan('pricing', generatePricingPlan, pricingdb,
      { authorization: authorization(sign(systemTokenPayload, tokenSecret)) }));

  context('with system scope abacus-ext-provisioning-plugin get rating plan',
    () => testGetOfPlan('rating', generateRatingPlan, ratingdb,
      { authorization: authorization(sign(systemTokenPayload, tokenSecret)) }));

  it('should fails to get plan when non system scope is provided', (done) => {

    const tokenPayload = {
      jti: '254abca5-1c25-40c5-99d7-2cc641791517',
      sub: 'abacus-provisioning-plugin',
      authorities: [
        'abacus.usage.dummy.read'
      ],
      scope: [
        'abacus.usage.dummy.read'
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

    getRequest('metering', 'dummyPlanId',
      { authorization: authorization(sign(tokenPayload, tokenSecret)) },
      (val) => {
        expect(val.statusCode).to.equal(403);
        done();
      });
  });
});

