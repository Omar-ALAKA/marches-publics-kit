import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 mb-6">
              🇹🇬 🇸🇳 🇨🇮 🇧🇫 🇲🇱 UEMOA + BOAD + BCEAO + Grands Comptes
            </span>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6">
              Gagnez des marchés publics
              <br />
              <span className="text-primary-600">sans avancer un centime</span>
            </h1>
            <p className="text-lg lg:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Veille automatisée, qualification experte, dossiers complets générés en 1 clic.
              <strong className="text-primary-700"> Vous ne payez que si vous gagnez : 1% du marché (500k-10M FCFA).</strong>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/onboarding"
                className="w-full sm:w-auto px-8 py-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors text-center"
              >
                Démarrer gratuitement →
              </Link>
              <Link
                href="#comment-ca-marche"
                className="w-full sm:w-auto px-8 py-4 border-2 border-primary-600 text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors text-center"
              >
                Comment ça marche
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <dt className="text-3xl lg:text-4xl font-bold text-primary-600">0 FCFA</dt>
              <dd className="mt-2 text-gray-600">Investissement initial</dd>
            </div>
            <div className="text-center">
              <dt className="text-3xl lg:text-4xl font-bold text-primary-600">1%</dt>
              <dd className="mt-2 text-gray-600">Success fee (min 500k)</dd>
            </div>
            <div className="text-center">
              <dt className="text-3xl lg:text-4xl font-bold text-primary-600">24h</dt>
              <dd className="mt-2 text-gray-600">Dossier complet généré</dd>
            </div>
            <div className="text-center">
              <dt className="text-3xl lg:text-4xl font-bold text-primary-600">5</dt>
              <dd className="mt-2 text-gray-600">Pays UEMOA couverts</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment-ca-marche" className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-16">
            Comment ça marche en 4 étapes
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Inscription & Onboarding',
                desc: 'Créez votre compte, renseignez vos infos légales (RCCM, IFU, CNPS), capacités techniques, références. 15 min chrono.',
                icon: '📝',
              },
              {
                step: '2',
                title: 'Veille & Alertes Quotidiennes',
                desc: 'Nos bots scannent 10+ sources (portails officiels, BOAD, BCEAO, Sonatel, banques, ONG). Vous recevez les opportunités pertinentes par Telegram/Email.',
                icon: '🔍',
              },
              {
                step: '3',
                title: 'Qualification & Génération',
                desc: 'Cliquez "Qualifier" → Checklist auto + Score GO/NO-GO. Cliquez "Générer" → 8 documents prêts (DC1, DC2, Mémoire, BPU, Capacités, Attestations, Lettre).',
                icon: '⚡',
              },
              {
                step: '4',
                title: 'Dépôt & Success Fee',
                desc: 'Vous déposez (ou on dépose pour vous). Si gagné → Facture 1% (min 500k, max 10M). Si perdu → 0 FCFA. Simple.',
                icon: '🏆',
              },
            ].map((item) => (
              <div key={item.step} className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{item.icon}</div>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold mb-4">
                  {item.step}
                </span>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Documents générés */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-16">
            8 documents générés automatiquement
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              'DC1 - Demande Participation',
              'DC2 - Déclaration Sur Honneur',
              'BPU - Bordereau Prix Unitaires',
              'Mémoire Technique',
              'Capacités Techniques/Financières',
              'Attestation CNPS (modèle demande)',
              'Attestation Fiscale (modèle demande)',
              'Lettre de Soumission',
            ].map((doc) => (
              <div key={doc} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <span className="text-sm font-medium text-gray-700">{doc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Prêt à tester ? Aucun risque, tout à gagner.
          </h2>
          <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
            Inscrivez votre entreprise en 15 minutes. Première alerte marché demain 6h. Premier dossier généré cette semaine.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors text-lg"
          >
            Créer mon compte gratuit →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-gray-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-2">Marchés Publics Partner — Success Fee Only</p>
          <p className="text-sm">Basé à Lomé, Togo — Couverture UEMOA complète</p>
          <p className="text-sm mt-4">Contact : omaralaka7@gmail.com | Telegram @omaralaka</p>
        </div>
      </footer>
    </main>
  )
}