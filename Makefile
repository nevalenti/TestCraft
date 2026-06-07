.PHONY: dev down clean apply migrate seed e2e api web \
        build load images destroy status deploy

API_IMAGE = testcraft-api
WEB_IMAGE = testcraft-web
KUBECTL = sudo k3s kubectl

-include .env
export
unexport DATABASE_URL
unexport POSTGRES_EXPORTER_DSN

up:
	docker compose up -d

down:
	docker compose down -v

apply:
	terraform -chdir=infra/terraform apply

migrate:
	pnpm --filter testcraft-api run db:migrate

seed:
	pnpm --filter testcraft-api run db:seed

e2e:
	pnpm --filter testcraft-e2e run e2e

api:
	act push -W .github/workflows/api.yml -j build-test

web:
	act push -W .github/workflows/web.yml -j build-test

build:
	docker build -t $(API_IMAGE) -f apps/api/Dockerfile .
	docker build -t $(WEB_IMAGE) -f apps/web/Dockerfile .

load:
	docker save $(API_IMAGE):latest | sudo k3s ctr images import -
	docker save $(WEB_IMAGE):latest | sudo k3s ctr images import -

images: build load

destroy:
	$(KUBECTL) delete namespace testcraft --ignore-not-found

status:
	$(KUBECTL) get all -n testcraft

deploy: images
	$(KUBECTL) apply -k .
	$(KUBECTL) rollout restart deployment/api deployment/web -n testcraft
	$(KUBECTL) rollout status deployment/api deployment/web -n testcraft --timeout=120s
