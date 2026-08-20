# 🚀 Marchés Publics Kit — Suite Complète d'Automatisation Appels d'Offres UEMOA

> **Modèle** : **Success Fee Only** — 0 FCFA à l'entrée, 1% du marché gagné (min 500k, max 10M FCFA)
> **Cible** : PME Togo/Sénégal/CI/Burkina/Mali + BOAD/BCEAO + Grands comptes privés
> **Stack** : **Next.js 14** + **n8n** + **PostgreSQL 16** + **Metabase** + **Docxtemplater** + **Caddy** + **Docker Compose**

---

## 🎯 Le Problème

Les PME de l'UEMOA **ratent des marchés publics** par millions parce que :
- ❌ Pas de veille automatisée (portails éparpillés, sites donneurs d'ordre, ONG, banques)
- ❌ Dossiers de candidature complexes (8+ documents, formats stricts OHADA/UEMOA)
- ❌ Pas d'expertise interne pour qualifier GO/NO-GO
- ❌ Relances manuelles, dépôts en retard, pertes bêtes
- ❌ Cabinets d'experts-comptables/avocats chers et lents

---

## 💡 La Solution : Marchés Publics Partner

**Une plateforme complète "clé en main"** qui transforme la candidature aux marchés publics en processus industriel :

| Phase | Avant (Manuel) | Après (Automatisé) |
|-------|----------------|-------------------|
| **Veille** | Recherche manuelle quotidienne sur 10+ sites | Bot 6h00 : scraping 10 sources → scoring → alerte Telegram/Email |
| **Qualification** | Analyse Excel + feeling | Checklist auto 16 points → Score 0-100 → Décision GO/CONDITIONNEL/NO-GO |
| **Génération** | 2-3 jours rédaction Word | 1 clic → 8 documents Docxtemplater (DC1, DC2, BPU, Mémoire, Capacités, Attestations, Lettre) |
| **Suivi** | Oubli échéances, relances manuelles | Cron 9h00 : alertes J-7/J-3/J-1/J-0 + relances auto client |
| **Facturation** | Papier, erreurs, retards | Déclaration "Gagné" → Facture success fee 1% auto + email |

**Modèle aligné** : **Tu ne gagnes que si ton client gagne.** 0 risque pour le client, 0 CapEx pour toi.

---

## 🏗️ Architecture Technique

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           DOCKER COMPOSE STACK (7 services)                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Caddy 2    │───▶│  Next.js 14  │    │     n8n      │    │  PostgreSQL  │      │
│  │ (SSL Auto,   │    │  (Webapp     │    │ (5 Workflows)│    │     16       │      │
│  │  Reverse     │    │   Clients)   │    │              │    │ (Source      │      │
│  │  Proxy)      │    │              │    │              │    │  Unique)     │      │
│  └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │                   │               │
│         │                   │                   │                   ▼               │
│         │                   │                   │          ┌──────────────┐        │
│         │                   │                   └────────▶│   Redis 7    │        │
│         │                   │                      (Queue) │  (BullMQ)    │        │
│         │                   │                           └──────────────┘        │
│         │                   ▼                                                      │
│         │          ┌──────────────┐                                               │
│         └────────▶│  Metabase    │                                               │
│                    │  (Dashboard) │                                               │
│                    └──────────────┘                                               │
│                                                                                      │
│  Réseau Docker: marches-net  │  Volumes: 6 persistants  │  SSL: Let's Encrypt auto │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### **Flux de Données Unifié**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Webapp     │────▶│ PostgreSQL  │◀───│    n8n      │
│ (Clients)   │     │ (Source    │     │ (Workflows) │
│             │     │  Unique)   │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                  │                   │
       │                  │                   ▼
       │                  │            ┌─────────────┐
       │                  └───────────▶│  Metabase   │
       │                               │ (Dashboard) │
       ▼                               └─────────────┘
┌─────────────┐
│ Telegram/   │
│ Email/SMTP  │
└─────────────┘
```

**Un seul source de vérité** : PostgreSQL partagé entre Webapp (écrit onboarding, déclarations), n8n (lit/écrit qualification, génération, facturation), Metabase (lit dashboard).

---

## 📦 Contenu du Repository

```
marches-publics-kit/
├── docker-compose.yml          # Stack complète 7 services (prod-ready)
├── Caddyfile                   # Reverse proxy 3 sous-domaines + SSL auto
├── .env.example                # Toutes les variables d'environnement
├── .gitignore                  # Complet
├── start.sh                    # Démarrage local avec health checks
├── deploy.sh                   # Déploiement prod (backup, build, rolling)
├── README.md                   # Ce fichier
├── webapp/README.md            # Doc détaillée webapp (archi, workflows, data model)
│
├── n8n-workflows/              # 5 workflows JSON (import direct dans n8n)
│   ├── 1-veille-marches-scraping.json       # Détection quotidienne 10 sources + scoring
│   ├── 2-qualification-dossier.json         # Checklist 16 pts + décision GO/NO-GO
│   ├── 3-generation-dossier-complet.json    # 8 docs Docxtemplater (DC1, DC2, BPU, MT, CTF, ATT, LETTRE)
│   ├── 4-suivi-depots-relances.json         # Alertes J-7/J-3/J-1/J-0 + relances auto
│   └── 5-resultats-analyse-gains.json       # Déclaration résultat + facturation success fee
│
├── templates-docx/             # 9 templates .docx (placeholders Docxtemplater)
│   ├── DC1_Demande_Participation.docx
│   ├── DC2_Declaration_Sur_Honneur.docx
│   ├── Bordereau_Prix_Unitaire.docx
│   ├── Memoire_Technique.docx
│   ├── Capacites_Techniques_Financieres.docx
│   ├── Attestation_CNPS.docx
│   ├── Attestation_Fiscale.docx
│   ├── Lettre_Soumission.docx
│   └── Facture_Success_Fee.docx
│
├── metabase/
│   └── dashboard.json          # Dashboard 10 cartes (pipeline, revenus, alertes, performance)
│
├── contracts/                  # 3 contrats types (prêts à signer)
│   ├── Contrat_Prestation_Success_Fee.docx
│   ├── NDA_Confidentialite.docx
│   └── Mandat_Depot.docx
│
├── scripts/
│   └── schema.sql              # Schéma PG complet + index + vues Metabase (v_pipeline_marches, v_revenus, v_client_performance, v_conformity_alerts)
│
├── webapp/                     # Next.js 14 Application Clients
│   ├── Dockerfile              # Multi-stage build (standalone output)
│   ├── package.json            # Deps: next, prisma, next-auth, react-hook-form, zod, radix-ui, tailwind
│   ├── tailwind.config.ts      # Theme primary/secondary (vert/ambre)
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── prisma/schema.prisma    # Mapping complet tables PG + User/Account/Session (NextAuth)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx              # Root layout + Inter font
│   │   │   ├── page.tsx                # Landing page (hero, stats, 4 étapes, 8 docs, CTA)
│   │   │   ├── globals.css
│   │   │   ├── onboarding/page.tsx     # 5 étapes: Entreprise → Représentant → Capacités → Références → Compte
│   │   │   ├── dashboard/page.tsx      # Table marchés + actions contextuelles (Qualifier, Générer, Gagné/Perdu)
│   │   │   ├── api/
│   │   │   │   ├── onboarding/route.ts     # POST: Client + User + Conformité tracking (6 docs)
│   │   │   │   ├── marches/route.ts        # GET: Marchés du client connecté (avec qualification)
│   │   │   │   └── auth/[...nextauth]/     # NextAuth (credentials + email magic links)
│   │   │   └── auth/                   # Pages NextAuth (signin, error, verify-request)
│   │   ├── lib/
│   │   │   ├── prisma.ts               # Singleton PrismaClient
│   │   │   ├── auth.ts                 # NextAuthOptions (PrismaAdapter + bcrypt)
│   │   │   ├── n8n.ts                  # Client webhooks n8n (qualify, generate, declare)
│   │   │   └── utils.ts                # Formatters (currency XOF, dates FR, status colors)
│   │   ├── components/                 # UI components (à étendre)
│   │   ├── hooks/                      # Custom hooks (à créer)
│   │   └── types/                      # Types partagés (à créer)
│   └── public/                         # Assets statiques
│
└── execution-plan/
    └── PLAN_SEMAINES_1-4.md    # Plan jour par jour → Premier gain (4 semaines)
```

---

## ⚡ Démarrage Rapide (Production)

### **Prérequis**
- Serveur Proxmox : CT/VM Ubuntu 22.04 (4 vCPU, 8GB RAM, 100GB SSD)
- Domaine + 3 sous-domaines A records vers IP publique
- Compte Brevo (SMTP gratuit 300/jour) ou SendGrid/Mailgun
- Bot Telegram (@BotFather) → Token + Chat ID

### **Installation**
```bash
# 1. Cloner
git clone https://github.com/Omar-ALAKA/marches-publics-kit.git
cd marches-publics-kit

# 2. Configurer .env (OBLIGATOIRE - toutes les valeurs)
cp .env.example .env
nano .env  # Remplir TOUTES les variables (mots de passe 32+ chars, domaines, SMTP, Telegram...)

# 3. Lancer
./start.sh
```

### **Vérifications Post-Démarrage**
| Service | URL | Credentials |
|---------|-----|-------------|
| **Webapp Clients** | `https://app.votredomaine.tg` | Inscription libre |
| **n8n Editor** | `https://n8n.votredomaine.tg` | Basic Auth (N8N_BASIC_AUTH_USER/PASSWORD) |
| **Metabase** | `https://metabase.votredomaine.tg` | Basic Auth (METABASE_ADMIN_USER/PASSWORD) |

---

## 🎯 Workflow Opérationnel (4 Semaines → Premier Gain)

| Semaine | Objectif | Actions Clés | Livrable |
|---------|----------|--------------|----------|
| **S1** | **Infra & Tests** | Déployer stack, importer 5 workflows n8n, configurer credentials, tester E2E (onboarding → veille → qualification → génération → facturation) | Stack 100% fonctionnelle, premier dossier test généré |
| **S2** | **Prospection & Contrats** | Construire liste 50 prospects (DG/DAF PME + experts-comptables), outreach LinkedIn/WhatsApp/Email/Appel, démos live, signature contrats (DocuSign gratuit) | 3-5 clients signés (Success Fee Only) |
| **S3** | **Onboarding & Dossiers Réels** | Guider clients sur webapp (15 min), vérifier complétude données, qualifier marchés (GO), générer dossiers, dépôts | 3-5 dossiers déposés avec accusés de réception |
| **S4** | **Résultats & Facturation** | Suivi relances auto (J-7/J-3/J-1/J-0), déclarer résultats, **premier gain → facture 500k-2M FCFA** | **Revenu récurrent lancé** |

**KPIs Semaine 4** : 1+ marché gagné, 500k-2M FCFA facturés, 3-5 clients actifs.

---

## 💰 Modèle Économique

| Métrique | Valeur |
|----------|--------|
| **Investissement initial** | 0 FCFA (ton Proxmox existant) |
| **Coût mensuel infra** | ~0 FCFA (mutualisé sur ton serveur) |
| **Revenu par gain** | 500k - 10M FCFA (1% borné) |
| **Objectif Mois 3** | 1 gain = 500k-2M FCFA |
| **Objectif Mois 6** | 5 clients × 2-3 gains/an = 2.5-7.5M FCFA/an |
| **Objectif An 1** | 15 clients + 5-10 gains = 10-20M FCFA/an |
| **Objectif An 2** | 40 clients + équipe 2 pers = 30-60M FCFA/an |

**Marge** : ~95% (coût marginal ≈ 0 après setup)

---

## 🔧 Personnalisation Requise (Avant Vente)

1. **Mots-clés secteurs** : `n8n-workflows/1-veille-marches-scraping.json` → nœud `Scoring & Filtrage Intelligent` → arrays `keywords` / `excludeKeywords`
2. **Sources de veille** : Ajouter/retirer URLs dans nœuds HTTP Request (portails pays, donneurs d'ordre locaux)
3. **Seuils** : `parsedAmount > 5M FCFA`, `score > 50` alerte, `deadline < 30j`
4. **Templates Docx** : Ouvrir dans LibreOffice/Word → Enregistrer vrai `.docx` → Adapter réglementation locale (TG/SN/CI/BF/ML)
5. **Contrats** : Remplacer `[Votre Nom]`, `[Votre Société]`, `[Votre RCCM]`, `[Votre IFU]`, coordonnées bancaires/MoMo
6. **Webapp** : Couleurs, logos, textes dans `webapp/src/app/` + `tailwind.config.ts`

---

## 🤝 Partenaires Prescripteurs (Levier x10)

| Partenaire | Incitation | Approche |
|------------|------------|----------|
| **Expert-Comptable** | 10% du success fee (50k-1M FCFA/dossier) | "Je gère la partie marchés de tes clients, tu touches la commission" |
| **Avocat Affaires** | 10% du success fee | "Tu valides juridiquement, je fais le technique/admin" |
| **CCI / Chambre de Métiers** | Service adhérents + revenu partagé | "Guichet unique marchés pour tes membres" |
| **Banques / MFI** | Dossiers financables (cautions, préfinancement) | "Je t'apporte des dossiers qualifiés avec marchés signés" |

---

## 📚 Documentation Détaillée

| Composant | Documentation |
|-----------|---------------|
| **Webapp Next.js** | [`webapp/README.md`](webapp/README.md) — Architecture, workflows, data model, auth, déploiement, roadmap |
| **n8n Workflows** | `n8n-workflows/*.json` — 5 workflows commentés (import direct) |
| **Schéma DB** | `scripts/schema.sql` — Tables, index, vues Metabase, données exemples |
| **Plan Exécution** | `execution-plan/PLAN_SEMAINES_1-4.md` — Jour par jour, KPIs, checklist |
| **Docker Stack** | `docker-compose.yml` + `Caddyfile` + `.env.example` |
| **Contrats** | `contracts/*.docx` — Modèles à personnaliser |

---

## 📞 Support & Évolution

- **Issues GitHub** : Bugs, améliorations, nouvelles sources de veille
- **Discussions** : Stratégie, pricing, partenariats
- **Monitoring** : Uptime Kuma (à ajouter) + Metabase alerts + `docker compose logs -f`
- **Backup** : `deploy.sh` inclut `pg_dump` automatique pré-déploiement

---

## 📄 Licence

**Usage interne commercial uniquement.** Pas de redistribution du code/templates sans accord.
Les contrats sont des modèles — **à faire valider par ton avocat local** (droit OHADA/UEMOA/Togo).

---

**Créé par** : **Omar Alaka** — ST DIGITAL Prop Trading + Homelab Proxmox + Next.js + n8n
**Contact** : omaralaka7@gmail.com | Telegram @omaralaka
**Basé à** : Lomé, Togo (UTC+0) — Couverture UEMOA complète

---

*Version 1.0 — Août 2026 — Stack complète production-ready*