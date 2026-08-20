# 🌐 Webapp Marchés Publics Partner — Documentation Complète

> **Application Next.js 14** pour l'onboarding client, le dashboard marchés, et l'intégration n8n.
> **Stack** : Next.js App Router + Prisma + NextAuth.js + Tailwind CSS + TypeScript

---

## 🏗️ Architecture Globale

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              WEBAPP (Next.js)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐  │
│  │  Landing     │    │  Onboarding  │    │  Dashboard   │    │  Profile │  │
│  │  Page        │───▶│  (5 étapes)  │───▶│  Client      │    │  & Auth  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘    └──────────┘  │
│         │                    │                    │              │         │
│         ▼                    ▼                    ▼              ▼         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        API ROUTES (Server Actions)                    │  │
│  │  • POST /api/onboarding     → Crée Client + User + Conformité       │  │
│  │  • GET  /api/marches        → Liste marchés du client connecté      │  │
│  │  • POST /api/auth/[...nextauth] → NextAuth (credentials + email)    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│         │                    │                    │              │         │
│         ▼                    ▼                    ▼              ▼         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        LIBRAIRIES PARTAGÉES                            │  │
│  │  • @/lib/prisma.ts      → Client Prisma singleton (DB unique)       │  │
│  │  • @/lib/auth.ts        → Config NextAuth (PrismaAdapter + bcrypt)  │  │
│  │  • @/lib/n8n.ts         → Client webhooks n8n (qualify, generate,   │  │
│  │                             declare-result)                          │  │
│  │  • @/lib/utils.ts       → Formatters (currency, dates, status)      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
└────────────────────────────────────▼────────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
            ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
            │ PostgreSQL  │  │    n8n      │  │  Metabase   │
            │ (Source     │  │ (Workflows) │  │ (Dashboard) │
            │  Unique)    │  │             │  │             │
            └─────────────┘  └─────────────┘  └─────────────┘
```

---

## 🔄 Workflows Intégrés (Webapp ↔ n8n)

### **1. Onboarding Client → Base de Données**
```
Client remplit formulaire (5 étapes)
         │
         ▼
POST /api/onboarding
         │
         ├─▶ Prisma: Client.create() + User.create() + ConformityTracking.create() (6 docs)
         │
         ▼
Response: { success: true, clientId }
         │
         ▼
Redirection /dashboard?onboarded=1
```

**Données collectées** (alignées schema.sql + Prisma) :
| Étape | Champs | Table Cible |
|-------|--------|-------------|
| Entreprise | companyName, legalForm, capitalSocial, rcmNumber, ifuNumber, cnpsNumber, taxCenter, address, phone, email, website, sector | `clients` |
| Représentant | representativeName, representativeTitle, representativeIdNumber | `clients` |
| Capacités | staffCount, techStaffCount, ca3Years[3], ownFunds, creditLines | `clients` |
| Références | Array[{year, client, description, amount}] | `clients.references` (JSONB) |
| Compte | email, password (bcrypt) | `users` + lien `clientId` |

**Auto-création conformité** : 6 entrées `conformity_tracking` (RCCM, IFU, CNPS, IMPOTS, LICENCE, ASSURANCE) avec statut initial.

---

### **2. Dashboard → Actions n8n (Temps Réel)**

Le dashboard affiche les marchés du client connecté (`GET /api/marches`) avec boutons d'action qui déclenchent les webhooks n8n :

| Bouton | Condition | Webhook n8n | Payload | Workflow Déclenché |
|--------|-----------|-------------|---------|-------------------|
| **Qualifier** | `status === 'nouveau'` | `/webhook/qualify-marche` | `{ marche_id, client_id }` | **#2 Qualification** → Checklist + Décision GO/NO-GO |
| **Générer dossier** | `qualification.decision === 'GO' && status === 'qualifie'` | `/webhook/generate-dossier` | `{ marche_id }` | **#3 Génération** → 8 docs Docxtemplater |
| **Gagné** | `['qualifie','dossier_genere','depose'].includes(status)` | `/webhook/declare-result` | `{ marche_id, status: 'gagne', amount }` | **#5 Résultat** → Facture success fee |
| **Perdu** | Idem | `/webhook/declare-result` | `{ marche_id, status: 'perdu' }` | **#5 Résultat** → MAJ statut seulement |

**Flux complet** :
```
Dashboard (Client)          n8n Workflows              PostgreSQL (Partagé)
     │                          │                           │
     ├─▶ Qualifier ──────────▶ #2 Qualification ─────────▶ qualifications + marches_detectes
     │                          │                           │
     ├─▶ Générer ────────────▶ #3 Génération ────────────▶ (docs générés stockés)
     │                          │                           │
     ├─▶ Gagné ──────────────▶ #5 Résultat ──────────────▶ marches_detectes + invoices
     │                          │                           │
     ▼                          ▼                           ▼
