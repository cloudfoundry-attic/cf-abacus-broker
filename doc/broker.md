Abacus Broker
=============

## Overview
This is a Cloud Foundry service broker which provisions resource consumption service instances. This includes the creation of the needed abacus plans and uaa clients.

## Endpoints

### `GET /v2/catalog`

Returns the broker catalog that is located in the `lib/cf/broker/src/catalog/catalog.js` file. 

More information on the meaning of the fields can be found in the [official documentation](https://docs.cloudfoundry.org/services/api.html#catalog-mgmt).

### `PUT /v2/service_instances/:instance_id`

Creates a resource consumption service instance. This includes the creation of:
* metering plan
* pricing plan
* rating plan
* metering plan mapping
* pricing plan mapping
* rating plan mapping 

All newly crated plans will look like the sampled plans located in `lib/cf/broker/plans` with `instance_id` as plan_id.
The mappings will map *(resource_type, plan_name) -> plan_id* where resource_type and plan_id are `instance_id` and plan_name is `basic` by default.   

### `PATCH /v2/service_instances/:id`

This endpoint is not implemented.

### `PUT /v2/service_instances/:instance_id/service_bindings/:binding_id`

Binds a resource consumption service instance to an application. The broker will create a UAA Client and will propagate the following variables to the binded application environment:

```json
"credentials": {
  "client_id": "abacus-rp-<instance_id>",
  "client_secret": "<generated-password>",
  "collector_url": "https://abacus-usage-collector.<domain>",
  "dashboard_url": ""
}
```
The user/application will send its usage to the `collector_url` using the uaa client described with the `client_id` and `client_secret` fields, where `client_id` is based on the `instance_id` and `client_secret` is a generated password.
The `dashboard_url` is the place whare the user will be able to update the plan, associated with the service instance.

### `DELETE /v2/service_instances/:instance_id/service_bindings/:binding_id`
Unbinds a resource consumption service instance from an application. The broker will delete the UAA Client (described in the [binding endpoint](#put-v2service_instancesinstance_idservice_bindingsbinding_id)) and remove the environment variables, associated with the service from the application. 

### `DELETE /v2/service_instances/:instance_id`
Deletes a resource consumption service instance.

## How to deploy the broker
1. The following variables need to be changed in the [`manifest.yml`](https://github.com/cloudfoundry-incubator/cf-abacus-broker/blob/mappings/lib/cf/broker/manifest.yml) with the proper values.
    ```bash
        CF_API: https://api
        UAA_SERVER: https://uaa
        PROVISIONING: https://abacus-provisioning-plugin
        COLLECTOR: https://abacus-usage-collector
        BROKER_USER: user
        BROKER_PASSWORD: pass
    ```

1. Run the following commands:
    ```bash
    cd lib/cf/broker
    npm run cfpack
    npm run cfpush
    
    cf start abacus-ext-cf-broker
    cf create-service-broker abacus-ext-cf-broker $BROKER_USER $BROKER_PASSWORD https://abacus-ext-cf-broker.<domain>
    cf enable-service-access metering
    ```
    
    where `$BROKER_USER` and `$BROKER_PASSWORD` are defined in the [`manifest.yml`](https://github.com/cloudfoundry-incubator/cf-abacus-broker/blob/mappings/lib/cf/broker/manifest.yml) and `<domain>` is the landscape apps domain.

## How to use the broker
1. Run the following commands:
    ```bash
    cf create-service metering default <service_name>
    cf bind-service <application-name> <service_name>
    cf unbind-service <application-name> <service_name>
    cf delete-service metering default <service_name>
    ```
    
    where `<application_name>` is the name of your application and `<service-name>` is the name your serivce instance.