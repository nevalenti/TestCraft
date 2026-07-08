# A real Jenkins controller (not jenkinsfile-runner - see README for why: jenkinsfile-runner's
# last release predates Jenkins core's Jetty 12 migration and can't run any core version new
# enough to satisfy current plugin requirements).
FROM jenkins/jenkins:lts-jdk21

ARG PLUGINS="workflow-aggregator credentials-binding htmlpublisher configuration-as-code job-dsl junit"

ENV DOTNET_ROOT=/usr/share/dotnet \
    DOTNET_NOLOGO=1 \
    DOTNET_CLI_TELEMETRY_OPTOUT=1 \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1 \
    PATH="/usr/share/dotnet:/usr/share/dotnet/tools:/usr/local/node/bin:${PATH}" \
    CASC_JENKINS_CONFIG=/usr/share/jenkins/ref/jcasc.yaml \
    JAVA_OPTS="-Dhudson.security.csrf.GlobalCrumbIssuerConfiguration.DISABLE_CSRF_PROTECTION=true -Djenkins.install.runSetupWizard=false"

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
      curl wget git ca-certificates unzip gnupg xz-utils jq \
    && rm -rf /var/lib/apt/lists/*

# Docker CLI only - talks to the host daemon via a mounted socket.
RUN curl -fsSL https://download.docker.com/linux/static/stable/x86_64/docker-27.3.1.tgz -o /tmp/docker.tgz \
    && tar -xzf /tmp/docker.tgz -C /tmp \
    && mv /tmp/docker/docker /usr/local/bin/docker \
    && rm -rf /tmp/docker.tgz /tmp/docker

# buildx plugin - some Dockerfiles here (e.g. apps/web) use `FROM --platform=$BUILDPLATFORM`,
# a BuildKit-only feature; without this the CLI falls back to the legacy builder and fails to
# parse that syntax.
RUN mkdir -p /usr/local/lib/docker/cli-plugins \
    && curl -fsSL https://github.com/docker/buildx/releases/download/v0.35.0/buildx-v0.35.0.linux-amd64 -o /usr/local/lib/docker/cli-plugins/docker-buildx \
    && chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx

# .NET SDK 10 (jenkins/api)
RUN curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh \
    && chmod +x /tmp/dotnet-install.sh \
    && /tmp/dotnet-install.sh --channel 10.0 --install-dir "${DOTNET_ROOT}" \
    && rm /tmp/dotnet-install.sh

# Node 24 + pnpm (jenkins/web, jenkins/e2e)
RUN curl -fsSL https://nodejs.org/dist/v24.16.0/node-v24.16.0-linux-x64.tar.xz -o /tmp/node.tar.xz \
    && mkdir -p /usr/local/node \
    && tar -xJf /tmp/node.tar.xz -C /usr/local/node --strip-components=1 \
    && rm /tmp/node.tar.xz \
    && corepack enable

# Plugins resolve against this image's own bundled core, so there's no hand-pinned
# core/plugin version matrix to keep in sync (that's what broke jenkinsfile-runner).
RUN jenkins-plugin-cli --plugins ${PLUGINS}

COPY jcasc.yaml /usr/share/jenkins/ref/jcasc.yaml
