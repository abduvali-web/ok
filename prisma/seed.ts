import { PrismaClient } from '@prisma/client';
import { MENUS, getDishImageUrl, EXTRA_DISHES } from '../src/lib/menuData';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding Dishes from menuData...');

  const processDish = async (dish: any) => {
    // Correct Image URL from the Map
    const imageUrl = getDishImageUrl(dish.id);

    // Check if exists
    const existing = await prisma.dish.findFirst({ where: { name: dish.name } });

    if (!existing) {
      await prisma.dish.create({
        data: {
          name: dish.name,
          mealType: dish.mealType,
          imageUrl: imageUrl,
          ingredients: [],
        }
      });
      console.log(`Created: ${dish.name} (Img: ${imageUrl?.split('/').pop()})`);
    } else {
      // Update image if changed
      if (imageUrl && existing.imageUrl !== imageUrl) {
        await prisma.dish.update({
          where: { id: existing.id },
          data: { imageUrl: imageUrl }
        });
        console.log(`Updated Image: ${dish.name} -> ${imageUrl?.split('/').pop()}`);
      }
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
