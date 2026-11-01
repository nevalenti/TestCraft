set shell := ["bash", "-euc"]
set dotenv-load := true

compose := "docker compose --env-file .env --env-file infrastructure/image-versions.env"
api_project := "apps/Api/src/TestCraft.Api"
apps := "api web gateway docs"
ghcr_owner := "nevalenti"

default:
    @just --list

[private]
render:
    scripts/render-image-versions.sh
    scripts/render-dev-realm.sh

[group('stack')]
env-sync:
    scripts/env-sync.sh

[group('stack')]
up: env-sync render
    {{ compose }} up -d
    bash scripts/glitchtip-bootstrap.sh

[group('stack')]
down:
    {{ compose }} down

[group('stack')]
[confirm("Delete every local container volume (Postgres, MinIO, Keycloak, GlitchTip)?")]
nuke: render
    {{ compose }} down -v

[group('stack')]
dev:
    uvx honcho start -f Procfile.dev

[group('stack')]
e2e-up: render
    docker compose -p testcraft-e2e -f compose.e2e.yaml up -d --build --wait

[group('stack')]
e2e-down:
    docker compose -p testcraft-e2e -f compose.e2e.yaml down --volumes --remove-orphans

[group('stack')]
container-smoke:
    bash scripts/container-smoke.sh

[group('api')]
api-serve: (api-migrate "seed")
    ASPNETCORE_ENVIRONMENT=Development ASPNETCORE_URLS=http://localhost:5000 dotnet watch run --project {{ api_project }} --no-launch-profile

[group('api')]
api-migrate *args:
    dotnet run --project apps/Api/src/TestCraft.Migrator -- {{ args }}

[group('api')]
api-migration name:
    dotnet ef migrations add {{ name }} --project apps/Api/src/TestCraft.Persistence

[group('api')]
api-db-reset *flags:
    #!/usr/bin/env bash
    set -euo pipefail
    set -a; source .env; set +a
    if [[ "{{ flags }}" != *--yes* ]]; then
        read -rp "Drop and recreate ${POSTGRES_DB}? [y/N] " answer
        [[ "$answer" == [yY] ]] || { echo "Aborted."; exit 0; }
    fi
    docker exec testcraft-postgres psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 \
        -c "DROP DATABASE IF EXISTS \"$POSTGRES_DB\" WITH (FORCE)" \
        -c "CREATE DATABASE \"$POSTGRES_DB\" OWNER \"$POSTGRES_USER\""
    dotnet run --project apps/Api/src/TestCraft.Migrator

[group('api')]
codegen:
    pnpm --filter @testcraft/types run generate
    just web-sdk

[group('api')]
api-contract-baseline:
    UPDATE_CONTRACT_BASELINE=1 dotnet test apps/Api/tests/TestCraft.Api.IntegrationTests --filter "FullyQualifiedName~OpenApiContract"
    pnpm exec oxfmt apps/Api/openapi/v1.json

[group('api')]
api-contract-lint *args:
    pnpm run --silent lint:contract {{ args }}

[group('api')]
api-test *args:
    systemd-run --user --scope --quiet -p MemoryMax=6G -p MemorySwapMax=0 dotnet test TestCraft.slnx {{ args }}

[group('api')]
api-test-unit *args:
    dotnet test apps/Api/tests/TestCraft.Domain.UnitTests {{ args }}
    dotnet test apps/Api/tests/TestCraft.Application.UnitTests {{ args }}
    dotnet test apps/Api/tests/TestCraft.Architecture.Tests {{ args }}

[group('api')]
api-test-integration *args:
    systemd-run --user --scope --quiet -p MemoryMax=6G -p MemorySwapMax=0 dotnet test apps/Api/tests/TestCraft.Api.IntegrationTests {{ args }}

[private]
web-sdk:
    pnpm --filter testcraft-web generate:sdk

[group('web')]
email-preview:
    pnpm --filter @testcraft/emails dev

[group('web')]
email-export:
    pnpm --filter @testcraft/emails build

[group('quality')]
format:
    pnpm format
    dotnet csharpier format .

[group('quality')]
lint:
    pnpm lint
    just api-contract-lint
    dotnet csharpier check .

[group('quality')]
hooks-install:
    uvx --from pre-commit==4.5.1 pre-commit install

[group('quality')]
hooks-check:
    uvx --from pre-commit==4.5.1 pre-commit run --all-files

[group('quality')]
workflow-audit:
    uvx zizmor==1.30.1 --offline .github

[group('quality')]
ci app job=(if app == "e2e" { "e2e" } else { "build-test" }):
    #!/usr/bin/env bash
    set -euo pipefail
    act push -W .github/workflows/ci-{{ app }}.yml -j {{ job }} --secret-file .secrets
    if [ "{{ app }}" = "e2e" ]; then docker stop keycloak 2>/dev/null || true; fi

[group('deploy')]
k8s-bootstrap:
    scripts/k8s-bootstrap.sh

[private]
helm-deps:
    helm dependency update infrastructure/helm/testcraft

[group('deploy')]
deploy-prod: k8s-bootstrap helm-deps
    APPS="{{ apps }}" scripts/deploy.sh

[group('deploy')]
deploy-app app tag: k8s-bootstrap helm-deps
    scripts/deploy.sh {{ app }} {{ tag }} {{ ghcr_owner }}

[group('deploy')]
[confirm("Delete the production testcraft namespace and everything in it?")]
k8s-destroy:
    sudo k3s kubectl delete namespace testcraft --ignore-not-found
