#!/bin/bash

npx yarn clean

docker-compose down && \
	make all && \
	docker-compose up
