'use strict';
require('./lib/index.js');
const auth = require('../../lib/middleware/authmiddleware');
const req = {
  isAuthenticated: () => {
    return true;
  }
};
const res = {};


let authSpy, next;
describe('lib', () => {
  describe('middleware', () => {
    describe('authmiddleware', () => {
      describe('get service bindings call', () => {
        beforeEach(() => {
          authStub.restore();
          authSpy = sinon.spy(auth, 'ensureAuthenticated');
          next = sinon.stub();
        });
        afterEach(() => {
          authSpy.restore();
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
