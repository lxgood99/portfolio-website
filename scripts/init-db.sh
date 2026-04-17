#!/bin/bash
# Database initialization script

set -e

# Load environment variables
export DB_HOST=${DB_HOST:-localhost}
export DB_PORT=${DB_PORT:-5432}
export DB_NAME=${DB_NAME:-portfolio}
export DB_USER=${DB_USER:-portfolio}
export DB_PASSWORD=${DB_PASSWORD:-portfolio123}

# Build the project first
pnpm run build

# Run drizzle push to sync schema
pnpm exec drizzle-kit push

echo "Database initialized successfully!"
