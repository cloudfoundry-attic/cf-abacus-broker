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

  it('should generate correct plan_id', () => {
    const testInstanceId = 'instance_id';
    const testPlanId = 'plan_id';
    expect(config.generatePlanId(testInstanceId, testPlanId)).to.be
      .equal(`${testInstanceId}-${testPlanId}`);
  });

  beforeEach(() => {
    delete require.cache[require.resolve('../config.js')];
  });

  context('knows about usage collector path', () => {
    beforeEach(() => {
      delete process.env.USAGE_COLLECTOR_PATH;
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

  context('knows about dashboard uri', () => {
    beforeEach(() => {
      delete process.env.DASHBOARD_URI;
    });

    const requireConfig = (dashboardUri) => {
      process.env.DASHBOARD_URI = dashboardUri;
      config = require('../config.js');
    };

    it('should just read it form the environment', () => {
      const dashboardUrl = 'http://dashboard.com/some/';
      requireConfig(dashboardUrl);
      expect(config.dashboardUrl()).to.equal(dashboardUrl);
    });

    it('should read it form the environment and append trailing slash', () => {
      const dashboardUrl = 'http://dashboard.com/some';
      requireConfig(dashboardUrl);
      expect(config.dashboardUrl()).to.equal(dashboardUrl + '/');
    });

    it('should return just a slash when there is no variable exported',() => {
      config = require('../config.js');
      expect(config.dashboardUrl()).to.equal('/');
    });

    it('should append instanceId when passed',() => {
      const instanceId = 'a123e';
      const dashboardUrl = 'http://dashboard.com/some/';
      requireConfig(dashboardUrl);
      expect(config.dashboardUrl(instanceId))
        .to.equal(dashboardUrl + instanceId);
    });
  });
});
