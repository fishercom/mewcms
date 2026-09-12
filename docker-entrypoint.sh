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

# Dump autoload and discover packages with code in place
echo "📦 Finalizing Composer autoloader..."
composer dump-autoload --optimize --no-dev --no-interaction

# Run database migrations
echo "🗄️ Running database migrations..."
php artisan migrate --force

# Seed database only if requested and users table is empty
if [ "$RUN_SEED" = "true" ]; then
  USER_COUNT=$(php artisan tinker --execute="echo \App\Models\User::count();" 2>/dev/null || echo "0")
  if [ "$USER_COUNT" = "0" ]; then
    echo "🌱 Fresh database detected (0 users). Seeding initial demo content..."
    php artisan db:seed --force
  else
    echo "ℹ️ Database is already seeded ($USER_COUNT users found). Skipping seeder."
  fi
fi

# Cache production routes, views and config
echo "⚡ Optimizing Laravel for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start web server
echo "🌐 Starting web server on 0.0.0.0:${PORT:-8080}..."
exec php -S 0.0.0.0:${PORT:-8080} -t public public/index.php
