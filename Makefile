.PHONY: up down clean migrate seed e2e api web \
        build load images destroy status deploy \
        build-action debug-import

API_IMAGE = testcraft-api
WEB_IMAGE = testcraft-web
KUBECTL = sudo k3s kubectl

-include .env
-include .secrets
export
unexport DATABASE_URL
unexport POSTGRES_EXPORTER_DSN

up:
	docker compose up -d

down:
	docker compose down -v

migrate:
	pnpm --filter testcraft-api run db:migrate

seed:
	pnpm --filter testcraft-api run db:seed

build-action:
	npm run build --prefix .github/actions/import-results

debug-import: build-action
	mkdir -p /tmp/testcraft-debug
	printf '<?xml version="1.0" encoding="UTF-8"?>\n<testsuites tests="1"><testsuite tests="1"><testcase name="debug"/></testsuite></testsuites>' \
		> /tmp/testcraft-debug/junit.xml
	env \
	  "NODE_TLS_REJECT_UNAUTHORIZED=0" \
	  "INPUT_API-URL=$(TESTCRAFT_API_URL)" \
	  "INPUT_USERNAME=$(TESTCRAFT_USERNAME)" \
	  "INPUT_PASSWORD=$(TESTCRAFT_PASSWORD)" \
	  "INPUT_KEYCLOAK-AUTHORITY=$(TESTCRAFT_KEYCLOAK_AUTHORITY)" \
	  "INPUT_PROJECT-NAME=TestCraft" \
	  "INPUT_JUNIT-XML=/tmp/testcraft-debug/junit.xml" \
	  "INPUT_RUN-NAME=debug run" \
	  "INPUT_SOURCE=debug" \
	  node .github/actions/import-results/dist/index.js

e2e:
	act push -W .github/workflows/e2e.yml -j e2e --secret-file .secrets

api:
	act push -W .github/workflows/api.yml -j build-test --secret-file .secrets

web:
	act push -W .github/workflows/web.yml -j build-test --secret-file .secrets

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
