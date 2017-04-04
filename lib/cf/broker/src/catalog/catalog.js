'use strict';

module.exports = {
  services: [
    {
      id: 'abacus_service_broker',
      description: 'Abacus Plan Provisioning',
      name: 'abacus_plan_provisioning',
      tags: [
        'abacus',
        'resource provider'
      ],
      bindable: true,
      plan_updateable: false,
      plans: [
        {
          id: 'abacus-default-ad42edc567aa',
          description: 'Default plan',
          name: 'default'
        }
      ],
      dashboard_client: {
        id: process.env.DASHBOARD_CLIENT_ID,
        secret: process.env.DASHBOARD_CLIENT_SECRET,
        redirect_uri: process.env.DASHBOARD_REDIRECT_URL
      }
    }
  ]
};
