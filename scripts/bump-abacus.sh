#!/bin/bash

set -e

pushd abacus
  git pull -r origin master
  git branch
popd
git add abacus

diff=$(git submodule status | awk '{print $2}' | xargs git diff --cached --submodule | awk 'NR==1 { print }; NR>1 { $1="*"; print }')

(echo "Bump Abacus" && echo "" && echo "$diff") | git commit --file -
git log -1
