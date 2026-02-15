import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, hasRole } from '@/lib/auth-utils'
import { getGroupAdminIds } from '@/lib/admin-scope'
import { z } from 'zod'

const updateSchema = z.object({
  orderId: z.string().min(1),
  orderNumber: z.number().int(),
  courierId: z.string().min(1).nullable().optional(),
})

const bodySchema = z.object({
  updates: z.array(updateSchema).min(1),
})

function sortedNumbers(values: number[]) {
  return values.slice().sort((a, b) => a - b)
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasRole(user, ['SUPER_ADMIN', 'MIDDLE_ADMIN', 'LOW_ADMIN'])) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    let raw: unknown
    try {
      raw = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = bodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid payload' }, { status: 400 })
    }

    const updates = parsed.data.updates

    const orderIds = updates.map((u) => u.orderId)
    if (new Set(orderIds).size !== orderIds.length) {
      return NextResponse.json({ error: 'Duplicate orderId in payload' }, { status: 400 })
    }

    const desiredOrderNumbers = updates.map((u) => u.orderNumber)
    if (new Set(desiredOrderNumbers).size !== desiredOrderNumbers.length) {
      return NextResponse.json({ error: 'Duplicate orderNumber in payload' }, { status: 400 })
    }

    const groupAdminIds = user.role === 'SUPER_ADMIN' ? null : await getGroupAdminIds(user)

    const existingOrders = await db.order.findMany({
      where: {
        id: { in: orderIds },
        ...(groupAdminIds ? { adminId: { in: groupAdminIds } } : {}),
      },
      select: { id: true, orderNumber: true, adminId: true },
    })

    if (existingOrders.length !== orderIds.length) {
      const found = new Set(existingOrders.map((o) => o.id))
      const missing = orderIds.filter((id) => !found.has(id))
      return NextResponse.json({ error: 'Некоторые заказы недоступны', missing }, { status: 404 })
    }

    const currentOrderNumbers = existingOrders.map((o) => o.orderNumber)
    const isPermutation =
      JSON.stringify(sortedNumbers(currentOrderNumbers)) === JSON.stringify(sortedNumbers(desiredOrderNumbers))
    if (!isPermutation) {
      return NextResponse.json(
        { error: 'Номера заказов должны быть перестановкой текущих номеров выбранных заказов' },
        { status: 400 }
      )
    }

    // Validate courier IDs (optional)
    const courierIds = Array.from(
      new Set(
        updates
          .map((u) => (u.courierId == null || u.courierId === '' ? null : u.courierId))
          .filter((v): v is string => typeof v === 'string' && v.length > 0)
      )
    )

    if (courierIds.length > 0) {
      const couriers = await db.admin.findMany({
        where: {
          id: { in: courierIds },
          role: 'COURIER',
          ...(groupAdminIds ? { createdBy: { in: groupAdminIds } } : {}),
        },
        select: { id: true },
      })
      if (couriers.length !== courierIds.length) {
        const found = new Set(couriers.map((c) => c.id))
        const missing = courierIds.filter((id) => !found.has(id))
        return NextResponse.json({ error: 'Указан неверный курьер', missing }, { status: 400 })
      }
    }

    const maxRow = await db.order.findFirst({
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    })
    const maxOrderNumber = maxRow?.orderNumber ?? 0
    const offset = maxOrderNumber + 10000

    const currentById = new Map(existingOrders.map((o) => [o.id, o.orderNumber]))
    const finalById = new Map(
      updates.map((u) => [u.orderId, { orderNumber: u.orderNumber, courierId: u.courierId ?? null }])
    )

    await db.$transaction(async (tx) => {
      // Phase 1: move away from current orderNumbers to avoid unique collisions
      for (const orderId of orderIds) {
        const current = currentById.get(orderId)
        if (current == null) continue
        await tx.order.update({
          where: { id: orderId },
          data: { orderNumber: current + offset },
          select: { id: true },
        })
      }

      // Phase 2: apply final numbers + courier reassignment
      for (const orderId of orderIds) {
        const next = finalById.get(orderId)
        if (!next) continue
        await tx.order.update({
          where: { id: orderId },
          data: {
            orderNumber: next.orderNumber,
            courierId: next.courierId === 'null' || next.courierId === '' ? null : next.courierId,
          },
          select: { id: true },
        })
      }
    })

    return NextResponse.json({ message: 'OK', updatedCount: orderIds.length })
  } catch (error) {
    console.error('Orders reorder error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

