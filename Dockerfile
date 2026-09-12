# --- Stage 1: Build PHP dependencies ---
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install \
  --no-dev \
  --no-scripts \
  --ignore-platform-reqs \
  --prefer-dist \
  --no-interaction \
  --no-progress \
  --optimize-autoloader


# --- Stage 2: Build frontend assets with Vite ---
FROM node:20-alpine AS asset-builder
WORKDIR /app

# Copy vendor for Vite alias resolution (ziggy)
COPY --from=vendor /app/vendor ./vendor

# Install deps
COPY package*.json ./
RUN npm ci --omit=dev=false

# Copy only files needed for the Vite build
COPY resources ./resources
COPY vite.config.ts tsconfig.json components.json ./

# Build assets to public/build
ENV NODE_ENV=production
RUN npm run build


# --- Stage 3: Runtime (PHP built-in server) ---
FROM php:8.3-alpine AS runtime
WORKDIR /var/www/html

# System and PHP extensions
RUN apk add --no-cache \
    bash \
    curl \
    icu-dev \
    oniguruma-dev \
    ca-certificates \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libwebp-dev && \
    docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp && \
    docker-php-ext-install pdo_mysql mbstring intl bcmath exif gd && \
    rm -rf /var/cache/apk/*

# Copy application code
COPY . .

# Bring in vendor deps, composer binary and built assets
COPY --from=vendor /usr/bin/composer /usr/bin/composer
COPY --from=vendor /app/vendor ./vendor
COPY --from=asset-builder /app/public/build ./public/build

# Ensure writable dirs
RUN mkdir -p storage bootstrap/cache && \
    chown -R www-data:www-data storage bootstrap/cache

# Render provides PORT env
ENV PORT=8080
EXPOSE 8080

# Configure entrypoint
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]


