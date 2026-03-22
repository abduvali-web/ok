import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { auth } from '@/auth'
import { getGroupAdminIds, getOwnerAdminId } from '@/lib/admin-scope'

function startOfDayUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function diffDaysInclusiveUtc(from: Date, to: Date) {
  const fromDay = startOfDayUtc(from).getTime()
  const toDay = startOfDayUtc(to).getTime()
  const diff = Math.floor((toDay - fromDay) / (24 * 60 * 60 * 1000))
  return Math.max(0, diff + 1)
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (
      !session ||
      !session.user ||
      !['SUPER_ADMIN', 'MIDDLE_ADMIN', 'LOW_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const asOfRaw = searchParams.get('asOf')
    const asOf = asOfRaw && !Number.isNaN(new Date(asOfRaw).getTime()) ? new Date(asOfRaw) : new Date()

    const fromRaw = searchParams.get('from')
    const toRaw = searchParams.get('to')
    const fromDate = fromRaw ? new Date(fromRaw) : undefined
    const toDate = toRaw ? new Date(toRaw) : undefined

    const effectiveAdminId =
      session.user.role === 'LOW_ADMIN'
        ? (await getOwnerAdminId(session.user)) ?? session.user.id
        : session.user.id

    const groupAdminIds = await getGroupAdminIds(session.user)

    const where: any = {
      role: { in: ['LOW_ADMIN', 'COURIER', 'WORKER'] as const },
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      where.createdBy = { in: groupAdminIds ?? [effectiveAdminId] }
    }

    const admins = await prisma.admin.findMany({
      where,
      select: {
        id: true,
        name: true,
        role: true,
        salary: true,
        createdAt: true,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const adminIds = admins.map((a) => a.id)

    const salaryPayments = adminIds.length
      ? await prisma.transaction.groupBy({
          by: ['salaryRecipientAdminId'],
          where: {
            category: 'SALARY',
            salaryRecipientAdminId: { in: adminIds },
          },
          _sum: { amount: true },
        })
      : []

    const paidById = new Map<string, number>()
    for (const row of salaryPayments) {
      if (row.salaryRecipientAdminId) {
        paidById.set(row.salaryRecipientAdminId, row._sum.amount ?? 0)
      }
    }

    // Now calculate period-specific withdrawals
    const periodWhere: any = {
      category: 'SALARY',
      salaryRecipientAdminId: { in: adminIds },
    }
    if (fromDate && toDate) {
      periodWhere.createdAt = {
        gte: startOfDayUtc(fromDate),
        lte: startOfDayUtc(toDate),
      }
      // If same day, we need local end of day instead of UTC, or just +24h if it's startOfDay
      periodWhere.createdAt.lte = new Date(startOfDayUtc(toDate).getTime() + 24 * 60 * 60 * 1000 - 1)
    }

    const periodWithdrawals = adminIds.length ? await prisma.transaction.groupBy({
      by: ['salaryRecipientAdminId'],
      where: periodWhere,
      _sum: { amount: true },
    }) : []

    const withdrawnPeriodById = new Map<string, number>()
    for (const row of periodWithdrawals) {
      if (row.salaryRecipientAdminId) {
        withdrawnPeriodById.set(row.salaryRecipientAdminId, row._sum.amount ?? 0)
      }
    }

    const payload = admins.map((admin) => {
      const days = diffDaysInclusiveUtc(admin.createdAt, asOf)
      const accrued = Number(admin.salary ?? 0) * days
      const paid = paidById.get(admin.id) ?? 0
      const balance = accrued - paid
      const withdrawnPeriod = withdrawnPeriodById.get(admin.id) ?? 0

      return {
        id: admin.id,
        name: admin.name,
        role: admin.role,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        salaryPerDay: admin.salary ?? 0,
        days,
        accrued,
        paid,
        balance,
        withdrawnPeriod,
      }
    })

    return NextResponse.json({ asOf, admins: payload })
  } catch (error) {
    console.error('Error fetching admin salary balances:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

