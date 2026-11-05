FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches/ ./patches/
COPY apps/docs/package.json ./apps/docs/

RUN pnpm install --frozen-lockfile

COPY apps/docs/ ./apps/docs/

RUN pnpm --filter testcraft-docs run build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

USER root
ARG APK_CACHE_BUST=0
RUN echo "apk-cache-bust=${APK_CACHE_BUST}" && apk update && apk upgrade --no-cache

COPY apps/docs/default.conf.template /etc/nginx/templates/default.conf.template

COPY --from=build /app/apps/docs/dist /usr/share/nginx/html

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
