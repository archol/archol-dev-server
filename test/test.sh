#!/bin/bash

cd `dirname $0`
cd ..
echo "node: `node --version` npm: `npm --version` root: `pwd`"

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

CMD="$1"

if [ -z "$CIRCLE_PROJECT_REPONAME" ]
then
  DEF="nyc"
else
  DEF="codecov"
fi

rm -Rf ~/bin
rm -Rf ~/coverage
rm -Rf ~/.nyc_output

[ -z "$1" ] && CMD=$DEF
if [ "$1" = "nolint" ]
then
  CMD=$DEF
  tsc -p . 
else
  tslint -p . 
  [ $? -eq 0 ] && tsc -p . 
fi

[ $? -eq 0 ] && tsc --sourceMap test/*.ts 
[ $? -eq 0 ] && $CMD
exit $?
