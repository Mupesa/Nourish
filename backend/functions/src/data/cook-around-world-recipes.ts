import {
  DietaryPreference,
  Recipe,
  RecipeCuisineRegion,
  RecipeDifficulty,
  RecipeMealType,
} from "../domain/types";

type Profile = "vegan" | "vegetarian" | "pescatarian" | "meat" | "keto";

interface WorldRecipeOutline {
  title: string;
  description: string;
  cuisine: string;
  cuisineRegion: RecipeCuisineRegion;
  mealType: RecipeMealType;
  profile: Profile;
  difficulty: RecipeDifficulty;
  prepMins: number;
  cookMins: number;
  kcal: number;
  core: string[];
}

const BASE_TS = Date.UTC(2026, 6, 1);

const outlines: WorldRecipeOutline[] = [
  // Southern Africa
  r("Peri-Peri Chicken with Coconut Rice", "Charred peri-peri chicken served over coconut rice with bright tomato salad.", "Southern African", "southern_africa", "dinner", "meat", "medium", 15, 30, 610, ["chicken thighs", "peri-peri sauce", "coconut milk", "basmati rice", "cherry tomatoes", "baby spinach"]),
  r("Bobotie with Yellow Rice", "A lighter bobotie bake with fragrant turmeric rice and a crisp cucumber side.", "South African", "southern_africa", "dinner", "meat", "medium", 20, 35, 560, ["lean beef mince", "onion", "curry powder", "egg", "brown rice", "turmeric"]),
  r("Chakalaka and Pap Bowl", "Spicy chakalaka vegetables spooned over creamy pap with beans for a hearty bowl.", "Southern African", "southern_africa", "lunch", "vegan", "easy", 12, 25, 430, ["maize meal", "tomatoes", "carrots", "cabbage", "baked beans", "chilli"]),
  r("Bunny Chow Curry Bowl", "A bowl-style take on bunny chow with chicken curry and toasted whole-grain bread.", "South African", "southern_africa", "dinner", "meat", "medium", 15, 30, 590, ["chicken breast", "potatoes", "tomatoes", "curry powder", "whole-grain bread", "coriander"]),
  r("Sadza with Beef Stew", "Comforting sadza with slow-simmered beef, tomato gravy and leafy greens.", "Zimbabwean", "southern_africa", "dinner", "meat", "medium", 15, 40, 620, ["maize meal", "lean stewing beef", "tomatoes", "onion", "collard greens", "beef stock"]),
  r("Braai Chicken with Tomato Relish", "Smoky braai-style chicken with tomato relish, greens and roasted sweet potato.", "Southern African", "southern_africa", "dinner", "meat", "easy", 15, 28, 540, ["chicken drumsticks", "sweet potato", "tomatoes", "red onion", "baby spinach", "lemon"]),

  // West Africa
  r("Nigerian Jollof Rice with Chicken", "Tomato-rich jollof rice with spiced chicken and sweet peppers.", "West African", "west_africa", "dinner", "meat", "medium", 15, 35, 640, ["chicken thighs", "parboiled rice", "tomatoes", "red pepper", "onion", "jollof spice"]),
  r("Ghanaian Waakye Bowl", "Rice and beans bowl inspired by waakye, finished with egg, greens and pepper sauce.", "Ghanaian", "west_africa", "lunch", "vegetarian", "medium", 15, 30, 520, ["brown rice", "black-eyed peas", "egg", "cabbage", "tomatoes", "pepper sauce"]),
  r("Egusi Stew with Greens", "Nutty egusi-style stew with leafy greens, tomato and lean turkey.", "West African", "west_africa", "dinner", "meat", "medium", 18, 32, 580, ["lean turkey mince", "egusi seeds", "spinach", "tomatoes", "onion", "stock"]),
  r("Suya Beef Skewers", "Spiced suya beef skewers with cucumber salad and roasted vegetables.", "Nigerian", "west_africa", "dinner", "meat", "easy", 15, 18, 500, ["lean beef strips", "suya spice", "cucumber", "tomatoes", "red onion", "peanut powder"]),
  r("Maafe Peanut Stew", "Peanut tomato stew with chicken, sweet potato and greens.", "West African", "west_africa", "dinner", "meat", "medium", 15, 32, 610, ["chicken breast", "sweet potato", "natural peanut butter", "tomatoes", "kale", "stock"]),
  r("Kelewele Spiced Plantains", "Oven-roasted spiced plantains with lime yogurt and crunchy peanuts.", "Ghanaian", "west_africa", "snack", "vegetarian", "easy", 10, 18, 260, ["ripe plantain", "ginger", "cayenne", "lime", "Greek yogurt", "peanuts"]),

  // East Africa
  r("Kenyan Pilau with Kachumbari", "Fragrant pilau rice with lean beef and a crisp kachumbari tomato salad.", "East African", "east_africa", "dinner", "meat", "medium", 15, 30, 590, ["lean beef strips", "basmati rice", "pilau masala", "tomatoes", "red onion", "coriander"]),
  r("Nyama Choma Plate", "Grilled nyama choma-style beef with kachumbari and roasted maize.", "Kenyan", "east_africa", "dinner", "meat", "easy", 15, 25, 560, ["lean beef steak", "maize", "tomatoes", "red onion", "cabbage", "lemon"]),
  r("Ethiopian Misir Wat with Injera", "Red lentil misir wat with berbere spice, greens and soft injera.", "Ethiopian", "east_africa", "dinner", "vegan", "medium", 12, 30, 480, ["red lentils", "berbere spice", "tomatoes", "onion", "spinach", "injera"]),
  r("Ugali with Sukuma Wiki", "Simple ugali with garlicky sukuma wiki and beans for a filling plate.", "East African", "east_africa", "lunch", "vegan", "easy", 10, 22, 430, ["maize meal", "collard greens", "kidney beans", "tomatoes", "onion", "garlic"]),
  r("Tanzanian Coconut Fish Curry", "White fish simmered in coconut tomato curry with rice and greens.", "Tanzanian", "east_africa", "dinner", "pescatarian", "medium", 15, 25, 560, ["white fish", "light coconut milk", "tomatoes", "spinach", "curry powder", "basmati rice"]),
  r("Somali Bariis Iskukaris", "Spiced rice with chicken, carrots, raisins and warming aromatics.", "Somali", "east_africa", "dinner", "meat", "medium", 18, 35, 620, ["chicken breast", "basmati rice", "carrots", "raisins", "cardamom", "tomatoes"]),

  // Asian
  r("Pad Thai", "A lighter pad thai with rice noodles, prawns, egg and crunchy peanuts.", "Thai", "asian", "dinner", "pescatarian", "medium", 15, 18, 540, ["prawns", "rice noodles", "egg", "bean sprouts", "tamarind sauce", "peanuts"]),
  r("Thai Green Curry", "Green curry with tofu, vegetables and fragrant jasmine rice.", "Thai", "asian", "dinner", "vegan", "medium", 15, 25, 520, ["firm tofu", "green curry paste", "light coconut milk", "broccoli", "bell pepper", "jasmine rice"]),
  r("Chicken Fried Rice", "Weeknight chicken fried rice packed with vegetables and ginger.", "East Asian", "asian", "dinner", "meat", "easy", 12, 15, 500, ["chicken breast", "brown rice", "egg", "peas", "carrots", "tamari"]),
  r("Ramen Noodle Bowl", "Cozy ramen bowl with mushrooms, egg, greens and sesame.", "Japanese", "asian", "dinner", "vegetarian", "medium", 15, 20, 490, ["ramen noodles", "egg", "mushrooms", "bok choy", "miso", "sesame seeds"]),
  r("Korean Bibimbap", "Colorful bibimbap with beef, vegetables, rice and gochujang.", "Korean", "asian", "lunch", "meat", "medium", 18, 20, 560, ["lean beef mince", "brown rice", "spinach", "carrots", "egg", "gochujang"]),
  r("Vietnamese Lemongrass Chicken Bowl", "Lemongrass chicken with rice noodles, herbs and crunchy vegetables.", "Vietnamese", "asian", "lunch", "meat", "easy", 15, 18, 510, ["chicken breast", "rice noodles", "lemongrass", "cucumber", "carrot", "mint"]),

  // Indian
  r("Butter Chicken with Naan", "Creamy tomato butter chicken with naan and cucumber salad.", "Indian", "indian", "dinner", "meat", "medium", 15, 30, 640, ["chicken breast", "tomatoes", "Greek yogurt", "butter", "garam masala", "naan"]),
  r("Chicken Biryani", "Spiced chicken biryani with basmati rice, herbs and yogurt.", "Indian", "indian", "dinner", "meat", "hard", 25, 40, 680, ["chicken thighs", "basmati rice", "yogurt", "biryani spice", "onion", "mint"]),
  r("Chana Masala", "Chickpea masala with tomato, ginger and brown rice.", "Indian", "indian", "dinner", "vegan", "easy", 12, 25, 460, ["chickpeas", "tomatoes", "onion", "ginger", "garam masala", "brown rice"]),
  r("Dal Makhani", "Slow-simmered black lentil dal with warming spices and rice.", "Indian", "indian", "dinner", "vegetarian", "medium", 15, 35, 520, ["black lentils", "kidney beans", "tomatoes", "Greek yogurt", "garam masala", "basmati rice"]),
  r("Masala Dosa", "Crisp dosa with spiced potato filling and coconut chutney.", "South Indian", "indian", "breakfast", "vegetarian", "medium", 20, 25, 430, ["dosa batter", "potatoes", "mustard seeds", "curry leaves", "coconut chutney", "spinach"]),
  r("Palak Paneer", "Spinach paneer curry with rice and fragrant spices.", "Indian", "indian", "dinner", "vegetarian", "medium", 15, 25, 540, ["paneer", "spinach", "tomatoes", "onion", "garam masala", "brown rice"]),

  // Western
  r("Herb Roast Chicken", "Lemon herb roast chicken with potatoes and green beans.", "Western", "western", "dinner", "meat", "easy", 15, 35, 580, ["chicken thighs", "baby potatoes", "green beans", "lemon", "rosemary", "olive oil"]),
  r("Creamy Tomato Pasta", "Tomato pasta with basil, ricotta and a side of greens.", "Western", "western", "dinner", "vegetarian", "easy", 10, 20, 520, ["whole-wheat pasta", "tomatoes", "ricotta", "basil", "spinach", "parmesan"]),
  r("Chicken Caesar Bowl", "Chicken Caesar-inspired grain bowl with crunchy romaine and yogurt dressing.", "Western", "western", "lunch", "meat", "easy", 12, 18, 490, ["chicken breast", "romaine", "quinoa", "Greek yogurt", "parmesan", "lemon"]),
  r("Beef Stew with Potatoes", "Classic beef stew with potatoes, carrots and herbs.", "Western", "western", "dinner", "meat", "medium", 20, 45, 610, ["lean stewing beef", "potatoes", "carrots", "celery", "beef stock", "thyme"]),
  r("Turkey Meatballs with Rice", "Tender turkey meatballs with tomato sauce and rice.", "Western", "western", "dinner", "meat", "medium", 15, 28, 560, ["lean turkey mince", "brown rice", "tomato sauce", "egg", "parsley", "parmesan"]),
  r("Sheet Pan Salmon and Vegetables", "Salmon roasted with colorful vegetables and lemon.", "Western", "western", "dinner", "pescatarian", "easy", 12, 22, 540, ["salmon fillets", "broccoli", "bell peppers", "zucchini", "lemon", "olive oil"]),
];

