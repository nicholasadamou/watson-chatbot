#!/bin/bash

ng build && \
  rm -rf ../server/ui/* && \
  cp -a dist/angular-app/. ../server/ui/
