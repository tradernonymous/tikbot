#!/bin/sh
set -e

# Apply Prisma database migrations on container startup (P1)
if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] Applying Prisma database migrations..."
  npx prisma migrate deploy || echo "[entrypoint] Warning: Migration deploy encountered non-zero return code"
fi

exec "$@"
