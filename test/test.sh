#!/bin/bash

cd `dirname $0`
cd ..
pwd

function nyc() {
  node_modules/.bin/nyc node_modules/mocha/bin/mocha
  node_modules/.bin/nyc report --reporter=json
  node_modules/.bin/nyc report --reporter=html
}

function codecov() {
  node_modules/.bin/nyc node_modules/mocha/bin/mocha
  node_modules/.bin/nyc report --reporter=json
  node_modules/.bin/codecov -f coverage/*.json -t $CODECON_TOKEN
}

function coveralls() {
  node ./node_modules/istanbul/lib/cli.js cover ./node_modules/mocha/bin/_mocha --report lcovonly -- -R spec && cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js && rm -rf ./coverage
}

CMD="$1"

[ -z "$1" ] && CMD="node_modules/mocha/bin/mocha"

tsc -p . 
[ $? -eq 0 ] && $CMD
