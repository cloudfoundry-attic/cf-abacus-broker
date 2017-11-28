const config = require('../config');
require('abacus-dbclient');
require.cache[require.resolve('abacus-dbclient')].exports = {
  dbcons: (url, {}, cb) => {
    cb(null, url);
  }
};

let storeStub = sinon.stub();
const store = (connect) => {
  class MongoStore {
    constructor(options) {
      return storeStub(options);
    }
  }
  return MongoStore;
};
require('connect-mongo');
require.cache[require.resolve('connect-mongo')].exports = store;
require('abacus-couchstore');
require.cache[require.resolve('abacus-couchstore')].exports = store;

const dbController = require('../db').dbController;


describe('db controller', () => {
  let isMongoStub = sinon.stub(dbController, 'isMongoClient');
  let configUrisStub = null;
  before(() => {
    configUrisStub = sinon.stub(config, 'uris');
  });

  after(() => {
    configUrisStub.restore();
    delete require.cache[require.resolve('abacus-dbclient')];
  });

  it('calls getDBUri with url', (done) => {
    configUrisStub.returns({
      db: 'testdb'
    });
    const test = dbController.getDBUri();
    expect(test).to.equal('testdb');
    done();
  });

  // test if in production
  it('calls connectToDB with  array url', (done) => {
    configUrisStub.returns({
      db: ['testdb']
    });
    const test = dbController.getDBUri();
    expect(test).to.equal('testdb');
    done();
  });

  it('use mongo-store for mongoclient', (done) => {
    isMongoStub.returns(true);
    dbController.getSessionStore();
    sinon.assert.calledWith(storeStub, {
      autoRemove: 'interval',
      autoRemoveInterval: 10,
      collection: 'abacus-service-dashboard',
      dbPromise: dbController.getDbHandle()
    });
    done();
  });

  it('use couch-store for couchclient', (done) => {
    isMongoStub.returns(false);
    dbController.getSessionStore();
    sinon.assert.calledWith(storeStub, { autoRemoveInterval: 600000,
      dbName: 'abacus-service-dashboard',
      dbUri: 'testdb' });
    done();
  });
});
