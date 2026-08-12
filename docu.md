# 📙 Documentation API UniFlow - Backend 2 (Comptes Indépendants & SaaS Auto-géré)

Ce backend hébergé sur **Vercel Serverless** gère les **étudiants et enseignants indépendants (non rattachés à une université partenaire)**. Ces utilisateurs gèrent eux-mêmes leurs matières, leurs emplois du temps et leurs notes, et bénéficient d'un tarif adapté à leur zone géographique.

---

## ⚙️ Configuration de l'URL de base

Variable d'environnement Frontend : `VITE_PERSONAL_API_URL`  
Exemple URL : `https://api-personal.uniflow.app` ou `https://uniflow-personal-backend.vercel.app`

---

## 💳 1. Tarification & Abonnements (`/api/subscription`)

### Grille Tarifaire Géolocalisée

| Pays | Tarif Mensuel | Devise | Modes de Paiement Supportés |
| :--- | :--- | :--- | :--- |
| **Cameroun (`CM`)** | **100 FCFA / mois** | `XAF` | MTN Mobile Money, Orange Money (NotchPay / CinetPay) |
| **International** | **1,00 € / mois** | `EUR` | Carte Bancaire, Stripe, Apple Pay |

---

### `GET /api/subscription/pricing?countryCode=CM`
Détermine automatiquement la grille tarifaire selon le pays détecté ou passé en paramètre.
* **Query Parameters**: `countryCode` (ex: `CM` ou `FR`)
* **Response (200 OK - Cameroun)**:
  ```json
  {
    "countryCode": "CM",
    "currency": "XAF",
    "amount": 100,
    "formattedPrice": "100 FCFA / mois",
    "billingInterval": "MONTHLY",
    "providers": ["MTN_MOMO", "ORANGE_MONEY", "NOTCHPAY"]
  }
  ```
* **Response (200 OK - France/International)**:
  ```json
  {
    "countryCode": "FR",
    "currency": "EUR",
    "amount": 1.00,
    "formattedPrice": "1,00 € / mois",
    "billingInterval": "MONTHLY",
    "providers": ["STRIPE", "CARD"]
  }
  ```

---

### `POST /api/subscription/checkout`
Initie le processus de paiement d'abonnement mensuel.
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Body (Cameroun - Mobile Money)**:
  ```json
  {
    "countryCode": "CM",
    "paymentProvider": "NOTCHPAY",
    "phoneNumber": "+237678901234"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "transactionId": "tx_cm_8912",
    "paymentUrl": "https://pay.notchpay.co/checkout/tx_cm_8912",
    "status": "PENDING",
    "message": "Veuillez valider le retrait Mobile Money sur votre téléphone."
  }
  ```

---

### `GET /api/subscription/status`
Vérifie le statut de l'abonnement de l'utilisateur connecté.
* **Response (200 OK)**:
  ```json
  {
    "status": "ACTIVE",
    "countryCode": "CM",
    "currency": "XAF",
    "monthlyAmount": 100,
    "currentPeriodEnd": "2026-09-12T00:00:00Z",
    "isAutoRenew": true
  }
  ```

---

## 📝 2. Gestion Autonome des Matières (`/api/personal/subjects`)

### `GET /api/personal/subjects`
Liste les matières créées par l'étudiant indépendant.
* **Response (200 OK)**:
  ```json
  [
    {
      "id": "psub_1",
      "code": "MAT201",
      "name": "Analyse Numérique",
      "instructorName": "Prof. Mbarga",
      "credits": 4,
      "colorHex": "#2563eb"
    }
  ]
  ```

### `POST /api/personal/subjects`
Ajoute une nouvelle matière.
* **Body**:
  ```json
  {
    "code": "INF204",
    "name": "Structures de Données C++",
    "instructorName": "Dr. Etoa",
    "credits": 3,
    "colorHex": "#10b981"
  }
  ```

---

## 📅 3. Emploi du Temps Personnel (`/api/personal/schedules`)

### `POST /api/personal/schedules`
Ajoute une plage horaire de cours sur l'emploi du temps.
* **Body**:
  ```json
  {
    "subjectId": "psub_1",
    "dayOfWeek": "LUNDI",
    "startTime": "08:00:00",
    "endTime": "10:00:00",
    "classroomLocation": "Amphi 300"
  }
  ```

---

## 📊 4. Calculator & Notes (`/api/personal/grades`)

### `POST /api/personal/grades`
Enregistre une note pour calculer la moyenne générale.
* **Body**:
  ```json
  {
    "subjectId": "psub_1",
    "evaluationTitle": "Contrôle Continu 1",
    "score": 14.50,
    "maxScore": 20.00,
    "coefficient": 0.30
  }
  ```

