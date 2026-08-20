-- =============================================================================
-- SCHÉMA BASE DE DONNÉES - MARCHÉS PUBLICS KIT
-- PostgreSQL 14+ | Exécuter sur ton Proxmox Postgres
-- =============================================================================

-- Extensions utiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Recherche floue

-- =============================================================================
-- TABLE : clients (Entreprises que tu accompagnes)
-- =============================================================================
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    legal_form VARCHAR(100),           -- SARL, SA, SUARL, EURL, etc.
    capital_social BIGINT,             -- En FCFA
    rcm_number VARCHAR(100) UNIQUE,    -- Registre Commerce
    ifu_number VARCHAR(50) UNIQUE,     -- Identifiant Fiscal Unique
    cnps_number VARCHAR(50),           -- Numéro CNPS
    tax_center VARCHAR(100),           -- Centre des Impôts rattachement
    address TEXT NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    representative_name VARCHAR(255),
    representative_title VARCHAR(100),
    representative_id_number VARCHAR(100), -- CNI/Passeport
    sector VARCHAR(100),               -- Secteur d'activité principal
    staff_count INTEGER DEFAULT 0,
    tech_staff_count INTEGER DEFAULT 0,
    ca_3_years BIGINT[],               -- CA 3 dernières années [2022, 2023, 2024]
    avg_ca BIGINT GENERATED ALWAYS AS (
        CASE WHEN array_length(ca_3_years, 1) > 0 
        THEN (SELECT sum(val)::bigint / array_length(ca_3_years, 1) FROM unnest(ca_3_years) val)
        ELSE 0 END
    ) STORED,
    own_funds BIGINT DEFAULT 0,        -- Fonds propres
    credit_lines BIGINT DEFAULT 0,     -- Lignes de crédit confirmées
    max_capacity BIGINT GENERATED ALWAYS AS (
        own_funds + credit_lines
    ) STORED,
    references JSONB DEFAULT '[]',     -- Références marchés passés
    key_staff JSONB DEFAULT '[]',      -- Personnel clé
    equipment JSONB DEFAULT '[]',      -- Équipements
    certifications JSONB DEFAULT '[]', -- Certifications ISO, etc.
    status VARCHAR(50) DEFAULT 'actif', -- actif, inactif, suspendu
    onboarded_at DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_rcm ON clients(rcm_number);
CREATE INDEX idx_clients_ifu ON clients(ifu_number);
CREATE INDEX idx_clients_sector ON clients(sector);
CREATE INDEX idx_clients_status ON clients(status);

-- =============================================================================
-- TABLE : marches_detectes (Marchés trouvés par veille)
-- =============================================================================
CREATE TABLE marches_detectes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(50) NOT NULL,       -- TG, SN, CI, BF, ML, BOAD, TELCO, BANKS, DONORS
    title TEXT NOT NULL,
    reference VARCHAR(255),
    deadline DATE,
    amount TEXT,                       -- Montant brut (ex: "50 000 000 FCFA")
    category VARCHAR(255),
    link TEXT,
    detected_at TIMESTAMPTZ NOT NULL,
    parsed_amount BIGINT,              -- Montant parsé en FCFA
    parsed_deadline DATE,
    score INTEGER DEFAULT 0,           -- Score 0-100
    status VARCHAR(50) DEFAULT 'nouveau', -- nouveau, qualifie, dossier_genere, depose, gagne, perdu, annule
    client_id UUID REFERENCES clients(id),
    qualification_id UUID,
    result_date DATE,
    result_amount BIGINT,
    result_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marches_source ON marches_detectes(source);
CREATE INDEX idx_marches_status ON marches_detectes(status);
CREATE INDEX idx_marches_deadline ON marches_detectes(parsed_deadline);
CREATE INDEX idx_marches_score ON marches_detectes(score DESC);
CREATE INDEX idx_marches_client ON marches_detectes(client_id);
CREATE INDEX idx_marches_trgm ON marches_detectes USING gin(title gin_trgm_ops);

