'use strict';

// Minimal example implementation of an Abacus provisioning plugin.

const _ = require('underscore');
const extend = _.extend;

// Configure test db URL prefix
process.env.DB = process.env.DB || 'test';

const cluster = require('abacus-cluster');
const dbclient = require('abacus-dbclient');
const oauth = require('abacus-oauth');
const request = require('abacus-request');
const mappings = require('abacus-plan-mappings');

// Mock the cluster module
require.cache[require.resolve('abacus-cluster')].exports =
  extend((app) => app, cluster);

// Mock the oauth module with a spy
const oauthspy = spy((req, res, next) => next());
const oauthmock = extend({}, oauth, {
  validator: () => oauthspy
});
require.cache[require.resolve('abacus-oauth')].exports = oauthmock;

describe('abacus-ext-provisioning-plugin mappings', () => {
  let provisioning;

  before((done) => {
    delete require.cache[require.resolve('..')];
    provisioning = require('..');

    // Delete test dbs (plan and mappings) on the configured db server
    dbclient.drop(process.env.DB,
      /^abacus-rating-plan|^abacus-pricing-plan|^abacus-metering-plan/,
      done);
  });

  context('manages mappings', () => {
    let port;

    const readMapping = (mappingType, resourceType,
      planName, expectedPlanId, done) => {
      request.get(
        'http://localhost::p/v1/provisioning/mappings/:mapping_type/' +
        'resources/:resource_type/plans/:plan_name', {
          p: port,
          mapping_type: mappingType,
          resource_type: resourceType,
          plan_name: planName
        }, (err, val) => {
          expect(err).to.equal(undefined);
          expect(val.statusCode).to.equal(200);
          expect(val.body).to.deep.equal({ plan_id: expectedPlanId });
          done();
        });
    };

    const createMapping = (mappingType, expectedPlanId, done) => {
      request.post(
        'http://localhost::p/v1/provisioning/mappings/:mapping_type/' +
        'resources/:resource_type/plans/:plan_name/:plan_id', {
          p: port,
          mapping_type: mappingType,
          resource_type: 'object-storage',
          plan_name: 'default',
          plan_id: 'basic-object-storage'
        }, (err, val) => {
          expect(err).to.equal(undefined);
          expect(val.statusCode).to.equal(200);
          readMapping(mappingType, 'object-storage', 'default',
            expectedPlanId, done);
        });
    };

    context('creates', () => {
      beforeEach(() => {
        // Create a test provisioning app
        const app = provisioning();

        // Listen on an ephemeral port
        const server = app.listen(0);
        port = server.address().port;
      });

      it('metering mapping', (done) => {
        createMapping('metering', 'basic-object-storage', done);
      });

      it('rating mapping', (done) => {
        createMapping('rating', 'basic-object-storage', done);
      });

      it('pricing mapping', (done) => {
        createMapping('pricing', 'basic-object-storage', done);
      });
    });

    context('pre-defined', () => {
      before((done) => {
        mappings.storeDefaultMappings(() => {

          // Create a test provisioning app and *wait* for it
          const app = provisioning();

          // Listen on an ephemeral port
          const server = app.listen(0);
          port = server.address().port;

          done();
        });
      });

      it('stores metering mappings', (done) => {
        readMapping('metering', 'object-storage',
          'basic', 'basic-object-storage', done);
      });

      it('stores rating mappings', (done) => {
        readMapping('rating', 'object-storage',
          'basic', 'object-rating-plan', done);
      });

      it('stores pricing mappings', (done) => {
        readMapping('pricing', 'object-storage',
          'basic', 'object-pricing-basic', done);
      });
    });
  });

});

