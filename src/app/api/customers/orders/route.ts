import { NextRequest, NextResponse } from 'next/server'
import { OrderStatus, Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getCustomerFromRequest } from '@/lib/customer-auth'

export async function GET(request: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(request)
    if (!customer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: Prisma.OrderWhereInput = {
      customerId: customer.id,
      deletedAt: null,
    }

    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      where.orderStatus = status as OrderStatus
    }

    const orders = await db.order.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        courier: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { details: error instanceof Error ? error.message : 'Unknown error' }),
      },
      { status: 500 }
    )
  }
}