function r(
  title: string,
  description: string,
  cuisine: string,
  cuisineRegion: RecipeCuisineRegion,
  mealType: RecipeMealType,
  profile: Profile,
  difficulty: RecipeDifficulty,
  prepMins: number,
  cookMins: number,
  kcal: number,
  core: string[],
): WorldRecipeOutline {
  return {
    title,
    description,
    cuisine,
    cuisineRegion,
    mealType,
    profile,
    difficulty,
    prepMins,
    cookMins,
    kcal,
    core,
  };
}

function quantityFor(name: string): string {
  const n = name.toLowerCase();
  if (/(chicken|beef|fish|salmon|prawn|turkey|tofu|paneer)/.test(n)) return "300 g";
  if (/(rice|noodles|lentils|beans|chickpeas|pasta|quinoa|maize meal)/.test(n)) return "1 cup";
  if (/(sauce|paste|butter|oil|yogurt|chutney)/.test(n)) return "2 tbsp";
  if (/(spice|masala|berbere|curry|cardamom|mustard|thyme|rosemary)/.test(n)) return "1 tsp";
  if (/(egg|plantain|potato|onion|lemon|lime)/.test(n)) return "2";
  return "1 cup";
}

function macrosFor(kcal: number, profile: Profile) {
  const split: Record<Profile, [number, number, number]> = {
    vegan: [0.18, 0.56, 0.26],
    vegetarian: [0.22, 0.48, 0.3],
    pescatarian: [0.3, 0.4, 0.3],
    meat: [0.32, 0.4, 0.28],
    keto: [0.3, 0.12, 0.58],
  };
  const [protein, carbs, fat] = split[profile];
  return {
    proteinG: Math.round((kcal * protein) / 4),
    carbsG: Math.round((kcal * carbs) / 4),
    fatG: Math.round((kcal * fat) / 9),
  };
}

