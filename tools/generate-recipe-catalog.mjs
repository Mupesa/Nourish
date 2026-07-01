import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const CATALOG_PATH = join(
  ROOT,
  "backend/functions/src/data/recipes.catalog.json",
);
const MANIFEST_PATH = join(ROOT, "content/recipes/image-manifest.json");

const CUISINES = {
  african: "African & Mauritian",
  mediterranean: "Mediterranean & Middle Eastern",
  eastAsian: "East & Southeast Asian",
  southAsian: "South Asian",
  european: "European",
  latin: "Latin American & Caribbean",
  global: "North American & Global",
};

const PROFILES = {
  vegan: { tags: ["vegan", "vegetarian"], split: [0.2, 0.52, 0.28] },
  vegetarian: { tags: ["vegetarian"], split: [0.24, 0.46, 0.3] },
  pescatarian: { tags: [], split: [0.3, 0.4, 0.3] },
  meat: { tags: [], split: [0.3, 0.4, 0.3] },
  keto: { tags: ["keto", "gluten_free"], split: [0.28, 0.08, 0.64] },
  ketoVegetarian: {
    tags: ["keto", "gluten_free", "vegetarian"],
    split: [0.24, 0.08, 0.68],
  },
  paleo: { tags: ["paleo", "gluten_free"], split: [0.3, 0.24, 0.46] },
};

const METHOD_ICONS = {
  bowl: "rice_bowl",
  breakfast: "egg",
  curry: "soup_kitchen",
  salad: "restaurant_menu",
  soup: "soup_kitchen",
  skillet: "skillet",
  bake: "oven",
  roast: "oven",
  wrap: "lunch_dining",
  tacos: "tapas",
  snack: "nutrition",
  stew: "soup_kitchen",
  stirfry: "skillet",
};

const r = (
  title,
  mealType,
  cuisineKey,
  profile,
  method,
  core,
  options = {},
) => ({
  title,
  mealType,
  cuisine: CUISINES[cuisineKey],
  profile,
  method,
  core,
  ...options,
});

