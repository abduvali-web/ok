import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'
import { getAuthUser, hasRole } from '@/lib/auth-utils'

const JWT_SECRET = process.env.JWT_SECRET

type SiteAdminChatTokenPayload = {
  id: string
  role: 'SITE_ADMIN'
  name: string
  websiteId: string
}

export async function POST(request: NextRequest) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json({ error: 'JWT_SECRET is not configured' }, { status: 500 })
    }

    const user = await getAuthUser(request)
    if (!user || !hasRole(user, ['MIDDLE_ADMIN', 'SUPER_ADMIN'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const websiteId = typeof body.websiteId === 'string' ? body.websiteId : ''

    if (!websiteId) {
      return NextResponse.json({ error: 'websiteId is required' }, { status: 400 })
    }

    const website = await db.website.findFirst({
      where: {
        id: websiteId,
        adminId: user.id,
      },
      select: { id: true },
    })

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 })
    }

    const admin = await db.admin.findUnique({
      where: { id: user.id },
      select: { name: true },
    })

    const payload: SiteAdminChatTokenPayload = {
      id: user.id,
      role: 'SITE_ADMIN',
      name: admin?.name || 'Middle Admin',
      websiteId,
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' })

    return NextResponse.json({ token, role: payload.role, name: payload.name })
  } catch (error) {
    console.error('Error issuing site chat token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
