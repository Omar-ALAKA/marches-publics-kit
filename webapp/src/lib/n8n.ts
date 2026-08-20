// ─────────────────────────────────────────────────────────────
// API N8N WEBHOOKS
// ─────────────────────────────────────────────────────────────
const N8N_BASE = process.env.N8N_WEBHOOK_BASE || 'https://n8n.marches-partner.tg'

export async function callN8nWebhook(endpoint: string, payload: any) {
  const url = `${N8N_BASE}/webhook/${endpoint}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`N8N webhook failed: ${response.status} - ${error}`)
  }
  
  return response.json()
}

export const n8nWebhooks = {
  qualifyMarche: (marcheId: string, clientId: string) => 
    callN8nWebhook('qualify-marche', { marche_id: marcheId, client_id: clientId }),
  
  generateDossier: (marcheId: string) => 
    callN8nWebhook('generate-dossier', { marche_id: marcheId }),
  
  declareResult: (marcheId: string, status: 'gagne' | 'perdu' | 'annule', amount?: number, notes?: string) => 
    callN8nWebhook('declare-result', { marche_id: marcheId, status, amount, notes }),
}