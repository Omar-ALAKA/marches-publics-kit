'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, daysUntil } from '@/lib/utils'
import { n8nWebhooks } from '@/lib/n8n'

interface Marche {
  id: string
  title: string
  reference: string | null
  parsedAmount: number | null
  parsedDeadline: string | null
  score: number
  status: string
  qualification?: {
    decision: string
    completionRate: number
    checklistJson: any[]
  } | null
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [marches, setMarches] = useState<Marche[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'tous' | 'a_qualifier' | 'en_cours' | 'gagnes'>('tous')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
    if (status === 'authenticated') fetchMarches()
  }, [status])

  const fetchMarches = async () => {
    try {
      const res = await fetch('/api/marches')
      if (res.ok) {
        const data = await res.json()
        setMarches(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleQualify = async (marcheId: string) => {
    try {
      await n8nWebhooks.qualifyMarche(marcheId, session?.user?.clientId || '')
      fetchMarches()
    } catch (err) {
      alert('Erreur qualification')
    }
  }

  const handleGenerate = async (marcheId: string) => {
    try {
      await n8nWebhooks.generateDossier(marcheId)
      fetchMarches()
    } catch (err) {
      alert('Erreur génération')
    }
  }

  const handleDeclareResult = async (marcheId: string, status: 'gagne' | 'perdu') => {
    const amount = status === 'gagne' ? prompt('Montant du marché attribué (FCFA) :') : undefined
    if (status === 'gagne' && !amount) return
    
    try {
      await n8nWebhooks.declareResult(marcheId, status, amount ? Number(amount) : undefined)
      fetchMarches()
    } catch (err) {
      alert('Erreur déclaration')
    }
  }

  const filteredMarches = marches.filter(m => {
    if (activeTab === 'tous') return true
    if (activeTab === 'a_qualifier') return m.status === 'nouveau'
    if (activeTab === 'en_cours') return ['qualifie', 'dossier_genere', 'depose'].includes(m.status)
    if (activeTab === 'gagnes') return m.status === 'gagne'
    return true
  })

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  const client = session?.user

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold text-primary-600">Marchés Publics Partner</Link>
              <nav className="hidden md:flex gap-6">
                {['tous', 'a_qualifier', 'en_cours', 'gagnes'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {tab === 'tous' && 'Tous'}
                    {tab === 'a_qualifier' && 'À qualifier'}
                    {tab === 'en_cours' && 'En cours'}
                    {tab === 'gagnes' && 'Gagnés'}
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{client?.name}</span>
              <Link href="/dashboard/profile" className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700">Profil</Link>
              <button onClick={() => fetch('/api/auth/signout', {method:'POST'}).then(()=>router.push('/'))} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900">Déconnexion</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Marchés détectés" value={marches.length} icon="🔍" color="blue" />
          <StatCard title="À qualifier" value={marches.filter(m=>m.status==='nouveau').length} icon="📋" color="yellow" />
          <StatCard title="En cours" value={marches.filter(m=>['qualifie','dossier_genere','depose'].includes(m.status)).length} icon="⚡" color="purple" />
          <StatCard title="Gagnés" value={marches.filter(m=>m.status==='gagne').length} icon="🏆" color="green" />
        </div>

        {/* Marchés Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Marché</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Montant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Échéance</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Qualification</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMarches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      {activeTab === 'a_qualifier' ? 'Aucun marché à qualifier. La veille tourne chaque jour à 6h.' : 'Aucun marché'}
                    </td>
                  </tr>
                ) : (
                  filteredMarches.map(marche => (
                    <tr key={marche.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{marche.title}</p>
                          <p className="text-sm text-gray-500">Réf: {marche.reference || '—'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-900 font-medium">
                        {marche.parsedAmount ? formatCurrency(marche.parsedAmount) : 'Non précisé'}
                      </td>
                      <td className="px-4 py-4">
                        {marche.parsedDeadline ? (
                          <>
                            <p className="text-gray-900">{formatDate(marche.parsedDeadline)}</p>
                            <p className={`text-xs ${daysUntil(marche.parsedDeadline) <= 3 ? 'text-red-600' : 'text-gray-500'}`}>
                              {daysUntil(marche.parsedDeadline) > 0 ? `J-${daysUntil(marche.parsedDeadline)}` : daysUntil(marche.parsedDeadline) === 0 ? 'AUJOURD\'HUI' : `Retard ${Math.abs(daysUntil(marche.parsedDeadline))}j`}
                            </p>
                          </>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-600" style={{width: `${Math.min(marche.score, 100)}%`}} />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{marche.score}/100</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(marche.status)}`}>
                          {getStatusLabel(marche.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {marche.qualification ? (
                          <>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(marche.qualification.decision)}`}>
                              {marche.qualification.decision}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">Complétude: {marche.qualification.completionRate?.toFixed(0)}%</p>
                          </>
                        ) : 'Non qualifié'}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {marche.status === 'nouveau' && (
                            <button
                              onClick={() => handleQualify(marche.id)}
                              className="px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-lg hover:bg-yellow-200"
                            >
                              Qualifier
                            </button>
                          )}
                          {marche.qualification?.decision === 'GO' && marche.status === 'qualifie' && (
                            <button
                              onClick={() => handleGenerate(marche.id)}
                              className="px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-100 rounded-lg hover:bg-primary-200"
                            >
                              Générer dossier
                            </button>
                          )}
                          {['qualifie', 'dossier_genere'].includes(marche.status) && (
                            <button
                              onClick={() => handleDeclareResult(marche.id, 'gagne')}
                              className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200"
                            >
                              Gagné
                            </button>
                          )}
                          {['qualifie', 'dossier_genere', 'depose'].includes(marche.status) && (
                            <button
                              onClick={() => handleDeclareResult(marche.id, 'perdu')}
                              className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200"
                            >
                              Perdu
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: string, color: string }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    purple: 'bg-purple-100 text-purple-700',
    green: 'bg-green-100 text-green-700',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colors[color as keyof typeof colors]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  )
}