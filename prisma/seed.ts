import { PrismaClient } from '@prisma/client';
import { MENUS, getDishImageUrl, EXTRA_DISHES } from '../src/lib/menuData';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing dishes...');
  await prisma.dish.deleteMany();
  console.log('Start seeding Dishes from menuData...');

  const processDish = async (dish: any) => {
    // Correct Image URL from the Map
    const imageUrl = getDishImageUrl(dish.id);

    // Check if exists by ID (since we want to keep IDs in sync)
    const dishId = dish.id.toString();
    const existing = await prisma.dish.findUnique({ where: { id: dishId } });

    if (!existing) {
      await prisma.dish.create({
        data: {
          id: dishId,
          name: dish.name,
          mealType: dish.mealType,
          imageUrl: imageUrl,
          ingredients: dish.ingredients || [],
        }
      });
      console.log(`Created: ${dish.name} (ID: ${dishId})`);
    } else {
      // Update image or ingredients if changed
      // We always update ingredients to ensure sync with menuData
      await prisma.dish.update({
        where: { id: existing.id },
        data: {
          imageUrl: imageUrl,
          ingredients: dish.ingredients || [] // Fix: Update ingredients
        }
      });
      console.log(`Updated: ${dish.name}`);
    }
  };

  // 1. Process Daily Menus
  for (const menu of MENUS) {
    for (const dish of menu.dishes) {
      await processDish(dish);
    }
  }

  // 2. Process Extra/6th Meal Dishes
  for (const dish of EXTRA_DISHES) {
    await processDish(dish);
  }

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
