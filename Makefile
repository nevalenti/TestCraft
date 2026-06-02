.PHONY: dev down prod build clean apply migrate e2e ci-api ci-web

API_IMAGE = testcraft-api
WEB_IMAGE = testcraft-web

dev:
	docker compose up -d

prod:
	docker build -t $(API_IMAGE) -f apps/api/Dockerfile .
	docker build -t $(WEB_IMAGE) -f apps/web/Dockerfile .
	docker compose -f docker-compose.prod.yml up -d

down:
	docker compose down

downv:
	docker compose down -v

build:
	docker build -t $(API_IMAGE) -f apps/api/Dockerfile .
	docker build -t $(WEB_IMAGE) -f apps/web/Dockerfile .

clean:
	docker compose down -v
	docker compose -f docker-compose.prod.yml down -v || true

apply:
	terraform -chdir=infra/terraform apply

migrate:
	pnpm --filter testcraft-api run db:migrate

seed:
	pnpm --filter testcraft-api run db:seed

e2e:
	pnpm --filter testcraft-e2e run e2e

ci-api:
	act push -W .github/workflows/api.yml -j build-test

ci-web:
	act push -W .github/workflows/web.yml -j build-test
