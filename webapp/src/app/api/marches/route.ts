import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.clientId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const marches = await prisma.marche.findMany({
      where: {
        clientId: session.user.clientId,
        ...(status && { status: status as any }),
      },
      include: {
        qualification: true,
      },
      orderBy: { detectedAt: 'desc' },
    })

    return NextResponse.json(marches)
  } catch (error) {
    console.error('Fetch marches error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}