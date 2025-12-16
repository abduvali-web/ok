
import {
    calculateIngredientsForMenu,
    CALORIE_MULTIPLIERS,
    MEAL_TYPES,
    MENU_CYCLE_DAYS,
    MENUS,
    getMenu
} from '../src/lib/menuData';

// Mock data to verify simplified scenario
// Client distribution: 1 client for each tier used in calculation
const clientsByCalorie = {
    1200: 1, // Base
    1600: 1, // 1.4x Breakfast/Dinner, 1.75x Lunch
    2000: 1, // 1.6x Breakfast/Dinner, 2.0x Lunch
    2500: 0, // Skip for simplicity
    3000: 0  // Skip
};

function verify() {
    console.log("=== Verifying Calorie Calculations ===");
    console.log("Multipliers:", JSON.stringify(CALORIE_MULTIPLIERS, null, 2));

    // Pick Menu 1 to test
    const menuNum = 1;
    const menu = getMenu(menuNum);

    if (!menu) {
        console.error("Menu 1 not found!");
        return;
    }

    console.log(`\nTesting Menu ${menuNum}:`);

    // Pick first dish (usually Breakfast)
    const dish = menu.dishes[0];
    console.log(`Dish: ${dish.name} (${dish.mealType})`);
    console.log("Base Ingredients:", dish.ingredients);

    const multipliers = {
        1200: CALORIE_MULTIPLIERS[1200].breakfast,
        1600: CALORIE_MULTIPLIERS[1600].breakfast,
        2000: CALORIE_MULTIPLIERS[2000].breakfast
    };

    console.log(`Multipliers for ${dish.mealType}:`, multipliers);

    // Expected Calculation for 1 client each (1200, 1600, 2000)
    // For each ingredient: 
    // Total = (Base * 1.0 * 1) + (Base * 1.4 * 1) + (Base * 1.6 * 1) = Base * (4.0)

    console.log("\n--- Mock Calculation ---");
    const result = calculateIngredientsForMenu(menuNum, clientsByCalorie);

    dish.ingredients.forEach(ing => {
        const total = result.get(ing.name);
        const expectedFactor = multipliers[1200] + multipliers[1600] + multipliers[2000];
        const expectedAmount = ing.amount * expectedFactor;

        console.log(`Ingredient: ${ing.name}`);
        console.log(`  Base Amount: ${ing.amount}`);
        console.log(`  Expected Factor: ${expectedFactor}`);
        console.log(`  Expected Total: ${expectedAmount}`);
        console.log(`  Calculated Total: ${total?.amount}`);

        if (Math.abs((total?.amount || 0) - expectedAmount) < 0.1) {
            console.log("  ✅ MATCH");
        } else {
            console.log("  ❌ MISMATCH");
        }
    });
}

verify();
