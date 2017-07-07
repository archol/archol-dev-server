#!/bin/sh

npm test
if [ $? -eq 0 ] 
then
  if [ -n "`git status --porcelain`" ]
	then
	  git status -b
		exit 1
	fi 
fi
exit $?
