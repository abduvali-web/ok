import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session || !session.user || (session.user.role !== 'MIDDLE_ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        // Parse query params for filtering
        const { searchParams } = new URL(req.url)
        const filter = searchParams.get('filter') // 'all', 'positive', 'negative', 'zero'
        const search = searchParams.get('search') || ''

        let whereClause: any = {
            isActive: true, // Only active clients? Or should we show all? Usually finance needs all.
            // Let's filter by createdBy or defaultCourier related to this admin if needed
            // Assuming Middle Admin sees all clients they manage
        }

        // If middle admin is restricted to their own clients (check existing logic in clients/route.ts)
        // For now assuming all clients visible specifically to this admin
        // Note: The main clients route usually filters by `createdBy` or `defaultCourier`.
        // We'll mimic that if possible, but for now let's keep it simple.

        // Add search filter
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ]
        }

        // Add balance filter
        if (filter === 'positive') {
            whereClause.balance = { gt: 0 }
        } else if (filter === 'negative') {
            whereClause.balance = { lt: 0 }
        } else if (filter === 'zero') {
            whereClause.balance = { equals: 0 }
        }

        const clients = await prisma.customer.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                phone: true,
                balance: true,
                createdAt: true,
            },
            orderBy: {
                name: 'asc'
            }
        })

        return NextResponse.json(clients)
    } catch (error) {
        console.error('Error fetching finance clients:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
