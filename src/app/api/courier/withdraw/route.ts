import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, hasRole } from '@/lib/auth-utils'
import { z } from 'zod'
import { getOwnerAdminId } from '@/lib/admin-scope'

const WithdrawSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || !hasRole(user, ['COURIER'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = WithdrawSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const { amount } = validation.data

    // Get the owner admin (the middle admin who owns this courier)
    const ownerAdminId = await getOwnerAdminId(user)
    if (!ownerAdminId) {
      return NextResponse.json({ error: 'No owner admin found' }, { status: 400 })
    }

    // Calculate current balance (accrued - paid)
    const asOf = new Date()
    const diffDaysInclusiveUtc = (from: Date, to: Date) => {
      const fromDay = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())).getTime()
      const toDay = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate())).getTime()
      const diff = Math.floor((toDay - fromDay) / (24 * 60 * 60 * 1000))
      return Math.max(0, diff + 1)
    }

    const courier = await db.admin.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, salary: true, createdAt: true },
    })

    if (!courier) {
      return NextResponse.json({ error: 'Courier not found' }, { status: 404 })
    }

    const days = diffDaysInclusiveUtc(courier.createdAt, asOf)
    const accrued = Number(courier.salary ?? 0) * days

    // Sum all prior payments
    const payments = await db.transaction.aggregate({
      where: {
        category: 'SALARY',
        salaryRecipientAdminId: user.id,
      },
      _sum: { amount: true },
    })
    const paid = payments._sum.amount ?? 0
    const balance = accrued - paid

    if (balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // Use transaction: deduct from company balance + create transaction record
    const result = await db.$transaction(async (tx) => {
      // Deduct from company balance (who pays this courier)
      await tx.admin.update({
        where: { id: ownerAdminId },
        data: { companyBalance: { decrement: amount } },
      })

      // Create Transaction Record (Category: SALARY affects balance calculation)
      const transaction = await tx.transaction.create({
        data: {
          amount,
          type: 'EXPENSE',
          description: `Courier withdrawal: ${courier.name}`,
          category: 'SALARY',
          adminId: ownerAdminId,
          salaryRecipientAdminId: user.id,
        },
      })

      return transaction
    })

    const newPayments = await db.transaction.aggregate({
      where: {
        category: 'SALARY',
        salaryRecipientAdminId: user.id,
      },
      _sum: { amount: true },
    })
    const newPaid = newPayments._sum.amount ?? 0
    const newBalance = accrued - newPaid

    // Log action
    try {
      await db.actionLog.create({
        data: {
          adminId: user.id,
          action: 'COURIER_WITHDRAWAL',
          entityType: 'TRANSACTION',
          entityId: result.id,
          description: `Courier ${courier.name} withdrew ${amount} UZS`,
        },
      })
    } catch {
      // ignore logging failures
    }

    return NextResponse.json({
      success: true,
      newBalance,
      transactionId: result.id,
    })
  } catch (error) {
    console.error('Error processing withdrawal:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
