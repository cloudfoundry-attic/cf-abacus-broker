'use strict';
require('./lib/index.js');
const auth = require('../lib/middleware/authMiddleware');
const authController = require('../lib/auth').authConfigCtrl;
const req = {
  isAuthenticated: () => {
    return true;
  }
};
const res = {};


let authSpy, next,accessTokenStub;
describe('lib', () => {
  describe('middleware', () => {
    describe('authmiddleware', () => {
      describe('should call authmiddleware', () => {
        beforeEach(() => {
          authStub.restore();
          authSpy = sinon.spy(auth, 'ensureAuthenticated');
          accessTokenStub = sinon.stub(authController,'checkAccessTokenExpired');
          next = sinon.stub();
        });
        afterEach(() => {
          authSpy.restore();
          accessTokenStub.restore();

        });
        it('should call next on authenticate', () => {
          auth.ensureAuthenticated(req, res, next);
          expect(authSpy.calledOnce).to.equal(true);
          expect(next.called).to.equal(true);
        });
      });
    });
  });
});
