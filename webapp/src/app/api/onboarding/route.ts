import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      companyName, legalForm, capitalSocial, rcmNumber, ifuNumber, cnpsNumber,
      taxCenter, address, phone, email, website, sector,
      representativeName, representativeTitle, representativeIdNumber,
      staffCount, techStaffCount, ca3Years, ownFunds, creditLines,
      references, password
    } = body

    // Vérifications
    if (!companyName || !rcmNumber || !ifuNumber || !address || !email || !representativeName || !password) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    // Vérifier unicité
    const existing = await prisma.client.findFirst({
      where: { OR: [{ rcmNumber }, { ifuNumber }, { email }] }
    })
    if (existing) {
      return NextResponse.json({ error: 'Entreprise déjà enregistrée (RCCM, IFU ou Email)' }, { status: 409 })
    }

    // Hasher mot de passe
    const passwordHash = await bcrypt.hash(password, 12)

    // Créer client + user en transaction
    const result = await prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          companyName,
          legalForm,
          capitalSocial: capitalSocial ? BigInt(capitalSocial) : null,
          rcmNumber,
          ifuNumber,
          cnpsNumber,
          taxCenter,
          address,
          phone,
          email,
          website,
          sector,
          representativeName,
          representativeTitle,
          representativeIdNumber,
          staffCount: staffCount || 0,
          techStaffCount: techStaffCount || 0,
          ca3Years: ca3Years?.map((v: number) => BigInt(v)) || [],
          ownFunds: ownFunds ? BigInt(ownFunds) : 0,
          creditLines: creditLines ? BigInt(creditLines) : 0,
          references: references || [],
          onboardedAt: new Date(),
        }
      })

      const user = await tx.user.create({
        data: {
          email,
          name: companyName,
          passwordHash,
          role: 'client',
          clientId: client.id,
        }
      })

      // Créer entrées conformité tracking
      const docTypes = ['RCCM', 'IFU', 'CNPS', 'IMPOTS', 'LICENCE', 'ASSURANCE']
      await Promise.all(docTypes.map(dt => 
        tx.conformityTracking.create({
          data: {
            clientId: client.id,
            documentType: dt,
            status: dt === 'RCCM' || dt === 'IFU' ? 'valide' : 'manquant',
          }
        })
      ))

      return { client, user }
    })

    return NextResponse.json({ 
      success: true, 
      clientId: result.client.id,
      message: 'Inscription réussie. Connectez-vous pour accéder à votre dashboard.'
    })
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}