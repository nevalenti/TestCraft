import "dotenv/config";

import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  // @ts-expect-error runtime supports async adapter, typings don't yet.
  migrate: {
    async adapter() {
      const { PrismaPg } = await import("@prisma/adapter-pg");
      return new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    },
  },
});
