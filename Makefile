# Define variables
DOCKER_COMPOSE = docker compose
PROJECT_NAME = lofi-donut
DOCKER_FRONTEND_CONTAINER = lofi-donut-dev
DOCKER_LLM_CONTAINER = llm
DOCKER_NETWORK = lofi-network
BROWSER_CMD = open
ENV_FILE = .env

.PHONY: all build up down clean desolate llm-pull llm-list logs open restart dev

# Default task
all: build up llm-pull open

# Build Docker Compose stack
build:
	@echo "Building Docker Compose stack..."
	$(DOCKER_COMPOSE) build

# Start Docker Compose stack
up:
	@echo "Starting Docker Compose stack..."
	$(DOCKER_COMPOSE) up -d

# Pull the Llama2 3B model
llm-pull:
	@echo "Pulling the Llama2 3B model..."
	@curl -X POST http://localhost:11434/api/pull \
		-H "Content-Type: application/json" \
		-d '{"name": "llama2:3b"}'

# List available models
llm-list:
	@echo "Listing available models..."
	@docker exec $(DOCKER_LLM_CONTAINER) ollama list

# Show logs of all containers
logs:
	@echo "Displaying logs of all containers..."
	$(DOCKER_COMPOSE) logs -f

# Open browser to web service
open:
	@echo "Opening browser at http://localhost:5173..."
	$(BROWSER_CMD) http://localhost:5173

# Stop Docker Compose stack
down:
	@echo "Stopping Docker Compose stack..."
	$(DOCKER_COMPOSE) down

# Restart containers
restart:
	@echo "Restarting containers..."
	$(DOCKER_COMPOSE) restart

# Development mode with logs
dev: up llm-pull
	@echo "Starting development mode with logs..."
	$(DOCKER_COMPOSE) logs -f

# Stop and clean up the Docker Compose stack
clean:
	@echo "Stopping and removing Docker Compose stack..."
	@$(DOCKER_COMPOSE) down --volumes --remove-orphans || echo "Docker Compose is already stopped."
	@echo "Removing volumes associated with the project '${PROJECT_NAME}'..."
	@docker volume ls --filter "name=${PROJECT_NAME}_" --format "{{.Name}}" | xargs -r docker volume rm || echo "No volumes to remove."
	@echo "Cleaning up unused Docker resources..."
	@docker system prune -f

# Complete cleanup of all Docker resources
desolate:
	@echo "Starting complete Docker cleanup..."
	@echo "Stopping all running containers..."
	@docker stop $$(docker ps -aq) 2>/dev/null || echo "No running containers to stop."
	@echo "Removing all containers..."
	@docker rm $$(docker ps -aq) 2>/dev/null || echo "No containers to remove."
	@echo "Removing all images..."
	@docker rmi $$(docker images -q) -f 2>/dev/null || echo "No images to remove."
	@echo "Removing all volumes..."
	@docker volume rm $$(docker volume ls -q) 2>/dev/null || echo "No volumes to remove."
	@echo "Removing all networks..."
	@docker network rm $$(docker network ls -q) 2>/dev/null || echo "No networks to remove."
	@echo "Pruning system resources..."
	@docker system prune -a -f --volumes
	@echo "All Docker resources have been removed."

# Show container status
status:
	@echo "Container Status:"
	@docker ps --filter "name=$(PROJECT_NAME)"

# Show container resources
stats:
	@echo "Container Resource Usage:"
	@docker stats --no-stream $(DOCKER_FRONTEND_CONTAINER) $(DOCKER_LLM_CONTAINER)

# Enter LLM container shell
llm-shell:
	@echo "Entering LLM container shell..."
	@docker exec -it $(DOCKER_LLM_CONTAINER) /bin/bash

# Enter frontend container shell
frontend-shell:
	@echo "Entering frontend container shell..."
	@docker exec -it $(DOCKER_FRONTEND_CONTAINER) /bin/bash