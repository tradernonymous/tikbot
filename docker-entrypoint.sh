#!/bin/sh
set -e

# Apply Prisma database migrations on container startup (P1)
if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] Applying Prisma database migrations..."
  if [ -f "./node_modules/prisma/build/index.js" ]; then
    node ./node_modules/prisma/build/index.js migrate deploy || echo "[entrypoint] Warning: Migration deploy encountered non-zero return code"
  elif command -v npx > /dev/null 2>&1; then
    npx prisma migrate deploy || echo "[entrypoint] Warning: Migration deploy encountered non-zero return code"
  else
    echo "[entrypoint] Warning: Prisma CLI not found for automated migration deploy"
  fi
fi

exec "$@"