Metabase Dashboard ◀────── Vues SQL (v_pipeline_marches, v_revenus, etc.)
```

---

### **3. Veille Automatique → Notification Client (Passif)**

Ce workflow ne nécessite **aucune action client** :

| Heure | Workflow | Action | Notification Client |
|-------|----------|--------|---------------------|
| **6h00** (lun-ven) | **#1 Veille** | Scraping 10 sources → Scoring → Insert `marches_detectes` | Telegram/Email si score > 50 |
| **9h00** (lun-ven) | **#4 Suivi** | Check échéances (J-7, J-3, J-1, J-0, retard) | Email + Telegram relance |
| **Temps réel** | **#5 Résultat** | Déclaration gain/perte via webapp | Facture auto + Email client |

---

## 📱 Pages & Composants Principaux

### **Landing Page** (`/page.tsx`)
- Hero : Value prop "0 FCFA initial, 1% success fee"
- 4 étapes visuelles (Inscription → Veille → Génération → Gain)
- 8 documents listés
- CTA → `/onboarding`

### **Onboarding** (`/onboarding/page.tsx`) — **5 étapes avec validation**
```
Étape 1/5 : Entreprise (12 champs dont 6 obligatoires)
Étape 2/5 : Représentant légal (3 champs obligatoires)
Étape 3/5 : Capacités (effectifs, CA 3 ans, fonds propres, lignes crédit)
Étape 4/5 : Références marchés (array dynamique, min 1)
Étape 5/5 : Compte (email + password + confirm, min 8 chars)
```
- Progress bar fixe en haut
- Validation côté client + serveur
- POST vers `/api/onboarding` à la fin

### **Dashboard** (`/dashboard/page.tsx`) — **Interface principale client**
- **Header** : Navigation tabs (Tous / À qualifier / En cours / Gagnés) + User menu
- **Stats cards** : 4 KPIs (Détectés, À qualifier, En cours, Gagnés)
- **Table marchés** : Colonnes (Marché, Montant, Échéance, Score, Statut, Qualification, Actions)
- **Actions contextuelles** : Boutons apparaissent selon statut + qualification
- **Real-time** : `fetchMarches()` au mount + après chaque action

### **Authentification** (NextAuth.js)
- **Providers** : Credentials (email/password bcrypt) + Email (magic links)
- **Adapter** : PrismaAdapter → tables `users`, `accounts`, `sessions`, `verification_tokens`
- **JWT Strategy** : 30 jours, callbacks pour `role` et `clientId`
- **Pages** : `/auth/signin`, `/auth/error`, `/auth/verify-request`

---

## 🗄️ Modèle de Données (Prisma ↔ PostgreSQL)

### **Tables Métier (sync avec schema.sql)**
```prisma
Client           @@map("clients")
Marche           @@map("marches_detectes")
Qualification    @@map("qualifications")
Invoice          @@map("invoices")
ConformityTracking @@map("conformity_tracking")
PartnerCommission  @@map("partner_commissions")
```

### **Tables Auth (NextAuth.js)**
```prisma
User         @@map("users")
Account      @@map("accounts")
Session      @@map("sessions")
VerificationToken @@map("verification_tokens")
```

### **Relations Clés**
```
User 1──1 Client (clientId unique)
Client 1──N Marche
Client 1──N Qualification
Client 1──N Invoice
Client 1──N ConformityTracking
Marche 1──1 Qualification
```

### **Enums (alignés PostgreSQL)**
```prisma
ClientStatus: actif | inactif | suspendu
MarcheStatus: nouveau | qualifie | dossier_genere | depose | gagne | perdu | annule
QualificationDecision: GO | CONDITIONNEL | NO_GO
InvoiceStatus: emise | payee | en_retard | annulee
ConformityStatus: valide | expire_soon | expire | manquant
```

---

## 🔐 Sécurité & Bonnes Pratiques

| Aspect | Implémentation |
|--------|----------------|
| **Passwords** | bcryptjs (cost 12) |
| **Sessions** | JWT HttpOnly cookies (NextAuth) |
| **CSRF** | NextAuth built-in |
| **Rate limiting** | À ajouter (middleware ou nginx) |
| **Headers** | Caddy : HSTS, X-Frame-Options, CSP basique |
| **Validation** | Zod schemas (à ajouter sur API routes) |
| **RBAC** | `role` sur User (client, admin, partner) |

---

## 🚀 Déploiement Webapp

### **Docker (Production)**
```dockerfile
# Multi-stage: deps → builder → runner (standalone)
# Output: .next/standalone + .next/static + public
# User: nextjs (UID 1001), non-root
```

### **Variables Requises** (`.env`)
```bash
DATABASE_URL=postgresql://marches_user:PASS@postgres:5432/marches_publics
DIRECT_URL=postgresql://marches_user:PASS@postgres:5432/marches_publics
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=https://app.votredomaine.tg
N8N_WEBHOOK_BASE=https://n8n.votredomaine.tg
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=xxx
SMTP_PASSWORD=xxx
EMAIL_FROM=noreply@votredomaine.tg
```

### **Build & Start**
```bash
# Local dev
cd webapp && npm install && npm run dev

