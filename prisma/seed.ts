import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MEAL_TYPES = {
  BREAKFAST: 'BREAKFAST',
  SECOND_BREAKFAST: 'SECOND_BREAKFAST',
  LUNCH: 'LUNCH',
  SNACK: 'SNACK',
  DINNER: 'DINNER',
  SIXTH_MEAL: 'SIXTH_MEAL',
};

// Helper to generate image URL
const getImg = (filename: string) =>
  `https://wsrv.nl/?url=github.com/FreedoomForm/hi/blob/main/${filename}?raw=true&w=400&output=webp&q=80`;

const dishesData = [
  // --- NONUSHTALAR (BREAKFAST) ---
  { name: 'Balish (Tovuqli pirog)', mealType: MEAL_TYPES.BREAKFAST, img: '1.png' },
  { name: "Tariq bo'tqasi (Pshonaya kasha)", mealType: MEAL_TYPES.BREAKFAST, img: '17.png' },
  { name: 'Tovuqli blinchik', mealType: MEAL_TYPES.BREAKFAST, img: '13.png' },
  { name: 'Sutli zapekanka (Vermeshel bilan)', mealType: MEAL_TYPES.BREAKFAST, img: '8.png' },
  { name: 'Grechka kasha', mealType: MEAL_TYPES.BREAKFAST, img: '26.png' },
  { name: 'Skrembl (Ismaloqli tuxum)', mealType: MEAL_TYPES.BREAKFAST, img: '29.png' },
  { name: 'Fritata (Indeyka va pishloqli)', mealType: MEAL_TYPES.BREAKFAST, img: '41.png' },
  { name: 'Ovsianka kasha (Sutli)', mealType: MEAL_TYPES.BREAKFAST, img: '36.png' },
  { name: 'Shakshuka (Pomidorli tuxum)', mealType: MEAL_TYPES.BREAKFAST, img: '46.png' },
  { name: 'Pshenka kasha (Tariq)', mealType: MEAL_TYPES.BREAKFAST, img: '51.png' },
  { name: 'Achma (Tvorog va pishloqli)', mealType: MEAL_TYPES.BREAKFAST, img: '57.png' },
  { name: 'Kesadilya (Lavashda pishloq va sabzavot)', mealType: MEAL_TYPES.BREAKFAST, img: '57.png' }, // Placeholder (Achma) until real image found
  { name: "Bug'doy kasha (Pshenichnaya)", mealType: MEAL_TYPES.BREAKFAST, img: '62.png' },
  { name: 'Tvorogli nonushta (Smetana bilan)', mealType: MEAL_TYPES.BREAKFAST, img: '70.png' },
  { name: "Shokoladli kasha (Kakao qo'shilgan)", mealType: MEAL_TYPES.BREAKFAST, img: '72.png' },
  { name: 'Omlet (Motsarella bilan)', mealType: MEAL_TYPES.BREAKFAST, img: '11.png' }, // Also 87.png
  { name: 'Sendvich (Tovuq va bodringli)', mealType: MEAL_TYPES.BREAKFAST, img: '83.png' },
  { name: 'Ovsianka Kefirda (Tungi ivitilgan)', mealType: MEAL_TYPES.BREAKFAST, img: '105.png' }, // Also 97.png
  { name: 'Arpa kashasi (Yachka)', mealType: MEAL_TYPES.BREAKFAST, img: '92.png' },
  { name: 'Sirniki (Tvorogli quymoq)', mealType: MEAL_TYPES.BREAKFAST, img: '104.png' },
  { name: 'Glazunya (Qovurilgan tuxum)', mealType: MEAL_TYPES.BREAKFAST, img: '102.png' },

  // --- 2-NONUSHTA (SECOND_BREAKFAST) & DESSERT ---
  { name: 'Qovoq tatlisi (Shakar bilan dimlangan)', mealType: MEAL_TYPES.SECOND_BREAKFAST, img: '5.png' },
  { name: "Mazurka (Yong'oq va mayizli pirog)", mealType: MEAL_TYPES.SECOND_BREAKFAST, img: '6.png' },
  { name: 'Tvorogli pirog', mealType: MEAL_TYPES.SECOND_BREAKFAST, img: '14.png' },
  { name: 'Mevali assorti', mealType: MEAL_TYPES.SECOND_BREAKFAST, img: '19.png' },
  { name: 'Shoko blinchik', mealType: MEAL_TYPES.SECOND_BREAKFAST, img: '22.png' },
  { name: 'Limonli maffin', mealType: MEAL_TYPES.SECOND_BREAKFAST, img: '28.png' },
  { name: 'Tvorogli desert (Pechenye bilan)', mealType: MEAL_TYPES.SECOND_BREAKFAST, img: '32.png' },
  { name: 'Shokoladli rulet', mealType: MEAL_TYPES.SECOND_BREAKFAST, img: '37.png' },
  { name: 'Chia puding', mealType: MEAL_TYPES.SECOND_BREAKFAST, img: '47.png' },
  { name: 'Brauni (PP usulida)', mealType: MEAL_TYPES.SECOND_BREAKFAST, img: '48.png' },
  { name: 'Vafli (Soddasi va Shokoladlisi)', mealType: MEAL_TYPES.SECOND_BREAKFAST, img: '54.png' }, // Also 84.png
  { name: 'Sharlotka (Olmali pirog)', mealType: MEAL_TYPES.SECOND_BREAKFAST, img: '58.png' },
  { name: 'Ovsianka pechenye', mealType: MEAL_TYPES.SECOND_BREAKFAST, img: '63.png' },
  { name: 'Medovik (Asalli tort)', mealType: MEAL_TYPES.SECOND_BREAKFAST, img: '68.png' },
  { name: 'Chizkeyk', mealType: MEAL_TYPES.SECOND_BREAKFAST, img: '73.png' },
  { name: 'Trileche', mealType: MEAL_TYPES.SECOND_BREAKFAST, img: '78.png' },
  { name: 'Shokoladli maffin', mealType: MEAL_TYPES.SECOND_BREAKFAST, img: '88.png' },
  { name: 'Bananli blinchik', mealType: MEAL_TYPES.SECOND_BREAKFAST, img: '93.png' },
  { name: 'Granola (Yogurt bilan)', mealType: MEAL_TYPES.SECOND_BREAKFAST, img: '98.png' },
  { name: 'Apelsinli maffin', mealType: MEAL_TYPES.SECOND_BREAKFAST, img: '103.png' },

  // --- TUSHLIK (LUNCH) ---
  { name: "Mol go'shti va Qo'ziqorin (Garnir: Grechka)", mealType: MEAL_TYPES.LUNCH, img: '2.png' },
  { name: 'Tovuq kabob (Garnir: Aralash sabzavot)', mealType: MEAL_TYPES.LUNCH, img: '9.png' }, // 9 is Kabob, 10 is Kabob w/ Veg
  { name: 'Gulyash (Garnir: Spagetti)', mealType: MEAL_TYPES.LUNCH, img: '15.png' },
  { name: 'Jigar qovurma (Garnir: Kartoshka pyure)', mealType: MEAL_TYPES.LUNCH, img: '18.png' },
  { name: 'Buffalo qanotchalar (Garnir: Qizil sabzi)', mealType: MEAL_TYPES.LUNCH, img: '23.png' },
  { name: 'Karni yarik (Qiymali baqlajon)', mealType: MEAL_TYPES.LUNCH, img: '27.png' },
  { name: 'Baliqli kotlet (Garnir: Perlovka)', mealType: MEAL_TYPES.LUNCH, img: '33.png' },
  { name: "Brizol (Garnir: Bulg'ur)", mealType: MEAL_TYPES.LUNCH, img: '38.png' },
  { name: 'Tovuq soni (Garnir: Kartoshka)', mealType: MEAL_TYPES.LUNCH, img: '43.png' },
  { name: 'Kotlet (Mol+Tovuq) (Garnir: Noxat)', mealType: MEAL_TYPES.LUNCH, img: '49.png' },
  { name: 'Tovuq rulet (Sabzavotli)', mealType: MEAL_TYPES.LUNCH, img: '52.png' },
  { name: "Bulg'ur palov", mealType: MEAL_TYPES.LUNCH, img: '59.png' },
  { name: "Frikase (Tovuq va qo'ziqorinli)", mealType: MEAL_TYPES.LUNCH, img: '64.png' },
  { name: 'Hasanposho kofte (Pyureli kotlet, Garnir: Guruch)', mealType: MEAL_TYPES.LUNCH, img: '69.png' },
  { name: "Tovuksay (Tovuq va sabzavotlar, Garnir: Bulg'ur)", mealType: MEAL_TYPES.LUNCH, img: '74.png' },
  { name: 'Lyulya kabob (Garnir: Spagetti)', mealType: MEAL_TYPES.LUNCH, img: '79.png' },
  { name: 'Tovuqli kotlet (Pishloqli, Garnir: Grechka)', mealType: MEAL_TYPES.LUNCH, img: '85.png' },
  { name: "Do'lma (Tok oshi)", mealType: MEAL_TYPES.LUNCH, img: '89.png' },
  { name: 'Kiyev kotleti (Garnir: Perlovka)', mealType: MEAL_TYPES.LUNCH, img: '94.png' },
  { name: "Bif Burginyon (Go'sht va sabzavotli ragu)", mealType: MEAL_TYPES.LUNCH, img: '99.png' },
  { name: 'Dalan kofte (Tovuqli, Garnir: Baqlajon/Qovoqcha)', mealType: MEAL_TYPES.LUNCH, img: '108.png' },

  // --- POLDNIK (SNACK) ---
  { name: "Lavlagi salati (Yong'oqli / Olmali / Brinzali)", mealType: MEAL_TYPES.SNACK, img: '3.png' }, // Also 65.png, 81.png
  { name: 'Tulum salati (Tvorog, Olma, Aysberg)', mealType: MEAL_TYPES.SNACK, img: '56.png' }, // Also 16.png
  { name: "Tabule salati (Bulg'ur va ko'kat)", mealType: MEAL_TYPES.SNACK, img: '21.png' },
  { name: 'Suzmali salat', mealType: MEAL_TYPES.SNACK, img: '24.png' },
  { name: 'Nisuaz salati (Tuna yoki Tovuq bilan)', mealType: MEAL_TYPES.SNACK, img: '31.png' },
  { name: 'Vinegret', mealType: MEAL_TYPES.SNACK, img: '34.png' },
  { name: 'Sezar salati', mealType: MEAL_TYPES.SNACK, img: '39.png' },
  { name: 'Olivye salati', mealType: MEAL_TYPES.SNACK, img: '44.png' },
  { name: 'Ikra (Sabzavotli) va Xlebci', mealType: MEAL_TYPES.SNACK, img: '50.png' },
  { name: 'Xumus va Xlebci', mealType: MEAL_TYPES.SNACK, img: '67.png' },
  { name: 'Fransuzcha salat (Karam, lavlagi, sabzi)', mealType: MEAL_TYPES.SNACK, img: '77.png' },
  { name: 'Baqlajon salat', mealType: MEAL_TYPES.SNACK, img: '75.png' },
  { name: 'Pashtet (Jigar) va Xlebci', mealType: MEAL_TYPES.SNACK, img: '86.png' },
  { name: 'Mavsumiy salat (Sabzi, bodring)', mealType: MEAL_TYPES.SNACK, img: '95.png' }, // Also 90.png
  { name: 'Sushi (Kimpab)', mealType: MEAL_TYPES.SNACK, img: '100.png' },
  { name: 'Tofu salati', mealType: MEAL_TYPES.SNACK, img: '107.png' },

  // --- KECHKI OVQAT (DINNER) ---
  { name: "Tovuq sho'rva", mealType: MEAL_TYPES.DINNER, img: '4.png' },
  { name: "Frikadelka sho'rva (Go'shtli/Tovuqli)", mealType: MEAL_TYPES.DINNER, img: '76.png' }, // Also 12.png
  { name: "Terbiye sho'rva (Qatiqli)", mealType: MEAL_TYPES.DINNER, img: '7.png' }, // Also 55.png
  { name: 'Borsh', mealType: MEAL_TYPES.DINNER, img: '20.png' }, // Also 25.png
  // { name: 'Mastava', mealType: MEAL_TYPES.DINNER, img: null },
  { name: "Brokkoli sho'rva", mealType: MEAL_TYPES.DINNER, img: '30.png' },
  { name: "Shi sho'rvasi (Shovul bilan)", mealType: MEAL_TYPES.DINNER, img: '35.png' },
  { name: 'Minestrone (Loviya va sabzavotli)', mealType: MEAL_TYPES.DINNER, img: '40.png' }, // Also 42.png
  { name: "Ezogelin (Yasmiqli turkcha sho'rva)", mealType: MEAL_TYPES.DINNER, img: '45.png' },
  { name: "Qo'ziqorinli sho'rva (Slivkali/Sutli)", mealType: MEAL_TYPES.DINNER, img: '53.png' },
  { name: "Qizil sabzi sho'rva (Sosiska bilan)", mealType: MEAL_TYPES.DINNER, img: '61.png' }, // Also 60.png
  { name: "Til sho'rva (Til va qaymoqli)", mealType: MEAL_TYPES.DINNER, img: '66.png' },
  { name: "Yashil sho'rva (Ismaloqli)", mealType: MEAL_TYPES.DINNER, img: '71.png' },
  { name: "Chuchvarali sho'rva", mealType: MEAL_TYPES.DINNER, img: '82.png' },
  // { name: "Rassolnik (Perlovka va sho'r bodring)", mealType: MEAL_TYPES.DINNER, img: null },
  { name: "Qovoq sho'rva (Pyure)", mealType: MEAL_TYPES.DINNER, img: '91.png' }, // Also 96.png
  { name: "Chechevitsa sho'rva (Yasmiq)", mealType: MEAL_TYPES.DINNER, img: '101.png' },
  // { name: "Pishloqli sho'rva", mealType: MEAL_TYPES.DINNER, img: null },

  // --- 6-TAOM (SIXTH_MEAL) ---
  // --- 6-TAOM (SIXTH_MEAL) ---
  { name: "Mol go'shti va Guruch (Oddiy qaynatma/dimlama)", mealType: MEAL_TYPES.SIXTH_MEAL, img: '2.png' },
  { name: "Tovuq filesi va Makaron", mealType: MEAL_TYPES.SIXTH_MEAL, img: '74.png' },
  { name: "Mol go'shti va Grechka", mealType: MEAL_TYPES.SIXTH_MEAL, img: '2.png' },
  { name: "Tovuq kotleti va Non (Sendvich)", mealType: MEAL_TYPES.SIXTH_MEAL, img: '85.png' },
  { name: "Mol go'shti va Bulg'ur", mealType: MEAL_TYPES.SIXTH_MEAL, img: '2.png' },
  { name: "Tovuq filesi va Sabzavotlar (Dimlama)", mealType: MEAL_TYPES.SIXTH_MEAL, img: '74.png' },
  { name: "Go'shtli teftel va Guruch", mealType: MEAL_TYPES.SIXTH_MEAL, img: '49.png' },
  { name: "Tovuq filesi va Karam (Dimlama)", mealType: MEAL_TYPES.SIXTH_MEAL, img: '74.png' },
  // { name: "Mol go'shti va Grechka", mealType: MEAL_TYPES.SIXTH_MEAL, img: '2.png' }, // Duplicate name
  { name: "Tovuq filesi va Yasmiq (Garnir)", mealType: MEAL_TYPES.SIXTH_MEAL, img: '74.png' },
  { name: "Mol go'shti va Sabzavotli ragu", mealType: MEAL_TYPES.SIXTH_MEAL, img: '15.png' },
  { name: "Tovuq filesi va Guruch", mealType: MEAL_TYPES.SIXTH_MEAL, img: '74.png' },
  { name: "Mol go'shti va Makaron", mealType: MEAL_TYPES.SIXTH_MEAL, img: '2.png' },
  { name: "Tovuq kotleti va Grechka", mealType: MEAL_TYPES.SIXTH_MEAL, img: '85.png' },
  { name: "Mol go'shti va Sabzavotlar", mealType: MEAL_TYPES.SIXTH_MEAL, img: '2.png' },
  { name: "Tovuq filesi va Perlovka", mealType: MEAL_TYPES.SIXTH_MEAL, img: '33.png' },
  // Repeats found in list, skipping duplicates to keep unique names or appending suffix if distinct
];

async function main() {
  console.log(`Start seeding ${dishesData.length} dishes...`);

  for (const dish of dishesData) {
    const imageUrl = dish.img ? getImg(dish.img) : null;

    // Check if exists to avoid duplicates (optional, based on name)
    const existing = await prisma.dish.findFirst({ where: { name: dish.name } });

    if (!existing) {
      await prisma.dish.create({
        data: {
          name: dish.name,
          mealType: dish.mealType,
          imageUrl: imageUrl,
          ingredients: [], // Empty ingredients as starters
        }
      });
      console.log(`Created dish: ${dish.name}`);
    } else {
      // Force update image to ensure it uses the optimized version
      if (imageUrl && existing.imageUrl !== imageUrl) {
        await prisma.dish.update({
          where: { id: existing.id },
          data: { imageUrl: imageUrl }
        });
        console.log(`Updated/Corrected image for: ${dish.name}`);
      } else {
        console.log(`Image already up to date for: ${dish.name}`);
      }
    }
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
