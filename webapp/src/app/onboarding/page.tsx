'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const steps = [
  { id: 'company', title: 'Entreprise', fields: ['companyName', 'legalForm', 'capitalSocial', 'rcmNumber', 'ifuNumber', 'cnpsNumber', 'taxCenter', 'address', 'phone', 'email', 'website', 'sector'] },
  { id: 'representative', title: 'Représentant', fields: ['representativeName', 'representativeTitle', 'representativeIdNumber'] },
  { id: 'capacities', title: 'Capacités', fields: ['staffCount', 'techStaffCount', 'ca3Years', 'ownFunds', 'creditLines'] },
  { id: 'references', title: 'Références', fields: ['references'] },
  { id: 'account', title: 'Compte', fields: ['password', 'confirmPassword'] },
]

const initialData = {
  companyName: '', legalForm: 'SARL', capitalSocial: '', rcmNumber: '', ifuNumber: '', cnpsNumber: '',
  taxCenter: '', address: '', phone: '', email: '', website: '', sector: '',
  representativeName: '', representativeTitle: 'Directeur Général', representativeIdNumber: '',
  staffCount: 0, techStaffCount: 0, ca3Years: [0, 0, 0], ownFunds: 0, creditLines: 0,
  references: [], password: '', confirmPassword: '',
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [data, setData] = useState(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const validateStep = (stepId: string) => {
    const newErrors: Record<string, string> = {}
    const currentStep = steps[step]
    
    currentStep.fields.forEach(field => {
      const value = data[field as keyof typeof data]
      if (['companyName', 'rcmNumber', 'ifuNumber', 'address', 'email', 'representativeName', 'password'].includes(field)) {
        if (!value || (Array.isArray(value) && value.length === 0)) {
          newErrors[field] = 'Champ requis'
        }
      }
      if (field === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors[field] = 'Email invalide'
      }
      if (field === 'confirmPassword' && value !== data.password) {
        newErrors[field] = 'Mots de passe différents'
      }
      if (field === 'password' && value && value.length < 8) {
        newErrors[field] = 'Minimum 8 caractères'
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(steps[step].id)) return
    if (step < steps.length - 1) {
      setStep(step + 1)
      return
    }
    
    setSubmitting(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Erreur inscription')
      router.push('/dashboard?onboarded=1')
    } catch (err) {
      console.error(err)
      alert('Erreur lors de l\'inscription')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const currentStep = steps[step]
  const progress = ((step + 1) / steps.length) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-2 bg-gray-200 z-50">
        <div 
          className="h-full bg-primary-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="mx-auto max-w-2xl px-4 py-16 pt-20">
        {/* Steps Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s.id} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i < step ? 'bg-primary-600 text-white' : 
                  i === step ? 'bg-primary-600 text-white ring-4 ring-primary-100' : 
                  'bg-gray-200 text-gray-500'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs mt-1 font-medium ${i <= step ? 'text-primary-600' : 'text-gray-400'}`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{currentStep.title}</h1>
            <p className="text-gray-600 mt-1">Étape {step + 1} sur {steps.length}</p>
          </div>

          {currentStep.fields.map(field => {
            const error = errors[field]
            const value = data[field as keyof typeof data]
            
            if (field === 'ca3Years') {
              return (
                <div key={field} className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CA 3 dernières années (FCFA) <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['2022', '2023', '2024'].map((year, i) => (
                      <div key={year}>
                        <label className="block text-xs text-gray-500 mb-1">{year}</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          value={value[i] || 0}
                          onChange={e => handleChange(field, [...value.slice(0,i), Number(e.target.value), ...value.slice(i+1)])}
                          min={0}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            }

            if (field === 'references') {
              return (
                <div key={field} className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Références marchés (3-5 ans) — Ajoutez au moins 1
                  </label>
                  {value.map((ref: any, i: number) => (
                    <div key={i} className="space-y-2 mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between">
                        <span className="font-medium text-sm">Référence #{i + 1}</span>
                        {value.length > 1 && (
                          <button type="button" onClick={() => handleChange(field, value.filter((_: any, idx: number) => idx !== i))} className="text-red-500 text-sm">Supprimer</button>
                        )}
                      </div>
                      <input
                        placeholder="Année (ex: 2023)"
                        value={ref.year || ''}
                        onChange={e => handleChange(field, value.map((r: any, idx: number) => idx === i ? {...r, year: e.target.value} : r))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <input
                        placeholder="Client"
                        value={ref.client || ''}
                        onChange={e => handleChange(field, value.map((r: any, idx: number) => idx === i ? {...r, client: e.target.value} : r))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <input
                        placeholder="Description"
                        value={ref.description || ''}
                        onChange={e => handleChange(field, value.map((r: any, idx: number) => idx === i ? {...r, description: e.target.value} : r))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        placeholder="Montant FCFA"
                        value={ref.amount || ''}
                        onChange={e => handleChange(field, value.map((r: any, idx: number) => idx === i ? {...r, amount: Number(e.target.value)} : r))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                  <button type="button" onClick={() => handleChange(field, [...value, {year: '', client: '', description: '', amount: 0}])} className="text-primary-600 hover:text-primary-700 text-sm font-medium">+ Ajouter une référence</button>
                </div>
              )
            }

            if (field === 'legalForm') {
              return (
                <div key={field} className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Forme juridique <span className="text-red-500">*</span></label>
                  <select
                    value={value}
                    onChange={e => handleChange(field, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {['SARL', 'SA', 'SUARL', 'EURL', 'SAS', 'SN', 'GIE', 'Association'].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )
            }

            if (field === 'password' || field === 'confirmPassword') {
              return (
                <div key={field} className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field === 'password' ? 'Mot de passe' : 'Confirmer le mot de passe'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={value}
                    onChange={e => handleChange(field, e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${error ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder={field === 'password' ? 'Min 8 caractères' : 'Confirmer'}
                  />
                  {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
                </div>
              )
            }

            return (
              <div key={field} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} 
                  {['companyName', 'rcmNumber', 'ifuNumber', 'address', 'email', 'representativeName'].includes(field) && <span className="text-red-500">*</span>}
                </label>
                <input
                  type={field.includes('email') ? 'email' : field.includes('phone') ? 'tel' : field.includes('Count') || field.includes('Funds') || field.includes('Lines') || field.includes('capital') ? 'number' : 'text'}
                  value={value}
                  onChange={e => handleChange(field, e.target.type === 'number' ? Number(e.target.value) : e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${error ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder={field === 'capitalSocial' ? 'Ex: 10000000' : field === 'rcmNumber' ? 'Ex: TG-LFW-2024-B-12345' : ''}
                />
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
              </div>
            )
          })}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium">
                ← Précédent
              </button>
            )}
            {step === steps.length - 1 ? (
              <button type="submit" disabled={submitting} className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? 'Inscription...' : 'Finaliser l\'inscription'}
              </button>
            ) : (
              <button type="submit" className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700">
                Suivant →
              </button>
            )}
          </div>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ? <Link href="/auth/signin" className="text-primary-600 hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}