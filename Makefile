.PHONY: dev down prod build clean e2e e2e-ui ci-api ci-web ci deploy deploy-images deploy-k8s

API_IMAGE     = testcraft-api
WEB_IMAGE     = testcraft-web
REGISTRY      ?= ghcr.io/nevalenti

DEPLOY_HOST      ?= nevalenti@rpi5.local
DEPLOY_DOMAIN    ?= rpi5.local
DEPLOY_DIR       ?= /home/nevalenti/source/nevalenti/testcraft
NAMESPACE        ?= testcraft
KEYCLOAK_URL     ?= https://$(DEPLOY_DOMAIN):8443

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

e2e:
	pnpm --filter testcraft-web run e2e

e2e-ui:
	pnpm --filter testcraft-web run e2e:ui

ci-api:
	act push -W .github/workflows/api.yml -j build-test

ci-web:
	act push -W .github/workflows/web.yml -j build-test

ci:
	make ci-api && make ci-web

setup-tls:
	ssh $(DEPLOY_HOST) '\
		openssl req -x509 -nodes -newkey rsa:2048 \
		  -keyout /tmp/tls.key -out /tmp/tls.crt -days 3650 \
		  -subj "/CN=$(DEPLOY_DOMAIN)" \
		  -addext "subjectAltName=DNS:$(DEPLOY_DOMAIN),DNS:localhost" && \
		kubectl create secret tls rpi5-tls \
		  --cert=/tmp/tls.crt --key=/tmp/tls.key \
		  -n $(NAMESPACE) --dry-run=client -o yaml | kubectl apply -f - && \
		rm /tmp/tls.crt /tmp/tls.key'

deploy: deploy-images deploy-k8s

deploy-images:
	docker buildx build --platform linux/arm64 \
		-t $(REGISTRY)/$(API_IMAGE):latest \
		--push \
		-f apps/api/Dockerfile .
	docker buildx build --platform linux/arm64 \
		-t $(REGISTRY)/$(WEB_IMAGE):latest \
		--push \
		--build-arg VITE_KEYCLOAK_URL=$(KEYCLOAK_URL) \
		-f apps/web/Dockerfile .

deploy-k8s:
	ssh $(DEPLOY_HOST) "mkdir -p $(DEPLOY_DIR)/infra"
	rsync -av infra/ $(DEPLOY_HOST):$(DEPLOY_DIR)/infra/
	ssh $(DEPLOY_HOST) "DEPLOY_DIR=$(DEPLOY_DIR) NAMESPACE=$(NAMESPACE) bash $(DEPLOY_DIR)/infra/k8s/deploy.sh"
	ssh $(DEPLOY_HOST) "kubectl rollout restart deployment/api deployment/web -n $(NAMESPACE)"