-- =============================================================================
-- TABLE : qualifications (Résultats qualification)
-- =============================================================================
CREATE TABLE qualifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    marche_id UUID NOT NULL REFERENCES marches_detectes(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    checklist_json JSONB NOT NULL,     -- Checklist complète avec statuts
    completion_rate DECIMAL(5,2),
    critical_missing INTEGER,
    decision VARCHAR(20),              -- GO, CONDITIONNEL, NO-GO
    decision_reason TEXT,
    qualified_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qualif_marche ON qualifications(marche_id);
CREATE INDEX idx_qualif_client ON qualifications(client_id);
CREATE INDEX idx_qualif_decision ON qualifications(decision);

-- =============================================================================
-- TABLE : invoices (Factures success fee)
-- =============================================================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number VARCHAR(100) UNIQUE NOT NULL,
    date DATE NOT NULL,
    due_date DATE NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id),
    client_name VARCHAR(255) NOT NULL,
    marche_reference VARCHAR(255),
    marche_title TEXT,
    marche_amount BIGINT,
    fee_rate DECIMAL(5,2) DEFAULT 1.00,
    fee_amount BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'emise', -- emise, payee, en_retard, annulee
    description TEXT,
    paid_at DATE,
    payment_method VARCHAR(50),        -- virement, momo, wave, especes
    payment_ref VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_number ON invoices(number);

-- =============================================================================
-- TABLE : conformity_tracking (Suivi conformité continue)
-- =============================================================================
CREATE TABLE conformity_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id),
    document_type VARCHAR(50) NOT NULL, -- RCCM, IFU, CNPS, IMPOTS, LICENCE, ASSURANCE
    status VARCHAR(20) DEFAULT 'valide', -- valide, expire_soon, expire, manquant
    issue_date DATE,
    expiry_date DATE,
    document_ref VARCHAR(255),         -- Numéro/référence document
    file_path TEXT,                    -- Chemin fichier stocké
    alert_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, document_type)
);

CREATE INDEX idx_conformity_client ON conformity_tracking(client_id);
CREATE INDEX idx_conformity_expiry ON conformity_tracking(expiry_date);
CREATE INDEX idx_conformity_status ON conformity_tracking(status);

-- =============================================================================
-- TABLE : partner_commissions (Commissions partenaires prescripteurs)
-- =============================================================================
CREATE TABLE partner_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_name VARCHAR(255) NOT NULL,
    partner_type VARCHAR(50),          -- expert_comptable, avocat, cci, autre
    partner_contact VARCHAR(255),
    commission_rate DECIMAL(5,2) DEFAULT 10.00, -- % du success fee
    status VARCHAR(20) DEFAULT 'actif',
    contract_signed_at DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- VUES UTILES POUR METABASE
-- =============================================================================

-- Vue : Pipeline Marchés (pour dashboard principal)
CREATE OR REPLACE VIEW v_pipeline_marches AS
SELECT 
    m.id,
    m.source,
    m.title,
    m.reference,
    m.parsed_amount,
    m.parsed_deadline,
    m.score,
    m.status,
    m.detected_at,
    c.company_name as client_name,
    c.sector as client_sector,
    q.decision as qualification_decision,
    q.completion_rate,
    CASE 
        WHEN m.parsed_deadline IS NOT NULL 
        THEN m.parsed_deadline - CURRENT_DATE
        ELSE NULL
    END as days_until_deadline,
    CASE 
        WHEN m.status = 'gagne' THEN m.result_amount * 0.01
        ELSE 0
    END as potential_fee
FROM marches_detectes m
LEFT JOIN clients c ON m.client_id = c.id
LEFT JOIN qualifications q ON m.id = q.marche_id
WHERE m.parsed_deadline >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY m.score DESC, m.parsed_deadline ASC;