function tagsFor(profile: Profile): DietaryPreference[] {
  if (profile === "vegan") return ["vegan", "vegetarian"];
  if (profile === "vegetarian") return ["vegetarian"];
  if (profile === "keto") return ["keto", "gluten_free"];
  return [];
}

function stepsFor(outline: WorldRecipeOutline) {
  const [first, second, third, ...rest] = outline.core;
  return [
    {
      title: "Prepare",
      body: `Measure and prepare ${[first, second, third].filter(Boolean).join(", ")}.`,
      icon: "restaurant_menu",
    },
    {
      title: "Build flavour",
      body: "Warm a pan, add the aromatics and spices, and cook until fragrant.",
      icon: "skillet",
    },
    {
      title: "Cook",
      body: `Cook the main ingredients for about ${outline.cookMins} minutes, stirring or turning as needed.`,
      icon: "soup_kitchen",
    },
    {
      title: "Finish",
      body: rest.length
        ? `Fold in ${rest.join(", ")} and adjust seasoning before serving.`
        : "Adjust seasoning, portion evenly and serve while fresh.",
      icon: "room_service",
    },
  ];
}

export const cookAroundWorldRecipes: Recipe[] = outlines.map((outline, index) => {
  const id = `world-${String(index + 1).padStart(3, "0")}`;
  const now = BASE_TS + index * 1000;
  return {
    id,
    title: outline.title,
    description: outline.description,
    imageUrl: `https://firebasestorage.googleapis.com/v0/b/nourish-22776.firebasestorage.app/o/recipes%2F${id}%2Fhero.webp?alt=media`,
    imagePath: `recipes/${id}/hero.webp`,
    source: "curated",
    status: "approved",
    submittedBy: null,
    mealTypes: [outline.mealType],
    cuisine: outline.cuisine,
    cuisineRegion: outline.cuisineRegion,
    dietaryTags: tagsFor(outline.profile),
    difficulty: outline.difficulty,
    servings: outline.mealType === "snack" ? 4 : 4,
    prepMins: outline.prepMins,
    cookMins: outline.cookMins,
    kcal: outline.kcal,
    macros: macrosFor(outline.kcal, outline.profile),
    nutritionDisclaimer: "Estimated per serving; not medical advice.",
    ingredients: outline.core.map((name) => ({
      name,
      quantity: quantityFor(name),
    })),
    steps: stepsFor(outline),
    spoonacularId: null,
    createdAt: now,
    updatedAt: now,
  };
});
