#!/bin/bash
set -e

echo "🚀 Starting MewCMS application on Render..."

# Create storage symlink
php artisan storage:link || true

# Run database migrations
echo "🗃️ Running migrations..."
php artisan migrate --force

# Run seeder if RUN_SEED is true
if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 Seeding database initial content..."
  php artisan db:seed --force
fi

# Optimize Laravel for production
echo "⚡ Optimizing Laravel..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start web server
echo "🌐 Starting web server on port ${PORT:-8000}..."
php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
