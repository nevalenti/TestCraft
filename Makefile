.PHONY: dev down prod build clean format e2e

API_IMAGE=testcraft-api
WEB_IMAGE=testcraft-web

dev:
	docker compose up -d postgres

down:
	docker compose down

prod:
	docker build -t $(WEB_IMAGE) -f apps/web/Dockerfile .
	docker compose -f docker-compose.prod.yml up -d

build:
	docker build -t $(WEB_IMAGE) -f apps/web/Dockerfile .

clean:
	docker compose down -v
	docker compose -f docker-compose.prod.yml down -v || true

format:
	pnpm dlx prettier . --write

e2e:
	docker compose --profile e2e run --rm --build e2e
