#!/bin/bash

npx yarn install-dependencies

npx yarn --cwd angular-app build

nodemon server/server.js
