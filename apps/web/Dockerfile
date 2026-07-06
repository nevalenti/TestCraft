FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY packages/types/ ./packages/types/
COPY apps/web/ ./apps/web/
COPY apps/Api/openapi/ ./apps/Api/openapi/

ARG VITE_API_URL=https://testcraft.dev
ARG VITE_KEYCLOAK_URL=https://testcraft.dev:8443
ARG VITE_KEYCLOAK_REALM=testcraft
ARG VITE_KEYCLOAK_CLIENT_ID=testcraft-web

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL
ENV VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM
ENV VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID

RUN pnpm --filter @testcraft/types run build
RUN pnpm --filter testcraft-web run build

FROM nginx:1.27-alpine AS runtime

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
