import { execSync } from "node:child_process";
import { resolve } from "node:path";

import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PostgreSqlContainer } from "@testcontainers/postgresql";

let container: StartedPostgreSqlContainer;

export async function setup({
  provide,
}: {
  provide: (key: string, value: unknown) => void;
}) {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();
  const databaseUrl = container.getConnectionUri();

  execSync("pnpm prisma migrate deploy", {
    cwd: resolve(import.meta.dirname, "../../.."),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "pipe",
  });

  provide("databaseUrl", databaseUrl);
}

export async function teardown() {
  await container?.stop();
}
