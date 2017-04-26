#!/bin/bash

cp manifest-template.yml manifest.yml
echo "    CF_API: $CF_API" >> manifest.yml
echo "    UAA_SERVER: $UAA_SERVER" >> manifest.yml
echo "    PROVISIONING: $PROVISIONING" >> manifest.yml
echo "    COLLECTOR: $COLLECTOR" >> manifest.yml
echo "    BROKER_USER: $BROKER_USER" >> manifest.yml
echo "    BROKER_PASSWORD: $BROKER_PASSWORD" >> manifest.yml
