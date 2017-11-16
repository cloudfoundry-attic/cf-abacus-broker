'use strict';

const exec = require('../index.js').execute;

describe('cmdline-exec-utility', () => {
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    sandbox.spy(console, 'log');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('executes command that writes in stdout' + 
  ' (command is included in stdout)', () => {
    let result = exec('ls -l');
    expect(result !== null);
    expect(console.log.calledOnce).to.be.equal(true);
  });

  it('executes command that writes in stdout' +
  ' (command is not included in stdout)', () => {
    let result = exec('ls -l', false);
    expect(result !== null);
    expect(console.log.calledOnce).to.be.equal(false);
  });

  it('executes command that writes in stderr' + 
  ' (command is included in stdout)', () => {
    try {
      exec('ls foo');
      expect(true).to.be(false);
      xpect(console.log.calledOnce).to.be.equal(true);
    }
    catch (e) {
      console.log('--> ', e.stderr.toString());
    }
  });
});
