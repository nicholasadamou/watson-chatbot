#!/bin/bash

cd angular-app && \
	npx yarn install && \
	npx yarn build

cd .. && \
	npx yarn install && \
	nodemon server/server.js
