#!/bin/sh
set -e

[ "$APPLY_MIGRATIONS" = "true" ] && node_modules/.bin/prisma migrate deploy
[ "$SEED_DATA" = "true" ]        && node --max-old-space-size=512 dist/infrastructure/database/seed.js

exec node --max-old-space-size=512 dist/server.js
