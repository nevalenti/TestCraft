.PHONY: up down clean \
        build load images destroy status deploy \
        api-dotnet api web e2e \
        migrate seed \
        format

API_IMAGE = testcraft-api
WEB_IMAGE = testcraft-web
GATEWAY_IMAGE = testcraft-gateway
KUBECTL = sudo k3s kubectl

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

destroy:
	$(KUBECTL) delete namespace testcraft --ignore-not-found

status:
	$(KUBECTL) get all -n testcraft

deploy: images
	$(KUBECTL) apply -k .
	$(KUBECTL) rollout restart deployment/api deployment/web deployment/gateway -n testcraft
	$(KUBECTL) rollout status deployment/api deployment/web deployment/gateway -n testcraft --timeout=120s

api-dotnet:
	act push -W .github/workflows/api-dotnet.yml -j build-test --secret-file .secrets

api:
	act push -W .github/workflows/api.yml -j build-test --secret-file .secrets

web:
	act push -W .github/workflows/web.yml -j build-test --secret-file .secrets

e2e:
	act push -W .github/workflows/e2e.yml -j e2e --secret-file .secrets

migrate:
	pnpm --filter testcraft-api run db:migrate

seed:
	pnpm --filter testcraft-api run db:seed

format:
	pnpm format
	dotnet csharpier format .
