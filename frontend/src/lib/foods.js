// Built-in food list: typical home portions of everyday South Indian (and common Indian) foods,
// so meals can be logged without any AI. Values are approximate (IFCT/NIN-style averages);
// numbers are per portion: kcal, protein, carbs, fat in grams.
// Tags drive the skin & hair tips: protein, vitC, omega3, iron, biotin, zinc, vitE, betaCarotene,
// plus fried and sugary for gentle warnings. "aka" holds other names people search for.

const make = (cat) => (id, name, portion, cal, p, c, f, tags = "", aka = "") => ({
  id, cat, name, portion, cal, p, c, f,
  tags: tags ? tags.split(" ") : [],
  aka: aka ? aka.split(",").map((s) => s.trim()) : [],
});

const tiffin = make("tiffin");
const rice = make("rice");
const curries = make("curries");
const meat = make("protein");
const dairy = make("dairy");
const nuts = make("nuts");
const fruit = make("fruits");
const drink = make("drinks");
const snack = make("snacks");
const extra = make("extras");

export const FOODS = [
  tiffin("idli", "Idli", "1 piece (40 g)", 58, 2, 12, 0.4, "", "idly"),
  tiffin("dosa", "Plain dosa", "1 medium", 125, 3, 19, 4, "", "dosai, dosa"),
  tiffin("masala-dosa", "Masala dosa", "1 medium", 270, 5, 38, 11, "", "masala dosai"),
  tiffin("ghee-roast", "Ghee roast dosa", "1", 220, 3, 22, 13, "", "ghee dosa, roast"),
  tiffin("ragi-dosa", "Ragi dosa", "1 medium", 115, 3, 19, 3, "iron", "kezhvaragu dosai"),
  tiffin("rava-dosa", "Rava dosa", "1", 170, 3, 24, 7, "", "rava dosai"),
  tiffin("pesarattu", "Pesarattu (moong dosa)", "1", 140, 7, 18, 4, "iron", "green gram dosa, moong dosa"),
  tiffin("adai", "Adai (lentil dosa)", "1", 180, 7, 25, 6, "iron", "adai dosai"),
  tiffin("uttapam", "Onion uttapam", "1", 180, 4, 28, 6, "", "uthappam, oothappam"),
  tiffin("appam", "Appam", "1", 120, 2, 22, 2.5, "", "aappam, palappam"),
  tiffin("idiyappam", "Idiyappam", "1 piece", 60, 1, 13, 0.3, "", "string hopper, sevai"),
  tiffin("puttu", "Puttu", "1 cup", 210, 4, 40, 4, "", "pittu"),
  tiffin("pongal", "Ven pongal", "1 cup", 280, 7, 38, 11, "", "khara pongal, pongal"),
  tiffin("upma", "Rava upma", "1 cup", 240, 5, 34, 9, "", "uppuma, uppma"),
  tiffin("poha", "Poha", "1 cup", 230, 4, 38, 7, "", "aval, avalakki"),
  tiffin("medu-vada", "Medu vada", "1 piece", 140, 4, 13, 8, "fried", "uzhunthu vadai, vadai, vada"),
  tiffin("paruppu-vadai", "Paruppu vadai", "1 piece", 115, 4, 11, 6, "fried", "masala vadai, dal vada"),
  tiffin("paniyaram", "Kuzhi paniyaram", "3 pieces", 140, 3, 21, 5, "", "paddu, appe"),
  tiffin("chapati", "Chapati", "1 medium", 110, 3.5, 20, 2, "", "chapathi, roti, chappathi"),
  tiffin("phulka", "Phulka (no oil)", "1", 80, 3, 16, 0.5, "", "roti"),
  tiffin("parotta", "Parotta", "1 piece", 290, 6, 40, 12, "", "porotta, barotta, paratha"),
  tiffin("kothu-parotta", "Kothu parotta", "1 plate", 490, 14, 60, 22, "", "kothu"),
  tiffin("poori", "Poori", "1", 110, 2, 12, 6, "fried", "puri"),
  tiffin("oats", "Oats porridge", "1 bowl (40 g oats)", 155, 5.5, 27, 3, "", "oatmeal"),
  tiffin("bread", "Bread", "1 slice", 75, 2.5, 14, 1, "", "toast, white bread"),
  tiffin("brown-bread", "Brown bread", "1 slice", 70, 3, 12, 1, "", "wheat bread"),

  rice("rice", "White rice", "1 cup cooked", 195, 4, 43, 0.5, "", "rice, sadam, saadam, choru"),
  rice("brown-rice", "Brown rice", "1 cup cooked", 168, 3.5, 35, 1.3, "", "red rice, matta rice"),
  rice("curd-rice", "Curd rice", "1 cup", 230, 7, 36, 6, "", "thayir sadam, thayir saadam, mosaranna"),
  rice("lemon-rice", "Lemon rice", "1 cup", 280, 5, 45, 9, "", "elumichai sadam, chitranna"),
  rice("tamarind-rice", "Tamarind rice", "1 cup", 300, 5, 48, 10, "", "puliyodharai, puli sadam, puliyogare"),
  rice("sambar-rice", "Sambar rice", "1 cup", 270, 8, 46, 6, "", "sambar sadam, bisi bele bath"),
  rice("veg-biryani", "Veg biryani", "1 cup", 295, 6, 45, 10, "", "biriyani, veg pulao"),
  rice("chicken-biryani", "Chicken biryani", "1 cup", 330, 17, 40, 11, "", "biriyani, kozhi biryani"),
  rice("mutton-biryani", "Mutton biryani", "1 cup", 360, 16, 40, 15, "", "biriyani"),
  rice("fried-rice", "Veg fried rice", "1 cup", 260, 5, 40, 9, "", "fried rice"),
  rice("ragi-kali", "Ragi kali / mudde", "1 ball (150 g)", 175, 4, 38, 1, "iron", "ragi ball, kezhvaragu kali, ragi mudde"),
  rice("kambu-koozh", "Kambu koozh", "1 glass", 150, 4, 30, 2, "iron", "bajra, pearl millet, koozh"),
  rice("millet-rice", "Millet rice", "1 cup cooked", 160, 4, 33, 1.5, "iron", "thinai, samai, varagu, kodo, foxtail millet"),

  curries("sambar", "Sambar", "1 cup", 125, 6, 16, 4, "", "sambhar"),
  curries("kuzhambu", "Kara / vatha kuzhambu", "1 cup", 150, 3, 14, 9, "", "kuzhambu, puli kuzhambu, vathal kuzhambu"),
  curries("rasam", "Rasam", "1 cup", 55, 2, 7, 2, "", "saaru"),
  curries("dal", "Dal (toor)", "1 cup", 180, 10, 26, 4, "iron", "paruppu, dhal, toor dal, pappu"),
  curries("moong-dal", "Moong dal", "1 cup", 160, 10, 22, 3, "", "pasi paruppu"),
  curries("rajma", "Rajma curry", "1 cup", 210, 10, 30, 6, "iron", "kidney beans"),
  curries("chana-masala", "Chana masala", "1 cup", 250, 11, 34, 8, "iron zinc", "chole, chickpea curry, kondakadalai"),
  curries("kootu", "Kootu", "1 cup", 150, 6, 15, 7, "", "koottu"),
  curries("poriyal", "Vegetable poriyal", "1 cup", 115, 3, 10, 7, "", "thoran, palya, stir fry, beans poriyal, cabbage poriyal"),
  curries("keerai", "Keerai (greens) poriyal", "1 cup", 85, 4, 6, 5, "iron", "keerai masiyal, spinach, palak, murungai keerai, greens"),
  curries("avial", "Avial", "1 cup", 170, 3, 12, 12, "", "aviyal"),
  curries("kurma", "Vegetable kurma", "1 cup", 180, 4, 14, 12, "", "korma, saagu"),
  curries("coconut-chutney", "Coconut chutney", "2 tbsp", 70, 1, 3, 6, "", "thengai chutney, chutney"),
  curries("tomato-chutney", "Tomato / onion chutney", "2 tbsp", 40, 0.5, 4, 2.5, "", "kara chutney, thakkali chutney, onion chutney"),
  curries("podi", "Idli podi with oil", "1 tbsp", 75, 2, 5, 5, "", "gunpowder, milagai podi"),
  curries("paneer-butter-masala", "Paneer butter masala", "1 cup", 375, 14, 12, 30, "", "paneer curry"),
  curries("palak-paneer", "Palak paneer", "1 cup", 270, 13, 10, 20, "iron", "saag paneer"),
  curries("salad", "Vegetable salad", "1 cup", 40, 1.5, 8, 0.3, "vitC betaCarotene", "salad, cucumber, carrot"),
  curries("sprouts", "Sprouts salad", "1 cup", 120, 8, 20, 1, "vitC iron", "sprouted moong, mulaikattiya payaru"),

  meat("egg", "Boiled egg", "1 egg", 78, 6.3, 0.6, 5.3, "biotin", "muttai, mutta, egg"),
  meat("egg-white", "Egg white", "1 egg", 17, 3.6, 0.2, 0.1, "", "egg whites"),
  meat("omelette", "Omelette", "2 eggs", 195, 13, 2, 15, "biotin", "omlet, egg dosa"),
  meat("egg-curry", "Egg curry", "2 eggs with gravy", 280, 14, 8, 21, "biotin", "muttai kuzhambu, egg masala"),
  meat("egg-bhurji", "Egg bhurji", "2 eggs", 210, 13, 4, 16, "biotin", "scrambled eggs, muttai podimas, egg podimas"),
  meat("chicken-curry", "Chicken curry", "1 cup", 285, 25, 7, 17, "zinc", "kozhi kuzhambu, chicken kulambu, chicken gravy, chettinad chicken"),
  meat("grilled-chicken", "Grilled / tandoori chicken", "150 g", 250, 38, 3, 9, "zinc", "tandoori, chicken tikka"),
  meat("chicken-breast", "Chicken breast (cooked)", "100 g", 165, 31, 0, 3.6, "", "boiled chicken"),
  meat("chicken-fry", "Chicken 65 / fry", "100 g", 275, 20, 10, 17, "fried", "chicken 65, chicken fry, chilli chicken"),
  meat("chicken-liver", "Chicken liver fry", "100 g", 165, 20, 3, 8, "iron biotin", "liver"),
  meat("fish-curry", "Fish curry", "1 cup", 200, 20, 5, 11, "omega3", "meen kuzhambu, meen curry, fish kulambu"),
  meat("fish-fry", "Fish fry (ayala / seer)", "1 piece (100 g)", 230, 20, 4, 15, "omega3", "meen varuval, mackerel, ayala, vanjaram, seer fish"),
  meat("sardine", "Sardine (mathi) fry", "100 g", 220, 22, 3, 13, "omega3", "mathi, chaala"),
  meat("prawn", "Prawn masala", "1 cup", 220, 22, 8, 11, "zinc", "eral, shrimp, prawns, chemmeen"),
  meat("mutton-curry", "Mutton curry", "1 cup", 350, 25, 6, 25, "iron zinc", "aattu kari, mutton kuzhambu, goat curry"),

  dairy("curd", "Curd", "1 cup (200 g)", 125, 7, 9, 6.5, "", "thayir, yogurt, dahi, mosaru"),
  dairy("milk", "Milk (toned)", "1 glass (250 ml)", 145, 8, 12, 7.5, "", "paal, turmeric milk"),
  dairy("paneer", "Paneer", "100 g", 265, 18, 3, 20, "", "cottage cheese"),
  dairy("paneer-bhurji", "Paneer bhurji", "1 cup", 295, 18, 6, 22, "", "paneer scramble"),
  dairy("whey", "Whey protein", "1 scoop (30 g)", 120, 24, 3, 1.5, "", "protein shake, protein powder"),
  dairy("soya", "Soya chunks (cooked)", "50 g dry", 172, 26, 16, 0.3, "iron", "meal maker, soya"),
  dairy("tofu", "Tofu", "100 g", 80, 8, 2, 4.8, "", "soy paneer"),
  dairy("chana-sundal", "Chana sundal", "1 cup", 200, 10, 30, 4, "iron zinc", "kondakadalai sundal, chickpea sundal, sundal"),
  dairy("moong-sundal", "Green gram sundal", "1 cup", 185, 12, 28, 3, "iron", "pachai payaru sundal, moong sundal"),

  nuts("peanuts", "Peanuts", "30 g (a handful)", 170, 7.5, 5, 14, "vitE biotin", "groundnuts, verkadalai, kadalai"),
  nuts("almonds", "Almonds", "10 pieces", 70, 2.5, 2.5, 6, "vitE biotin", "badam"),
  nuts("walnuts", "Walnuts", "4 halves", 65, 1.5, 1.4, 6.5, "omega3 vitE", "akhrot"),
  nuts("roasted-chana", "Roasted chana", "30 g", 110, 6.5, 18, 1.5, "zinc", "pottukadalai, roasted gram, fried gram"),
  nuts("pumpkin-seeds", "Pumpkin seeds", "1 tbsp (10 g)", 57, 3, 1, 5, "zinc", "seeds"),
  nuts("flaxseed", "Flaxseed", "1 tbsp (10 g)", 55, 2, 3, 4, "omega3", "alsi, flax"),
  nuts("peanut-butter", "Peanut butter", "1 tbsp", 95, 4, 3, 8, "vitE", "pb"),

  fruit("banana", "Banana", "1 medium", 105, 1.3, 27, 0.4, "", "vazhaipazham, pazham, kela"),
  fruit("apple", "Apple", "1 medium", 95, 0.5, 25, 0.3, "", "seb"),
  fruit("guava", "Guava", "1 medium", 68, 2.5, 14, 1, "vitC", "koyya, koyyapazham, peru"),
  fruit("orange", "Orange", "1", 62, 1.2, 15, 0.2, "vitC", "sathukudi, mosambi, sweet lime"),
  fruit("papaya", "Papaya", "1 cup", 55, 0.7, 14, 0.4, "vitC betaCarotene", "pappali"),
  fruit("amla", "Amla", "1", 15, 0.3, 3, 0.2, "vitC", "nellikai, gooseberry"),
  fruit("watermelon", "Watermelon", "1 cup", 46, 0.9, 11.5, 0.2, "", "tharpoosani"),
  fruit("mango", "Mango", "1 cup", 100, 1.4, 25, 0.6, "vitC betaCarotene", "maambazham"),
  fruit("pomegranate", "Pomegranate", "½ cup seeds", 72, 1.5, 16, 1, "vitC", "maadhulai"),
  fruit("dates", "Dates", "3 small (25 g)", 70, 0.6, 18, 0.1, "iron", "perichampazham, pericham pazham, kharjur"),

  drink("tea", "Tea with milk & sugar", "1 cup", 70, 2, 10, 2.5, "", "chai"),
  drink("coffee", "Filter coffee", "1 tumbler", 90, 3, 12, 3, "", "kaapi, coffee"),
  drink("black-coffee", "Black coffee / green tea", "1 cup", 3, 0.3, 0.5, 0, "", "green tea, black tea, americano"),
  drink("buttermilk", "Buttermilk", "1 glass", 35, 2, 3, 1.5, "", "mor, neer mor, chaas, majjige"),
  drink("coconut-water", "Tender coconut water", "1 coconut", 45, 0.5, 9, 0.5, "", "ilaneer, elaneer, coconut water"),
  drink("ragi-malt", "Ragi malt", "1 glass", 180, 6, 30, 4, "iron", "ragi java, ragi porridge, ragi koozh"),
  drink("lime-juice", "Lime juice with sugar", "1 glass", 80, 0, 20, 0, "vitC sugary", "nimbu pani, lemon juice, lemonade"),
  drink("fruit-juice", "Fruit juice", "1 glass", 115, 1, 28, 0.3, "sugary", "juice, orange juice"),
  drink("soft-drink", "Soft drink", "1 can (330 ml)", 140, 0, 35, 0, "sugary", "coke, pepsi, cola, soda"),

  snack("murukku", "Murukku", "2 pieces (30 g)", 160, 3, 18, 9, "fried", "chakli, thenkuzhal"),
  snack("bajji", "Bajji / pakoda", "1 piece", 95, 1.5, 9, 6, "fried", "bhajji, pakora, pakoda, onion pakoda, vazhakkai bajji"),
  snack("samosa", "Samosa", "1", 260, 4, 30, 14, "fried", "samsa"),
  snack("bonda", "Bonda", "1", 130, 2, 15, 7, "fried", "aloo bonda, mysore bonda"),
  snack("puff", "Veg puff", "1", 250, 4, 25, 15, "", "puffs, egg puff"),
  snack("biscuits", "Biscuits (Marie)", "2 pieces", 55, 1, 9, 1.5, "", "biscuit, marie"),
  snack("payasam", "Payasam / kheer", "1 cup", 260, 6, 40, 9, "sugary", "kheer, paayasam"),
  snack("sweet-pongal", "Sakkarai pongal", "1 cup", 350, 6, 55, 12, "sugary", "sweet pongal, chakkara pongal"),
  snack("laddu", "Laddu", "1", 180, 3, 22, 9, "sugary", "ladoo, boondi laddu"),
  snack("gulab-jamun", "Gulab jamun", "1", 150, 2, 25, 6, "sugary", "jamun"),
  snack("mysore-pak", "Mysore pak", "1 piece", 175, 2, 15, 12, "sugary", "mysorepak"),
  snack("chocolate", "Chocolate", "1 small bar (25 g)", 135, 2, 14, 7.5, "sugary", "dairy milk"),
  snack("ice-cream", "Ice cream", "1 scoop", 135, 2, 16, 7, "sugary", "icecream"),

  extra("ghee", "Ghee", "1 tsp", 45, 0, 0, 5, "", "nei"),
  extra("oil", "Oil", "1 tsp", 40, 0, 0, 4.5, "", "ennai, coconut oil, gingelly oil"),
  extra("butter", "Butter", "1 tsp", 36, 0, 0, 4, "", "vennai"),
  extra("sugar", "Sugar / jaggery", "1 tsp", 16, 0, 4, 0, "", "jaggery, vellam, sakkarai"),
  extra("honey", "Honey", "1 tsp", 21, 0, 6, 0, "", "then"),
  extra("pickle", "Pickle", "1 tsp", 20, 0.1, 0.5, 2, "", "oorugai, achar"),
  extra("appalam", "Appalam (fried)", "1", 65, 2, 5, 4, "fried", "pappadam, papad"),
];

