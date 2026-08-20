#!/bin/bash
# ─────────────────────────────────────────────────────────────
# STARTUP SCRIPT - Marchés Publics Kit
# Usage: ./start.sh
# ─────────────────────────────────────────────────────────────

set -e

echo "🚀 Starting Marchés Publics Kit..."

# Check .env exists
if [ ! -f .env ]; then
    echo "❌ .env manquant. Copiez .env.example vers .env et remplissez les valeurs."
    exit 1
fi

# Load env
source .env

# Check required vars
required_vars=("POSTGRES_PASSWORD" "N8N_ENCRYPTION_KEY" "NEXTAUTH_SECRET" "DOMAIN")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ] || [[ "${!var}" == CHANGE_ME* ]]; then
        echo "❌ Variable $var non configurée dans .env"
        exit 1
    fi
done

echo "✅ Variables d'environnement OK"

# Create networks/volumes if needed
docker network create marches-net 2>/dev/null || true

# Pull latest images
echo "📦 Pulling images..."
docker compose pull

# Start infrastructure first
echo "🐘 Starting PostgreSQL & Redis..."
docker compose up -d postgres redis

# Wait for postgres
echo "⏳ Waiting for PostgreSQL..."
until docker compose exec -T postgres pg_isready -U marches_user -d marches_publics >/dev/null 2>&1; do
    sleep 2
done
echo "✅ PostgreSQL ready"

# Start n8n, webapp, metabase
echo "🔄 Starting n8n, Webapp, Metabase..."
docker compose up -d n8n webapp metabase

# Wait for n8n
echo "⏳ Waiting for n8n..."
until curl -sf "http://localhost:5678/healthz" >/dev/null 2>&1; do
    sleep 3
done
echo "✅ n8n ready"

# Start Caddy (SSL)
echo "🔐 Starting Caddy (SSL auto)..."
docker compose up -d caddy

# Optional: Watchtower
if [ "$ENABLE_WATCHTOWER" = "true" ]; then
    docker compose up -d watchtower
fi

echo ""
echo "🎉 Marchés Publics Kit is running!"
echo ""
echo "📍 URLs:"
echo "   Webapp (Clients):     https://${WEBAPP_HOST}"
echo "   n8n (Automation):     https://${N8N_HOST}"
echo "   Metabase (Dashboard): https://${METABASE_HOST}"
echo ""
echo "📋 Next steps:"
echo "   1. Import n8n workflows: n8n UI → Workflows → Import (5 JSON files)"
echo "   2. Configure n8n credentials: PostgreSQL, Telegram, SMTP"
echo "   3. Activate workflows in n8n"
echo "   4. Test onboarding: https://${WEBAPP_HOST}/onboarding"
echo "   5. Check Metabase dashboard"
echo ""
echo "📖 Logs: docker compose logs -f [service]"