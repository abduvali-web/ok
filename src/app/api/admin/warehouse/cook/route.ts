
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { scaleIngredients, MEAL_TYPES, CALORIE_MULTIPLIERS } from '@/lib/menuData';

// Helper to manually scale ingredients since we might need more control here or reuse existing
// Reusing scaleIngredients from lib is fine, but we need to fetch specific Dish content from DB
// because Dish ingredients might have been edited.

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !['SUPER_ADMIN', 'MIDDLE_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { date, updates, dishes: simpleDishes } = body;
        // Support both old simple format (dishes: {id: qty}) and new format (updates: [{...}])
        // We might want to keep backward compatibility or deprecate old.
        // For this task, we focus on new detailed format.

        if (simpleDishes) {
            // ... legacy logic if needed...
            return NextResponse.json({ error: 'Please use new detailed cooking interface' }, { status: 400 });
        }

        if (!date || !updates || !Array.isArray(updates)) {
            return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
        }

        // updates: [{ dishId, calorie, amount }]

        // 1. Fetch current plan to update stats
        const targetDate = new Date(date);
        const plan = await db.dailyCookingPlan.findFirst({
            where: {
                date: {
                    gte: new Date(targetDate.setHours(0, 0, 0, 0)),
                    lt: new Date(targetDate.setHours(23, 59, 59, 999))
                }
            }
        });

        if (!plan) {
            return NextResponse.json({ error: 'No cooking plan found for date' }, { status: 404 });
        }

        const cookedStats = (plan.cookedStats as any) || {};

        // 2. Process each update
        // We need to fetch Dish details to know ingredients
        const dishIds = updates.map((u: any) => u.dishId);
        const dishes = await db.dish.findMany({
            where: { id: { in: dishIds } }
        });
        const dishMap = new Map(dishes.map(d => [d.id, d]));

        const inventoryUpdates = new Map<string, number>(); // name -> amount to deduct

        for (const update of updates) {
            const { dishId, calorie, amount } = update;
            const dish = dishMap.get(dishId);
            if (!dish) continue;

            // Calculate ingredients for this specific batch
            // Note: DB ingredients is Json, cast it
            const ingredients = dish.ingredients as any[];
            const mealType = dish.mealType as keyof typeof MEAL_TYPES;

            // Scale
            const scaled = scaleIngredients(ingredients, calorie, mealType, amount);

            // Accumulate deductions
            for (const ing of scaled) {
                const current = inventoryUpdates.get(ing.name) || 0;
                inventoryUpdates.set(ing.name, current + ing.amount);
            }

            // Update stats
            if (!cookedStats[dishId]) cookedStats[dishId] = {};
            const currentCooked = cookedStats[dishId][calorie] || 0;
            cookedStats[dishId][calorie] = currentCooked + amount;
        }

        // 3. Apply DB Transaction
        await db.$transaction(async (tx) => {
            // Update Plan
            await tx.dailyCookingPlan.update({
                where: { id: plan.id },
                data: { cookedStats }
            });

            // Update Inventory
            for (const [name, deduucAmount] of inventoryUpdates) {
                // Find item first? Inventory is currently stored ?? 
                // Wait, previous code used `WarehouseItem` or just a JSON/Map?
                // Let's check `WarehouseTab` implementation. 
                // Ah, inventory was fetched via `/api/admin/warehouse/inventory` which maps to `WarehouseItem` table.
                // We should update `WarehouseItem`.

                const item = await tx.warehouseItem.findUnique({ where: { name } });
                if (item) {
                    await tx.warehouseItem.update({
                        where: { name },
                        data: { amount: { decrement: deduucAmount } }
                    });
                } else {
                    // Item doesn't exist? Create optional or skip?
                    // To handle "Create ingredient if missing" logic generally existing in system
                }
            }
        });

        return NextResponse.json({ success: true, cookedStats });

    } catch (error) {
        console.error('Error in cooking:', error);
        return NextResponse.json({ error: 'Failed to process cooking' }, { status: 500 });
    }
}
