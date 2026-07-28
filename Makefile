.PHONY: up down build load images image-versions dev-realm \
        deploy deploy-prod deploy-app namespace tls-secret destroy status \
        api-github web-github e2e-github docs-github \
        api-gitlab web-gitlab e2e-gitlab docs-gitlab \
        api-jenkins web-jenkins e2e-jenkins docs-jenkins jenkins-image jenkins-up jenkins-down \
        format

API_IMAGE = testcraft-api
WEB_IMAGE = testcraft-web
GATEWAY_IMAGE = testcraft-gateway
DOCS_IMAGE = testcraft-docs
JENKINS_IMAGE = testcraft-jenkins-controller
GHCR_OWNER = nevalenti
KUBECTL = sudo k3s kubectl
HELM = sudo helm --kubeconfig /etc/rancher/k3s/k3s.yaml
GITLAB_CI_LOCAL = pnpm exec gitlab-ci-local --ignore-predefined-vars CI,CI_PIPELINE_SOURCE --variable CI_PIPELINE_SOURCE=web --privileged --variable NODE_TLS_REJECT_UNAUTHORIZED=0
HELM_PROD_VALUES = --values infrastructure/helm/testcraft/values.production.yaml --values infrastructure/helm/testcraft/values.secrets.yaml --reset-then-reuse-values
HELM_SSA_FLAGS = --server-side=true --force-conflicts

image-versions: infrastructure/image-versions.env
dev-realm: infrastructure/keycloak/realm.json

infrastructure/image-versions.env: infrastructure/helm/testcraft/values.yaml scripts/render-image-versions.sh
	scripts/render-image-versions.sh

infrastructure/keycloak/realm.json: infrastructure/helm/testcraft/files/realm.json scripts/render-dev-realm.sh
	scripts/render-dev-realm.sh

up: infrastructure/image-versions.env infrastructure/keycloak/realm.json
	docker compose --env-file .env --env-file infrastructure/image-versions.env up -d

down: infrastructure/image-versions.env infrastructure/keycloak/realm.json
	docker compose --env-file .env --env-file infrastructure/image-versions.env down -v

build:
	docker build -t $(API_IMAGE) -f apps/Api/Dockerfile .
	docker build -t $(WEB_IMAGE) -f apps/web/Dockerfile .
	docker build -t $(GATEWAY_IMAGE) -f apps/Gateway/Dockerfile .
	docker build -t $(DOCS_IMAGE) -f apps/docs/Dockerfile .

load:
	docker save $(API_IMAGE):latest | sudo k3s ctr images import -
	docker save $(WEB_IMAGE):latest | sudo k3s ctr images import -
	docker save $(GATEWAY_IMAGE):latest | sudo k3s ctr images import -
	docker save $(DOCS_IMAGE):latest | sudo k3s ctr images import -

images: build load

namespace:
	scripts/k8s-namespace.sh

tls-secret: namespace
	scripts/k8s-tls-bootstrap.sh

deploy: images namespace
	$(KUBECTL) create secret tls testcraft-ca-tls -n testcraft \
		--cert="$$(mkcert -CAROOT)/rootCA.pem" --key="$$(mkcert -CAROOT)/rootCA-key.pem" \
		--dry-run=client -o yaml | $(KUBECTL) apply -f -
	$(HELM) upgrade --install testcraft infrastructure/helm/testcraft --namespace testcraft --values infrastructure/helm/testcraft/values.secrets.yaml $(HELM_SSA_FLAGS)
	scripts/rollout.sh deployment/api deployment/web deployment/gateway deployment/docs

deploy-prod: namespace tls-secret
	helm dependency update infrastructure/helm/testcraft
	$(HELM) upgrade --install testcraft infrastructure/helm/testcraft --namespace testcraft $(HELM_PROD_VALUES) $(HELM_SSA_FLAGS)
	scripts/rollout.sh deployment/api deployment/web deployment/gateway deployment/docs

deploy-app: namespace tls-secret
	@test -n "$(APP)" || { echo "APP is required, e.g. make deploy-app APP=api TAG=<sha>" >&2; exit 1; }
	@test -n "$(TAG)" || { echo "TAG is required, e.g. make deploy-app APP=api TAG=<sha>" >&2; exit 1; }
	scripts/image-exists.sh $(GHCR_OWNER)/testcraft-$(APP) $(TAG) || { echo "ghcr.io/$(GHCR_OWNER)/testcraft-$(APP):$(TAG) does not exist - refusing to deploy" >&2; exit 1; }
	helm dependency update infrastructure/helm/testcraft
	$(HELM) upgrade --install testcraft infrastructure/helm/testcraft --namespace testcraft $(HELM_PROD_VALUES) $(HELM_SSA_FLAGS) \
		--set images.$(APP).tag=$(TAG) \
		--set images.$(APP).pullPolicy=IfNotPresent
	scripts/rollout.sh deployment/$(APP)

destroy:
	$(KUBECTL) delete namespace testcraft --ignore-not-found

status:
	$(KUBECTL) get all -n testcraft

api-github:
	act push -W .github/workflows/api.yml -j build-test --secret-file .secrets

web-github:
	act push -W .github/workflows/web.yml -j build-test --secret-file .secrets

e2e-github:
	act push -W .github/workflows/e2e.yml -j e2e --secret-file .secrets; \
	docker stop keycloak 2>/dev/null || true

docs-github:
	act push -W .github/workflows/docs.yml -j build-test --secret-file .secrets

api-gitlab:
	$(GITLAB_CI_LOCAL) api:build-test

web-gitlab:
	$(GITLAB_CI_LOCAL) web:build-test

e2e-gitlab:
	$(GITLAB_CI_LOCAL) e2e

docs-gitlab:
	$(GITLAB_CI_LOCAL) docs:build-test

jenkins-image:
	docker build -t $(JENKINS_IMAGE) -f jenkins/controller/Dockerfile jenkins/controller

jenkins-up:
	jenkins/controller/run.sh

jenkins-down:
	docker stop testcraft-jenkins-controller 2>/dev/null || true

api-jenkins:
	jenkins/controller/run.sh api

web-jenkins:
	jenkins/controller/run.sh web

e2e-jenkins:
	jenkins/controller/run.sh e2e; \
	docker stop keycloak testcraft-e2e-postgres 2>/dev/null || true

docs-jenkins:
	jenkins/controller/run.sh docs

format:
	pnpm format
	dotnet csharpier format .