export const CATEGORIES = [
  ["tiffin", "Tiffin"],
  ["rice", "Rice & millets"],
  ["curries", "Curries & sides"],
  ["protein", "Eggs, meat & fish"],
  ["dairy", "Dairy & protein"],
  ["nuts", "Nuts & seeds"],
  ["fruits", "Fruits"],
  ["drinks", "Drinks"],
  ["snacks", "Snacks & sweets"],
  ["extras", "Oil, ghee & extras"],
];

const BY_ID = Object.fromEntries(FOODS.map((f) => [f.id, f]));
const BY_NAME = Object.fromEntries(FOODS.map((f) => [f.name.toLowerCase(), f]));

export const findFood = (id) => BY_ID[id];
// A saved meal item points to its food by id; older or edited items are matched by name
export const foodForItem = (item) => (item.foodId && BY_ID[item.foodId]) || BY_NAME[String(item.name).toLowerCase()];

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const SEARCH = FOODS.map((f) => [f, [f.name, ...f.aka].map(norm)]);

// Best matches first: exact name, then name start, then a word start, then anywhere
export function searchFoods(query) {
  const q = norm(query);
  if (!q) return [];
  const score = (names) => Math.max(...names.map((s) =>
    s === q ? 4 : s.startsWith(q) ? 3 : s.split(" ").some((w) => w.startsWith(q)) ? 2 : s.includes(q) ? 1 : 0));
  return SEARCH
    .map(([f, names]) => [score(names), f])
    .filter(([s]) => s > 0)
    .sort((a, b) => b[0] - a[0] || a[1].name.localeCompare(b[1].name))
    .slice(0, 30)
    .map(([, f]) => f);
}

