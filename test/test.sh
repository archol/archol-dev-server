#!/bin/bash

cd `dirname $0`
cd ..
pwd

function mocha() {
  node_modules/mocha/bin/mocha
}

function nyc() {
  node_modules/.bin/nyc node_modules/mocha/bin/mocha
  [ $? -eq 0 ] && node_modules/.bin/nyc report --reporter=json
  [ $? -eq 0 ] && node_modules/.bin/nyc report --reporter=html
  exit $?
}

function codecov() {
  node_modules/.bin/nyc node_modules/mocha/bin/mocha
  [ $? -eq 0 ] && node_modules/.bin/nyc report --reporter=json
  [ $? -eq 0 ] && node_modules/.bin/codecov -f coverage/*.json -t "$CODECOV_TOKEN"
  exit $?
}

function coveralls() {
  node ./node_modules/istanbul/lib/cli.js cover ./node_modules/mocha/bin/_mocha --report lcovonly -- -R spec && cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js && rm -rf ./coverage
  exit $?
}

CMD="$1"

[ -z "$1" ] && CMD="nyc"

tsc -p . 
[ $? -eq 0 ] && $CMD
exit $?