// IDs 001-012 retain the titles already shipped in Nourish.
const outlines = [
  r("Mediterranean Salmon Bowl", "dinner", "mediterranean", "pescatarian", "bowl", ["salmon fillets", "quinoa", "cherry tomatoes", "cucumber", "tzatziki", "fresh dill"], { kcal: 450, gf: true, med: true }),
  r("Avocado Sourdough Toast", "breakfast", "global", "vegetarian", "breakfast", ["sourdough bread", "ripe avocado", "eggs", "lemon", "chilli flakes", "baby spinach"], { kcal: 320 }),
  r("Mediterranean Quinoa Bowl", "lunch", "mediterranean", "vegetarian", "bowl", ["quinoa", "chickpeas", "feta", "cherry tomatoes", "cucumber", "olives"], { kcal: 580, gf: true, med: true }),
  r("Honey Glazed Salmon", "dinner", "global", "pescatarian", "roast", ["salmon fillets", "honey", "tamari", "asparagus", "brown rice", "fresh ginger"], { kcal: 650, gf: true }),
  r("Spring Salmon Poke Bowl", "lunch", "eastAsian", "pescatarian", "bowl", ["sushi-grade salmon", "sushi rice", "edamame", "avocado", "cucumber", "sesame seeds"], { kcal: 420, gf: true }),
  r("Zesty Quinoa Salad", "lunch", "mediterranean", "vegan", "salad", ["quinoa", "roasted peppers", "baby spinach", "cucumber", "tahini", "lemon"], { kcal: 350, gf: true, med: true }),
  r("Berry Whole-Grain Pancakes", "breakfast", "global", "vegetarian", "breakfast", ["whole-grain flour", "milk", "egg", "blueberries", "Greek yogurt", "maple syrup"], { kcal: 290 }),
  r("Greek Yogurt & Granola Bowl", "breakfast", "global", "vegetarian", "breakfast", ["Greek yogurt", "granola", "strawberries", "blueberries", "honey", "pumpkin seeds"], { kcal: 310 }),
  r("Chicken & Veg Stir-Fry", "dinner", "eastAsian", "meat", "stirfry", ["chicken breast", "brown rice", "broccoli", "bell peppers", "tamari", "fresh ginger"], { kcal: 480, gf: true }),
  r("Keto Egg & Avocado Plate", "breakfast", "global", "ketoVegetarian", "breakfast", ["eggs", "avocado", "baby spinach", "feta", "cherry tomatoes", "butter"], { kcal: 420 }),
  r("Lentil & Sweet Potato Curry", "dinner", "southAsian", "vegan", "curry", ["red lentils", "sweet potato", "coconut milk", "spinach", "curry paste", "basmati rice"], { kcal: 410, gf: true }),
  r("Paleo Beef & Veg Skillet", "dinner", "global", "paleo", "skillet", ["lean ground beef", "zucchini", "bell peppers", "mushrooms", "tomatoes", "olive oil"], { kcal: 520 }),

  // African & Mauritian: 4 breakfast, 4 lunch, 5 dinner, 2 snack.
  r("Mauritian Tomato Rougaille Eggs", "breakfast", "african", "vegetarian", "skillet", ["eggs", "ripe tomatoes", "spring onion", "fresh thyme", "whole-grain toast", "coriander"], { gf: false }),
  r("Spiced Millet Banana Porridge", "breakfast", "african", "vegan", "breakfast", ["millet flakes", "banana", "coconut milk", "cinnamon", "peanut butter", "toasted coconut"], { gf: true }),
  r("Sweet Potato Moringa Hash", "breakfast", "african", "vegan", "skillet", ["sweet potato", "moringa leaves", "black beans", "bell pepper", "red onion", "avocado"], { gf: true }),
  r("Coconut Cassava Breakfast Bowl", "breakfast", "african", "vegan", "breakfast", ["grated cassava", "light coconut milk", "pineapple", "chia seeds", "lime", "cashews"], { gf: true }),
  r("Peri-Peri Chicken Couscous Bowl", "lunch", "african", "meat", "bowl", ["chicken breast", "whole-wheat couscous", "peri-peri sauce", "cucumber", "tomatoes", "parsley"]),
  r("Harissa Chickpea Carrot Salad", "lunch", "african", "vegan", "salad", ["chickpeas", "carrots", "baby spinach", "harissa", "lemon", "pumpkin seeds"], { gf: true }),
  r("Mauritian Lentil Farata Wrap", "lunch", "african", "vegetarian", "wrap", ["whole-wheat farata", "green lentils", "cabbage", "carrot", "cucumber raita", "coriander"]),
  r("Cape Malay Tuna Rice Salad", "lunch", "african", "pescatarian", "salad", ["tuna", "brown rice", "cucumber", "tomatoes", "raisins", "curry yogurt"], { gf: true }),
  r("Mauritian Chicken Curry", "dinner", "african", "meat", "curry", ["skinless chicken thighs", "potatoes", "tomatoes", "Mauritian curry powder", "green beans", "basmati rice"], { gf: true }),
  r("Berbere Beef Stew", "dinner", "african", "paleo", "stew", ["lean stewing beef", "carrots", "tomatoes", "butternut squash", "berbere spice", "kale"]),
  r("West African Peanut Sweet Potato Stew", "dinner", "african", "vegan", "stew", ["sweet potato", "chickpeas", "tomatoes", "natural peanut butter", "kale", "vegetable stock"], { gf: true }),
  r("Chermoula Fish with Green Beans", "dinner", "african", "keto", "roast", ["white fish fillets", "green beans", "chermoula", "cauliflower", "lemon", "coriander"]),
  r("Jollof Cauliflower Rice Chicken", "dinner", "african", "paleo", "skillet", ["chicken breast", "cauliflower rice", "tomatoes", "red pepper", "onion", "jollof spice"]),
  r("Baked Plantain Lime Bites", "snack", "african", "vegan", "snack", ["ripe plantain", "lime", "smoked paprika", "coconut oil", "coriander", "chilli"], { gf: true }),
  r("Spiced Chickpea Crunch", "snack", "african", "vegan", "snack", ["chickpeas", "cumin", "paprika", "garlic powder", "olive oil", "lemon zest"], { gf: true }),

  // Mediterranean & Middle Eastern: remaining 4 breakfast, 4 lunch, 5 dinner, 2 snack.
  r("Garden Shakshuka", "breakfast", "mediterranean", "vegetarian", "skillet", ["eggs", "tomatoes", "red pepper", "onion", "spinach", "cumin"], { gf: true, med: true }),
  r("Pistachio Fig Yogurt Bowl", "breakfast", "mediterranean", "vegetarian", "breakfast", ["Greek yogurt", "fresh figs", "pistachios", "oats", "honey", "orange zest"], { med: true }),
  r("Herbed Feta Omelette", "breakfast", "mediterranean", "ketoVegetarian", "breakfast", ["eggs", "feta", "spinach", "parsley", "cherry tomatoes", "olive oil"], { med: true }),
  r("Date Tahini Overnight Oats", "breakfast", "mediterranean", "vegan", "breakfast", ["rolled oats", "oat milk", "dates", "tahini", "chia seeds", "cinnamon"], { med: true }),
  r("Lemon Chicken Orzo Salad", "lunch", "mediterranean", "meat", "salad", ["chicken breast", "whole-wheat orzo", "cucumber", "tomatoes", "spinach", "lemon"], { med: true }),
  r("Falafel Tabbouleh Bowl", "lunch", "mediterranean", "vegan", "bowl", ["baked falafel", "bulgur", "parsley", "tomatoes", "cucumber", "tahini"], { med: true }),
  r("Roasted Eggplant Hummus Pita", "lunch", "mediterranean", "vegan", "wrap", ["whole-wheat pita", "eggplant", "hummus", "tomatoes", "rocket", "sumac"], { med: true }),
  r("Tuscan White Bean Kale Soup", "lunch", "mediterranean", "vegan", "soup", ["cannellini beans", "kale", "tomatoes", "carrots", "celery", "vegetable stock"], { gf: true, med: true }),
  r("Greek Lemon Chicken Potatoes", "dinner", "mediterranean", "meat", "roast", ["chicken thighs", "baby potatoes", "lemon", "oregano", "green beans", "olive oil"], { gf: true, med: true }),
  r("Turkey Kofta Cucumber Salad", "dinner", "mediterranean", "keto", "roast", ["lean turkey mince", "cucumber", "tomatoes", "Greek yogurt", "parsley", "cumin"], { med: true }),
  r("Ratatouille White Bean Bake", "dinner", "mediterranean", "vegan", "bake", ["eggplant", "zucchini", "bell pepper", "tomatoes", "white beans", "basil"], { gf: true, med: true }),
  r("Garlic Prawn Tomato Couscous", "dinner", "mediterranean", "pescatarian", "skillet", ["prawns", "whole-wheat couscous", "cherry tomatoes", "garlic", "spinach", "lemon"], { med: true }),
  r("Cauliflower Crust Margherita", "dinner", "mediterranean", "ketoVegetarian", "bake", ["cauliflower", "mozzarella", "egg", "tomato passata", "basil", "parmesan"], { med: true }),
  r("Rosemary Almond Olive Mix", "snack", "mediterranean", "vegan", "snack", ["almonds", "green olives", "rosemary", "orange zest", "chilli flakes", "olive oil"], { gf: true, med: true }),
  r("Cucumber Hummus Cups", "snack", "mediterranean", "vegan", "snack", ["cucumber", "hummus", "cherry tomatoes", "paprika", "parsley", "sesame seeds"], { gf: true, med: true }),

  // East & Southeast Asian: remaining 3 breakfast, 3 lunch, 5 dinner, 2 snack.
  r("Miso Mushroom Breakfast Rice", "breakfast", "eastAsian", "vegan", "bowl", ["brown rice", "mushrooms", "white miso", "spinach", "spring onion", "sesame seeds"], { gf: true }),
  r("Tamago Spinach Rice Bowl", "breakfast", "eastAsian", "vegetarian", "bowl", ["eggs", "brown rice", "spinach", "nori", "tamari", "sesame oil"], { gf: true }),
  r("Savory Scallion Oat Congee", "breakfast", "eastAsian", "vegan", "breakfast", ["rolled oats", "vegetable stock", "spring onion", "mushrooms", "ginger", "sesame seeds"], { gf: true }),
  r("Sesame Tofu Soba Salad", "lunch", "eastAsian", "vegan", "salad", ["firm tofu", "buckwheat soba", "cabbage", "carrot", "edamame", "sesame dressing"], { gf: true }),
  r("Korean Chicken Lettuce Cups", "lunch", "eastAsian", "keto", "wrap", ["chicken mince", "lettuce leaves", "mushrooms", "spring onion", "gochujang", "sesame seeds"]),
  r("Vietnamese Lemongrass Shrimp Noodles", "lunch", "eastAsian", "pescatarian", "bowl", ["prawns", "rice noodles", "cucumber", "carrot", "lemongrass", "mint"], { gf: true }),
  r("Ginger Soy Glazed Cod", "dinner", "eastAsian", "keto", "roast", ["cod fillets", "cauliflower rice", "bok choy", "tamari", "ginger", "lime"]),
  r("Thai Green Tofu Curry", "dinner", "eastAsian", "vegan", "curry", ["firm tofu", "light coconut milk", "green curry paste", "broccoli", "bell pepper", "brown rice"], { gf: true }),
  r("Japanese Beef Broccoli Donburi", "dinner", "eastAsian", "meat", "bowl", ["lean beef strips", "brown rice", "broccoli", "tamari", "ginger", "spring onion"], { gf: true }),
  r("Gochujang Turkey Meatballs", "dinner", "eastAsian", "meat", "bake", ["lean turkey mince", "brown rice", "broccoli", "gochujang", "spring onion", "sesame seeds"]),
  r("Coconut Lemongrass Chicken Soup", "dinner", "eastAsian", "keto", "soup", ["chicken breast", "light coconut milk", "mushrooms", "lemongrass", "bok choy", "lime"]),
  r("Nori Edamame Snack Cups", "snack", "eastAsian", "vegan", "snack", ["edamame", "nori", "cucumber", "sesame seeds", "rice vinegar", "chilli"], { gf: true }),
  r("Sesame Cucumber Rice Paper Rolls", "snack", "eastAsian", "vegan", "wrap", ["rice paper", "cucumber", "carrot", "mint", "tofu", "sesame dipping sauce"], { gf: true }),

  // South Asian: remaining 2 breakfast, 2 lunch, 4 dinner, 1 snack.
  r("Masala Egg Breakfast Wrap", "breakfast", "southAsian", "vegetarian", "wrap", ["whole-wheat roti", "eggs", "spinach", "tomatoes", "red onion", "garam masala"]),
  r("Cardamom Mango Chia Pudding", "breakfast", "southAsian", "vegan", "breakfast", ["chia seeds", "mango", "coconut milk", "cardamom", "pistachios", "lime"], { gf: true }),
  r("Tandoori Chicken Millet Bowl", "lunch", "southAsian", "meat", "bowl", ["chicken breast", "millet", "cucumber", "tomatoes", "yogurt", "tandoori spice"], { gf: true }),
  r("Chana Chaat Crunch Salad", "lunch", "southAsian", "vegan", "salad", ["chickpeas", "cucumber", "tomatoes", "red onion", "mint chutney", "pomegranate"], { gf: true }),
  r("Palak Paneer Brown Rice Bowl", "dinner", "southAsian", "vegetarian", "curry", ["paneer", "spinach", "brown rice", "tomatoes", "onion", "garam masala"], { gf: true }),
  r("Coconut Fish Curry", "dinner", "southAsian", "pescatarian", "curry", ["white fish", "light coconut milk", "tomatoes", "spinach", "curry leaves", "basmati rice"], { gf: true }),
  r("Red Lentil Spinach Dal", "dinner", "southAsian", "vegan", "curry", ["red lentils", "spinach", "tomatoes", "onion", "turmeric", "brown rice"], { gf: true }),
  r("Keto Butter Chicken Cauliflower Rice", "dinner", "southAsian", "keto", "curry", ["chicken breast", "cauliflower rice", "tomatoes", "Greek yogurt", "butter", "garam masala"]),
  r("Roasted Masala Makhana", "snack", "southAsian", "vegetarian", "snack", ["makhana", "ghee", "turmeric", "cumin", "chilli powder", "lime"], { gf: true }),

  // European: 3 breakfast, 3 lunch, 5 dinner, 1 snack.
  r("Spinach Ricotta Breakfast Crepes", "breakfast", "european", "vegetarian", "breakfast", ["whole-grain flour", "eggs", "milk", "ricotta", "spinach", "chives"]),
  r("Apple Cinnamon Buckwheat Porridge", "breakfast", "european", "vegan", "breakfast", ["buckwheat groats", "apple", "oat milk", "cinnamon", "walnuts", "raisins"], { gf: true }),
  r("Smoked Salmon Rye Scramble", "breakfast", "european", "pescatarian", "breakfast", ["eggs", "smoked salmon", "rye bread", "spinach", "dill", "Greek yogurt"]),
  r("French Lentil Goat Cheese Salad", "lunch", "european", "vegetarian", "salad", ["green lentils", "goat cheese", "rocket", "beetroot", "walnuts", "Dijon dressing"], { gf: true }),
  r("Spanish Chicken Gazpacho Bowl", "lunch", "european", "meat", "bowl", ["chicken breast", "tomatoes", "cucumber", "red pepper", "brown rice", "smoked paprika"], { gf: true }),
  r("German Potato Cucumber Salad", "lunch", "european", "vegetarian", "salad", ["baby potatoes", "cucumber", "Greek yogurt", "Dijon mustard", "dill", "spring onion"], { gf: true }),
  r("Herb Roast Chicken Root Vegetables", "dinner", "european", "paleo", "roast", ["chicken thighs", "carrots", "parsnips", "Brussels sprouts", "rosemary", "olive oil"]),
  r("Mushroom Barley Risotto", "dinner", "european", "vegetarian", "skillet", ["pearl barley", "mushrooms", "vegetable stock", "parmesan", "spinach", "thyme"]),
  r("Paprika Turkey Stuffed Peppers", "dinner", "european", "meat", "bake", ["lean turkey mince", "bell peppers", "brown rice", "tomatoes", "paprika", "parsley"], { gf: true }),
  r("Nordic Mustard Salmon with Dill", "dinner", "european", "pescatarian", "roast", ["salmon fillets", "baby potatoes", "green beans", "Dijon mustard", "dill", "lemon"], { gf: true }),
  r("Provençal Beef Zucchini Bake", "dinner", "european", "paleo", "bake", ["lean beef mince", "zucchini", "tomatoes", "eggplant", "herbes de Provence", "olive oil"]),
  r("Baked Parmesan Zucchini Coins", "snack", "european", "ketoVegetarian", "snack", ["zucchini", "parmesan", "almond flour", "egg", "oregano", "tomato dip"]),

  // Latin American & Caribbean: 2 breakfast, 4 lunch, 5 dinner, 1 snack.
  r("Black Bean Egg Breakfast Tacos", "breakfast", "latin", "vegetarian", "tacos", ["corn tortillas", "black beans", "eggs", "avocado", "tomatoes", "coriander"], { gf: true }),
  r("Tropical Quinoa Breakfast Bowl", "breakfast", "latin", "vegan", "breakfast", ["quinoa", "coconut milk", "mango", "pineapple", "chia seeds", "lime"], { gf: true }),
  r("Lime Chicken Burrito Bowl", "lunch", "latin", "meat", "bowl", ["chicken breast", "brown rice", "black beans", "corn", "tomatoes", "lime"], { gf: true }),
  r("Cuban Mojo Tofu Salad", "lunch", "latin", "vegan", "salad", ["firm tofu", "romaine", "black beans", "orange", "red onion", "mojo dressing"], { gf: true }),
  r("Shrimp Mango Ceviche Bowl", "lunch", "latin", "paleo", "bowl", ["cooked prawns", "mango", "cucumber", "avocado", "lime", "coriander"]),
  r("Roasted Corn Avocado Arepa", "lunch", "latin", "vegetarian", "wrap", ["corn arepas", "corn", "avocado", "black beans", "feta", "lime"], { gf: true }),
  r("Turkey Picadillo Sweet Potatoes", "dinner", "latin", "paleo", "skillet", ["lean turkey mince", "sweet potatoes", "tomatoes", "bell pepper", "green olives", "cumin"]),
  r("Chipotle Lentil Enchilada Bake", "dinner", "latin", "vegan", "bake", ["corn tortillas", "green lentils", "black beans", "tomato sauce", "corn", "chipotle"], { gf: true }),
  r("Brazilian Fish Stew", "dinner", "latin", "paleo", "stew", ["white fish", "light coconut milk", "tomatoes", "bell peppers", "lime", "coriander"]),
  r("Salsa Verde Chicken Skillet", "dinner", "latin", "keto", "skillet", ["chicken breast", "salsa verde", "zucchini", "bell pepper", "avocado", "coriander"]),
  r("Mushroom Walnut Tacos", "dinner", "latin", "vegan", "tacos", ["corn tortillas", "mushrooms", "walnuts", "cabbage", "tomatoes", "lime"], { gf: true }),
  r("Cinnamon Cocoa Energy Bites", "snack", "latin", "vegan", "snack", ["rolled oats", "dates", "almond butter", "cocoa", "cinnamon", "chia seeds"], { gf: true }),

  // North American & global: remaining 5 lunch, 4 dinner, 3 snack.
  r("Turkey Avocado Ranch Wrap", "lunch", "global", "meat", "wrap", ["whole-wheat wrap", "turkey breast", "avocado", "romaine", "tomatoes", "yogurt ranch"]),
  r("Maple Dijon Chicken Grain Bowl", "lunch", "global", "meat", "bowl", ["chicken breast", "farro", "roasted carrots", "kale", "maple syrup", "Dijon mustard"]),
  r("Buffalo Chickpea Salad", "lunch", "global", "vegan", "salad", ["chickpeas", "romaine", "celery", "carrot", "avocado", "buffalo sauce"], { gf: true }),
  r("Tuna White Bean Crunch Salad", "lunch", "global", "pescatarian", "salad", ["tuna", "cannellini beans", "cucumber", "celery", "tomatoes", "lemon"], { gf: true }),
  r("Grilled Vegetable Cottage Cheese Bowl", "lunch", "global", "vegetarian", "bowl", ["cottage cheese", "quinoa", "zucchini", "bell pepper", "cherry tomatoes", "pumpkin seeds"], { gf: true }),
  r("Sheet Pan Lemon Herb Chicken", "dinner", "global", "meat", "roast", ["chicken breast", "baby potatoes", "broccoli", "lemon", "garlic", "parsley"], { gf: true }),
  r("Turkey Zucchini Meatloaf", "dinner", "global", "paleo", "bake", ["lean turkey mince", "zucchini", "egg", "tomato paste", "carrots", "almond flour"]),
  r("Black Bean Sweet Potato Chili", "dinner", "global", "vegan", "stew", ["black beans", "sweet potato", "tomatoes", "corn", "bell pepper", "smoked paprika"], { gf: true }),
  r("Keto Garlic Steak Broccoli", "dinner", "global", "keto", "skillet", ["lean steak", "broccoli", "mushrooms", "garlic", "butter", "parsley"], { paleo: true }),
  r("Peanut Butter Apple Oat Bites", "snack", "global", "vegan", "snack", ["rolled oats", "apple", "peanut butter", "dates", "cinnamon", "chia seeds"]),
  r("Greek Yogurt Ranch Veggie Cups", "snack", "global", "vegetarian", "snack", ["Greek yogurt", "carrots", "cucumber", "bell pepper", "dill", "garlic"], { gf: true }),
  r("Dark Chocolate Almond Chia Pots", "snack", "global", "vegan", "snack", ["chia seeds", "almond milk", "cocoa", "dark chocolate", "almonds", "maple syrup"], { gf: true }),
];

