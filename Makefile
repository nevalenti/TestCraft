.PHONY: up down clean \
        build load images deploy destroy status \
        api web e2e \
        format

API_IMAGE = testcraft-api
WEB_IMAGE = testcraft-web
GATEWAY_IMAGE = testcraft-gateway
KUBECTL = sudo k3s kubectl
HELM = sudo helm --kubeconfig /etc/rancher/k3s/k3s.yaml

up:
	docker compose up -d

down:
	docker compose down -v

build:
	docker build -t $(API_IMAGE) -f apps/Api/Dockerfile .
	docker build -t $(WEB_IMAGE) -f apps/web/Dockerfile .
	docker build -t $(GATEWAY_IMAGE) -f apps/Gateway/Dockerfile .

load:
	docker save $(API_IMAGE):latest | sudo k3s ctr images import -
	docker save $(WEB_IMAGE):latest | sudo k3s ctr images import -
	docker save $(GATEWAY_IMAGE):latest | sudo k3s ctr images import -

images: build load

deploy: images
	$(KUBECTL) create namespace testcraft --dry-run=client -o yaml | $(KUBECTL) apply -f -
	$(KUBECTL) label namespace testcraft app.kubernetes.io/managed-by=Helm --overwrite
	$(KUBECTL) annotate namespace testcraft meta.helm.sh/release-name=testcraft meta.helm.sh/release-namespace=testcraft --overwrite
	$(HELM) upgrade --install testcraft infrastructure/helm/testcraft --namespace testcraft --values infrastructure/helm/testcraft/values.secrets.yaml
	$(KUBECTL) rollout restart deployment/api deployment/web deployment/gateway -n testcraft
	$(KUBECTL) rollout status deployment/api deployment/web deployment/gateway -n testcraft --timeout=120s

destroy:
	$(KUBECTL) delete namespace testcraft --ignore-not-found

status:
	$(KUBECTL) get all -n testcraft

api:
	act push -W .github/workflows/api.yml -j build-test --secret-file .secrets

web:
	act push -W .github/workflows/web.yml -j build-test --secret-file .secrets

e2e:
	act push -W .github/workflows/e2e.yml -j e2e --secret-file .secrets

format:
	pnpm format
	dotnet csharpier format .
