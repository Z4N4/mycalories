// A picture for every food: Apple's colour food emoji, picked by food id
// (first matching rule wins), then by category. The user's own photo, when
// added, replaces it everywhere.

const RULES = [
  // drinks first (so "tea_sugar" is tea, not sugar)
  [/^water$/, '💧'], [/milk_tea|^tea/, '🍵'], [/coffee|latte/, '☕'], [/redbull|monster|power_horse|sting|hype|energy/, '⚡'],
  [/cola|pepsi|mirinda|fanta|dew|soda|uludag|barbican/, '🥤'],
  [/juice|rani|cappy|sunquick|zbeeb|tamarind|qamar|cocktail|lipton|lemon_mint/, '🧃'],
  [/choc_milk|^milk|banana_milk|sahlab|hot_chocolate/, '🥛'], [/yogurt|laban|ayran|mastaw|jajeek/, '🥛'],
  // dishes before their ingredients
  [/soup|shorba|rishta|dokhawa|mehir|hamuth|shalgham/, '🥣'],
  [/stew|bamya|okra_chicken|qeema|fasolia|lobia|tirshik|tashreeb|pacha|shakriya|chicken_sauce|kofta_sauce/, '🍲'],
  [/biryani|quzi|maqluba|timman|rice|pilau|mutabbaq|zarda/, '🍚'], [/savar|girar|bulgur|harissa|freekeh/, '🌾'],
  [/dolma|yaprakh|mumbar/, '🫑'], [/kubba|kutilk|falafel/, '🧆'],
  [/hummus|foul|lablabi|chickpeas|white_beans|fava|bagilla|lentils|^peas$/, '🫘'],
  [/spaghetti|pasta|makarona|indomie/, '🍝'], [/kebab_wrap|tawook|shawarma|doner|wrap/, '🌯'], [/sandwich/, '🥪'],
  [/kebab|tikka|shifta|liver|iskender|qeli/, '🍢'], [/chicken|broasted|nuggets|strips|tepsi/, '🍗'],
  [/fish|masgouf|tuna|shrimp/, '🐟'], [/lamb|beef|mince|basturma|sujuk|mortadella/, '🥩'],
  [/pizza|manakish|lahm_ajeen|pide|fatayer|gozleme/, '🍕'], [/burger/, '🍔'], [/hot_dog/, '🌭'], [/fries/, '🍟'],
  [/sambusa|burek/, '🥟'], [/salad|fattoush|tabbouleh/, '🥗'], [/kumpir|potato/, '🥔'],
  [/eggplant|baytinjan|mutabbal|sheikh_mahshi/, '🍆'],
  // breakfast & dairy
  [/egg|omelette|makhlama/, '🥚'], [/cheese|labneh|kalleh/, '🧀'], [/geymar|^cream$|butter|ghee/, '🧈'],
  [/honey|dibis|jam|syrup|banada|nutella|tahini/, '🍯'], [/croissant/, '🥐'], [/simit|kaak/, '🥯'],
  [/samoon|khubz|nan_|bread|toast|pita|lavash|kada|kulere|kahi/, '🫓'], [/oats|cornflakes/, '🥣'], [/olive_oil|veg_oil|olives/, '🫒'],
  // sweets & snacks
  [/ice_cream|magnum|cornetto/, '🍦'], [/cake|browni|popkek|dankek|delice|basbousa|kunafa|qatayef/, '🍰'],
  [/chocolate|snickers|twix|mars|bounty|kitkat|galaxy|kinder|toblerone|ferrero|dido|albeni|halley|wafer|gofret/, '🍫'],
  [/biscuit|biskrem|oreo|lotus|tutku|eti_cin|eti_puf|hanimeller|burcak|minoo|maamoul|kleicha|crax/, '🍪'],
  [/haribo|lokum|mann_|mms|sohan|^sugar/, '🍬'], [/baklawa|burma|zalabia|donut|halawa|simsimiya/, '🥮'],
  [/pudding|muhallabi|caramel/, '🍮'], [/chips|lays|pringles|doritos|cheetos|pofak|mazmaz|patos|chipsy|popcorn|pretzel/, '🥔'],
  [/watermelon_seeds|sunflower|pumpkin_seeds/, '🌻'], [/almond|walnut|pistachio|cashew|peanut|nuts/, '🥜'],
  // fruits & vegetables
  [/^apple$/, '🍎'], [/banana/, '🍌'], [/^orange$|mandarin/, '🍊'], [/grape_leaves/, '🍃'], [/grape/, '🍇'],
  [/watermelon/, '🍉'], [/^melon/, '🍈'], [/peach|apricot|plum/, '🍑'], [/pear/, '🍐'], [/cherry|mulberry/, '🍒'],
  [/strawberr/, '🍓'], [/kiwi/, '🥝'], [/mango/, '🥭'], [/pineapple/, '🍍'], [/lemon/, '🍋'], [/pomegranate/, '🍎'],
  [/raisin|fig|dates/, '🫐'], [/tomato_paste|mayo|ketchup|amba|torshi|flour/, '🥫'], [/tomato/, '🍅'],
  [/cucumber/, '🥒'], [/carrot/, '🥕'], [/onion/, '🧅'], [/garlic|toum/, '🧄'], [/pepper/, '🫑'], [/^corn/, '🌽'],
  [/mushroom/, '🍄'], [/lettuce|cabbage|spinach|herbs|green_beans|okra|cauliflower|zucchini|turnip|beetroot/, '🥬'],
];

const BY_CATEGORY = {
  dish: '🍽️', stew: '🍲', rice: '🍚', grill: '🍢', bread: '🫓', breakfast: '🍳', dairy: '🥛', fast: '🍔',
  market: '🛒', sweet: '🍰', snack: '🥜', drink: '🥤', fruit: '🍎', veg: '🥬', protein: '🥩', extra: '🫙', custom: '🍽️',
};

/** @param {{id: string, cat: string}} food */
export function foodEmoji(food) {
  const rule = RULES.find(([re]) => re.test(food.id));
  return rule ? rule[1] : (BY_CATEGORY[food.cat] ?? '🍽️');
}
