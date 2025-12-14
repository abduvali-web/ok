// Menu Data Structure for 21-day rotating menu
// Start date: December 4, 2025
// 108 dishes total across 21 menus
// 5 calorie tiers: 1200, 1600, 2000, 2500, 3000

export const MENU_START_DATE = new Date('2025-12-04T00:00:00');
export const MENU_CYCLE_DAYS = 21;

// Calorie tier multipliers (based on 1200 kcal base)
export const CALORIE_MULTIPLIERS: Record<number, { breakfast: number; lunch: number; dinner: number; snack: number }> = {
  1200: { breakfast: 1.0, lunch: 1.0, dinner: 1.0, snack: 1.0 },
  1600: { breakfast: 1.4, lunch: 1.75, dinner: 1.4, snack: 1.0 },
  2000: { breakfast: 1.6, lunch: 2.0, dinner: 1.6, snack: 1.0 },
  2500: { breakfast: 1.6, lunch: 2.0, dinner: 1.6, snack: 1.0 }, // Same as 2000 + 6th meal
  3000: { breakfast: 2.5, lunch: 3.0, dinner: 2.5, snack: 2.0 },
};

// Meal types in Uzbek
export const MEAL_TYPES = {
  BREAKFAST: 'Nonushta',
  SECOND_BREAKFAST: '2-nonushta',
  LUNCH: 'Tushlik',
  SNACK: 'Poldnik',
  DINNER: 'Kechki ovqat',
  SIXTH_MEAL: '6-Taom',
} as const;

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface Dish {
  id: number; // 1-108
  name: string;
  mealType: keyof typeof MEAL_TYPES;
  ingredients: Ingredient[];
}

export interface DailyMenu {
  menuNumber: number; // 1-21
  dishes: Dish[];
}

// Get image URL for a dish
export function getDishImageUrl(dishNumber: number): string {
  return `https://wsrv.nl/?url=github.com/FreedoomForm/hi/blob/main/${dishNumber}.png?raw=true&w=400&output=webp&q=80`;
}

// Calculate menu number for a given date
export function getMenuNumber(date: Date): number {
  const startDate = new Date(MENU_START_DATE);
  startDate.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    // Before start date, calculate backwards
    const positiveDays = Math.abs(diffDays);
    const menuDay = MENU_CYCLE_DAYS - (positiveDays % MENU_CYCLE_DAYS);
    return menuDay === MENU_CYCLE_DAYS ? 21 : menuDay;
  }
  
  return (diffDays % MENU_CYCLE_DAYS) + 1;
}

// Get today's menu number
export function getTodaysMenuNumber(): number {
  return getMenuNumber(new Date());
}

// Get tomorrow's menu number
export function getTomorrowsMenuNumber(): number {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getMenuNumber(tomorrow);
}

// Scale ingredients based on calorie tier and portion count
export function scaleIngredients(
  ingredients: Ingredient[],
  calories: number,
  mealType: keyof typeof MEAL_TYPES,
  portionCount: number = 1
): Ingredient[] {
  const multipliers = CALORIE_MULTIPLIERS[calories] || CALORIE_MULTIPLIERS[1200];
  
  let multiplier = 1;
  switch (mealType) {
    case 'BREAKFAST':
    case 'SECOND_BREAKFAST':
      multiplier = multipliers.breakfast;
      break;
    case 'LUNCH':
      multiplier = multipliers.lunch;
      break;
    case 'DINNER':
    case 'SIXTH_MEAL':
      multiplier = multipliers.dinner;
      break;
    case 'SNACK':
      multiplier = multipliers.snack;
      break;
  }
  
  return ingredients.map(ing => ({
    ...ing,
    amount: Math.round(ing.amount * multiplier * portionCount * 10) / 10,
  }));
}

