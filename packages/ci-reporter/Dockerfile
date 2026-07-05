FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ci-reporter/package.json ./packages/ci-reporter/

RUN pnpm install --frozen-lockfile

COPY packages/ci-reporter/ ./packages/ci-reporter/

RUN pnpm --filter @testcraft/ci-reporter run build

FROM node:20-alpine AS runtime
WORKDIR /app

RUN addgroup -S -g 1001 appgroup && \
    adduser -S -u 1001 -G appgroup -H appuser

COPY --from=build /app/packages/ci-reporter/dist/cli.js ./cli.js

USER appuser

ENTRYPOINT ["node", "/app/cli.js"]
CMD ["import"]
