#!/bin/bash -e

pushd abacus
  git pull -r origin master
  git branch
popd
git add abacus

diff=$(git submodule status | awk '{print $2}' | xargs git diff --cached --submodule)

(echo "Bump Abacus" && echo "" && echo "$diff") | git commit --file -
git log -1
