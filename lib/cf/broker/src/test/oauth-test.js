'use strict';

// Mock the oauth module
require('abacus-oauth');
let i = 0;
const oauthCacheSpy = spy(() => () => ++i);
require.cache[require.resolve('abacus-oauth')].exports.cache = oauthCacheSpy;
require.cache[require.resolve('abacus-oauth')].exports.start = (cb) => cb();

const config = require('../config.js');

let oauth;

describe('OAuth helper', () => {
  before(() => {
    process.env.SERVICE_BROKER_CLIENT_ID = 'id';
    process.env.SERVICE_BROKER_CLIENT_SECRET = 'secret';
    oauth = require('../auth/oauth.js');
  });

  it('uses the correct url, credentials and scope', () => {
    expect(oauthCacheSpy.callCount).to.equal(1);
    assert.calledWith(oauthCacheSpy,
      config.uris().api, 'id', 'secret',
      'clients.write clients.admin'
    );
  });

  it('returns a token on each request', () => {
    expect(oauth.authHeader()).to.deep.equal({
      authorization: 1
    });
    expect(oauth.authHeader()).to.deep.equal({
      authorization: 2
    });
  });
});
