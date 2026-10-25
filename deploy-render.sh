#!/bin/bash
set -e

# Render build script for MewCMS
echo "🚀 Starting Render build process..."

# Install Composer dependencies
echo "📦 Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction

# Install Node dependencies
echo "📦 Installing Node dependencies..."
npm ci

# Build frontend assets and the SSR bundle
echo "🏗️ Building frontend assets and SSR bundle with Vite..."
npm run build:ssr

echo "✅ Build completed successfully!"
