# Architecture

![architecture](architecture.png)

# Roles

We can define two different roles for resource providers:

## Developer
* creates service instance
* binds service instance to Resource Provider
* modifies usage plans
* (code) submits usage
* unbinds service instance
* deletes service instance

## Operator
* deploys Resource Provider
* creates service instance
* binds service instance to Resource Provider
* uploads usage plans

# Flows

The Abacus Broker supports the following flows:

## Provision Resource Provider
0. Create service instance

   The name of the service instance is used as `resource_id`. The resource id is used in Abacus. This id is global in CF installation/landscape, therefore it is important to be unique.
   
0. Create UAA client
   
   The UAA client is created with:
   * id `abacus-<resource_id>`
   * scopes: `abacus.usage.<resource_id>.read` and `abacus.usage.<resource_id>.write`
   
   The client is used as a way to guarantee unique resource id.

0. Create plan(s)

   The plan id is equal to the service instance id. This provides the ability to discover plan ids.
   
0. Access dashboard

   The broker returns dashboard URL pointing to the UI and containing the service instance ID. For this to work we use a dashboard client, whose credentials are shared between broker and UI.

## Edit plan
0. Open dashboard
0. Find all resource providers

   The dashboard does plan discovery by looking up all services created with Abacus broker.

0. Open plan(s) for resource provider
   
   Since the service instance id is also the plan id we can directly reach Abacus to fetch the plan and display/edit it.

## De-provision Resource Provider
0. Delete service instance
0. Delete UAA client
0. Mark plans as deleted

   The plans are not deleted, since Abacus can recieve usage several days after the month ended (depends on `SLACK` setting). The plans are simply marked to be deleted. We can delete the marked-for-deletion plans together with the data after a certain period (usually after 3 to 6 months).

Re-create of resource provider with the same `resource_id` (same service instance name) is available since the UAA client was deleted and the plans would have a new id.
