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

    // Get courier's current salary (balance)
    const courier = await db.admin.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, salary: true },
    })

    if (!courier) {
      return NextResponse.json({ error: 'Courier not found' }, { status: 404 })
    }

    if (courier.salary < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // Use transaction: deduct from courier salary + create transaction record
    const result = await db.$transaction(async (tx) => {
      // Deduct from courier's salary (balance)
      await tx.admin.update({
        where: { id: user.id },
        data: { salary: { decrement: amount } },
      })

      // Deduct from company balance
      await tx.admin.update({
        where: { id: ownerAdminId },
        data: { companyBalance: { decrement: amount } },
      })

      // Create transaction record for finance history
      const transaction = await tx.transaction.create({
        data: {
          amount,
          type: 'EXPENSE',
          description: `Courier withdrawal: ${courier.name}`,
          category: 'COURIER_WITHDRAWAL',
          adminId: ownerAdminId,
          salaryRecipientAdminId: user.id,
        },
      })

      return transaction
    })

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

    const updatedCourier = await db.admin.findUnique({
      where: { id: user.id },
      select: { salary: true },
    })

    return NextResponse.json({
      success: true,
      newBalance: updatedCourier?.salary ?? 0,
      transactionId: result.id,
    })
  } catch (error) {
    console.error('Error processing withdrawal:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
