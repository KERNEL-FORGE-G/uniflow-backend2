# UniFlow Backend

UniFlow est une plateforme universitaire intelligente, modulaire et "Offline First", conçue pour gérer la scolarité, la planification et la communication au sein d'un établissement d'enseignement supérieur.

---

## 🛠 Tech Stack

- **Framework :** [NestJS](https://nestjs.com/) (TypeScript)
- **Base de données :** PostgreSQL
- **ORM :** [Prisma](https://www.prisma.io/)
- **Documentation API :** Swagger / OpenAPI
- **Stockage Média :** [Cloudinary](https://cloudinary.com/)
- **Authentification :** JWT (JSON Web Tokens)
- **Sécurité :** Helmet, CORS, Rate Limiting (Throttler)

---

## 🚀 Mise en route

### 1. Prérequis
- Node.js (version 20+)
- npm ou yarn
- PostgreSQL (instance locale ou distante)
- Compte Cloudinary pour le stockage des médias

### 2. Installation
```bash
# Cloner le dépôt
git clone <url-du-depot>
cd uniflow-backend

# Installer les dépendances
npm install
```

### 3. Configuration de l'environnement
Copiez le fichier `.env.example` vers `.env` et remplissez les valeurs :

```bash
cp .env.example .env
```

**Variables nécessaires :**
- `DATABASE_URL` : Chaîne de connexion PostgreSQL.
- `JWT_SECRET` : Chaîne longue et aléatoire.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` : Identifiants Cloudinary.

### 4. Base de données
```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate dev --name init
```

---

## 📖 API Documentation

La documentation interactive de l'API est disponible via **Swagger UI** :
👉 [https://api-uniflow.kernelforge.codes/api/docs](https://api-uniflow.kernelforge.codes/api/docs)

### Exemple d'utilisation des endpoints

#### Authentification (`/auth`)
- `POST /auth/register` : Inscription d'un utilisateur.
- `POST /auth/login` : Authentification et obtention d'un JWT.
- `POST /auth/refresh` : Rafraîchissement du token.

#### Étudiants (`/students`)
- `GET /students` : Liste des étudiants (nécessite rôle `SECRETARIAT`+).
- `POST /students` : Création d'un étudiant (nécessite rôle `SECRETARIAT`+).
- `POST /students/:id/upload` : Upload d'un document (via `Multipart/form-data`).

#### Gestion des fichiers (`FilesModule`)
Le backend utilise Cloudinary. Tous les documents (PDF, images, etc.) sont stockés sur Cloudinary et les références sont conservées dans la table `attachments` de la base de données.

---

## ⚙️ Développement & Scripts

- **Démarrer en développement :** `npm run start:dev`
- **Build pour production :** `npm run build`
- **Lancer les tests :** `npm run test`
- **Linting :** `npm run lint`

---

## 🛡️ Architecture & Conventions

Le projet suit une architecture modulaire par fonctionnalités (feature-based). Chaque module contient :
- `*.controller.ts` : Points d'entrée API.
- `*.service.ts` : Logique métier.
- `dto/` : Schémas de validation (class-validator) et documentation (Swagger).

### Traçabilité
Le système implémente une interception globale (`AuditInterceptor`) qui enregistre automatiquement chaque action sensible dans la table `audit_logs` conformément aux exigences de sécurité.

---

## 📝 License
UniFlow est sous licence MIT.
