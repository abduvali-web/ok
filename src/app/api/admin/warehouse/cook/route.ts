
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
        const { date, updates, dishes: simpleDishes, activeSetId } = body;

        if (simpleDishes) {
            return NextResponse.json({ error: 'Please use new detailed cooking interface' }, { status: 400 });
        }

        if (!date || !updates || !Array.isArray(updates)) {
            return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
        }

        // 1. Fetch current plan to update stats
        const targetDate = new Date(date);
        let plan = await db.dailyCookingPlan.findFirst({
            where: {
                date: {
                    gte: new Date(targetDate.setHours(0, 0, 0, 0)),
                    lt: new Date(targetDate.setHours(23, 59, 59, 999))
                }
            }
        });

        if (!plan) {
            const { menuNumber } = body;
            if (!menuNumber) {
                return NextResponse.json({ error: 'No cooking plan found and no menuNumber provided to create one' }, { status: 404 });
            }

            plan = await db.dailyCookingPlan.create({
                data: {
                    date: new Date(date),
                    menuNumber: parseInt(menuNumber),
                    dishes: {},
                    cookedStats: {}
                }
            });
        }

        const cookedStats = (plan.cookedStats as any) || {};

        // 2. Fetch Active Set if provided (for custom ingredients)
        let activeSet = null;
        if (activeSetId) {
            activeSet = await db.menuSet.findUnique({
                where: { id: activeSetId }
            });
        }

        // 3. Fetch standard dishes (we still need them for fallback and base info)
        const dishIds = updates.map((u: any) => u.dishId.toString());
        // Note: dishId comes as string or number, ensure string for Prisma if ID is string, or convert
        // Assuming Dish ID in DB is Int (based on previous code using findMany with numbers usually)
        // Let's check schema assumption. Previous code used `in: dishIds` directly.
        // Let's assume IDs are Ints.
        const dishIdsInt = dishIds.map((id: string) => parseInt(id)).filter((n: number) => !isNaN(n));

        const dishes = await db.dish.findMany({
            where: { id: { in: dishIdsInt } }
        });
        const dishMap = new Map(dishes.map(d => [d.id, d]));

        const inventoryUpdates = new Map<string, number>(); // name -> amount to deduct

        for (const update of updates) {
            const { dishId, calorie, amount } = update;
            // dishId might be string from JSON, convert to Int for map lookup
            const dId = typeof dishId === 'string' ? parseInt(dishId) : dishId;

            const dish = dishMap.get(dId);
            if (!dish) continue;

            // Determine Ingredients: Standard or Custom from Set?
            let ingredientsToUse = dish.ingredients as any[];

            if (activeSet && activeSet.calorieGroups) {
                // Determine day number from plan or body
                // plan is guaranteed to exist here
                const currentMenuNumber = plan!.menuNumber;

                // calorieGroups is JSON object: Record<string, CalorieGroup[]>
                const setGroups = activeSet.calorieGroups as any;

                // Get groups for this specific day
                const dayGroups = setGroups[currentMenuNumber.toString()];

                if (dayGroups && Array.isArray(dayGroups)) {
                    const targetGroup = dayGroups.find((g: any) => g.calories === calorie);

                    if (targetGroup && targetGroup.dishes) {
                        // Find this dish in the group
                        const setDish = targetGroup.dishes.find((d: any) => d.dishId === dId);

                        // If dish found in set AND has custom ingredients, use them
                        if (setDish && setDish.customIngredients && setDish.customIngredients.length > 0) {
                            ingredientsToUse = setDish.customIngredients;
                        }
                    }
                }
            }

            const mealType = dish.mealType as keyof typeof MEAL_TYPES;

            // Scale ingredients
            const scaled = scaleIngredients(ingredientsToUse, calorie, mealType, amount);

            // Accumulate deductions
            for (const ing of scaled) {
                const current = inventoryUpdates.get(ing.name) || 0;
                inventoryUpdates.set(ing.name, current + ing.amount);
            }

            // Update stats
            if (!cookedStats[dId]) cookedStats[dId] = {};
            const currentCooked = cookedStats[dId][calorie] || 0;
            cookedStats[dId][calorie] = currentCooked + amount;
        }

        // 4. Apply DB Transaction
        await db.$transaction(async (tx) => {
            // Update Plan
            await tx.dailyCookingPlan.update({
                where: { id: plan!.id }, // plan is not null here
                data: { cookedStats }
            });

            // Update Inventory with safety check
            for (const [name, deductAmount] of inventoryUpdates) {
                const item = await tx.warehouseItem.findUnique({ where: { name } });

                if (!item) {
                    throw new Error(`Ингредиент не найден на складе: ${name}`);
                }

                if (item.amount < deductAmount) {
                    throw new Error(`Недостаточно: ${name}. Нужно ${deductAmount.toFixed(1)}${item.unit}, есть ${item.amount.toFixed(1)}${item.unit}`);
                }

                await tx.warehouseItem.update({
                    where: { name },
                    data: { amount: { decrement: deductAmount } }
                });
            }
        });

        return NextResponse.json({ success: true, cookedStats });

    } catch (error) {
        console.error('Error in cooking:', error);
        const message = error instanceof Error ? error.message : 'Failed to process cooking';
        // Return 400 for expected logic errors (insufficient ingredients), 500 for unexpected
        const status = message.includes('Недостаточно') || message.includes('не найден') ? 400 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