// Cups, bowls, glasses and weights go up in halves; pieces go up one at a time
export const stepFor = (food) => (/^(1 cup|1 bowl|1 glass|1 plate|½ cup|1 tbsp|\d+ g|\d+ ml)/.test(food.portion) ? 0.5 : 1);

export function fmtQty(q) {
  const whole = Math.floor(q);
  return q - whole >= 0.5 ? `${whole || ""}½` : String(whole);
}

// A meal item for `qty` portions of a food
export function scaleFood(food, qty) {
  const r = (n) => Math.round(n * qty * 10) / 10;
  return {
    foodId: food.id,
    qty,
    name: food.name,
    portion: qty === 1 ? food.portion : `${fmtQty(qty)} × ${food.portion}`,
    calories: Math.round(food.cal * qty),
    protein: r(food.p),
    carbs: r(food.c),
    fat: r(food.f),
  };
}

export const summarize = (items) =>
  items.map((it) => (it.qty && it.qty !== 1 ? `${it.name} ×${fmtQty(it.qty)}` : it.name)).join(", ");

const TIPS = {
  vitC: "Vitamin C here helps your skin make collagen for a brighter glow.",
  omega3: "Omega-3 from this meal keeps skin supple and less dry.",
  iron: "Iron from greens, dals and millets helps prevent hair fall.",
  biotin: "Eggs and nuts give biotin, which supports strong hair.",
  zinc: "Zinc in this meal helps keep acne and oiliness in check.",
  vitE: "Vitamin E from nuts protects your skin from sun damage.",
  betaCarotene: "Beta-carotene (papaya, mango, carrot) gives an even, healthy skin tone.",
};

// Up to two skin & hair tips for a meal, worked out from its foods
export function mealTips(items) {
  const tags = new Set(items.flatMap((it) => foodForItem(it)?.tags || []));
  const protein = items.reduce((s, it) => s + (Number(it.protein) || 0), 0);
  const calories = items.reduce((s, it) => s + (Number(it.calories) || 0), 0);
  const tips = [];
  if (calories >= 250 && protein < 12) tips.push("This meal is low in protein. Add an egg, curd, paneer or sundal to support skin and hair.");
  Object.keys(TIPS).forEach((t) => tags.has(t) && tips.push(TIPS[t]));
  if (protein >= 20) tips.push("Good protein. Hair is made of keratin, so steady protein through the day helps it grow.");
  if (tags.has("fried")) tips.push("Fried food now and then is fine; often, it can trigger breakouts. Balance it with salad or fruit.");
  if (tags.has("sugary")) tips.push("Sweet things spike blood sugar, which can dull skin. Have them after a protein-rich meal, or less often.");
  return tips.slice(0, 2);
}
