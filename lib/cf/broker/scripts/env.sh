#!/bin/bash

export ABACUS_BROKER_ORG=SAP_abacus
export ABACUS_BROKER_SPACE=broker
export APP_NAME=abacus-ext-cf-broker

export CF_API=https://api.cf.landscape-dev-sof-qual-lss.sapcloud.io
export CF_SYS_DOMAIN=cf.landscape-dev-sof-qual-lss.sapcloud.io
export UAA_SERVER=https://uaa.cf.landscape-dev-sof-qual-lss.sapcloud.io
export PROVISIONING=https://abacus-provisioning-plugin.cfapps.landscape-dev-sof-qual-lss.sapcloud.io
export COLLECTOR=https://abacus-usage-collector.cfapps.landscape-dev-sof-qual-lss.sapcloud.io

export BROKER_PASSWORD=pass
export BROKER_USER=user

export CF_ADMIN_PASS=admin
export CF_ADMIN_USER=admin

export DASHBOARD_CLIENT_ID=dashboard-client-id
export DASHBOARD_CLIENT_SECRET=dashboard-secret
export DASHBOARD_REDIRECT_URL=https://dashboard/redirect

export ABACUS_ROOT=/Users/development/workspace/cf-abacus-broker
export ADDITIONAL_PACK_DIR=abacus/lib
