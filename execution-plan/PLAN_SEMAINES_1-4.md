# ─────────────────────────────────────────────────────────────
# PLAN D'EXÉCUTION - Semaines 1 à 4 (Objectif: Premier Gain)
# ─────────────────────────────────────────────────────────────

## SEMAINE 1 : INFRA & FONDATIONS (Lundi - Vendredi)

### Lundi - Infrastructure
- [ ] Cloner le repo sur le serveur Proxmox (CT/VM Ubuntu 22.04)
- [ ] Copier `.env.example` → `.env` et remplir **TOUTES** les valeurs
  - `POSTGRES_PASSWORD` (openssl rand -base64 32)
  - `N8N_ENCRYPTION_KEY` (openssl rand -base64 32)
  - `NEXTAUTH_SECRET` (openssl rand -base64 32)
  - `METABASE_ENCRYPTION_KEY` (openssl rand -base64 32)
  - `DOMAIN` + sous-domaines DNS A records vers IP Proxmox
  - SMTP (Brevo gratuit 300/jour), Telegram Bot (@BotFather)
- [ ] `./start.sh` → Vérifier que tous les conteneurs sont "Up"
- [ ] Test URLs : https://app.votredomaine.com, https://n8n.votredomaine.com, https://metabase.votredomaine.com

### Mardi - n8n Workflows
- [ ] Ouvrir n8n (Basic Auth) → Workflows → Import les 5 JSON
- [ ] Configurer **credentials** dans n8n :
  - PostgreSQL (host: postgres, port: 5432, db: marches_publics, user: marches_user, pass: $POSTGRES_PASSWORD)
  - Telegram (Bot Token + Chat ID)
  - SMTP (Brevo/SendGrid)
- [ ] Activer workflow #1 (Veille) → Exécuter manuel → Vérifier alerte Telegram
- [ ] Activer workflow #4 (Suivi dépôts) → Vérifier cron 9h

### Mercredi - Webapp & Templates
- [ ] Convertir les 9 templates `.docx` (texte) → vrais `.docx` :
  - Ouvrir chaque fichier dans LibreOffice/Word → Enregistrer sous `.docx` → Remplacer dans `./templates-docx/`
  - Redémarrer n8n : `docker compose restart n8n`
- [ ] Test Webapp : https://app.votredomaine.com/onboarding
  - Inscription test entreprise fictive
  - Vérifier création en base (prisma studio ou psql)
  - Vérifier email magic link / confirmation

### Jeudi - Metabase & Dashboard
- [ ] Ouvrir Metabase → Setup admin → Connecter PostgreSQL
- [ ] Import dashboard `metabase/dashboard.json`
- [ ] Vérifier les 10 cartes : Pipeline, Revenus, Alertes, Performance clients
- [ ] Créer question "Marchés à qualifier cette semaine" → Ajouter au dashboard

