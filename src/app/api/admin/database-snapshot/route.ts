import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, hasRole } from '@/lib/auth-utils'
import { getGroupAdminIds, getOwnerAdminId } from '@/lib/admin-scope'

type SnapshotTable = {
  id: string
  title: string
  description: string
  rowCount: number
  columns: string[]
  rows: Record<string, string>[]
}

function serializeValue(value: unknown): string {
  if (value == null) return ''
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function toRows<T extends Record<string, unknown>>(records: T[]) {
  return records.map((record) => {
    const normalized: Record<string, string> = {}
    Object.entries(record).forEach(([key, value]) => {
      normalized[key] = serializeValue(value)
    })
    return normalized
  })
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || !hasRole(user, ['LOW_ADMIN', 'MIDDLE_ADMIN', 'SUPER_ADMIN'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const groupAdminIds = await getGroupAdminIds(user)
    const ownerAdminId = await getOwnerAdminId(user)

    const adminWhere =
      user.role === 'SUPER_ADMIN'
        ? {}
        : {
            OR: [
              { id: { in: groupAdminIds ?? [user.id] } },
              ...(ownerAdminId ? [{ createdBy: ownerAdminId }] : []),
            ],
          }

    const customerWhere =
      user.role === 'SUPER_ADMIN'
        ? {}
        : { createdBy: { in: groupAdminIds ?? [user.id] } }

    const orderWhere =
      user.role === 'SUPER_ADMIN'
        ? {}
        : { adminId: { in: groupAdminIds ?? [user.id] } }

    const [admins, customers, orders, transactions, websites, menuSets, menus, dishes, warehouseItems, dailyCookingPlans, actionLogs, orderAuditEvents] =
      await Promise.all([
        db.admin.findMany({
          where: adminWhere,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdBy: true,
            createdAt: true,
            lastSeenAt: true,
          },
        }),
        db.customer.findMany({
          where: customerWhere,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
            isActive: true,
            calories: true,
            balance: true,
            createdBy: true,
            createdAt: true,
            assignedSetId: true,
          },
        }),
        db.order.findMany({
          where: orderWhere,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            orderStatus: true,
            paymentStatus: true,
            calories: true,
            quantity: true,
            deliveryAddress: true,
            deliveryDate: true,
            createdAt: true,
            customer: {
              select: {
                name: true,
                phone: true,
              },
            },
            courier: {
              select: {
                name: true,
              },
            },
          },
        }),
        db.transaction.findMany({
          where:
            user.role === 'SUPER_ADMIN'
              ? {}
              : {
                  OR: [
                    { adminId: { in: groupAdminIds ?? [user.id] } },
                    { customer: { createdBy: { in: groupAdminIds ?? [user.id] } } },
                  ],
                },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            amount: true,
            category: true,
            description: true,
            createdAt: true,
            admin: { select: { name: true } },
            customer: { select: { name: true, phone: true } },
          },
        }),
        db.website.findMany({
          where: user.role === 'SUPER_ADMIN' ? {} : { adminId: ownerAdminId ?? user.id },
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            subdomain: true,
            chatEnabled: true,
            adminId: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        db.menuSet.findMany({
          where: user.role === 'SUPER_ADMIN' ? {} : { adminId: ownerAdminId ?? user.id },
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            name: true,
            menuNumber: true,
            isActive: true,
            adminId: true,
            updatedAt: true,
          },
        }),
        db.menu.findMany({
          orderBy: { number: 'asc' },
          select: {
            id: true,
            number: true,
            createdAt: true,
            updatedAt: true,
            dishes: {
              select: {
                id: true,
              },
            },
          },
        }),
        db.dish.findMany({
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            name: true,
            mealType: true,
            imageUrl: true,
            updatedAt: true,
          },
        }),
        db.warehouseItem.findMany({
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            name: true,
            amount: true,
            unit: true,
            updatedAt: true,
          },
        }),
        db.dailyCookingPlan.findMany({
          orderBy: { date: 'desc' },
          select: {
            id: true,
            date: true,
            menuNumber: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        db.actionLog.findMany({
          where: user.role === 'SUPER_ADMIN' ? {} : { adminId: { in: groupAdminIds ?? [user.id] } },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            description: true,
            createdAt: true,
            admin: { select: { name: true, role: true } },
          },
        }),
        db.orderAuditEvent.findMany({
          where:
            user.role === 'SUPER_ADMIN'
              ? {}
              : { order: { adminId: { in: groupAdminIds ?? [user.id] } } },
          orderBy: { occurredAt: 'desc' },
          select: {
            id: true,
            eventType: true,
            actorName: true,
            previousStatus: true,
            nextStatus: true,
            occurredAt: true,
            order: { select: { orderNumber: true } },
          },
        }),
      ])

    const tables: SnapshotTable[] = [
      {
        id: 'admins',
        title: 'Admins',
        description: 'Operational admin accounts visible in this Neon scope.',
        rowCount: admins.length,
        columns: ['name', 'email', 'role', 'isActive', 'createdBy', 'createdAt', 'lastSeenAt'],
        rows: toRows(admins),
      },
      {
        id: 'customers',
        title: 'Customers',
        description: 'Client sheet from Neon with status, balance, calories, and ownership.',
        rowCount: customers.length,
        columns: ['name', 'phone', 'address', 'isActive', 'calories', 'balance', 'createdBy', 'assignedSetId', 'createdAt'],
        rows: toRows(customers),
      },
      {
        id: 'orders',
        title: 'Orders',
        description: 'Delivery pipeline rows from Neon with customer and courier references.',
        rowCount: orders.length,
        columns: ['orderNumber', 'orderStatus', 'paymentStatus', 'calories', 'quantity', 'deliveryAddress', 'deliveryDate', 'createdAt', 'customer', 'courier'],
        rows: toRows(
          orders.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            calories: order.calories,
            quantity: order.quantity,
            deliveryAddress: order.deliveryAddress,
            deliveryDate: order.deliveryDate,
            createdAt: order.createdAt,
            customer: order.customer ? `${order.customer.name} (${order.customer.phone})` : '',
            courier: order.courier?.name ?? '',
          }))
        ),
      },
      {
        id: 'transactions',
        title: 'Transactions',
        description: 'Income, expense, and balance-related movements stored in Neon.',
        rowCount: transactions.length,
        columns: ['type', 'amount', 'category', 'description', 'createdAt', 'admin', 'customer'],
        rows: toRows(
          transactions.map((item) => ({
            id: item.id,
            type: item.type,
            amount: item.amount,
            category: item.category,
            description: item.description,
            createdAt: item.createdAt,
            admin: item.admin?.name ?? '',
            customer: item.customer ? `${item.customer.name} (${item.customer.phone})` : '',
          }))
        ),
      },
      {
        id: 'websites',
        title: 'Websites',
        description: 'Subdomain website configuration rows for the current scope.',
        rowCount: websites.length,
        columns: ['subdomain', 'chatEnabled', 'adminId', 'createdAt', 'updatedAt'],
        rows: toRows(websites),
      },
      {
        id: 'menuSets',
        title: 'Menu Sets',
        description: 'Assigned menu set definitions and active state from Neon.',
        rowCount: menuSets.length,
        columns: ['name', 'menuNumber', 'isActive', 'adminId', 'updatedAt'],
        rows: toRows(menuSets),
      },
      {
        id: 'menus',
        title: 'Menus',
        description: 'Base menu definitions with linked dish counts.',
        rowCount: menus.length,
        columns: ['number', 'dishCount', 'createdAt', 'updatedAt'],
        rows: toRows(
          menus.map((menu) => ({
            id: menu.id,
            number: menu.number,
            dishCount: menu.dishes.length,
            createdAt: menu.createdAt,
            updatedAt: menu.updatedAt,
          }))
        ),
      },
      {
        id: 'dishes',
        title: 'Dishes',
        description: 'Dish catalog rows used in menu construction.',
        rowCount: dishes.length,
        columns: ['name', 'mealType', 'imageUrl', 'updatedAt'],
        rows: toRows(dishes),
      },
      {
        id: 'warehouse',
        title: 'Warehouse',
        description: 'Warehouse inventory rows from Neon.',
        rowCount: warehouseItems.length,
        columns: ['name', 'amount', 'unit', 'updatedAt'],
        rows: toRows(warehouseItems),
      },
      {
        id: 'cookingPlans',
        title: 'Cooking Plans',
        description: 'Daily cooking plan rows tied to menu numbers.',
        rowCount: dailyCookingPlans.length,
        columns: ['date', 'menuNumber', 'createdAt', 'updatedAt'],
        rows: toRows(dailyCookingPlans),
      },
      {
        id: 'actionLogs',
        title: 'Action Logs',
        description: 'Audit trail of admin actions stored in Neon.',
        rowCount: actionLogs.length,
        columns: ['action', 'entityType', 'entityId', 'description', 'createdAt', 'admin'],
        rows: toRows(
          actionLogs.map((log) => ({
            id: log.id,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            description: log.description,
            createdAt: log.createdAt,
            admin: log.admin ? `${log.admin.name} (${log.admin.role})` : '',
          }))
        ),
      },
      {
        id: 'orderAudit',
        title: 'Order Audit',
        description: 'Order event history with status transitions.',
        rowCount: orderAuditEvents.length,
        columns: ['orderNumber', 'eventType', 'actorName', 'previousStatus', 'nextStatus', 'occurredAt'],
        rows: toRows(
          orderAuditEvents.map((event) => ({
            id: event.id,
            orderNumber: event.order?.orderNumber ?? '',
            eventType: event.eventType,
            actorName: event.actorName,
            previousStatus: event.previousStatus,
            nextStatus: event.nextStatus,
            occurredAt: event.occurredAt,
          }))
        ),
      },
    ]

    const summary = tables.map((table) => ({
      id: table.id,
      title: table.title,
      description: table.description,
      rowCount: table.rowCount,
      columnCount: table.columns.length,
    }))

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      scope: user.role === 'SUPER_ADMIN' ? 'Global' : 'Owner group',
      tables,
      summary,
    })
  } catch (error) {
    // eslint-disable-next-line no-console -- route diagnostics for Neon snapshot failures.
    console.error('Error building database snapshot:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to build Neon database snapshot' },
      { status: 500 }
    )
  }
}