function quantityFor(name) {
  const n = name.toLowerCase();
  if (/(chicken|salmon|fish|cod|prawn|shrimp|beef|steak|turkey|tuna|tofu|paneer)/.test(n)) return "300 g";
  if (/(rice|quinoa|millet|couscous|farro|barley|oats|lentils|beans|chickpeas|noodles|soba)/.test(n)) return "1 cup";
  if (/(yogurt|milk|stock|tomato sauce|passata|coconut milk)/.test(n)) return "1 cup";
  if (/(oil|tahini|sauce|dressing|hummus|peanut butter|almond butter|mustard)/.test(n)) return "2 tbsp";
  if (/(spice|paprika|cumin|cinnamon|turmeric|oregano|thyme|rosemary|chilli|sumac)/.test(n)) return "1 tsp";
  if (/(lime|lemon|orange|avocado|banana|apple|mango|eggplant|zucchini|cucumber|pepper|onion|potato)/.test(n)) return "1 medium";
  if (/(egg)/.test(n)) return "2";
  if (/(bread|toast|pita|wrap|roti|tortilla|arepa)/.test(n)) return "2";
  if (/(seeds|nuts|almonds|walnuts|pistachios|feta|parmesan|mozzarella|ricotta)/.test(n)) return "¼ cup";
  return "1 cup";
}

