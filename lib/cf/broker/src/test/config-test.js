'use strict';

let config = require('../config.js');

describe('Config', () => {
  it('should set a prefix to a parameter specified', () => {
    const id = '123';
    expect(config.prefixWithResourceProvider(id))
      .to.equal(`${config.defaultResourceProviderPrefix}${id}`);
  });

  it('should return the prefix when there is no parameter specified', () => {
    expect(config.prefixWithResourceProvider())
      .to.equal(config.defaultResourceProviderPrefix);
  });

  context('knows about usage collector path', () => {
    beforeEach(() => {
      delete process.env.USAGE_COLLECTOR_PATH;
      delete require.cache[require.resolve('../config.js')];
    });

    it('should read it form the environment', () => {
      const path = '/some/path';
      process.env.USAGE_COLLECTOR_PATH = path;
      config = require('../config.js');
      expect(config.usageCollectorPath).to.equal(path);
    });

    it('should return default when no varaible is exported',() => {
      config = require('../config.js');
      expect(config.usageCollectorPath)
        .to.equal(config.defaultUsageCollectorPath);
    });
  });
});
