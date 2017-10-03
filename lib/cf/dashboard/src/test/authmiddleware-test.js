'use strict';
/* eslint-disable max-len*/
require('./lib/index.js');
const auth = require('../middleware/authMiddleware');
const authController = require('../auth').authConfigCtrl;
const passport = require('passport');
const req = {
  isAuthenticated: () => {
    return true;
  }
};
const res = {};

describe('lib', () => {

  after(() => {
    delete require.cache[require.resolve('../middleware/authMiddleware')];
  });

  describe('middleware', () => {
    describe('authmiddleware', () => {
      describe('should call authmiddleware', () => {
        let authSpy, next, accessTokenStub;
        beforeEach(() => {
          authSpy = sinon.spy(auth, 'ensureAuthenticated');
          accessTokenStub = sinon.stub(authController, 'checkAccessTokenExpired');
          next = sinon.stub();
        });
        afterEach(() => {
          authSpy.restore();
          accessTokenStub.restore();

        });
        it('should call next on authenticate', (done) => {
          accessTokenStub.returns(false);
          auth.ensureAuthenticated(req, res, next);
          expect(authSpy.calledOnce).to.equal(true);
          expect(next.called).to.equal(true);
          done();
        });

        it('should render session expired on token expiry', (done) => {
          res.render = sinon.stub();
          accessTokenStub.returns(true);
          auth.ensureAuthenticated(req, res, next);
          expect(authSpy.calledOnce).to.equal(true);
          sinon.assert.calledWith(res.render, 'notfound', {
            message: 'Session expired. Refresh the page to continue'
          });
          done();
        });
      });
    });

    describe('authmiddleware unauthenticated', () => {
      let authSpy, passportSpy, next;
      beforeEach(() => {
        next = sinon.stub();
        authSpy = sinon.spy(auth, 'ensureAuthenticated');
        passportSpy = sinon.spy(passport, 'authenticate');
        req.originalUrl = 'http://demo';
        req.isAuthenticated = () => {
          return false;
        };
      });

      afterEach(() => {
        authSpy.restore();
        passportSpy.restore();
      });

      it('should call passport authenticated when not authorized', (done) => {
        auth.ensureAuthenticated(req, res, next);
        expect(authSpy.calledOnce).to.equal(true);
        expect(passportSpy.calledOnce).to.equal(true);
        sinon.assert.calledWith(passportSpy, 'oauth2', {
          successReturnToOrRedirect: req.originalUrl,
          callbackURL: req.originalUrl
        });
        done();
      });
    });
  });
});
