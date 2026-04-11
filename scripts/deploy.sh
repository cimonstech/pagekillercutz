#!/bin/bash
set -e

echo "=== KillerCutz Deployment Script ==="
echo "Running on: $(date)"

# Pull latest code
echo "Pulling latest code..."
git stash
git pull origin main
git stash pop || true

# Install dependencies
echo "Installing dependencies..."
npm ci --production=false

# Build the project
echo "Building Next.js..."
npm run build

# Restart PM2
echo "Restarting PM2..."
pm2 restart killercutz || pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

echo "=== Deployment complete ==="
pm2 logs killercutz --lines 20
