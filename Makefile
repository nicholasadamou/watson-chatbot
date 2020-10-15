DOCKER_IMAGE ?= nicholasadamou/watson-chatbot
DOCKER_TAG ?= latest
DOCKER_IMAGE_NAME ?= $(DOCKER_IMAGE):$(DOCKER_TAG)
COMMIT ?= 00000000
PROP ?= test


ifeq ($(DOCKER_TAG), latest)
	PROP = test
else
	PROP = prod
endif

.PHONY: all
all: build


.PHONY: build
build: conf/fingerprint.json package.json Dockerfile
	docker build --build-arg COMMIT=$(COMMIT) --build-arg PROP=$(PROP) -t $(DOCKER_IMAGE_NAME)  .
	touch .build_image

conf/fingerprint.json:
	mkdir -p conf
	echo "{ \"date\": \"$(date +"%Y-%m-%d %T%z")\", \"commit\": \"$(COMMIT)\", \"branch\": \"$(git branch | grep \* | cut -d ' ' -f2)\",  \"build-number\": 0 }" > conf/fingerprint.json

.PHONY: serve
serve: package.json node_modules
	npm run start

.PHONY: install
install:
	npm install

.PHONY: clean
clean:
	rm -rf .build_image
	npm run clean