# Production (via docker-compose)
docker compose build webapp --no-cache
docker compose up -d webapp
```

---

## 🧪 Tests & Développement

### **Prisma Studio** (Visual DB)
```bash
cd webapp && npx prisma studio
# http://localhost:5555
```

### **Commandes Utiles**
```bash
# Générer client Prisma après schema change
cd webapp && npm run db:generate

# Push schema vers DB (dev seulement)
cd webapp && npm run db:push

# Migration versionnée
cd webapp && npm run db:migrate

# Lint
cd webapp && npm run lint

# Type check
cd webapp && npx tsc --noEmit
```

---

## 📦 Extensions Futures (Roadmap)

| Feature | Description | Effort |
|---------|-------------|--------|
| **Paiement Mobile Money** | Intégration Wave/MoMo/Orange Money API pour encaissement auto factures | Moyen |
| **E-signature** | DocuSign/HelloSign API pour signature DC1/DC2/Lettre directement dans webapp | Moyen |
| **Notifications Push** | Service Workers + Web Push pour alertes temps réel sans email | Faible |
| **Multi-entreprise** | Un user → plusieurs clients (holding, groupes) | Moyen |
| **API Partenaires** | Webhooks sortants pour experts-comptables/avocats (commission auto) | Moyen |
| **Mobile App** | PWA → Capacitor/React Native pour app stores | Élevé |
| **IA Assistant** | Chat GPT-4o intégré pour aide rédaction mémoire technique | Moyen |

---

## 📁 Structure Fichiers Webapp

```
webapp/
├── Dockerfile
├── next.config.js
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Landing
│   │   ├── globals.css
│   │   ├── onboarding/page.tsx         # 5 étapes
│   │   ├── dashboard/page.tsx          # Table + actions
│   │   ├── api/
│   │   │   ├── onboarding/route.ts     # POST inscription
│   │   │   ├── marches/route.ts        # GET marchés client
│   │   │   └── auth/[...nextauth]/route.ts
│   │   └── auth/                       # Pages NextAuth (signin, error, verify)
│   ├── lib/
│   │   ├── prisma.ts                   # Singleton PrismaClient
│   │   ├── auth.ts                     # NextAuthOptions
│   │   ├── n8n.ts                      # Webhook client
│   │   └── utils.ts                    # Formatters
│   ├── components/                     # (À créer: ui kit)
│   ├── hooks/                          # (À créer: useMarches, useAuth, etc.)
│   └── types/                          # (À créer: types partagés)
└── public/                             # Assets statiques
```

---

## 🔗 Liens Utiles

| Ressource | URL |
|-----------|-----|
| **Repo GitHub** | https://github.com/Omar-ALAKA/marches-publics-kit |
| **n8n Workflows** | `/n8n-workflows/*.json` (5 workflows) |
| **Templates Docx** | `/templates-docx/*.docx` (9 templates) |
| **Schema SQL** | `/scripts/schema.sql` |
| **Plan Exécution** | `/execution-plan/PLAN_SEMAINES_1-4.md` |
| **Docker Compose** | `/docker-compose.yml` |
| **Caddy Config** | `/Caddyfile` |

---

## 📞 Support

- **Dev** : Omar Alaka — omaralaka7@gmail.com
- **Infra** : Proxmox CT/VM — Docker Compose stack
- **Monitoring** : Uptime Kuma (à ajouter) + Metabase alerts
- **Logs** : `docker compose logs -f webapp` / `n8n` / `postgres`

---

*Documentation générée pour la stack Marchés Publics Kit — Version 1.0 (Août 2026)*