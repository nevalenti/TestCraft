.PHONY: dev down downv clean apply migrate seed e2e ci-api ci-web \
        k3s-build k3s-load k3s-images k3s-down k3s-status deploy

API_IMAGE = testcraft-api
WEB_IMAGE = testcraft-web
KEYCLOAK_URL ?= https://testcraft.dev:8443
KUBECTL = sudo k3s kubectl

-include .env
export
unexport DATABASE_URL
unexport POSTGRES_EXPORTER_DSN

dev:
	docker compose up -d

down:
	docker compose down

downv:
	docker compose down -v

clean:
	docker compose down -v

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

k3s-build:
	docker build -t $(API_IMAGE) -f apps/api/Dockerfile .
	docker build -t $(WEB_IMAGE) -f apps/web/Dockerfile . --build-arg VITE_KEYCLOAK_URL=$(KEYCLOAK_URL)

k3s-load:
	docker save $(API_IMAGE):latest | sudo k3s ctr images import -
	docker save $(WEB_IMAGE):latest | sudo k3s ctr images import -

k3s-images: k3s-build k3s-load

k3s-down:
	$(KUBECTL) delete namespace testcraft --ignore-not-found

k3s-status:
	$(KUBECTL) get all -n testcraft

deploy: k3s-images
	$(KUBECTL) apply -k .
	$(KUBECTL) rollout restart deployment/api deployment/web -n testcraft
	$(KUBECTL) rollout status deployment/api deployment/web -n testcraft --timeout=120s