function estimatedKcal(outline, index) {
  if (outline.kcal) return outline.kcal;
  const bases = { breakfast: 360, lunch: 460, dinner: 540, snack: 220 };
  const profileDelta = {
    vegan: -20,
    vegetarian: 0,
    pescatarian: 20,
    meat: 35,
    keto: 60,
    ketoVegetarian: 45,
    paleo: 40,
  };
  return bases[outline.mealType] + profileDelta[outline.profile] + (index % 5) * 10;
}

function macrosFor(kcal, profile) {
  const [proteinShare, carbShare, fatShare] = PROFILES[profile].split;
  return {
    proteinG: Math.round((kcal * proteinShare) / 4),
    carbsG: Math.round((kcal * carbShare) / 4),
    fatG: Math.round((kcal * fatShare) / 9),
  };
}

function tagsFor(outline) {
  const tags = [...PROFILES[outline.profile].tags];
  if (outline.gf && !tags.includes("gluten_free")) tags.push("gluten_free");
  if (outline.med && !tags.includes("mediterranean")) tags.push("mediterranean");
  if (outline.paleo && !tags.includes("paleo")) tags.push("paleo");
  return tags;
}

function ingredientsFor(outline) {
  return outline.core.map((name) => ({ name, quantity: quantityFor(name) }));
}

