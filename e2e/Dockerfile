FROM mcr.microsoft.com/playwright:v1.60.0-noble

WORKDIR /e2e

RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

CMD ["pnpm", "test"]