// All 21 daily menus with dishes and base ingredients (1200 kcal tier)
export const MENUS: DailyMenu[] = [
  // MENU 1
  {
    menuNumber: 1,
    dishes: [
      {
        id: 1,
        name: 'Balish (Pirog)',
        mealType: 'BREAKFAST',
        ingredients: [
          { name: 'Xamir (Margarin/Qatiq/Un)', amount: 71.4, unit: 'gr' },
          { name: 'Tovuq filesi', amount: 45.7, unit: 'gr' },
          { name: 'Piyoz', amount: 42.8, unit: 'gr' },
        ],
      },
      {
        id: 2,
        name: 'Qovoq tatlisi',
        mealType: 'SECOND_BREAKFAST',
        ingredients: [
          { name: 'Qovoq', amount: 150, unit: 'gr' },
          { name: 'Shakar', amount: 15, unit: 'gr' },
        ],
      },
      {
        id: 3,
        name: "Asosiy taom (Go'sht/Qo'ziqorin)",
        mealType: 'LUNCH',
        ingredients: [
          { name: "Mol go'shti", amount: 85.7, unit: 'gr' },
          { name: "Qo'ziqorin (Veshenka)", amount: 100, unit: 'gr' },
          { name: 'Garnir (Grechka)', amount: 42.8, unit: 'gr' },
        ],
      },
      {
        id: 4,
        name: 'Salat (Lavlagi)',
        mealType: 'SNACK',
        ingredients: [
          { name: 'Lavlagi', amount: 157, unit: 'gr' },
          { name: "Yong'oq", amount: 14.2, unit: 'gr' },
        ],
      },
      {
        id: 5,
        name: "Tovuq sho'rva",
        mealType: 'DINNER',
        ingredients: [
          { name: 'Tovuq soni', amount: 50, unit: 'gr' },
          { name: 'Sabzavotlar (Sabzi/Bolgari/Kartoshka)', amount: 60, unit: 'gr' },
        ],
      },
    ],
  },
  // MENU 2
  {
    menuNumber: 2,
    dishes: [
      {
        id: 6,
        name: "Tariq bo'tqasi",
        mealType: 'BREAKFAST',
        ingredients: [
          { name: 'Tariq', amount: 27.2, unit: 'gr' },
          { name: 'Sut', amount: 54.5, unit: 'ml' },
          { name: 'Shakar', amount: 10.9, unit: 'gr' },
        ],
      },
      {
        id: 7,
        name: 'Mazurka',
        mealType: 'SECOND_BREAKFAST',
        ingredients: [
          { name: "Yong'oq va mayiz aralashmasi", amount: 66.6, unit: 'gr' },
          { name: 'Tuxum', amount: 13.5, unit: 'gr' },
          { name: 'Shakar', amount: 8.3, unit: 'gr' },
        ],
      },
      {
        id: 8,
        name: 'Tovuq kabob',
        mealType: 'LUNCH',
        ingredients: [
          { name: "Tovuq go'shti", amount: 181.8, unit: 'gr' },
          { name: 'Mayonez/Soya', amount: 15, unit: 'gr' },
          { name: 'Aralash sabzavotlar', amount: 218, unit: 'gr' },
        ],
      },
      {
        id: 9,
        name: 'Omlet',
        mealType: 'SNACK',
        ingredients: [
          { name: 'Tuxum', amount: 110, unit: 'gr' },
          { name: 'Sabzavotlar (Gorox/Jo\'xori/Brokkoli)', amount: 40, unit: 'gr' },
        ],
      },
      {
        id: 10,
        name: "Frikadelka sho'rva",
        mealType: 'DINNER',
        ingredients: [
          { name: "Mol go'shti", amount: 23.6, unit: 'gr' },
          { name: 'Guruch', amount: 5, unit: 'gr' },
        ],
      },
    ],
  },
  // MENU 3
  {
    menuNumber: 3,
    dishes: [
      {
        id: 11,
        name: 'Tovuqli blinchik',
        mealType: 'BREAKFAST',
        ingredients: [
          { name: 'Sut', amount: 75, unit: 'ml' },
          { name: 'Tovuq qiymasi', amount: 25, unit: 'gr' },
          { name: 'Piyoz', amount: 25, unit: 'gr' },
          { name: 'Un', amount: 30, unit: 'gr' },
        ],
      },
      {
        id: 12,
        name: 'Tvorogli pirog',
        mealType: 'SECOND_BREAKFAST',
        ingredients: [
          { name: 'Un', amount: 46.5, unit: 'gr' },
          { name: 'Tvorog', amount: 55.5, unit: 'gr' },
          { name: 'Smetana', amount: 18.7, unit: 'gr' },
          { name: "Saryog'", amount: 11.8, unit: 'gr' },
        ],
      },
      {
        id: 13,
        name: 'Gulyash va Spagetti',
        mealType: 'LUNCH',
        ingredients: [
          { name: "Mol go'shti", amount: 62.5, unit: 'gr' },
          { name: 'Sabzi', amount: 25, unit: 'gr' },
          { name: 'Spagetti (quruq)', amount: 50, unit: 'gr' },
        ],
      },
      {
        id: 14,
        name: 'Tulum salati',
        mealType: 'SNACK',
        ingredients: [
          { name: 'Tvorog', amount: 25, unit: 'gr' },
          { name: 'Olma', amount: 100, unit: 'gr' },
          { name: 'Aysberg salati', amount: 25, unit: 'gr' },
        ],
      },
      {
        id: 15,
        name: "Terbiye sho'rva",
        mealType: 'DINNER',
        ingredients: [
          { name: 'Tovuq soni', amount: 25, unit: 'gr' },
          { name: 'Qatiq', amount: 25, unit: 'ml' },
        ],
      },
    ],
  },
  // MENU 4
  {
    menuNumber: 4,
    dishes: [
      {
        id: 16,
        name: 'Sutli zapekanka',
        mealType: 'BREAKFAST',
        ingredients: [
          { name: 'Tuxum', amount: 73, unit: 'gr' },
          { name: 'Vermeshel (Pautinka)', amount: 18.5, unit: 'gr' },
          { name: 'Sut', amount: 16.6, unit: 'ml' },
        ],
      },
      {
        id: 17,
        name: 'Mevali assorti',
        mealType: 'SECOND_BREAKFAST',
        ingredients: [
          { name: 'Meva', amount: 166.6, unit: 'gr' },
        ],
      },
      {
        id: 18,
        name: 'Jigar va garnir',
        mealType: 'LUNCH',
        ingredients: [
          { name: 'Jigar', amount: 133.3, unit: 'gr' },
          { name: 'Kartoshka', amount: 116.6, unit: 'gr' },
          { name: 'Kraxmal', amount: 16.6, unit: 'gr' },
        ],
      },
      {
        id: 19,
        name: 'Tabule salati',
        mealType: 'SNACK',
        ingredients: [
          { name: "Bulg'ur", amount: 33.3, unit: 'gr' },
          { name: "Ko'katlar", amount: 15, unit: 'gr' },
        ],
      },
      {
        id: 20,
        name: 'Borsh',
        mealType: 'DINNER',
        ingredients: [
          { name: 'Lavlagi', amount: 66.6, unit: 'gr' },
          { name: 'Karam', amount: 50, unit: 'gr' },
          { name: "Go'sht", amount: 16.6, unit: 'gr' },
        ],
      },
    ],
  },
  // MENU 5
  {
    menuNumber: 5,
    dishes: [
      {
        id: 21,
        name: 'Grechka kasha',
        mealType: 'BREAKFAST',
        ingredients: [
          { name: 'Grechka', amount: 35.7, unit: 'gr' },
          { name: 'Sut', amount: 57.1, unit: 'ml' },
          { name: 'Shakar', amount: 5.7, unit: 'gr' },
        ],
      },
      {
        id: 22,
        name: 'Shoko blinchik',
        mealType: 'SECOND_BREAKFAST',
        ingredients: [
          { name: 'Tayyor blinchik massasi', amount: 100, unit: 'gr' },
        ],
      },
      {
        id: 23,
        name: 'Buffalo qanotchalar',
        mealType: 'LUNCH',
        ingredients: [
          { name: 'Tovuq qanotlari', amount: 142.8, unit: 'gr' },
          { name: 'Garnir (Qizil sabzi)', amount: 142.8, unit: 'gr' },
        ],
      },
      {
        id: 24,
        name: 'Suzmali salat',
        mealType: 'SNACK',
        ingredients: [
          { name: 'Pomidor', amount: 42.8, unit: 'gr' },
          { name: 'Bodring', amount: 42.8, unit: 'gr' },
          { name: 'Suzma', amount: 28.5, unit: 'gr' },
        ],
      },
      {
        id: 25,
        name: 'Mastava',
        mealType: 'DINNER',
        ingredients: [
          { name: 'Guruch', amount: 21.4, unit: 'gr' },
          { name: "Go'sht", amount: 14.3, unit: 'gr' },
          { name: 'Kartoshka', amount: 42.8, unit: 'gr' },
        ],
      },
    ],
  },
  // MENU 6
  {
    menuNumber: 6,
    dishes: [
      {
        id: 26,
        name: 'Skrembl (Tuxum)',
        mealType: 'BREAKFAST',
        ingredients: [
          { name: 'Tuxum', amount: 150, unit: 'gr' },
          { name: 'Ismaloq', amount: 28.5, unit: 'gr' },
          { name: 'Pishloq', amount: 10, unit: 'gr' },
        ],
      },
      {
        id: 27,
        name: 'Limonli maffin',
        mealType: 'SECOND_BREAKFAST',
        ingredients: [
          { name: 'Un', amount: 28.5, unit: 'gr' },
          { name: 'Qatiq', amount: 42.8, unit: 'ml' },
          { name: 'Shakar', amount: 8.5, unit: 'gr' },
        ],
      },
      {
        id: 28,
        name: 'Karni yarik (Baqlajon)',
        mealType: 'LUNCH',
        ingredients: [
          { name: 'Baqlajon', amount: 150, unit: 'gr' },
          { name: "Go'sht qiymasi", amount: 50, unit: 'gr' },
        ],
      },
      {
        id: 29,
        name: 'Nisuaz salati',
        mealType: 'SNACK',
        ingredients: [
          { name: 'Salat massasi', amount: 130, unit: 'gr' },
        ],
      },
      {
        id: 30,
        name: "Brokkoli sho'rva",
        mealType: 'DINNER',
        ingredients: [
          { name: 'Brokkoli', amount: 20, unit: 'gr' },
          { name: 'Makaron (Pautinka)', amount: 12.8, unit: 'gr' },
        ],
      },
    ],
  },
  // MENU 7
  {
    menuNumber: 7,
    dishes: [
      {
        id: 31,
        name: 'Fritata',
        mealType: 'BREAKFAST',
        ingredients: [
          { name: 'Tuxum', amount: 110, unit: 'gr' },
          { name: 'Indeyka', amount: 10, unit: 'gr' },
          { name: 'Motsarella', amount: 10, unit: 'gr' },
        ],
      },
      {
        id: 32,
        name: 'Tvorogli desert',
        mealType: 'SECOND_BREAKFAST',
        ingredients: [
          { name: 'Tvorog', amount: 100, unit: 'gr' },
          { name: 'Pechenye', amount: 30, unit: 'gr' },
        ],
      },
      {
        id: 33,
        name: 'Baliqli kotlet',
        mealType: 'LUNCH',
        ingredients: [
          { name: 'Baliq (Pangasius)', amount: 142.8, unit: 'gr' },
          { name: 'Piyoz', amount: 28.5, unit: 'gr' },
          { name: 'Garnir (Perlovka)', amount: 42.8, unit: 'gr' },
        ],
      },
      {
        id: 34,
        name: 'Vinegret salati',
        mealType: 'SNACK',
        ingredients: [
          { name: 'Lavlagi', amount: 71.4, unit: 'gr' },
          { name: 'Kartoshka', amount: 42.8, unit: 'gr' },
          { name: 'Sabzi', amount: 28.5, unit: 'gr' },
        ],
      },
      {
        id: 35,
        name: "Shi sho'rvasi",
        mealType: 'DINNER',
        ingredients: [
          { name: 'Sabzi', amount: 28.5, unit: 'gr' },
          { name: 'Kartoshka', amount: 21.4, unit: 'gr' },
          { name: "Shovul/Ko'kat", amount: 10, unit: 'gr' },
        ],
      },
    ],
  },
  // MENU 8
  {
    menuNumber: 8,
    dishes: [
      {
        id: 36,
        name: 'Ovsianka kasha',
        mealType: 'BREAKFAST',
        ingredients: [
          { name: 'Suli yormasi', amount: 31.2, unit: 'gr' },
          { name: 'Sut', amount: 50, unit: 'ml' },
          { name: 'Shakar', amount: 7.5, unit: 'gr' },
        ],
      },
      {
        id: 37,
        name: 'Shokoladli rulet',
        mealType: 'SECOND_BREAKFAST',
        ingredients: [
          { name: 'Tuxum', amount: 35.7, unit: 'gr' },
          { name: 'Un', amount: 15, unit: 'gr' },
        ],
      },
      {
        id: 38,
        name: 'Brizol',
        mealType: 'LUNCH',
        ingredients: [
          { name: "Go'sht", amount: 50, unit: 'gr' },
          { name: 'Tuxum', amount: 55, unit: 'gr' },
          { name: "Garnir (Bulg'ur)", amount: 50, unit: 'gr' },
        ],
      },
      {
        id: 39,
        name: 'Sezar salati',
        mealType: 'SNACK',
        ingredients: [
          { name: 'Tovuq filesi', amount: 37.5, unit: 'gr' },
          { name: 'Pishloq', amount: 10, unit: 'gr' },
          { name: 'Cherri pomidor', amount: 37.5, unit: 'gr' },
        ],
      },
      {
        id: 40,
        name: "Minestrone sho'rva",
        mealType: 'DINNER',
        ingredients: [
          { name: 'Loviya', amount: 25, unit: 'gr' },
          { name: 'Bolgar qalampiri', amount: 50, unit: 'gr' },
        ],
      },
    ],
  },
  // MENU 9
  {
    menuNumber: 9,
    dishes: [
      {
        id: 41,
        name: 'Shakshuka',
        mealType: 'BREAKFAST',
        ingredients: [
          { name: 'Tuxum', amount: 55, unit: 'gr' },
          { name: 'Pomidor', amount: 37.5, unit: 'gr' },
          { name: 'Bolgar qalampiri', amount: 50, unit: 'gr' },
        ],
      },
      {
        id: 42,
        name: 'Chia puding',
        mealType: 'SECOND_BREAKFAST',
        ingredients: [
          { name: "Chia urug'i", amount: 20, unit: 'gr' },
          { name: 'Kefir', amount: 125, unit: 'ml' },
        ],
      },
      {
        id: 43,
        name: 'Tovuq soni va garnir',
        mealType: 'LUNCH',
        ingredients: [
          { name: 'Tovuq soni (bedra)', amount: 1, unit: 'dona' },
          { name: 'Kartoshka', amount: 150, unit: 'gr' },
        ],
      },
      {
        id: 44,
        name: 'Olivye salati',
        mealType: 'SNACK',
        ingredients: [
          { name: 'Kartoshka', amount: 37.5, unit: 'gr' },
          { name: "Tovuq go'shti", amount: 37.5, unit: 'gr' },
          { name: 'Bodring', amount: 25, unit: 'gr' },
        ],
      },
      {
        id: 45,
        name: "Ezogelin sho'rva",
        mealType: 'DINNER',
        ingredients: [
          { name: 'Yasmiq (Chechevitsa)', amount: 25, unit: 'gr' },
          { name: 'Sabzi', amount: 12.5, unit: 'gr' },
        ],
      },
    ],
  },
  // MENU 10
  {
    menuNumber: 10,
    dishes: [
      {
        id: 46,
        name: 'Pshenka kasha',
        mealType: 'BREAKFAST',
        ingredients: [
          { name: 'Tariq', amount: 33.3, unit: 'gr' },
          { name: 'Sut', amount: 50, unit: 'ml' },
        ],
      },
      {
        id: 47,
        name: 'Brauni',
        mealType: 'SECOND_BREAKFAST',
        ingredients: [
          { name: 'Tuxum', amount: 36.6, unit: 'gr' },
          { name: 'Qatiq', amount: 33.3, unit: 'ml' },
          { name: "Yong'oq", amount: 8.3, unit: 'gr' },
        ],
      },
      {
        id: 48,
        name: 'Kotlet va garnir',
        mealType: 'LUNCH',
        ingredients: [
          { name: "Go'sht (Mol+Tovuq)", amount: 100, unit: 'gr' },
          { name: 'Garnir (Noxat)', amount: 50, unit: 'gr' },
        ],
      },
      {
        id: 49,
        name: 'Ikra va xlebci',
        mealType: 'SNACK',
        ingredients: [
          { name: 'Sabzavotli ikra', amount: 60, unit: 'gr' },
          { name: 'Xlebci', amount: 2, unit: 'dona' },
        ],
      },
      {
        id: 50,
        name: "Qo'ziqorinli sho'rva",
        mealType: 'DINNER',
        ingredients: [
          { name: "Qo'ziqorinlar", amount: 116.6, unit: 'gr' },
          { name: "Saryog'", amount: 5, unit: 'gr' },
        ],
      },
    ],
  },
  // MENU 11
  {
    menuNumber: 11,
    dishes: [
      {
        id: 51,
        name: 'Achma',
        mealType: 'BREAKFAST',
        ingredients: [
          { name: 'Porsiya', amount: 150, unit: 'gr' },
          { name: 'Tvorog', amount: 37.5, unit: 'gr' },
          { name: 'Pishloq', amount: 18.7, unit: 'gr' },
        ],
      },
      {
        id: 52,
        name: 'Vafli',
        mealType: 'SECOND_BREAKFAST',
        ingredients: [
          { name: 'Qatiq', amount: 37.5, unit: 'ml' },
          { name: 'Tuxum', amount: 17, unit: 'gr' },
        ],
      },
      {
        id: 53,
        name: 'Tovuq rulet',
        mealType: 'LUNCH',
        ingredients: [
          { name: 'Tovuq filesi', amount: 125, unit: 'gr' },
          { name: 'Sabzi', amount: 37.5, unit: 'gr' },
          { name: 'Ismaloq', amount: 12.5, unit: 'gr' },
        ],
      },
      {
        id: 54,
        name: 'Tulum salati',
        mealType: 'SNACK',
        ingredients: [
          { name: 'Tvorog', amount: 50, unit: 'gr' },
          { name: 'Aysberg', amount: 43.7, unit: 'gr' },
          { name: 'Olma', amount: 37.5, unit: 'gr' },
        ],
      },
      {
        id: 55,
        name: "Terbiye sho'rva",
        mealType: 'DINNER',
        ingredients: [
          { name: "Tovuq go'shti", amount: 37.5, unit: 'gr' },
          { name: 'Qatiq', amount: 25, unit: 'ml' },
        ],
      },
    ],
  },
  // MENU 12
  {
    menuNumber: 12,
    dishes: [
      {
        id: 56,
        name: 'Kesadilya',
        mealType: 'BREAKFAST',
        ingredients: [
          { name: 'Tortilya/Lavash', amount: 1, unit: 'dona' },
          { name: 'Motsarella', amount: 25, unit: 'gr' },
          { name: 'Bolgar qalampiri', amount: 50, unit: 'gr' },
        ],
      },
      {
        id: 57,
        name: 'Sharlotka',
        mealType: 'SECOND_BREAKFAST',
        ingredients: [
          { name: 'Olma', amount: 50, unit: 'gr' },
          { name: 'Xamir', amount: 50, unit: 'gr' },
        ],
      },
      {
        id: 58,
        name: "Bulg'ur palov",
        mealType: 'LUNCH',
        ingredients: [
          { name: "Go'sht", amount: 50, unit: 'gr' },
          { name: "Bulg'ur", amount: 50, unit: 'gr' },
          { name: 'Sabzi', amount: 75, unit: 'gr' },
        ],
      },
      {
        id: 59,
        name: 'Xumus',
        mealType: 'SNACK',
        ingredients: [
          { name: 'Noxat (Xumus)', amount: 50, unit: 'gr' },
          { name: 'Xlebci', amount: 2, unit: 'dona' },
        ],
      },
      {
        id: 60,
        name: "Qizil sabzi sho'rva",
        mealType: 'DINNER',
        ingredients: [
          { name: 'Sabzi', amount: 62.5, unit: 'gr' },
          { name: 'Kartoshka', amount: 25, unit: 'gr' },
          { name: 'Sosiska', amount: 12.5, unit: 'gr' },
        ],
      },
    ],
  },
  // MENU 13
  {
    menuNumber: 13,
    dishes: [
      {
        id: 61,
        name: "Bug'doy kasha",
        mealType: 'BREAKFAST',
        ingredients: [
          { name: "Bug'doy yormasi", amount: 29.4, unit: 'gr' },
          { name: 'Sut', amount: 47, unit: 'ml' },
        ],
      },
      {
        id: 62,
        name: 'Ovsianka pechenye',
        mealType: 'SECOND_BREAKFAST',
        ingredients: [
          { name: 'Suli yormasi', amount: 25.8, unit: 'gr' },
          { name: 'Shakar', amount: 25.8, unit: 'gr' },
        ],
      },
      {
        id: 63,
        name: 'Frikase',
        mealType: 'LUNCH',
        ingredients: [
          { name: "Tovuq go'shti", amount: 100, unit: 'gr' },
          { name: "Qo'ziqorin", amount: 52.9, unit: 'gr' },
          { name: 'Qaymoq', amount: 23.5, unit: 'ml' },
        ],
      },
      {
        id: 64,
        name: 'Lavlagi salati',
        mealType: 'SNACK',
        ingredients: [
          { name: 'Lavlagi', amount: 141.1, unit: 'gr' },
          { name: 'Brinza', amount: 29.4, unit: 'gr' },
        ],
      },
      {
        id: 65,
        name: "Til sho'rva",
        mealType: 'DINNER',
        ingredients: [
          { name: "Go'sht va Til", amount: 23.5, unit: 'gr' },
          { name: 'Qaymoq', amount: 5.8, unit: 'gr' },
        ],
      },
    ],
  },
  // MENU 14
  {
    menuNumber: 14,
    dishes: [
      {
        id: 66,
        name: 'Tvorog nonushta',
        mealType: 'BREAKFAST',
        ingredients: [
          { name: 'Tvorog', amount: 120, unit: 'gr' },
          { name: 'Smetana', amount: 30, unit: 'gr' },
        ],
      },
      {
        id: 67,
        name: 'Medovik',
        mealType: 'SECOND_BREAKFAST',
        ingredients: [
          { name: 'Sut', amount: 32, unit: 'ml' },
          { name: "Saryog'", amount: 9.6, unit: 'gr' },
          { name: 'Un', amount: 45, unit: 'gr' },
        ],
      },
      {
        id: 68,
        name: 'Hasanposho kofte',
        mealType: 'LUNCH',
        ingredients: [
          { name: "Go'sht", amount: 47, unit: 'gr' },
          { name: 'Piyoz', amount: 23.5, unit: 'gr' },
          { name: 'Garnir (Guruch)', amount: 47, unit: 'gr' },
        ],
      },
      {
        id: 69,
        name: 'Fransuzcha salat',
        mealType: 'SNACK',
        ingredients: [
          { name: 'Tovuq', amount: 35.2, unit: 'gr' },
          { name: 'Lavlagi', amount: 35.2, unit: 'gr' },
          { name: 'Karam', amount: 35.2, unit: 'gr' },
        ],
      },
      {
        id: 70,
        name: "Yashil sho'rva",
        mealType: 'DINNER',
        ingredients: [
          { name: "Saryog'", amount: 11.7, unit: 'gr' },
          { name: "Ismaloq/Ko'kat", amount: 20, unit: 'gr' },
        ],
      },
    ],
  },
  // MENU 15
  {
    menuNumber: 15,
    dishes: [
      {
        id: 71,
        name: 'Shokoladli kasha',
        mealType: 'BREAKFAST',
        ingredients: [
          { name: 'Suli yormasi', amount: 29.4, unit: 'gr' },
          { name: 'Sut', amount: 47, unit: 'ml' },
        ],
      },
      {
        id: 72,
        name: 'Chizkeyk',
        mealType: 'SECOND_BREAKFAST',
        ingredients: [
          { name: 'Pishloq (Kalleh)', amount: 24.3, unit: 'gr' },
          { name: 'Pechenye', amount: 20.8, unit: 'gr' },
        ],
      },
      {
        id: 73,
        name: 'Tovuksay',
        mealType: 'LUNCH',
        ingredients: [
          { name: 'Tovuq filesi', amount: 82.3, unit: 'gr' },
          { name: 'Sabzavotlar (Karam/Daykon)', amount: 100, unit: 'gr' },
          { name: "Garnir (Bulg'ur)", amount: 47, unit: 'gr' },
        ],
      },
      {
        id: 74,
        name: 'Baqlajon salat',
        mealType: 'SNACK',
        ingredients: [
          { name: 'Baqlajon', amount: 176, unit: 'gr' },
          { name: 'Pomidor', amount: 35.2, unit: 'gr' },
        ],
      },
      {
        id: 75,
        name: "Frikadelka sho'rva",
        mealType: 'DINNER',
        ingredients: [
          { name: 'Tovuq filesi', amount: 29.4, unit: 'gr' },
          { name: "Saryog'", amount: 3.5, unit: 'gr' },
        ],
      },
    ],
  },
  // MENU 16
  {
    menuNumber: 16,
    dishes: [
      {
        id: 76,
        name: 'Omlet',
        mealType: 'BREAKFAST',
        ingredients: [
          { name: 'Tuxum', amount: 63, unit: 'gr' },
          { name: 'Motsarella', amount: 14.2, unit: 'gr' },
          { name: 'Sut', amount: 28.5, unit: 'ml' },
        ],
      },
      {
        id: 77,
        name: 'Trileche',
        mealType: 'SECOND_BREAKFAST',
        ingredients: [
          { name: 'Sut', amount: 28.5, unit: 'ml' },
          { name: 'Tuxum', amount: 31, unit: 'gr' },
          { name: 'Karamel', amount: 28.5, unit: 'gr' },
        ],
      },
      {
        id: 78,
        name: 'Lyulya kabob',
        mealType: 'LUNCH',
        ingredients: [
          { name: "Mol go'shti", amount: 85.7, unit: 'gr' },
          { name: 'Piyoz', amount: 14.2, unit: 'gr' },
          { name: 'Spagetti', amount: 50, unit: 'gr' },
        ],
      },
      {
        id: 79,
        name: 'Lavlagi salati',
        mealType: 'SNACK',
        ingredients: [
          { name: 'Lavlagi', amount: 57.1, unit: 'gr' },
          { name: 'Olma', amount: 71.4, unit: 'gr' },
        ],
      },
      {
        id: 80,
        name: "Chuchvarali sho'rva",
        mealType: 'DINNER',
        ingredients: [
          { name: 'Kartoshka', amount: 50, unit: 'gr' },
          { name: 'Sabzi', amount: 42.8, unit: 'gr' },
        ],
      },
    ],
  },
  // MENU 17
  {
    menuNumber: 17,
    dishes: [
      {
        id: 81,
        name: 'Sendvich',
        mealType: 'BREAKFAST',
        ingredients: [
          { name: "Toster non", amount: 2, unit: "bo'lak" },
          { name: 'Tovuq filesi', amount: 40, unit: 'gr' },
          { name: 'Bodring', amount: 40, unit: 'gr' },
        ],
      },
      {
        id: 82,
        name: 'Shokoladli vafli',
        mealType: 'SECOND_BREAKFAST',
        ingredients: [
          { name: 'Qatiq', amount: 60, unit: 'ml' },
          { name: 'Tuxum', amount: 13, unit: 'gr' },
          { name: 'Shakar', amount: 16, unit: 'gr' },
        ],
      },
      {
        id: 83,
        name: 'Tovuqli kotlet',
        mealType: 'LUNCH',
        ingredients: [
          { name: 'Tovuq filesi', amount: 100, unit: 'gr' },
          { name: 'Motsarella', amount: 10, unit: 'gr' },
          { name: 'Garnir (Grechka)', amount: 60, unit: 'gr' },
        ],
      },
      {
        id: 84,
        name: 'Pashtet',
        mealType: 'SNACK',
        ingredients: [
          { name: 'Tovuq jigari', amount: 30, unit: 'gr' },
          { name: 'Xlebci', amount: 2, unit: 'dona' },
        ],
      },
      {
        id: 85,
        name: "Rassolnik sho'rva",
        mealType: 'DINNER',
        ingredients: [
          { name: 'Perlovka', amount: 30, unit: 'gr' },
          { name: "Sho'r bodring/pomidor", amount: 40, unit: 'gr' },
        ],
      },
    ],
  },
  // MENU 18
  {
    menuNumber: 18,
    dishes: [
      {
        id: 86,
        name: 'Ovsianka Kefirda',
        mealType: 'BREAKFAST',
        ingredients: [
          { name: 'Suli yormasi', amount: 30, unit: 'gr' },
          { name: 'Kefir', amount: 150, unit: 'gr' },
        ],
      },
      {
        id: 87,
        name: 'Shokoladli maffin',
        mealType: 'SECOND_BREAKFAST',
        ingredients: [
          { name: 'Un', amount: 42.8, unit: 'gr' },
          { name: 'Kefir', amount: 42.8, unit: 'ml' },
          { name: 'Tuxum', amount: 15, unit: 'gr' },
        ],
      },
      {
        id: 88,
        name: "Do'lma",
        mealType: 'LUNCH',
        ingredients: [
          { name: 'Tok bargi', amount: 8, unit: 'dona' },
          { name: "Go'sht", amount: 42.8, unit: 'gr' },
          { name: "Bulg'ur", amount: 42.8, unit: 'gr' },
        ],
      },
      {
        id: 89,
        name: 'Salat',
        mealType: 'SNACK',
        ingredients: [
          { name: 'Pomidor', amount: 50, unit: 'gr' },
          { name: 'Bodring', amount: 50, unit: 'gr' },
          { name: 'Bedana tuxum', amount: 2, unit: 'dona' },
        ],
      },
      {
        id: 90,
        name: "Qovoq sho'rva",
        mealType: 'DINNER',
        ingredients: [
          { name: 'Qovoq', amount: 100, unit: 'gr' },
          { name: 'Piyoz', amount: 14.2, unit: 'gr' },
        ],
      },
    ],
  },
  // MENU 19
  {
    menuNumber: 19,
    dishes: [
      {
        id: 91,
        name: 'Arpa kashasi',
        mealType: 'BREAKFAST',
        ingredients: [
          { name: 'Arpa yormasi', amount: 30, unit: 'gr' },
          { name: 'Sut', amount: 57.1, unit: 'ml' },
        ],
      },
      {
        id: 92,
        name: 'Bananli blinchik',
        mealType: 'SECOND_BREAKFAST',
        ingredients: [
          { name: 'Banan', amount: 42.8, unit: 'gr' },
          { name: 'Pishloq (Kalleh)', amount: 28.5, unit: 'gr' },
          { name: 'Tuxum', amount: 39, unit: 'gr' },
        ],
      },
      {
        id: 93,
        name: 'Kiyev kotleti',
        mealType: 'LUNCH',
        ingredients: [
          { name: 'Tovuq filesi', amount: 100, unit: 'gr' },
          { name: 'Motsarella', amount: 21.4, unit: 'gr' },
          { name: 'Garnir (Perlovka)', amount: 35.7, unit: 'gr' },
        ],
      },
      {
        id: 94,
        name: 'Mavsumiy salat',
        mealType: 'SNACK',
        ingredients: [
          { name: 'Sabzi', amount: 42.8, unit: 'gr' },
          { name: 'Bodring', amount: 42.8, unit: 'gr' },
        ],
      },
      {
        id: 95,
        name: "Qo'ziqorin sho'rva",
        mealType: 'DINNER',
        ingredients: [
          { name: "Qo'ziqorin", amount: 71.4, unit: 'gr' },
          { name: 'Sut', amount: 14.2, unit: 'ml' },
        ],
      },
    ],
  },
  // MENU 20
  {
    menuNumber: 20,
    dishes: [
      {
        id: 96,
        name: 'Sirniki',
        mealType: 'BREAKFAST',
        ingredients: [
          { name: 'Tvorog', amount: 100, unit: 'gr' },
          { name: 'Shakar', amount: 21.4, unit: 'gr' },
          { name: 'Kraxmal', amount: 14.2, unit: 'gr' },
        ],
      },
      {
        id: 97,
        name: 'Granola',
        mealType: 'SECOND_BREAKFAST',
        ingredients: [
          { name: 'Granola', amount: 50, unit: 'gr' },
          { name: 'Kefir/Yogurt', amount: 60, unit: 'ml' },
          { name: "Yong'oq/Mayiz", amount: 21.4, unit: 'gr' },
        ],
      },
      {
        id: 98,
        name: 'Bif Burginyon',
        mealType: 'LUNCH',
        ingredients: [
          { name: "Mol go'shti", amount: 71.4, unit: 'gr' },
          { name: 'Kartoshka', amount: 142.8, unit: 'gr' },
          { name: "Qo'ziqorin", amount: 42.8, unit: 'gr' },
        ],
      },
      {
        id: 99,
        name: 'Sushi (Kimpab)',
        mealType: 'SNACK',
        ingredients: [
          { name: 'Soni', amount: 4, unit: 'dona' },
          { name: 'Tovuq filesi', amount: 28.5, unit: 'gr' },
          { name: 'Bodring', amount: 28.5, unit: 'gr' },
        ],
      },
      {
        id: 100,
        name: "Chechevitsa sho'rva",
        mealType: 'DINNER',
        ingredients: [
          { name: 'Yasmiq', amount: 31.4, unit: 'gr' },
          { name: "Yog'", amount: 4.2, unit: 'gr' },
        ],
      },
    ],
  },
  // MENU 21
  {
    menuNumber: 21,
    dishes: [
      {
        id: 101,
        name: 'Glazunya',
        mealType: 'BREAKFAST',
        ingredients: [
          { name: 'Tuxum', amount: 148, unit: 'gr' },
          { name: 'Qora non', amount: 50, unit: 'gr' },
        ],
      },
      {
        id: 102,
        name: 'Apelsinli maffin',
        mealType: 'SECOND_BREAKFAST',
        ingredients: [
          { name: 'Un', amount: 42.8, unit: 'gr' },
          { name: 'Qatiq', amount: 42.8, unit: 'ml' },
          { name: 'Tuxum', amount: 15, unit: 'gr' },
        ],
      },
      {
        id: 103,
        name: 'Dalan kofte',
        mealType: 'LUNCH',
        ingredients: [
          { name: 'Tovuq filesi', amount: 85.7, unit: 'gr' },
          { name: 'Piyoz', amount: 28.5, unit: 'gr' },
        ],
      },
      {
        id: 104,
        name: 'Sabzavotli garnir',
        mealType: 'LUNCH',
        ingredients: [
          { name: 'Baqlajon', amount: 57.1, unit: 'gr' },
          { name: 'Qovoqcha', amount: 57.1, unit: 'gr' },
        ],
      },
      {
        id: 105,
        name: 'Tofu salati',
        mealType: 'SNACK',
        ingredients: [
          { name: 'Tofu', amount: 40, unit: 'gr' },
          { name: 'Bodring', amount: 28.5, unit: 'gr' },
          { name: 'Pomidor', amount: 28.5, unit: 'gr' },
        ],
      },
      {
        id: 106,
        name: "Pishloqli sho'rva",
        mealType: 'DINNER',
        ingredients: [
          { name: 'Sosiska/Indeyka', amount: 11.4, unit: 'gr' },
          { name: 'Pishloqlar', amount: 10, unit: 'gr' },
          { name: 'Sut', amount: 14.2, unit: 'ml' },
        ],
      },
    ],
  },
];

