.PHONY: dev down prod build clean apply e2e e2e-ui ci-api ci-web ci

API_IMAGE = testcraft-api
WEB_IMAGE = testcraft-web

dev:
	docker compose up -d postgres keycloak loki tempo prometheus grafana

down:
	docker compose down

prod:
	docker build -t $(API_IMAGE) -f apps/api/Dockerfile .
	docker build -t $(WEB_IMAGE) -f apps/web/Dockerfile .
	docker compose -f docker-compose.prod.yml up -d

build:
	docker build -t $(API_IMAGE) -f apps/api/Dockerfile .
	docker build -t $(WEB_IMAGE) -f apps/web/Dockerfile .

clean:
	docker compose down -v
	docker compose -f docker-compose.prod.yml down -v || true

apply:
	terraform -chdir=infra/terraform apply

e2e:
	pnpm --filter testcraft-e2e run e2e

e2e-ui:
	pnpm --filter testcraft-e2e run e2e:ui

ci-api:
	act push -W .github/workflows/api.yml -j build-test

ci-web:
	act push -W .github/workflows/web.yml -j build-test

ci:
	make ci-api && make ci-web
