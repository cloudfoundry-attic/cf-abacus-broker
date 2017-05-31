'use strict';

const _ = require('underscore');
const extend = _.extend;
const abacusOauth = require('abacus-oauth');

let oauth = require('../auth/oauth.js');

// Mock abacus-debug
const loggerSpy = spy((arg) => arg);
require.cache[require.resolve('abacus-debug')].exports = spy(() => loggerSpy);

describe('Oauth', () => {
  context('when reading credentials from the environment', () => {
    it('should not fail when they are not set', () => {
      delete process.env.SERVICE_BROKER_CLIENT_ID;
      delete process.env.SERVICE_BROKER_CLIENT_SECRET;
      expect(oauth.init).to.not.throw(Error);
    });
  });

  context('when credentials are valid', () => {
    const sampleToken = 'Bearer AAA';

    const mockAbacusOauth = (cacheResult, cacheStartCallbackResult) => {
      const abacusOauthCacheSpy = spy(() => cacheResult);
      abacusOauthCacheSpy.start = spy((cb) => cb(cacheStartCallbackResult));
      const abacusOauthMock = extend({}, abacusOauth, {
        cache: () => abacusOauthCacheSpy
      });
      require.cache[require.resolve('abacus-oauth')].exports = abacusOauthMock;
      // reload oauth module to resolve the mock
      delete require.cache[require.resolve('../auth/oauth.js')];
      oauth = require('../auth/oauth.js');
      return abacusOauthCacheSpy;
    };

    beforeEach(() => {
      process.env.SERVICE_BROKER_CLIENT_ID = 'valid';
      process.env.SERVICE_BROKER_CLIENT_SECRET = 'secret';
    });

    it('should return an authorization header', () => {
      const abacusOauthSpy = mockAbacusOauth(sampleToken, undefined);

      oauth.init(() => {
        expect(oauth.authHeader())
          .to.deep.equal({ authorization: sampleToken });
        expect(abacusOauthSpy.called).to.equal(true);
        expect(abacusOauthSpy.start.called).to.equal(true);
        expect(loggerSpy.calledWithMatch('Successfully fetched'));
      });
    });

    it('should return a token on each request', () => {
      const abacusOauthSpy = mockAbacusOauth(sampleToken, undefined);

      for (let callCount of [1, 2]) {
        expect(oauth.authHeader())
          .to.deep.equal({ authorization: sampleToken });
        expect(abacusOauthSpy.callCount).to.equal(callCount);
      }
    });

    it('should not fetch token in case of error', () => {
      const abacusOauthSpy = mockAbacusOauth(undefined, 'some error');
    
      oauth.init(() => {
        expect(oauth.authHeader()).to.be.equal(undefined);
        expect(abacusOauthSpy.start.called).to.equal(true);
      });
    });
  });
});
