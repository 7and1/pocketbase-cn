# PocketBase.cn Backend Makefile
# Production deployment on 107.174.42.198

.PHONY: deploy logs down restart validate build clean

# Default target
deploy: validate build
	docker-compose up -d
	@echo "Deployed! Checking health..."
	@sleep 5
	@docker-compose ps
	@echo "View logs with: make logs"

# Build the image
build:
	docker-compose build --no-cache

# View logs
logs:
	docker-compose logs -f

# Stop services
down:
	docker-compose down

# Restart services
restart: down deploy

# Validate configuration
validate:
	@echo "Validating docker-compose.yml..."
	docker-compose config --quiet
	@echo "Checking .env file..."
	@test -f .env || (echo "ERROR: .env file not found! Copy from .env.example" && exit 1)
	@echo "Checking data directory..."
	@mkdir -p ./data/pb_data
	@echo "Validation passed!"

# Clean up (keeps data)
clean:
	docker-compose down --rmi local
	@echo "Cleaned up images. Data preserved in ./data/"

# Show status
status:
	docker-compose ps
	@echo ""
	docker-compose logs --tail=20

# Backup data
backup:
	@BACKUP_FILE="pb_backup_$$(date +%Y%m%d_%H%M%S).tar.gz" && \
	tar -czvf "./$$BACKUP_FILE" ./data && \
	echo "Backup created: $$BACKUP_FILE"
