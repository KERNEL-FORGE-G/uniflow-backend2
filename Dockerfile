# Dockerfile
#
# Build multi-stage pour l'API NestJS UniFlow.
# Objectif (§9.3 et §11.2 du CDC) : image de production minimale (Alpine),
# sans les outils de compilation ni les dépendances de dev dans l'image finale.
#
# Étape 1 "builder" : compile le TypeScript, génère le client Prisma.
# Étape 2 "runner"  : ne garde que le strict nécessaire pour exécuter l'app.

# ---------- Étape 1 : builder ----------
FROM node:20-alpine AS builder

WORKDIR /app

# On copie d'abord uniquement les fichiers de dépendances pour profiter
# du cache Docker : si package.json ne change pas, npm ci n'est pas relancé
# à chaque modification du code source.
COPY package*.json ./
RUN npm ci

# Schéma Prisma nécessaire pour générer le client avant le build TypeScript
COPY prisma ./prisma
RUN npx prisma generate

# Reste du code source
COPY . .

# Compile le TypeScript -> dossier dist/
RUN npm run build

# ---------- Étape 2 : runner (image finale) ----------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# On ne réinstalle que les dépendances de PRODUCTION (pas @nestjs/cli,
# pas jest, pas eslint, etc.) -> image plus petite et plus sûre.
COPY package*.json ./
RUN npm ci --omit=dev

# On récupère uniquement ce qui est nécessaire à l'exécution depuis
# l'étape builder : le code compilé, le client Prisma généré, le schéma.
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Utilisateur non-root pour la sécurité (§9.3 du CDC — bonnes pratiques
# infrastructure), plutôt que de tourner en root par défaut dans le conteneur.
RUN addgroup -S uniflow && adduser -S uniflow -G uniflow
USER uniflow

EXPOSE 3000

CMD ["node", "dist/main"]