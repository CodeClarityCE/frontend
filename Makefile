# Makefile template derivated from https://github.com/dunglas/symfony-docker/blob/main/docs/makefile.md
.DEFAULT_GOAL = help
.PHONY        = help build build-prod up down logs

## —— 🦉 CodeClarity's backend 🦉 ——————————————————————————————————————————————
help: ## Outputs this help screen
	@grep -E '(^[a-zA-Z0-9_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}{printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'

## —— Docker 🐳 ————————————————————————————————————————————————————————————————
build-prod: ## Builds de production Docker images
	@docker build -f .cloud/docker/Dockerfile --tag codeclarityce/frontend:latest .

build: ## Builds the Docker images
	@cd ../.cloud/scripts && sh build.sh frontend

up: ## Starts the Docker images
	@cd ../.cloud/scripts && sh up.sh frontend

down: ## Stops the Docker images
	@cd ../.cloud/scripts && sh down.sh frontend

logs: ## Show compose logs
	@cd ../.cloud/scripts && sh logs.sh frontend