## Abacus Service Dashboard
Abacus provides usage metering and aggregation for Cloud Foundry (CF) services. Refer the [documentation](https://github.com/cloudfoundry-incubator/cf-abacus/wiki) for an overview on Abacus and familiarize yourself with the required concepts. Like other CF Services, you can find the Abacus service in the Service Marketplace. To use the Abacus Service dashboard, you need to create an instance of the Abacus service and bind the resource provider application to the instance. The service provides the user interface - Service dashboard - to define and manage the resource provider plans.


## Features
The Abacus Service dashboard offers the following features:
* Displays metering plan associated with a resource provider and allows you to update plan.
* Define and maintain new [Measures](https://github.com/cloudfoundry-incubator/cf-abacus/wiki/Measures) and [Metrics](https://github.com/cloudfoundry-incubator/cf-abacus/wiki/Metrics)
* Maintain the required functions - [meter](https://github.com/cloudfoundry-incubator/cf-abacus/wiki/Functions#meter), [accumulate](https://github.com/cloudfoundry-incubator/cf-abacus/wiki/Functions#accumulate), [aggregate](https://github.com/cloudfoundry-incubator/cf-abacus/wiki/Functions#aggregate) and [summarize](https://github.com/cloudfoundry-incubator/cf-abacus/wiki/Functions#summarize) - for the Metric


## How to use the service dashboard
Follow the steps  below to access the dashboard:
1. Log on to CF CLI.
2. Use following command to get CF marketplace.

   `cf marketplace`

3. Create a new instance of the Abacus service and bind the resource provider application.

   ```
   cf create-service <abacus-service-name> <abacus-service-plan-name>  <service-instance-name>
   cf bind-service <resource-provider-app> <service-instance-name>
   ```
   __Note:__ To use the service dashboard it is important to bind the application to the Abacus service instance.

4. Get the dashboard URL from CLI using following command.
   ```
   cf service <service-instance-name>
   ```
5. Log on using dashboard url. The dashboard shows the metering plan for the resource provider application that is bound to the service instance. The metering plan has a sample Measure and a sample Metric.
6. Navigate to the metering plan to maintain the Measures and Metrics of the metering plan.
7. On the Measures tab, the application developer can add/edit/delete the Measures for the metering plan.
8. On the Metrics tab, the application developer can add/edit/delete the Metrics for the metering plan.
9. Navigate to a metric to maintain the details of the metric and its relevant functions - meter, accumulate, aggregate and summarize

## How to deploy service dashboard
[__Note:__ This section is relevant only for the operations team and not for the application developers implementing resource provider]
1. Change the [manifest.yml](https://github.com/cloudfoundry-incubator/cf-abacus-broker/blob/master/lib/cf/dashboard/manifest.yml) with appropriate values.

   * **API** Cloudfoundry API endpoint
   * **AUTH_SERVER** Authorization server endpoint
   * **CF_CLIENT_ID** Dashboard Client ID
   * **CF_CLIENT_SECRET** Dashboard Client Secret
   * **CF_COOKIE_SECRET** Cookie Secret
   * **PROVISIONING** Provisioning endpoint


```
API: https://api
AUTH_SERVER: https://uaa
CF_CLIENT_ID: abacus_db_client
CF_CLIENT_SECRET: secret
CF_COOKIE_SECRET: secret
PROVISIONING: abacus-provisioning-plugin
```
2. UAA Client Definition
```
scope: openid,cloud_controller_service_permissions.read,cloud_controller.read,abacus.usage.read,abacus.usage.write
authorities: abacus.usage.read,abacus.usage.write,uaa.none
authorized_grant_types: authorization_code,refresh_token
redirect_uri: https://abacus-service-dashboard.<APPLICATION_DOMAIN>/manage/instances/*
```

3. Run the following commands
```
cd lib/cf/dashboard
npm run cfpack
npm run cfpush
```
__Note: We recommend to use a Linux-based Operating System for deployment__
