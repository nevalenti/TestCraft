FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/docs/package.json ./apps/docs/

RUN pnpm install --frozen-lockfile

COPY apps/docs/ ./apps/docs/

RUN pnpm --filter testcraft-docs run build

FROM nginx:1.31-alpine AS runtime

RUN rm /etc/nginx/conf.d/default.conf

COPY apps/docs/default.conf.template /etc/nginx/templates/default.conf.template

COPY --from=build /app/apps/docs/dist /usr/share/nginx/html

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
