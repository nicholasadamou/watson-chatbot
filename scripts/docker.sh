#!/bin/bash

docker-compose down && \
	make all && \
	docker-compose up
