#!/bin/bash

set -e

export NPM_CONFIG_LOGLEVEL=warn

pushd cf-abacus-broker
  git submodule init
  git submodule update
  cd abacus
  npm run provision
  cd ..
  npm run build
popd