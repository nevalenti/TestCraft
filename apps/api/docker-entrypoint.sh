#!/bin/sh
set -e

[ "$APPLY_MIGRATIONS" = "true" ] && node_modules/.bin/prisma migrate deploy
[ "$SEED_DATA" = "true" ]        && node_modules/.bin/tsx src/infrastructure/database/seed.ts

exec node_modules/.bin/tsx --max-old-space-size=512 src/server.ts
