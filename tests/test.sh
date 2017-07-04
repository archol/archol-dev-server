cd `dirname $0`
cd ..
pwd

npm install
[ $? -eq 0 ] && tsc -p . 
[ $? -eq 0 ] && cd tests 
[ $? -eq 0 ] && npm install 
[ $? -eq 0 ] && node_modules/mocha/bin/mocha

