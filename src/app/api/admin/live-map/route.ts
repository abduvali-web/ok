import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { getAuthUser, hasRole } from '@/lib/auth-utils'
import { getGroupAdminIds } from '@/lib/admin-scope'

type LiveMapPoint = {
  id: string
  name: string
  lat: number
  lng: number
}

function isFiniteCoord(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function toEtag({
  couriers,
  clients,
  latestUpdateMs,
}: {
  couriers: LiveMapPoint[]
  clients: LiveMapPoint[]
  latestUpdateMs: number
}) {
  return `W/"${latestUpdateMs}:${couriers.length}:${clients.length}"`
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || !hasRole(user, ['LOW_ADMIN', 'MIDDLE_ADMIN', 'SUPER_ADMIN'])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const groupAdminIds = user.role === 'SUPER_ADMIN' ? null : (await getGroupAdminIds(user)) ?? [user.id]

    const courierWhere: any = {
      role: 'COURIER',
      isActive: true,
      latitude: { not: null },
      longitude: { not: null },
    }
    if (groupAdminIds) {
      courierWhere.createdBy = { in: groupAdminIds }
    }

    const clientWhere: any = {
      deletedAt: null,
      isActive: true,
      latitude: { not: null },
      longitude: { not: null },
    }
    if (groupAdminIds) {
      clientWhere.createdBy = { in: groupAdminIds }
    }

    const [courierRows, clientRows] = await Promise.all([
      db.admin.findMany({
        where: courierWhere,
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
          updatedAt: true,
        },
      }),
      db.customer.findMany({
        where: clientWhere,
        select: {
          id: true,
          name: true,
          nickName: true,
          latitude: true,
          longitude: true,
          updatedAt: true,
        },
      }),
    ])

    const couriers: LiveMapPoint[] = courierRows
      .map((row) => {
        const lat = row.latitude
        const lng = row.longitude
        if (!isFiniteCoord(lat) || !isFiniteCoord(lng)) return null
        return {
          id: row.id,
          name: row.name,
          lat,
          lng,
        } satisfies LiveMapPoint
      })
      .filter((row): row is LiveMapPoint => !!row)

    const clients: LiveMapPoint[] = clientRows
      .map((row) => {
        const lat = row.latitude
        const lng = row.longitude
        if (!isFiniteCoord(lat) || !isFiniteCoord(lng)) return null
        return {
          id: row.id,
          name: row.nickName?.trim() || row.name,
          lat,
          lng,
        } satisfies LiveMapPoint
      })
      .filter((row): row is LiveMapPoint => !!row)

    const latestCourierUpdateMs = courierRows.reduce((max, row) => Math.max(max, row.updatedAt.getTime()), 0)
    const latestClientUpdateMs = clientRows.reduce((max, row) => Math.max(max, row.updatedAt.getTime()), 0)
    const latestUpdateMs = Math.max(latestCourierUpdateMs, latestClientUpdateMs)
    const etag = toEtag({ couriers, clients, latestUpdateMs })

    if (request.headers.get('if-none-match') === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          'Cache-Control': 'private, no-cache, must-revalidate',
        },
      })
    }

    return NextResponse.json(
      {
        serverTime: new Date().toISOString(),
        couriers,
        clients,
      },
      {
        headers: {
          ETag: etag,
          'Cache-Control': 'private, no-cache, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching live map data:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