function stepsFor(outline) {
  const ingredientNames = outline.core;
  const featured = ingredientNames.slice(0, 3).join(", ");
  const rest = ingredientNames.slice(3).join(", ");
  const icon = METHOD_ICONS[outline.method] ?? "restaurant_menu";
  const methodStep = {
    bowl: "Cook the grain or base until tender, then keep it warm.",
    breakfast: "Prepare the breakfast base until creamy, golden or just set.",
    curry: "Stir in the spices and simmer gently until the sauce thickens.",
    salad: "Prepare the fresh ingredients and whisk the dressing separately.",
    soup: "Simmer the aromatics and broth until the vegetables are tender.",
    skillet: "Cook over medium-high heat, stirring until evenly browned.",
    bake: "Transfer to a baking dish and bake until bubbling and golden.",
    roast: "Roast on a lined tray until cooked through and caramelised.",
    wrap: "Warm the wrap or bread until flexible and lightly toasted.",
    tacos: "Warm the tortillas and cook the filling until fragrant.",
    snack: "Combine the ingredients and portion into bite-sized servings.",
    stew: "Simmer slowly until the flavours deepen and the sauce is rich.",
    stirfry: "Stir-fry over high heat so the vegetables stay crisp.",
  }[outline.method];

  return [
    {
      title: "Prepare",
      body: `Measure and prepare ${featured}.`,
      icon: "restaurant_menu",
    },
    {
      title: "Build flavour",
      body: "Warm the pan, add the aromatics and seasoning, and cook until fragrant.",
      icon: "skillet",
    },
    {
      title: "Cook",
      body: methodStep,
      icon,
    },
    {
      title: "Combine",
      body: rest
        ? `Fold in ${rest} and cook just until everything is hot and well coated.`
        : "Combine the cooked components and adjust the consistency as needed.",
      icon: "layers",
    },
    {
      title: "Finish and serve",
      body: "Taste, adjust seasoning, portion evenly and serve while fresh.",
      icon: "room_service",
    },
  ];
}

