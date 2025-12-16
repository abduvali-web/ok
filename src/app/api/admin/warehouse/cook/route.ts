import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { MENUS, getDishImageUrl } from '@/lib/menuData';

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !['SUPER_ADMIN', 'MIDDLE_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { dishes } = body; // { [dishId: number]: number } -> quantity

        if (!dishes || Object.keys(dishes).length === 0) {
            return NextResponse.json({ error: 'No dishes specified' }, { status: 400 });
        }

        // Calculate total ingredient deduction
        const ingredientDeductions: Record<string, number> = {};

        // Helper to find dish by ID across all menus
        const findDishById = (id: number) => {
            for (const menu of MENUS) {
                const dish = menu.dishes.find(d => d.id === id);
                if (dish) return dish;
            }
            return null;
        };

        for (const [dishIdStr, quantity] of Object.entries(dishes)) {
            const dishId = parseInt(dishIdStr);
            const count = quantity as number;

            if (count <= 0) continue;

            const dish = findDishById(dishId);
            if (!dish) {
                console.warn(`Dish not found: ${dishId}`);
                continue;
            }

            // Simplified calculation: Base ingredients * count
            // Note: In a real scenario, you might want to consider calorie scaling here if applicable,
            // but usually stock deduction is based on a standard recipe or multiple variants.
            // For now, we assume standard portion size from menuData.
            dish.ingredients.forEach(ing => {
                const totalAmount = ing.amount * count;
                ingredientDeductions[ing.name] = (ingredientDeductions[ing.name] || 0) + totalAmount;
            });
        }

        // Perform Transaction
        await db.$transaction(async (tx) => {
            for (const [name, amount] of Object.entries(ingredientDeductions)) {
                // Decrement stock
                // We use upsert with decrement. If negative, it stays negative (debt) or zero depending on logic.
                // Generally simple decrement is enough, but we should handle if item doesn't exist.

                const existing = await tx.warehouseItem.findUnique({ where: { name } });

                if (existing) {
                    await tx.warehouseItem.update({
                        where: { name },
                        data: {
                            amount: { decrement: amount },
                            updatedAt: new Date()
                        }
                    });
                } else {
                    // Item doesn't exist, create with negative amount? Or just ignore?
                    // Better to create it so we track it.
                    await tx.warehouseItem.create({
                        data: {
                            name,
                            amount: -amount, // Negative inventory indicates deficit
                            unit: 'gr' // Default unit
                        }
                    });
                }
            }
        });

        return NextResponse.json({
            success: true,
            deductions: ingredientDeductions
        });

    } catch (error) {
        console.error('Error cooking dishes:', error);
        return NextResponse.json({ error: 'Failed to process cooking' }, { status: 500 });
    }
}