-- Vue : Revenus Récurrents & Prévisionnels
CREATE OR REPLACE VIEW v_revenus AS
SELECT 
    DATE_TRUNC('month', i.date) as mois,
    COUNT(*) as nb_factures,
    SUM(i.fee_amount) as total_facture,
    SUM(CASE WHEN i.status = 'payee' THEN i.fee_amount ELSE 0 END) as total_encaisse,
    SUM(CASE WHEN i.status = 'emise' THEN i.fee_amount ELSE 0 END) as total_en_attente,
    SUM(CASE WHEN i.status = 'en_retard' THEN i.fee_amount ELSE 0 END) as total_retard
FROM invoices i
GROUP BY DATE_TRUNC('month', i.date)
ORDER BY mois DESC;

-- Vue : Conformité Clients (Alertes)
CREATE OR REPLACE VIEW v_conformity_alerts AS
SELECT 
    c.company_name,
    c.email,
    c.phone,
    ct.document_type,
    ct.status,
    ct.expiry_date,
    ct.expiry_date - CURRENT_DATE as days_until_expiry
FROM conformity_tracking ct
JOIN clients c ON ct.client_id = c.id
WHERE ct.status IN ('expire_soon', 'expire', 'manquant')
   OR (ct.expiry_date IS NOT NULL AND ct.expiry_date - CURRENT_DATE <= 30)
ORDER BY days_until_expiry ASC;

-- Vue : Performance par Client
CREATE OR REPLACE VIEW v_client_performance AS
SELECT 
    c.id,
    c.company_name,
    c.sector,
    COUNT(m.id) as total_marches_detectes,
    COUNT(CASE WHEN m.status = 'qualifie' THEN 1 END) as marches_qualifies,
    COUNT(CASE WHEN m.status = 'dossier_genere' THEN 1 END) as dossiers_generes,
    COUNT(CASE WHEN m.status = 'depose' THEN 1 END) as marches_deposes,
    COUNT(CASE WHEN m.status = 'gagne' THEN 1 END) as marches_gagnes,
    COALESCE(SUM(CASE WHEN m.status = 'gagne' THEN m.result_amount END), 0) as ca_gagne,
    COALESCE(SUM(CASE WHEN m.status = 'gagne' THEN m.result_amount * 0.01 END), 0) as fees_gagnes,
    MAX(m.detected_at) as dernier_marche
FROM clients c
LEFT JOIN marches_detectes m ON c.id = m.client_id
GROUP BY c.id, c.company_name, c.sector
ORDER BY fees_gagnes DESC;

-- =============================================================================
-- DONNÉES INITIALES (Exemples)
-- =============================================================================

-- Client exemple
INSERT INTO clients (company_name, legal_form, capital_social, rcm_number, ifu_number, cnps_number, tax_center, address, phone, email, representative_name, representative_title, sector, staff_count, tech_staff_count, ca_3_years, own_funds, credit_lines, references, certifications)
VALUES (
    'Entreprise Demo SARL',
    'SARL',
    10000000,
    'TG-LFW-2024-B-12345',
    '123456789',
    'CNPS-123456',
    'Centre Impôts Lomé',
    'Boulevard de la Kara, Lomé, Togo',
    '+228 90 11 22 33',
    'contact@demo.tg',
    'Koffi AGBO',
    'Directeur Général',
    'BTP / Génie Civil',
    25,
    8,
    ARRAY[150000000, 180000000, 220000000],
    50000000,
    30000000,
    '[{"year": 2023, "client": "Ministère Infrastructures", "description": "Construction bâtiment administratif", "amount": 120000000}, {"year": 2022, "client": "BOAD", "description": "Réhabilitation voirie urbaine", "amount": 85000000}]',
    '[{"name": "ISO 9001", "status": "valid", "expiry": "2025-12-31"}]'
) ON CONFLICT (rcm_number) DO NOTHING;

-- Partenaire exemple
INSERT INTO partner_commissions (partner_name, partner_type, partner_contact, commission_rate, contract_signed_at)
VALUES 
('Cabinet Expert-Comptable ABC', 'expert_comptable', 'expert@abc.tg', 10.00, CURRENT_DATE),
('Maître Avocat XYZ', 'avocat', 'avocat@xyz.tg', 10.00, CURRENT_DATE)
ON CONFLICT DO NOTHING;