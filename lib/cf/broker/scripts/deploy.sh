#!/bin/bash

set -e -u

rm -rf ./cfp*

echo "Source env vars"
source ./scripts/env.sh

echo "Generating manifest..."
#./scripts/generate-manifest.sh

echo "Logging to CF..."
cf api api.$CF_SYS_DOMAIN --skip-ssl-validation
cf auth $CF_ADMIN_USER $CF_ADMIN_PASS

echo "Creating orgs and spaces..."
cf create-org "$ABACUS_BROKER_ORG"
cf create-space -o "$ABACUS_BROKER_ORG" "$ABACUS_BROKER_SPACE"

echo "Pushing application..."
cf target -o "$ABACUS_BROKER_ORG" -s "$ABACUS_BROKER_SPACE"
npm run cfpack
npm run cfpush
cf start $APP_NAME

echo "Register ${APP_NAME} as service"
echo "APP_NAME = $APP_NAME"
URL="$(cf app $APP_NAME | grep urls | awk '{print $2}')"
echo "URL = $URL"

cf delete-service-broker $APP_NAME -f
cf create-service-broker $APP_NAME $BROKER_USER $BROKER_PASSWORD https://${URL}

echo "Enabling service access"
for service in $(cf service-access -b $APP_NAME | awk 'NR > 3 {print $1}')
do
  cf enable-service-access "$service"
done
