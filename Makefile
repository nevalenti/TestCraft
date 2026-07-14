.PHONY: up down \
        build load images deploy destroy status \
        api-github web-github e2e-github \
        api-gitlab web-gitlab e2e-gitlab \
        jenkins-image jenkins-up jenkins-down api-jenkins web-jenkins e2e-jenkins \
        format

API_IMAGE = testcraft-api
WEB_IMAGE = testcraft-web
GATEWAY_IMAGE = testcraft-gateway
DOCS_IMAGE = testcraft-docs
JENKINS_IMAGE = testcraft-jenkins-controller
KUBECTL = sudo k3s kubectl
HELM = sudo helm --kubeconfig /etc/rancher/k3s/k3s.yaml
GITLAB_CI_LOCAL = pnpm exec gitlab-ci-local --ignore-predefined-vars CI,CI_PIPELINE_SOURCE --variable CI_PIPELINE_SOURCE=web --privileged --variable NODE_TLS_REJECT_UNAUTHORIZED=0

up:
	docker compose up -d

down:
	docker compose down -v

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

deploy: images
	$(KUBECTL) create namespace testcraft --dry-run=client -o yaml | $(KUBECTL) apply -f -
	$(KUBECTL) label namespace testcraft app.kubernetes.io/managed-by=Helm --overwrite
	$(KUBECTL) annotate namespace testcraft meta.helm.sh/release-name=testcraft meta.helm.sh/release-namespace=testcraft --overwrite
	$(KUBECTL) create secret tls testcraft-ca-tls -n testcraft \
		--cert="$$(mkcert -CAROOT)/rootCA.pem" --key="$$(mkcert -CAROOT)/rootCA-key.pem" \
		--dry-run=client -o yaml | $(KUBECTL) apply -f -
	$(HELM) upgrade --install testcraft infrastructure/helm/testcraft --namespace testcraft --values infrastructure/helm/testcraft/values.secrets.yaml
	$(KUBECTL) rollout restart deployment/api deployment/web deployment/gateway deployment/docs -n testcraft
	$(KUBECTL) rollout status deployment/api deployment/web deployment/gateway deployment/docs -n testcraft --timeout=120s

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

api-gitlab:
	$(GITLAB_CI_LOCAL) api:build-test

web-gitlab:
	$(GITLAB_CI_LOCAL) web:build-test

e2e-gitlab:
	$(GITLAB_CI_LOCAL) e2e

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

format:
	pnpm format
	dotnet csharpier format .