function difficultyFor(outline) {
  if (outline.difficulty) return outline.difficulty;
  if (["snack", "breakfast", "salad"].includes(outline.method)) return "easy";
  if (["stew", "bake"].includes(outline.method)) return "medium";
  return "medium";
}

function timesFor(outline, index) {
  if (outline.method === "snack") return { prepMins: 10, cookMins: index % 2 ? 0 : 15 };
  if (outline.method === "breakfast") return { prepMins: 8, cookMins: 12 };
  if (outline.method === "salad") return { prepMins: 15, cookMins: 10 };
  if (outline.method === "stew" || outline.method === "curry") return { prepMins: 15, cookMins: 30 };
  if (outline.method === "bake" || outline.method === "roast") return { prepMins: 15, cookMins: 25 };
  return { prepMins: 12, cookMins: 18 };
}

function promptFor(recipe) {
  const ingredients = recipe.ingredients.slice(0, 6).map((i) => i.name).join(", ");
  return [
    "Use case: photorealistic-natural",
    "Asset type: mobile recipe-card and recipe-detail hero image",
    `Primary request: ${recipe.title}, visibly featuring ${ingredients}`,
    "Scene/backdrop: warm organic kitchen table with restrained sage and terracotta accents",
    "Style/medium: photorealistic editorial food photography",
    "Composition/framing: 3:2 landscape, plated dish centred with breathing room, camera at a natural 35-degree dining angle",
    "Lighting/mood: soft natural window light, appetising and calm",
    "Materials/textures: matte ceramic tableware, linen napkin, realistic fresh food texture",
    "Constraints: the food must match the named dish and ingredients; one coherent serving; no people or hands",
    "Avoid: text, typography, logos, branded packaging, watermarks, duplicate plates, malformed food, excessive garnish",
  ].join("\n");
}

