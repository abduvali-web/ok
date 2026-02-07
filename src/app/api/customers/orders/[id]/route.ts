import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const customerId = request.headers.get('x-customer-id')
        if (!customerId) {
            return NextResponse.json({ error: 'Customer ID required' }, { status: 401 })
        }

        const { id } = await context.params
        const order = await db.order.findUnique({
            where: { id },
            include: {
                courier: {
                    select: {
                        name: true,
                        phone: true,
                        latitude: true,
                        longitude: true
                    }
                }
            }
        })

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        if (order.customerId !== customerId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        return NextResponse.json(order)

    } catch (error) {
        console.error('Error fetching order details:', error)
        return NextResponse.json({
            error: 'Внутренняя ошибка сервера',
            ...(process.env.NODE_ENV === 'development' && { details: error instanceof Error ? error.message : 'Unknown error' })
        }, { status: 500 })
    }
}
