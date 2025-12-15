import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['SUPER_ADMIN', 'MIDDLE_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const items = await prisma.warehouseItem.findMany({
            orderBy: { name: 'asc' },
        });

        // Convert array to object map for frontend compatibility { [name]: amount }
        const inventoryMap: Record<string, number> = {};
        items.forEach(item => {
            inventoryMap[item.name] = item.amount;
        });

        return NextResponse.json(inventoryMap);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['SUPER_ADMIN', 'MIDDLE_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const inventory: Record<string, number> = body;

        // Use transaction to update all items
        const updates = Object.entries(inventory).map(([name, amount]) => {
            return prisma.warehouseItem.upsert({
                where: { name },
                update: { amount },
                create: { name, amount },
            });
        });

        await prisma.$transaction(updates);

        return NextResponse.json({ success: true, count: updates.length });
    } catch (error) {
        console.error('Error saving inventory:', error);
        return NextResponse.json({ error: 'Failed to save inventory' }, { status: 500 });
    }
}
