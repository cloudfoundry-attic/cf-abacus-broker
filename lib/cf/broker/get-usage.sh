#!/bin/bash
set -e

instance_id='526c58f5-0bbe-47c2-8b74-49161f03e0bb'
CLIENT_ID=abacus
CLIENT_SECRET='s3cret'
org='sap_abacus'

echo "Obtaining API endpoint URL ..."
API=$(cf api | awk '{if (NR == 1) {print $3}}')
AUTH_SERVER=${API/api./uaa.}
echo "Using API URL $API"
echo ""

echo "Getting token for $CLIENT_ID from $AUTH_SERVER ..."
TOKEN=$(curl -k --user $CLIENT_ID:$CLIENT_SECRET -s "$AUTH_SERVER/oauth/token?grant_type=client_credentials&scope=abacus.usage.write%20abacus.usage.read" -k | jq -r .access_token)
if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo ""
  echo "No token found ! Running diagnostics ..."
  exit 1
fi
echo "Token obtained"
echo ""

echo "Get organization $org guid ..."
set +e
ORG_GUID=$(cf org $org --guid)
if [ $? != 0 ]; then
  echo "Organization $org not found !"
  exit 1
fi
set -e
echo "Done."
echo ""

echo "Getting current domain ..."
DOMAIN=$(cf domains | awk '{if (NR == 3) {print $1}}')
echo "Using domain $DOMAIN"
echo ""
if [ -z "$DOMAIN" ]; then
  echo "No domain found ! Are your logged in CF?"
  exit 1
fi

URL="https://${ABACUS_PREFIX}abacus-usage-reporting.$DOMAIN/v1/metering/organizations/${ORG_GUID}/aggregated/usage"

echo "Using $URL"
echo ""

echo "Getting report for org $org ($ORG_GUID) from $URL ..."
set +e
curl -k -s -H "Authorization: bearer $TOKEN" -H "Content-Type: application/json" $URL | jq .

