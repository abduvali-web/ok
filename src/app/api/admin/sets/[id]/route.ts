import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const set = await db.menuSet.findUnique({
            where: { id }
        });

        if (!set) {
            return NextResponse.json({ error: 'Set not found' }, { status: 404 });
        }

        return NextResponse.json(set);
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;
        const body = await request.json();

        // Allowed fields to update
        const { name, description, calorieGroups, isActive } = body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (calorieGroups !== undefined) updateData.calorieGroups = calorieGroups;
        if (isActive !== undefined) {
            updateData.isActive = isActive;

            // If activating this set, we might want to deactivate others?
            // Since this is a Global Set (all days), there should probably be only ONE active Global Set.
            // Or maybe multiple can be active but the user chooses which one to apply?
            // For now, let's allow multiple active and let logic decide (prioritize one).
            // Ideally: deactivate all other sets if this one is activated.
            if (isActive) {
                await db.menuSet.updateMany({
                    where: { id: { not: id } },
                    data: { isActive: false }
                });
            }
        }

        const updatedSet = await db.menuSet.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updatedSet);
    } catch (error) {
        console.error('Error updating set:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;
        await db.menuSet.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting set:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