// Get menu by number (1-21)
export function getMenu(menuNumber: number): DailyMenu | undefined {
  return MENUS.find(m => m.menuNumber === menuNumber);
}

// Get today's menu
export function getTodaysMenu(): DailyMenu | undefined {
  return getMenu(getTodaysMenuNumber());
}

// Get tomorrow's menu
export function getTomorrowsMenu(): DailyMenu | undefined {
  return getMenu(getTomorrowsMenuNumber());
}

// Calculate total ingredients needed for a menu based on client calorie distribution
export function calculateIngredientsForMenu(
  menuNumber: number,
  clientsByCalorie: Record<number, number>,
  dishQuantities?: Record<number, number>
): Map<string, { amount: number; unit: string }> {
  const menu = getMenu(menuNumber);
  if (!menu) return new Map();
  
  const totalIngredients = new Map<string, { amount: number; unit: string }>();
  
  for (const dish of menu.dishes) {
    const dishQty = dishQuantities?.[dish.id] ?? 1;
    if (dishQty === 0) continue;
    
    for (const [calorieStr, clientCount] of Object.entries(clientsByCalorie)) {
      const calories = parseInt(calorieStr);
      if (clientCount === 0) continue;
      
      const scaledIngredients = scaleIngredients(
        dish.ingredients,
        calories,
        dish.mealType,
        dishQty * clientCount
      );
      
      for (const ing of scaledIngredients) {
        const existing = totalIngredients.get(ing.name);
        if (existing) {
          existing.amount = Math.round((existing.amount + ing.amount) * 10) / 10;
        } else {
          totalIngredients.set(ing.name, { amount: ing.amount, unit: ing.unit });
        }
      }
    }
  }
  
  return totalIngredients;
}

// Calculate shopping list (expected - remaining)
export function calculateShoppingList(
  expectedIngredients: Map<string, { amount: number; unit: string }>,
  remainingInventory: Record<string, number>
): Map<string, { amount: number; unit: string }> {
  const shoppingList = new Map<string, { amount: number; unit: string }>();
  
  for (const [name, { amount, unit }] of expectedIngredients) {
    const remaining = remainingInventory[name] || 0;
    const needed = amount - remaining;
    if (needed > 0) {
      shoppingList.set(name, { amount: Math.round(needed * 10) / 10, unit });
    }
  }
  
  return shoppingList;
}

// Get all unique ingredients across all menus
export function getAllIngredients(): string[] {
  const ingredients = new Set<string>();
  for (const menu of MENUS) {
    for (const dish of menu.dishes) {
      for (const ing of dish.ingredients) {
        ingredients.add(ing.name);
      }
    }
  }
  return Array.from(ingredients).sort();
}
