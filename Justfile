set shell := ["bash", "-euc"]

kubectl := "sudo k3s kubectl"
helm_deploy := "sudo helm --kubeconfig /etc/rancher/k3s/k3s.yaml upgrade --install testcraft infrastructure/helm/testcraft --namespace testcraft --values infrastructure/helm/testcraft/values.production.yaml --values infrastructure/helm/testcraft/values.secrets.yaml --reset-then-reuse-values --server-side=true --force-conflicts"
gitlab_ci_local := "pnpm exec gitlab-ci-local --ignore-predefined-vars CI,CI_PIPELINE_SOURCE --variable CI_PIPELINE_SOURCE=web --privileged --variable NODE_TLS_REJECT_UNAUTHORIZED=0"
ghcr_owner := "nevalenti"
jenkins_image := "testcraft-jenkins-controller"

apps := "api web gateway docs"

[private]
render:
    scripts/render-image-versions.sh
    scripts/render-dev-realm.sh

up: render
    docker compose --env-file .env --env-file infrastructure/image-versions.env up -d

down: render
    docker compose --env-file .env --env-file infrastructure/image-versions.env down -v

namespace:
    scripts/k8s-namespace.sh

tls-secret: namespace
    scripts/k8s-tls-bootstrap.sh

[private]
helm-deps:
    helm dependency update infrastructure/helm/testcraft

deploy-prod: namespace tls-secret helm-deps
    {{ helm_deploy }}
    scripts/rollout.sh {{ prepend("deployment/", apps) }}

deploy-app app tag: namespace tls-secret helm-deps
    scripts/deploy-app.sh {{ app }} {{ tag }} {{ ghcr_owner }}

destroy:
    {{ kubectl }} delete namespace testcraft --ignore-not-found

status:
    {{ kubectl }} get all -n testcraft

github app job=(if app == "e2e" { "e2e" } else { "build-test" }):
    #!/usr/bin/env bash
    set -euo pipefail
    act push -W .github/workflows/{{ app }}.yml -j {{ job }} --secret-file .secrets
    if [ "{{ app }}" = "e2e" ]; then docker stop keycloak 2>/dev/null || true; fi

gitlab app job=(if app == "e2e" { "e2e" } else { app + ":build-test" }):
    {{ gitlab_ci_local }} {{ job }}

jenkins-image:
    docker build -t {{ jenkins_image }} -f jenkins/controller/Dockerfile jenkins/controller

jenkins-up:
    jenkins/controller/run.sh

jenkins-down:
    docker stop testcraft-jenkins-controller 2>/dev/null || true

jenkins app:
    #!/usr/bin/env bash
    set -euo pipefail
    jenkins/controller/run.sh {{ app }}
    if [ "{{ app }}" = "e2e" ]; then docker stop keycloak testcraft-e2e-postgres 2>/dev/null || true; fi

format:
    pnpm format
    dotnet csharpier format .
    dotnet format style --no-restore TestCraft.slnx

lint:
    pnpm lint
    dotnet format style --verify-no-changes --no-restore TestCraft.slnx
