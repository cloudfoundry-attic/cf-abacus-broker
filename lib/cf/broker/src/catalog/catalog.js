'use strict';

const prefix = (id) => {
  return process.env.ABACUS_PREFIX ? process.env.ABACUS_PREFIX + id : id;
};

module.exports = {
  services: [
    {
      id: prefix('metering'),
      description: 'Resource consumption service based on cf-abacus',
      name: prefix('metering'),
      tags: [
        'abacus',
        'resource provider'
      ],
      bindable: true,
      plan_updateable: false,
      plans: [
        {
          id: prefix('abacus-default-ad42edc567aa'),
          description: 'Default plan',
          name: 'standard'
        }
      ],
      dashboard_client: {
        id: prefix(process.env.DASHBOARD_CLIENT_ID),
        secret: process.env.DASHBOARD_CLIENT_SECRET,
        redirect_uri: process.env.DASHBOARD_REDIRECT_URI
      }
    }
  ]
};
