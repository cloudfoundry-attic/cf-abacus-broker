#!/bin/bash

set -e

instance_id='8b97d2da-9710-49ae-89d9-5a3773811592'
CLIENT_ID="abacus-rp-${instance_id}"
CLIENT_SECRET='Huijeu6MM4'
org='sap_abacus'


echo "Obtaining API endpoint URL ..."
API=$(cf api | awk '{if (NR == 1) {print $3}}')
AUTH_SERVER=${API/api./uaa.}
echo "Using API URL $API"
echo ""

echo "Getting token for $CLIENT_ID from $AUTH_SERVER ..."
TOKEN=$(curl --user $CLIENT_ID:$CLIENT_SECRET -s "$AUTH_SERVER/oauth/token?grant_type=client_credentials&scope=abacus.usage.$instance_id.write%20abacus.usage.$instance_id.read" -k | jq -r .access_token)
if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "No token found ! Are your credentials correct (CLIENT_ID and CLIENT_SECRET)?"
  exit 1
fi
echo "Token obtained"
echo ""

echo "Get organization $org guid ..."
ORG_GUID=$(cf org $org --guid)
echo "Org guid $ORG_GUID"
echo "Done."
echo ""

echo "List spaces for org $org ..."
SPACE=$(cf org $org | awk '{ if (NR==7) {print $2}}')
echo "Get space $SPACE guid ..."
SPACE_GUID=253e0075-7adf-4503-812a-4b9c88fa49b3
echo "Space guid $SPACE_GUID"
echo "Done."
echo ""

echo "Getting first CF domain ..."
DOMAIN=$(cf domains | awk '{if (NR == 3) {print $1}}')
echo "Using domain $DOMAIN"
echo ""
if [ -z "$DOMAIN" ]; then
  echo "No domain found ! Are your logged in CF?"
  exit 1
fi

echo "Getting abacus-usage-collector URL ..."
URL="https://${ABACUS_PREFIX}abacus-usage-collector.$DOMAIN/v1/metering/collected/usage"

echo "Using $URL"
echo ""

DATE_IN_MS="$(date +%s000)"
BODY="{\"start\":$DATE_IN_MS,\"end\":$DATE_IN_MS,\"organization_id\":\"$ORG_GUID\",\"space_id\":\"$SPACE_GUID\",\"resource_id\":\"$instance_id\",\"plan_id\":\"basic\",\"consumer_id\":\"app:8001191e-1ff0-44b2-b884-99a36c3a39f3\",\"resource_instance_id\":\"8001191e-1ff0-44b2-b884-99a36c3a39f3\",\"measured_usage\":[{\"measure\":\"sampleName\",\"quantity\":512}]}"
echo "Will submit usage $(echo $BODY | jq .)"
echo ""
curl -i -k -H "Authorization: bearer $TOKEN" -H "Content-Type: application/json" -X POST -d $BODY $URL -vvv

if [ "$(uname)" != "Darwin" ]; then
  DATE_IN_MS=$(date --date="$(date +%Y-%m-1) -1 month" +%s000)
  BODY="{\"start\":$DATE_IN_MS,\"end\":$DATE_IN_MS,\"organization_id\":\"$ORG_GUID\",\"space_id\":\"$SPACE_GUID\",\"resource_id\":\"linux-container\",\"plan_id\":\"basic\",\"consumer_id\":\"8001191e-1ff0-44b2-b884-99a36c3a39f3\",\"resource_instance_id\":\"853b8bd8-44e4-43f9-845b-e410a86f9e54\",\"measured_usage\":[{\"measure\":\"current_instance_memory\",\"quantity\":512},{\"measure\":\"current_running_instances\",\"quantity\":1},{\"measure\":\"previous_instance_memory\",\"quantity\":0},{\"measure\":\"previous_running_instances\",\"quantity\":0}]}"
  echo "Will submit usage for the last month $(echo $BODY | jq .)"
  echo ""
  curl -i -k -H "Authorization: bearer $TOKEN" -H "Content-Type: application/json" -X POST -d $BODY $URL
fi
