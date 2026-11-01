FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.34.5 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY packages/types/ ./packages/types/
COPY apps/web/ ./apps/web/
COPY apps/Api/openapi/contract/ ./apps/Api/openapi/contract/

ARG VITE_API_URL=https://build-arg-not-set.invalid
ARG VITE_KEYCLOAK_URL=https://build-arg-not-set.invalid
ARG VITE_KEYCLOAK_REALM=build-arg-not-set
ARG VITE_KEYCLOAK_CLIENT_ID=build-arg-not-set
ARG VITE_GLITCHTIP_DSN=
ARG VITE_RELEASE=dev
ARG VITE_ENVIRONMENT=production
ARG SENTRY_URL=
ARG SENTRY_ORG=
ARG SENTRY_PROJECT=

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL
ENV VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM
ENV VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID
ENV VITE_GLITCHTIP_DSN=$VITE_GLITCHTIP_DSN
ENV VITE_RELEASE=$VITE_RELEASE
ENV VITE_ENVIRONMENT=$VITE_ENVIRONMENT

RUN pnpm --filter @testcraft/types run build
RUN --mount=type=secret,id=glitchtip_auth_token,required=false \
    SENTRY_AUTH_TOKEN="$(cat /run/secrets/glitchtip_auth_token 2>/dev/null || true)" \
    SENTRY_URL="$SENTRY_URL" SENTRY_ORG="$SENTRY_ORG" SENTRY_PROJECT="$SENTRY_PROJECT" \
    pnpm --filter testcraft-web run build \
    && find apps/web/dist -name '*.map' -delete

FROM nginx:1.27-alpine AS runtime

ARG APK_CACHE_BUST=0
RUN echo "apk-cache-bust=${APK_CACHE_BUST}" && apk update && apk upgrade --no-cache

RUN rm /etc/nginx/conf.d/default.conf

COPY apps/web/default.conf.template /etc/nginx/templates/default.conf.template

COPY --from=build /app/apps/web/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html \
  && chown -R nginx:nginx /var/cache/nginx \
  && chown -R nginx:nginx /var/log/nginx \
  && chown -R nginx:nginx /etc/nginx/conf.d \
  && touch /var/run/nginx.pid \
  && chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
