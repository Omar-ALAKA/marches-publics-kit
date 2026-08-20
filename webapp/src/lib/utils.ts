// ─────────────────────────────────────────────────────────────
// UTILITAIRES COMMUNS
// ─────────────────────────────────────────────────────────────
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | bigint): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function daysUntil(date: Date | string): number {
  const target = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    nouveau: 'bg-gray-100 text-gray-800',
    qualifie: 'bg-blue-100 text-blue-800',
    dossier_genere: 'bg-purple-100 text-purple-800',
    depose: 'bg-indigo-100 text-indigo-800',
    gagne: 'bg-green-100 text-green-800',
    perdu: 'bg-red-100 text-red-800',
    annule: 'bg-gray-100 text-gray-600',
    GO: 'bg-green-100 text-green-800',
    CONDITIONNEL: 'bg-yellow-100 text-yellow-800',
    NO_GO: 'bg-red-100 text-red-800',
    emise: 'bg-blue-100 text-blue-800',
    payee: 'bg-green-100 text-green-800',
    en_retard: 'bg-red-100 text-red-800',
    annulee: 'bg-gray-100 text-gray-600',
    valide: 'bg-green-100 text-green-800',
    expire_soon: 'bg-yellow-100 text-yellow-800',
    expire: 'bg-red-100 text-red-800',
    manquant: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    nouveau: 'Nouveau',
    qualifie: 'Qualifié',
    dossier_genere: 'Dossier généré',
    depose: 'Déposé',
    gagne: 'Gagné',
    perdu: 'Perdu',
    annule: 'Annulé',
    GO: 'GO',
    CONDITIONNEL: 'Conditionnel',
    NO_GO: 'NO-GO',
    emise: 'Émise',
    payee: 'Payée',
    en_retard: 'En retard',
    annulee: 'Annulée',
    valide: 'Valide',
    expire_soon: 'Expire bientôt',
    expire: 'Expiré',
    manquant: 'Manquant',
  }
  return labels[status] || status
}