'use strict';

const _ = require('underscore');
const extend = _.extend;

const request = require('abacus-request');
const cluster = require('abacus-cluster');

const jwt = require('jsonwebtoken');

// Configure test db URL prefix
process.env.DB = process.env.DB || 'test';

// Mock the cluster module
require.cache[require.resolve('abacus-cluster')].exports =
  extend((app) => app, cluster);

describe('abacus-ext-provisioning-plugin updating', () => {
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
    mockDbClient();
  });

  beforeEach(() => {
    putToDbMock.reset();
  });

  after(() => {
    delete require.cache[require.resolve('abacus-dbclient')];
  });

  const requestPlan = (headers, resourceType, planId, requestBody,
    expectation) => {
    request.put('http://localhost::port/v1/:resource_type/plan/:plan_id', {
      port: server.address().port,
      resource_type: resourceType,
      plan_id: planId,
      body: requestBody,
      headers: headers
    }, function(err, response) {
      expectation(err, response);
    });
  };

  const expectStatusCodeOK = (err, response, dbDoc) => {
    expect(err).to.equal(undefined);
    expect(response.statusCode).to.equal(200);
    expect(getFromDbMock.callCount).to.equal(1);
    expect(putToDbMock.callCount).to.equal(1);
    assert.calledWith(putToDbMock, dbDoc);
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

  const testUpdatePlan = (planType, plan, headers = {}) => {

    const planDbDoc = extend({}, plan, {
      _id: `k/test-${planType}-plan`,
      _rev: 1
    });

    context(`${planType} plan`, () => {

      it('succeeds', (done) => {
        getFromDbMock = spy(function(id, cb) {
          return cb(undefined, planDbDoc);
        });

        requestPlan(headers, planType, plan.plan_id, plan,
          (err, response) => {
            expectStatusCodeOK(err, response, planDbDoc);
            done();
          });
      });

      it('fails with invalid request body', (done) => {
        getFromDbMock = spy(function(id, cb) {
          return cb(undefined, planDbDoc);
        });

        requestPlan(headers, planType, plan.plan_id, {},
          (err, response) => {
            expectStatusCodeBadRequest(err, response, planDbDoc);
            done();
          });
      });

      it('fails when plan does not exist', (done) => {
        getFromDbMock = spy(function(id, cb) {
          return cb(null, undefined);
        });

        requestPlan(headers, planType, 'non-existing-key', plan,
          (err, response) => {
            expectStatusCodeNotFound(err, response, planDbDoc);
            done();
          });
      });
    });
  };

  context('not secured', () => {

    before(() => {
      delete require.cache[require.resolve('..')];
      process.env.SECURED = false;
      const provisioning = require('..');
      server = provisioning().listen(0);
    });

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

  context('secured', () => {

    const tokenSecret = 'secret';

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

      const provisioning = require('..');
      server = provisioning().listen(0);
    });

    context('when system scope is provided', () => {

      const systemTokenPayload = {
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
      }, { authorization: authorization(sign(systemTokenPayload, tokenSecret)) }
      );

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
      }, { authorization: authorization(sign(systemTokenPayload, tokenSecret)) }
      );

      testUpdatePlan('rating', {
        plan_id: 'test-rating-plan',
        metrics: [{
          name: 'classifier_instances',
          rate: ((p,qty) => p ? p * qty : 0).toString(),
          charge: ((t,cost) => cost).toString()
        }]
      }, { authorization: authorization(sign(systemTokenPayload, tokenSecret)) }
      );

    });

    it('should fail to update plan when non system scope is provided',
      (done) => {
        const tokenPayload = {
          jti: '254abca5-1c25-40c5-99d7-2cc641791517',
          sub: 'abacus-provisioning-plugin',
          authorities: [
            'abacus.usage.dummy.write'
          ],
          scope: [
            'abacus.usage.dummy.write'
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

        const headers =
          { authorization: authorization(sign(tokenPayload, tokenSecret)) };
        requestPlan(headers, 'metering', 'dummy_id', {}, (err, response) => {
          expect(response.statusCode).to.equal(403);
          done();
        });
      });
  });

});
