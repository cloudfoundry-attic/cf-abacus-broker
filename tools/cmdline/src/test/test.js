'use strict';

const exec = require('../index.js').execute;

describe('cmdline-exec-utility', () => {
  it('executes commmad that writes in stdout', () => {
    let result = exec('ls -l');
    expect(result !== null);
  });

  it('executes commmad that writes in stderr', () => {
    try {
      exec('ls foo');
      expect(true).to.be(false);
    }
    catch (e) {
      console.log('--> ', e.stderr.toString());
    }
  });
});
