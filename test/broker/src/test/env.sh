#!/bin/bash

export CF_API="https://api.cf.landscape-dev-sof-qual-lss.sapcloud.io"
export CF_ADMIN_USER="admin"
export CF_ADMIN_PASSWORD="admin"
export CF_ORG="i324939-SAP_abacus"
export CF_SPACE="smoke-test"
export APPS_DOMAIN="cfapps.landscape-dev-sof-qual-lss.sapcloud.io"
export COLLECTOR_URL="https://i324939-abacus-usage-collector.cfapps.landscape-dev-sof-qual-lss.sapcloud.io"
export REPORTING_URL="https://i324939-abacus-usage-reporting.cfapps.landscape-dev-sof-qual-lss.sapcloud.io"
export SYSTEM_CLIENT_ID=abacus
export SYSTEM_CLIENT_SECRET=s3cret
export SERVICE_NAME="i324939-metering"
export SERVICE_PLAN="standard"


# For resource provider acceptance test
## You might want to change the CF_SPACE
export AUTH_SERVER="https://uaa.cf.landscape-dev-sof-qual-lss.sapcloud.io"
export UAA_SECRET="admin-secret"
export PROVISIONING_URL="https://i324939-abacus-provisioning-plugin.cfapps.landscape-dev-sof-qual-lss.sapcloud.io"
export CLIENT_SECRET="test-secret"
