.DEFAULT_GOAL := help

DOCKER_IMAGE_TAG ?= deno-image-transform


# target: help - Display available recipes.
.PHONY: help
help:
	@egrep "^# target:" [Mm]akefile

# target: rust-build - Build rust plugin binary.
.PHONY: rust-build
rust-build:
	cd rust-plugin && \
	cargo build && \
	cp target/debug/libtest_plugin.so libtest_plugin.so

# target: deno-run - Build rust plugin binary.
.PHONY: deno-run
deno-run:
	deno run --unstable --allow-plugin --allow-read --allow-write main.js

# target: docker-build - Build docker image.
.PHONY: docker-build
docker-build:
	docker build -t ${DOCKER_IMAGE_TAG} .

# target: docker-run - Build docker image.
.PHONY: docker-run
docker-run: docker-build
	docker run -v $$(pwd)/images/:/deno/images/ ${DOCKER_IMAGE_TAG}

# target: run - Build docker image.
.PHONY: run
run: docker-run

# target: local-run - Build docker image.
.PHONY: local-run
local-run: rust-build deno-run
