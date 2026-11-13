set shell := ["bash", "-euc"]
set working-directory := "../.."

apps := "api web gateway docs"
ghcr_owner := "nevalenti"

[private]
guard:
    @[ "${TESTCRAFT_DEPLOY_ENV:-}" = production ] || { echo "refusing to touch the production cluster: set TESTCRAFT_DEPLOY_ENV=production on the production host" >&2; exit 1; }

bootstrap: guard
    infrastructure/helm/k8s-bootstrap.sh

[private]
helm-deps:
    helm dependency update infrastructure/helm/testcraft

deploy: bootstrap helm-deps
    APPS="{{ apps }}" infrastructure/helm/deploy.sh

deploy-app app tag: bootstrap helm-deps
    infrastructure/helm/deploy.sh {{ app }} {{ tag }} {{ ghcr_owner }}

[confirm("Delete the production testcraft namespace and everything in it?")]
destroy: guard
    sudo k3s kubectl delete namespace testcraft --ignore-not-found
