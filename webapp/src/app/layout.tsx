import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Marchés Publics Partner - Gagnez des marchés publics en UEMOA',
  description: 'Plateforme d\'accompagnement aux appels d\'offres publics. Veille automatisée, qualification, génération de dossiers, success fee only.',
  keywords: ['marchés publics', 'appels d\'offres', 'UEMOA', 'Togo', 'Sénégal', 'Côte d\'Ivoire', 'success fee'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}