### Vendredi - Test Bout-en-Bout
- [ ] Créer client test complet (onboarding)
- [ ] Déclencher veille manuelle (workflow #1) → Marché détecté
- [ ] Qualifier via webapp (bouton "Qualifier") → Workflow #2 → Checklist + Décision
- [ ] Générer dossier (bouton "Générer") → Workflow #3 → 8 docs générés
- [ ] Vérifier documents dans volume n8n `/home/node/.n8n/` ou stockage configuré
- [ ] Déclarer "Gagné" → Workflow #5 → Facture générée + Email

---

## SEMAINE 2 : PROSPECTION & PREMIERS CLIENTS

### Lundi-Mardi - Liste & Scripts
- [ ] Construire liste **50 prospects** (Google Sheets) :
  - 20 DG/DAF PME Lomé (secteurs : BTP, IT, Énergie, Santé, Logistique, Agro)
  - 15 DG/DAF Abidjan/Dakar/Ouaga/Bamako
  - 10 Experts-comptables / Cabinets d'avocats / CCI
  - 5 Grands comptes (Banques, Télécoms, ONG) - pour veille seulement
- [ ] Préparer scripts prospection (LinkedIn, WhatsApp, Email, Appel)

### Mercredi-Jeudi - Outreach
- [ ] Envoyer 20 messages LinkedIn personnalisés/jour
- [ ] 10 appels téléphoniques/jour (script : "Je détecte des marchés pour vous, 0 FCFA à l'avance, 1% si gagné")
- [ ] 5 emails/jour (template HTML + pièce jointe plaquette 1 page)

### Vendredi - Premières Réunions
- [ ] Caler 3-5 appels découverte (15-30 min)
- [ ] Démonstration live : Dashboard + Veille + Génération dossier
- [ ] Envoyer contrat (DocuSign/HelloSign gratuit) + NDA + Mandat dépôt

---

## SEMAINE 3 : ONBOARDING & PREMIERS DOSSIERS RÉELS

### Lundi-Mardi - Onboarding Clients Signés
- [ ] Guider chaque client sur l'onboarding webapp (15 min)
- [ ] Vérifier complétude données (RCCM, IFU, CNPS, CA 3 ans, Références)
- [ ] Configurer alertes Telegram personnalisées par client

### Mercredi-Jeudi - Veille & Qualification
- [ ] Surveiller alertes quotidiennes (6h Telegram)
- [ ] Qualifier marchés pertinents pour chaque client (workflow #2)
- [ ] Partager checklist + décision GO/NO-GO avec client

### Vendredi - Génération & Dépôt
- [ ] Pour chaque GO : Générer dossier complet (workflow #3)
- [ ] Relecture client (15 min call) → Ajustements si besoin
- [ ] Dépôt client (ou mandat dépôt) → Accusé de réception

---

## SEMAINE 4 : SUIVI, RÉSULTATS & FACTURATION

### Lundi-Mercredi - Relances Automatiques
- [ ] Workflow #4 tourne (J-7, J-3, J-1, Jour J) → Alertes client + vous
- [ ] Suivi manuel appels clients pour dépôt

### Jeudi-Vendredi - Résultats
- [ ] Résultats marchés (attribution / rejet)
- [ ] Déclarer dans webapp (bouton "Gagné/Perdu") → Workflow #5
- [ ] **Premier gain → Facture success fee émise + envoyée**
- [ ] Encaissement → Célébration 🎉

---

## KPIS HEBDOMADAIRES (Tableau de bord Metabase)

| Semaine | Métrique | Cible |
|---------|----------|-------|
| S1 | Infra up, workflows actifs, test E2E OK | 100% |
| S2 | Prospects contactés | 100 |
| S2 | Réunions calées | 10 |
| S2 | Contrats signés | 3-5 |
| S3 | Clients onboardés | 3-5 |
| S3 | Marchés qualifiés (GO) | 5-10 |
| S3 | Dossiers générés & déposés | 3-5 |
| S4 | Marchés gagnés | **1+** |
| S4 | Revenus facturés | **500k-2M FCFA** |

---

## MOIS 2-3 : INDUSTRIALISATION

| Action | Détail |
|--------|--------|
| **Partenaires** | Signer 5-10 experts-comptables/avocats (10% commission) |
| **Automatisation** | Webhook n8n → Webapp temps réel (plus de polling) |
| **Paiement** | Intégrer Wave/MoMo/Orange Money API pour encaissement auto |
| **Scaling** | n8n queue mode + workers dédiés si volume > 50 marchés/jour |
| **Monitoring** | Uptime Kuma + Alertes Telegram si service down |

---

## MOIS 4-6 : PRODUIT & ÉQUIPE

| Jalons | Objectif |
|--------|----------|
| **Clients actifs** | 15-20 |
| **Gains/an** | 5-10 marchés |
| **Revenus/an** | 10-20M FCFA |
| **Équipe** | 1 Dev/Ops + 1 Commercial (stagiaire puis CDI) |
| **Nouveaux pays** | Sénégal, Côte d'Ivoire (partenaires locaux) |

---

## CHECKLIST "PRÊT POUR LA SEMAINE 1"

- [ ] Serveur Proxmox : CT/VM Ubuntu 22.04 (4 vCPU, 8GB RAM, 100GB SSD)
- [ ] Domaine acheté + DNS configuré (A records)
- [ ] Compte Brevo (SMTP gratuit) + Template emails
- [ ] Bot Telegram créé (@BotFather) + Groupe canal alertes
- [ ] Compte DocuSign/HelloSign gratuit (contrats)
- [ ] LibreOffice installé sur ton poste (conversion templates)
- [ ] 50 prospects identifiés dans Google Sheets
- [ ] Scripts prospection prêts (Notion/Obsidian)
- [ ] Agenda Calendly/Cal.com configuré (lien dans emails)

---

## COMMANDES UTILES QUOTIDIENNES

```bash
# Logs temps réel
docker compose logs -f n8n
docker compose logs -f webapp

# Redémarrer un service
docker compose restart n8n

# Backup DB manuel
docker compose exec -T postgres pg_dump -U marches_user marches_publics > backup_$(date +%Y%m%d).sql

# Accès psql
docker compose exec -T postgres psql -U marches_user -d marches_publics

# Prisma Studio (webapp)
cd webapp && npx prisma studio

# Mise à jour repo + rebuild
git pull && docker compose build webapp && docker compose up -d webapp
```

---

## CONTACTS CLÉS POUR DÉBLOQUER

| Besoin | Contact / Ressource |
|--------|---------------------|
| DNS / Domaine | Gandi / Cloudflare / Namecheap |
| SSL / Caddy | Auto (Let's Encrypt) - vérifier ports 80/443 ouverts |
| SMTP | Brevo (gratuit 300/jour) - valider domaine |
| Telegram Bot | @BotFather → Token + @userinfobot → Chat ID |
| Base de données | `docker compose exec postgres psql -U marches_user -d marches_publics` |
| n8n Editor | https://n8n.votredomaine.com (Basic Auth) |
| Metabase | https://metabase.votredomaine.com (Basic Auth) |
| Prisma Studio | `npx prisma studio` (port 5555) |