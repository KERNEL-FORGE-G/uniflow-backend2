#!/bin/bash
# ==============================================================================
# Script de déploiement en production VPS — UniFlow Backend (Dev D)
# ==============================================================================

set -e

echo "🚀 Démarrage du déploiement UniFlow Backend..."

# 1. Vérification de la présence du fichier .env
if [ ! -f .env ]; then
  echo "❌ Erreur: Fichier .env manquant en production!"
  exit 1
fi

# 2. Build et démarrage des conteneurs Docker
echo "📦 Construction et exécution des conteneurs Docker (Production)..."
docker compose -f docker-compose.prod.yml up -d --build

# 3. Migration automatique de la base de données
echo "🗄️ Application des migrations Prisma..."
docker compose -f docker-compose.prod.yml exec -T api npx prisma migrate deploy

echo "✅ Déploiement réussi avec succès!"