const BASE_TS = Date.UTC(2026, 0, 1);
const recipes = outlines.map((outline, index) => {
  const id = `curated-${String(index + 1).padStart(3, "0")}`;
  const kcal = estimatedKcal(outline, index);
  const times = timesFor(outline, index);
  return {
    id,
    title: outline.title,
    description: `${outline.title} made with ${outline.core
      .slice(0, 3)
      .join(", ")} for a practical, nourishing ${outline.mealType}.`,
    imageUrl: `https://firebasestorage.googleapis.com/v0/b/nourish-22776.firebasestorage.app/o/recipes%2F${id}%2Fhero.webp?alt=media`,
    imagePath: `recipes/${id}/hero.webp`,
    source: "curated",
    status: "approved",
    submittedBy: null,
    mealTypes: [outline.mealType],
    cuisine: outline.cuisine,
    dietaryTags: tagsFor(outline),
    difficulty: difficultyFor(outline),
    servings: outline.mealType === "snack" ? 4 : outline.mealType === "breakfast" ? 2 : 4,
    ...times,
    kcal,
    macros: macrosFor(kcal, outline.profile),
    ingredients: ingredientsFor(outline),
    steps: stepsFor(outline),
    spoonacularId: null,
    nutritionDisclaimer: "Estimated per serving; not medical advice.",
    createdAt: BASE_TS + index * 1000,
    updatedAt: BASE_TS + index * 1000,
  };
});

