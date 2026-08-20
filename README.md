# 🚀 Marchés Publics Kit — Suite d'Automatisation Appels d'Offres UEMOA

> **Modèle** : Success Fee Only (0 FCFA à l'entrée, 1% du marché gagné — min 500k, max 10M)
> **Cible** : PME Togo/Sénégal/CI/Burkina/Mali + BOAD/BCEAO + Grands comptes privés
> **Stack** : n8n + PostgreSQL + Metabase + Docxtemplater + Telegram/Email

---

## 📦 Contenu du Repository

```
marches-publics-kit/
├── n8n-workflows/           # 5 workflows JSON (import direct dans n8n)
│   ├── 1-veille-marches-scraping.json       # Détection quotidienne multi-sources
│   ├── 2-qualification-dossier.json         # Checklist + scoring + décision GO/NO-GO
│   ├── 3-generation-dossier-complet.json    # 8 documents auto-générés (Docxtemplater)
│   ├── 4-suivi-depots-relances.json         # Alertes J-7/J-3/J-1/J-0 + relances client
│   └── 5-resultats-analyse-gains.json       # Déclaration résultat + facturation success fee
│
├── templates-docx/          # 9 templates .docx (placeholders Docxtemplater)
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
│   └── dashboard.json       # Dashboard Metabase (import via API ou UI)
│
├── contracts/               # 3 contrats types (prêts à signer)
│   ├── Contrat_Prestation_Success_Fee.docx
│   ├── NDA_Confidentialite.docx
│   └── Mandat_Depot.docx
│
├── scripts/
│   └── schema.sql           # Schéma PostgreSQL complet + index + vues Metabase
│
└── execution-plan/          # (À créer) Plan semaine par semaine
```

---

## ⚡ Démarrage Rapide (30 min)

### 1. Infrastructure (sur ton Proxmox)
```bash
# PostgreSQL (si pas déjà fait)
docker run -d --name postgres -p 5432:5432 \
  -e POSTGRES_PASSWORD=TON_MOT_DE_PASSE_FORT \
  -v pgdata:/var/lib/postgresql/data \
  --restart unless-stopped postgres:16

# Appliquer le schéma
psql -h localhost -U postgres -d postgres -f scripts/schema.sql
```

### 2. n8n (sur ton Proxmox)
```bash
docker run -d --name n8n -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  -v /root/marches-publics-kit/templates-docx:/templates \
  --restart unless-stopped n8nio/n8n
```

**Dans n8n → Workflows → Import** : importe les 5 fichiers JSON de `n8n-workflows/`

**Configurer les credentials** :
- PostgreSQL (host: ton IP Proxmox, port 5432, db: postgres, user: postgres)
- Telegram Bot (créer via @BotFather, récupérer token + chat_id)
- SMTP (Brevo/SendGrid/Mailgun) pour emails clients

### 3. Metabase
```bash
docker run -d --name metabase -p 3000:3000 \
  -v metabase_data:/metabase-data \
  --restart unless-stopped metabase/metabase
```
Connecte à ta DB Postgres → **Import dashboard** via `metabase/dashboard.json`

### 4. Templates Docx
Les fichiers `.docx` dans `templates-docx/` sont des **fichiers texte** avec placeholders.
→ **Ouvre chaque fichier dans Word/LibreOffice** → **Enregistre en vrai .docx** → Replace dans le volume Docker `/templates/`

---

## 🎯 Workflow Opérationnel (Jour 1 → Premier Gain)

| Semaine | Action | Livrable |
|---------|--------|----------|
| **S1** | Déployer infra + Importer workflows + Test scraping | Alertes Telegram quotidiennes |
| **S1** | Créer 1 client test dans Postgres + Qualification manuelle | Checklist générée |
| **S1** | Générer 1er dossier complet (8 docs) | ZIP prêt à déposer |
| **S2** | Prospection : 10 DG/DAF PME + 3 experts-comptables | 1-2 contrats signés |
| **S2** | Premier dossier réel déposé | Accusé de réception |
| **S3-S4** | Suivi + Relances auto + Résultat | **Premier gain → Facture** |

---

## 💰 Modèle Économique

| Métrique | Valeur |
|----------|--------|
| **Investissement initial** | 0 FCFA (ton Proxmox existant) |
| **Coût mensuel** | ~0 FCFA (infra mutualisée) |
| **Revenu par gain** | 500k - 10M FCFA (1%, borné) |
| **Objectif Mois 3** | 1 gain = 500k-2M FCFA |
| **Objectif Mois 6** | 2-3 gains/an/client × 5 clients = 2.5-7.5M FCFA/an |
| **Objectif An 1** | 15 clients + 5 gains = 10-20M FCFA/an |

---

## 🔧 Personnalisation Requise

1. **Mots-clés secteurs** : Édite `1-veille-marches-scraping.json` → nœud `Scoring & Filtrage Intelligent` → arrays `keywords` / `excludeKeywords`
2. **Sources de veille** : Ajoute/retire URLs dans les nœuds HTTP Request (sites marchés publics pays, donneurs d'ordre locaux)
3. **Seuils** : `parsedAmount > 5M FCFA`, `score > 50` pour alerte, `deadline < 30j`
4. **Templates** : Adapte à la réglementation locale (Togo/SN/CI/BF/ML) si champs différents
5. **Contrats** : Remplace `[Votre Nom]`, `[Votre Société]`, `[Votre RCCM]`, `[Votre IFU]`, coordonnées bancaires/MoMo

---

## 📋 Checklist "Prêt à Vendre"

- [ ] Infra déployée (Postgres + n8n + Metabase + Caddy/SSL)
- [ ] 5 workflows n8n actifs & testés (run manuel → OK)
- [ ] 9 templates .docx valides (génération → PDF correct)
- [ ] Schéma SQL appliqué + données test insérées
- [ ] Dashboard Metabase visible (pipeline, revenus, alertes)
- [ ] 3 contrats personnalisés + signés (DocuSign/HelloSign gratuit)
- [ ] Script prospection LinkedIn/WhatsApp/Email prêt
- [ ] 1er client pilote identifié + appel calé
- [ ] Bot Telegram créé + canal alertes configuré
- [ ] SMTP transactionnel configuré (Brevo 300 emails/jour gratuit)

---

## 🤝 Partenaires Prescripteurs (Levier x10)

| Partenaire | Incitation | Approche |
|------------|------------|----------|
| **Expert-Comptable** | 10% du success fee (50k-1M FCFA/dossier) | "Je gère la partie marchés de tes clients, tu touches la commission" |
| **Avocat Affaires** | 10% du success fee | "Tu valides juridiquement, je fais le technique/admin" |
| **CCI / Chambre de Métiers** | Service adhérents + revenu | "Guichet unique marchés pour tes membres" |
| **Banques / MFI** | Dossiers financables (cautions, préfinancement) | "Je t'apporte des dossiers qualifiés avec marchés signés" |

---

## 📞 Support & Évolution

- **Issues** : Bugs, améliorations, nouvelles sources de veille
- **Discussions** : Stratégie, pricing, partenariats
- **Wiki** : Documentation technique, FAQ clients, templates réglementaires par pays

---

## 📄 Licence

Usage interne commercial. Pas de redistribution du code/templates sans accord.
Les contrats sont des modèles — à faire valider par ton avocat local.

---

**Créé par** : Omar Alaka — ST DIGITAL Prop Trading + Homelab Proxmox + Next.js
**Contact** : omaralaka7@gmail.com | Telegram @omaralaka
**Basé à** : Lomé, Togo (UTC+0) — Couverture UEMOA complète