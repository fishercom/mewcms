#!/bin/sh
set -e

echo "🚀 Booting MewCMS Production Container..."

# Generate APP_KEY if missing
if [ -z "$APP_KEY" ]; then
  echo "🔑 APP_KEY is empty, generating one..."
  php artisan key:generate --force
fi

# Ensure storage directories exist with proper permissions
mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Create storage symlink
php artisan storage:link || true

# Run database migrations
echo "🗄️ Running database migrations..."
php artisan migrate --force

# Seed database if RUN_SEED is enabled
if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 Seeding initial demo content..."
  php artisan db:seed --force
fi

# Cache production routes, views and config
echo "⚡ Optimizing Laravel for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start web server
echo "🌐 Starting web server on 0.0.0.0:${PORT:-8080}..."
exec php -S 0.0.0.0:${PORT:-8080} -t public public/index.php
