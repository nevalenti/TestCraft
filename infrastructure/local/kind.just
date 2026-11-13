set shell := ["bash", "-euc"]
set working-directory := "../.."

cluster := "testcraft-prod-local"
context := "kind-" + cluster
chart := "infrastructure/helm/testcraft"
local_values := chart / "values.local.yaml"
secrets_file := chart / "values.local.secrets.yaml"
cert_manager_version := "v1.21.2"

up: cluster (deploy "all")

cluster:
    #!/usr/bin/env bash
    set -euo pipefail
    kind get clusters | grep -qx {{ cluster }} || kind create cluster --name {{ cluster }} --config infrastructure/local/kind.yaml
    helm --kube-context {{ context }} upgrade --install cert-manager cert-manager \
      --repo https://charts.jetstack.io --version {{ cert_manager_version }} \
      --namespace cert-manager --create-namespace --set crds.enabled=true --wait
    kubectl() { command kubectl --context {{ context }} "$@"; }
    kubectl create namespace testcraft --dry-run=client -o yaml | kubectl apply -f -
    kubectl label namespace testcraft app.kubernetes.io/managed-by=Helm --overwrite
    kubectl annotate namespace testcraft meta.helm.sh/release-name=testcraft meta.helm.sh/release-namespace=testcraft --overwrite
    ca=$(mkcert -CAROOT)
    kubectl -n testcraft create secret tls testcraft-ca-tls --cert="$ca/rootCA.pem" --key="$ca/rootCA-key.pem" --dry-run=client -o yaml | kubectl apply -f -

[private]
secrets:
    #!/usr/bin/env bash
    set -euo pipefail
    [ -f {{ secrets_file }} ] && exit 0
    umask 077
    keys=(postgresPassword postgresAppPassword postgresKeycloakPassword postgresMonitorPassword postgresGlitchtipPassword
      glitchtipSecretKey rabbitmqPassword redisPassword metricsToken swaggerBasicAuthPassword hangfireBasicAuthPassword
      minioRootPassword grafanaAdminPassword keycloakAdminPassword keycloakAdminClientSecret testcraftCiClientSecret)
    lines=("secrets:")
    for key in "${keys[@]}"; do
      value=$(od -An -N24 -tx1 /dev/urandom | tr -d ' \n')
      [ ${#value} -eq 48 ] || { echo "could not generate a value for $key" >&2; exit 1; }
      lines+=("  $key: \"$value\"")
    done
    printf '%s\n' "${lines[@]}" > {{ secrets_file }}
    echo "generated {{ secrets_file }}"

deploy *apps="all": secrets
    #!/usr/bin/env bash
    set -euo pipefail
    apps="{{ apps }}"
    [ "$apps" = all ] && apps="api web gateway docs"
    tag="local-$(git rev-parse --short HEAD)-$(date +%s)"
    web_url=$(yq '.platform.webBaseUrl' {{ local_values }})
    auth_url=$(yq '.keycloak.hostname' {{ local_values }})
    images=() sets=()
    for app in $apps; do
      case "$app" in
        api)
          docker build -f apps/Api/Dockerfile -t "testcraft-api:$tag" .
          docker build -f apps/Api/Migrator.Dockerfile -t "testcraft-migrator:$tag" .
          images+=("testcraft-api:$tag" "testcraft-migrator:$tag")
          sets+=(--set "images.api.tag=$tag" --set "images.migrator.tag=$tag") ;;
        web)
          docker build -f apps/web/Dockerfile -t "testcraft-web:$tag" \
            --build-arg VITE_API_URL="$web_url" --build-arg VITE_KEYCLOAK_URL="$auth_url" \
            --build-arg VITE_KEYCLOAK_REALM=testcraft --build-arg VITE_KEYCLOAK_CLIENT_ID=testcraft-web \
            --build-arg VITE_RELEASE="$tag" --build-arg VITE_ENVIRONMENT=local .
          images+=("testcraft-web:$tag")
          sets+=(--set "images.web.tag=$tag") ;;
        gateway)
          docker build -f apps/Gateway/Dockerfile --build-arg GIT_SHA="$(git rev-parse HEAD)" -t "testcraft-gateway:$tag" .
          images+=("testcraft-gateway:$tag")
          sets+=(--set "images.gateway.tag=$tag") ;;
        docs)
          docker build -f apps/docs/Dockerfile -t "testcraft-docs:$tag" .
          images+=("testcraft-docs:$tag")
          sets+=(--set "images.docs.tag=$tag") ;;
        *) echo "unknown app '$app' (expected api, web, gateway, docs or all)" >&2; exit 1 ;;
      esac
    done
    kind load docker-image "${images[@]}" --name {{ cluster }}
    [ -d {{ chart }}/charts ] || helm dependency build {{ chart }}
    helm --kube-context {{ context }} upgrade --install testcraft {{ chart }} --namespace testcraft \
      --values {{ local_values }} --values {{ secrets_file }} \
      --reset-then-reuse-values "${sets[@]}" \
      --wait --wait-for-jobs --timeout 10m

[confirm("Delete the local testcraft namespace, its data and its volumes?")]
destroy:
    kubectl --context {{ context }} delete namespace testcraft --ignore-not-found --wait
