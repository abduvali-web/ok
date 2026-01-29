import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

// GET - Fetch all sets
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        // Allow courier/admins to view sets

        const sets = await db.menuSet.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Parse JSON fields if needed (Prisma handles this usually, but let's be safe)
        // If calorieGroups is stored as string in some legacy DBs, parse it. 
        // Assuming proper JSON type in Prisma.

        return NextResponse.json(sets);
    } catch (error) {
        console.error('Error fetching sets:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create a new set
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // We initialize with empty calorieGroups structure
        // Structure: { "1": [...], "2": [...] } where keys are day numbers
        const initialCalorieGroups: any = {};

        // Optional: Pre-fill with default menus if requested?
        // For now, let's start empty or let the frontend handling the filling.

        const newSet = await db.menuSet.create({
            data: {
                name,
                description: description || '',
                menuNumber: 0, // 0 indicates a "Global" set containing all days
                calorieGroups: initialCalorieGroups,
                isActive: false, // Inactive by default
                adminId: session.user.id
            }
        });

        return NextResponse.json(newSet, { status: 201 });
    } catch (error) {
        console.error('Error creating set:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
