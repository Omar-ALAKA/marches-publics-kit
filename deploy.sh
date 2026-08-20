#!/bin/bash
# ─────────────────────────────────────────────────────────────
# DEPLOY SCRIPT - Marchés Publics Kit (Production)
# Usage: ./deploy.sh
# ─────────────────────────────────────────────────────────────

set -e

echo "🚀 Deploying Marchés Publics Kit to production..."

# Check we're on main branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
    echo "⚠️  Not on main/master branch (currently: $BRANCH)"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin $BRANCH

# Load env
if [ ! -f .env ]; then
    echo "❌ .env manquant"
    exit 1
fi
source .env

# Build webapp image
echo "🏗️  Building webapp image..."
docker compose build webapp --no-cache

# Backup database (before migrations)
echo "💾 Backing up database..."
BACKUP_FILE="backups/marches_publics_$(date +%Y%m%d_%H%M%S).sql"
mkdir -p backups
docker compose exec -T postgres pg_dump -U marches_user marches_publics > "$BACKUP_FILE"
echo "✅ Backup saved to $BACKUP_FILE"

# Stop services gracefully
echo "🛑 Stopping services..."
docker compose down --remove-orphans

# Start fresh
echo "🔄 Starting services..."
docker compose up -d

# Wait for health
echo "⏳ Waiting for services..."
sleep 10

# Check health
services=("postgres" "redis" "n8n" "webapp" "metabase" "caddy")
for svc in "${services[@]}"; do
    if docker compose ps $svc | grep -q "Up"; then
        echo "✅ $svc: Running"
    else
        echo "❌ $svc: Failed"
        docker compose logs $svc --tail 50
    fi
done

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📍 URLs:"
echo "   Webapp:     https://${WEBAPP_HOST}"
echo "   n8n:        https://${N8N_HOST}"
echo "   Metabase:   https://${METABASE_HOST}"
echo ""
echo "📋 Post-deploy checklist:"
echo "   □ Test onboarding flow"
echo "   □ Verify n8n workflows active"
echo "   □ Check Telegram alerts"
echo "   □ Verify Metabase dashboard"
echo "   □ Test SSL certificates"