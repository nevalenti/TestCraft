FROM node:24-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

COPY packages/types/ ./packages/types/
COPY apps/api/ ./apps/api/

RUN pnpm --filter @testcraft/types run build
RUN pnpm --filter testcraft-api run db:generate
RUN pnpm --filter testcraft-api run build

RUN pnpm --filter testcraft-api deploy --prod --legacy /standalone

RUN cp -r /app/apps/api/dist /standalone/dist && \
    cp -r /app/apps/api/prisma /standalone/prisma && \
    cp /app/apps/api/prisma.config.ts /standalone/prisma.config.ts

FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S -g 1001 appgroup && \
    adduser -S -u 1001 -G appgroup -H appuser

RUN apk add --no-cache curl

COPY --from=builder /standalone/node_modules ./node_modules
COPY --from=builder /standalone/package.json ./
COPY --from=builder /standalone/dist ./dist
COPY --from=builder /standalone/prisma ./prisma
COPY --from=builder /standalone/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/apps/api/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x docker-entrypoint.sh

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