function countBy(values) {
  return values.reduce((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function validate() {
  const errors = [];
  const ids = new Set(recipes.map((recipe) => recipe.id));
  const titles = new Set(recipes.map((recipe) => recipe.title.toLowerCase()));
  if (recipes.length !== 100) errors.push(`Expected 100 recipes, got ${recipes.length}`);
  if (ids.size !== 100) errors.push("Recipe IDs are not unique");
  if (titles.size !== 100) errors.push("Recipe titles are not unique");

  const mealCounts = countBy(recipes.flatMap((recipe) => recipe.mealTypes));
  const expectedMeals = { breakfast: 22, lunch: 28, dinner: 38, snack: 12 };
  for (const [meal, expected] of Object.entries(expectedMeals)) {
    if (mealCounts[meal] !== expected) {
      errors.push(`${meal}: expected ${expected}, got ${mealCounts[meal] ?? 0}`);
    }
  }

  const cuisineCounts = countBy(recipes.map((recipe) => recipe.cuisine));
  const expectedCuisines = {
    [CUISINES.african]: 15,
    [CUISINES.mediterranean]: 18,
    [CUISINES.eastAsian]: 15,
    [CUISINES.southAsian]: 10,
    [CUISINES.european]: 12,
    [CUISINES.latin]: 12,
    [CUISINES.global]: 18,
  };
  for (const [cuisine, expected] of Object.entries(expectedCuisines)) {
    if (cuisineCounts[cuisine] !== expected) {
      errors.push(`${cuisine}: expected ${expected}, got ${cuisineCounts[cuisine] ?? 0}`);
    }
  }

  const tagCounts = countBy(recipes.flatMap((recipe) => recipe.dietaryTags));
  const minimumTags = {
    vegetarian: 36,
    vegan: 20,
    gluten_free: 32,
    keto: 12,
    mediterranean: 16,
    paleo: 10,
  };
  for (const [tag, minimum] of Object.entries(minimumTags)) {
    if ((tagCounts[tag] ?? 0) < minimum) {
      errors.push(`${tag}: expected at least ${minimum}, got ${tagCounts[tag] ?? 0}`);
    }
  }

  for (const recipe of recipes) {
    if (recipe.ingredients.length < 5 || recipe.ingredients.length > 12) {
      errors.push(`${recipe.id}: invalid ingredient count`);
    }
    if (recipe.steps.length < 4 || recipe.steps.length > 8) {
      errors.push(`${recipe.id}: invalid step count`);
    }
    const macroKcal =
      recipe.macros.proteinG * 4 +
      recipe.macros.carbsG * 4 +
      recipe.macros.fatG * 9;
    if (Math.abs(macroKcal - recipe.kcal) > 18) {
      errors.push(`${recipe.id}: macro kcal ${macroKcal} differs from ${recipe.kcal}`);
    }
  }

  if (errors.length) {
    throw new Error(`Catalogue validation failed:\n- ${errors.join("\n- ")}`);
  }
  return { mealCounts, cuisineCounts, tagCounts };
}

const report = validate();
const manifest = recipes.map((recipe) => ({
  recipeId: recipe.id,
  title: recipe.title,
  prompt: promptFor(recipe),
  sourceMaster: `content/recipes/masters/${recipe.id}.png`,
  deliveryFile: `content/recipes/webp/${recipe.id}.webp`,
  storagePath: recipe.imagePath,
  imageUrl: recipe.imageUrl,
  width: 1200,
  height: 800,
  generationStatus: "pending",
  qaStatus: "pending",
}));

await mkdir(dirname(CATALOG_PATH), { recursive: true });
await mkdir(dirname(MANIFEST_PATH), { recursive: true });
await writeFile(CATALOG_PATH, `${JSON.stringify(recipes, null, 2)}\n`, "utf8");
await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ recipes: recipes.length, ...report }, null, 2));
