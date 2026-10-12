// More home dishes from Duhok / Badini and across Iraq, breakfast, sweets,
// street & restaurant food popular in Duhok, and drinks.
// Row: [category, id, English, Arabic, Badini, kcal, protein, carbs, fat (per 100 g), portions "unit:grams", extra search words]
// Dishes that also have a recipe (js/foods/recipes.js) get their numbers from the ingredients instead.

export default [
  // ---------- Badini & Kurdish home dishes ----------
  ['dish', 'girar', 'Girar (bulgur with meat & tomato)', 'برغل باللحم والطماطة', 'گرار', 165, 6.5, 22, 5.8, 'plate:350', 'girar sawar savar سەوار'],
  ['stew', 'mehir', 'Mehîr (yogurt & wheat soup)', 'شوربة لبن بالحنطة', 'مەهیر', 70, 3.2, 9, 2.3, 'bowl:300', 'mehir doxewa dokhawa'],
  ['stew', 'tirshik', 'Tirshik (sour herb stew with meat)', 'ترشك', 'ترشک', 95, 6, 6, 5.2, 'bowl:300', 'tirsik tirshik sour'],
  ['protein', 'qeli', 'Qelî (fried preserved meat / kavurma)', 'قلية', 'قەلی', 300, 22, 1, 23, 'serving:100 tbsp:20', 'qeli kavurma qawarma'],
  ['dish', 'dolma_onion', 'Onion dolma', 'دولمة بصل', 'دۆلمێن پیڤازێ', 150, 4, 20, 6, 'piece:30 plate:350', 'dolma dolme'],
  ['dish', 'dolma_pepper', 'Stuffed peppers', 'دولمة فلفل', 'بیبەرێن تژی', 140, 5, 17, 6, 'piece:120 plate:350', 'dolma mahshi'],
  ['dish', 'dolma_ribs', 'Dolma with lamb ribs', 'دولمة بالضلوع', 'دۆلمە ب پەراسوویان', 190, 7, 18, 10, 'plate:400', 'dolma ribs'],
  ['dish', 'dolma_silq', 'Chard dolma (silq)', 'دولمة سلق', 'دۆلمێن سلقێ', 150, 4, 20, 6, 'piece:30 plate:350', 'silq dolma'],
  ['dish', 'kubba_shalgham', 'Kubba shalgham (turnip & kubba soup)', 'كبة شلغم', 'کوبە ب شێلمی', 90, 5, 10, 3.3, 'bowl:400', 'kubba turnip'],
  ['dish', 'kubba_siniya', 'Baked tray kubba (kubba siniya)', 'كبة صينية', 'کوبەیا سینیێ', 240, 11, 23, 11.5, 'piece:150', 'kubba tray'],
  ['dish', 'maqluba_eggplant', 'Eggplant maqluba', 'مقلوبة باذنجان', 'مەقلوبەیا باجانێن ڕەش', 185, 6, 21, 8.5, 'plate:400', 'maqluba'],
  ['dish', 'quzi_chicken', 'Chicken quzi', 'قوزي دجاج', 'قۆزی ب مریشکێ', 185, 11, 21, 6.3, 'plate:450', 'quzi ghuzi'],
  ['dish', 'biryani_nuts', 'Biryani with nuts & raisins', 'برياني بالمكسرات', 'بریانی ب کەرەزاتان', 210, 8, 26, 8.2, 'plate:400', 'biryani'],
  ['dish', 'chicken_sauce', 'Chicken in tomato sauce', 'دجاج بالصلصة', 'مریشک ب سۆسێ', 150, 15, 5, 8, 'plate:300 piece:150', 'dijaj'],
  ['dish', 'tepsi_chicken', 'Chicken & potato tray', 'صينية دجاج وبطاطا', 'سینیا مریشک و پەتاتا', 145, 10, 10, 7.3, 'plate:400', 'tepsi dijaj'],

  // ---------- More stews & soups ----------
  ['stew', 'okra_chicken', 'Okra stew with chicken', 'بامية بالدجاج', 'بامیە ب مریشکێ', 85, 6.5, 7, 3.6, 'bowl:300', 'bamya marga'],
  ['stew', 'zucchini_stew', 'Zucchini stew (marga shijar)', 'مرقة شجر', 'مەرەقا کولەکێ', 80, 5, 6, 4, 'bowl:300', 'marga shijar'],
  ['stew', 'cauliflower_stew', 'Cauliflower stew', 'مرقة قرنابيط', 'مەرەقا قەرنابیتێ', 85, 5, 7, 4, 'bowl:300', 'marga'],
  ['stew', 'cabbage_stew', 'Cabbage stew', 'مرقة لهانة', 'مەرەقا لەهانێ', 75, 4.5, 7, 3.3, 'bowl:300', 'marga'],
  ['stew', 'lobia', 'Red kidney bean stew (lobia)', 'مرقة لوبيا', 'لۆبیا', 115, 7, 14, 3.5, 'bowl:300', 'lobia fasolia hamra'],
  ['stew', 'chickpea_stew', 'Chickpea stew', 'مرقة حمص', 'مەرەقا نۆکێ', 120, 6.5, 15, 4, 'bowl:300', 'nok'],
  ['stew', 'mixed_veg_stew', 'Mixed vegetable stew', 'مرقة خضار', 'مەرەقا سەوزێ', 75, 4, 8, 3, 'bowl:300', 'marga khudar'],
  ['stew', 'rishta', 'Rishta (noodle & lentil soup)', 'رشتة', 'ڕشتە', 95, 4.5, 15, 2, 'bowl:300', 'rishta'],
  ['stew', 'freekeh_soup', 'Freekeh soup', 'شوربة فريكة', 'شۆربا فریکێ', 75, 4, 10, 2, 'bowl:300', 'freekeh'],

  // ---------- Rice & grains ----------
  ['rice', 'rice_chickpea', 'Rice with chickpeas (birinc u nok)', 'تمن بالحمص', 'برنج و نۆک', 165, 4.5, 29, 3.5, 'plate:300 cup:180', 'timman'],
  ['rice', 'savar_chickpea', 'Bulgur with chickpeas', 'برغل بالحمص', 'سەوار ب نۆکی', 150, 5, 25, 3.3, 'plate:300', 'savar burghul'],

  // ---------- Breads & breakfast ----------
  ['bread', 'kada', 'Kada (Kurdish butter pastry bread)', 'كادة', 'کادە', 400, 8, 52, 17.5, 'piece:100', 'kade'],
  ['bread', 'kulere', 'Kulêre (round sweet bread)', 'كليرة', 'کولێرە', 410, 8, 60, 15.5, 'piece:100', 'kulera kulire'],
  ['bread', 'simit', 'Simit (sesame ring)', 'سميط', 'سیمیت', 350, 11, 58, 8.5, 'piece:100', 'simit'],
  ['bread', 'pide_cheese', 'Pide with cheese', 'بيدا بالجبن', 'پیدە ب پەنیری', 275, 12, 32, 11, 'piece:250 slice:60', 'pide'],
  ['bread', 'pide_meat', 'Pide with minced meat', 'بيدا باللحم', 'پیدە ب گۆشتی', 260, 12, 30, 10.3, 'piece:250 slice:60', 'pide'],
  ['bread', 'gozleme', 'Gözleme (cheese / spinach)', 'كوزلمة', 'گۆزلەمە', 250, 9, 30, 10.5, 'piece:200', 'gozleme'],
  ['bread', 'lavash', 'Lavash wrap bread', 'خبز لواش', 'نانێ لاڤاشێ', 275, 9, 56, 1.5, 'piece:50', 'lavash'],
  ['bread', 'bread_brown', 'Brown bread', 'خبز أسمر', 'نانێ ئەسمەر', 250, 10, 44, 3.5, 'slice:35', 'whole wheat'],
  ['breakfast', 'kahi_set', 'Kahi with geymar & dibis (serving)', 'كاهي وقيمر ودبس', 'کاهی ب قەیماغ و دۆشاوی', 370, 5, 42, 20, 'serving:200', 'kahi geymar'],
  ['breakfast', 'cheese_herb', 'Kurdish herb cheese (penîrê bi giya)', 'جبن كردي بالأعشاب', 'پەنیرێ ب گیای', 270, 17, 2, 22, 'slice:30 tbsp:20', 'penir sirk'],
  ['breakfast', 'cheese_feta', 'Feta cheese', 'جبن فيتا', 'پەنیرێ فێتا', 264, 14, 4, 21, 'slice:30', 'feta'],
  ['breakfast', 'cheese_mozzarella', 'Mozzarella', 'موزاريلا', 'مۆزارێلا', 280, 28, 3, 17, 'slice:30', 'mozzarella'],
  ['breakfast', 'cream_cheese', 'Cream cheese', 'جبن كريمي', 'پەنیرێ کرێمی', 342, 6, 5, 34, 'tbsp:20', 'philadelphia'],
  ['breakfast', 'dibis_tahini', 'Dibis with tahini (rashi)', 'دبس وراشي', 'دۆشاو و ڕاشی', 430, 8, 48, 24, 'tbsp:20', 'dibis rashi dims'],
  ['breakfast', 'foul', 'Foul (mashed fava with oil)', 'فول مدمس', 'فوول', 130, 7, 15, 4.5, 'bowl:250', 'foul medames'],
  ['breakfast', 'eggs_qeli', 'Eggs with qelî', 'بيض بالقلية', 'هێک ب قەلی', 230, 15, 1, 18.5, 'plate:200', 'qeli eggs'],

  // ---------- Sweets ----------
  ['sweet', 'burma', 'Burma (pistachio pastry rolls)', 'بورما', 'بورمە', 520, 9, 50, 31, 'piece:40', 'burma'],
  ['sweet', 'baklawa_pistachio', 'Baklawa with pistachio', 'بقلاوة فستق', 'بەقلاوەیا فستقی', 450, 7, 48, 25.5, 'piece:30', 'baklava'],
  ['sweet', 'maamoul', 'Ma\'amoul with dates', 'معمول تمر', 'مەعموول', 430, 6, 60, 18, 'piece:35', 'maamoul'],
  ['sweet', 'halawa_flour', 'Home-made flour halawa', 'حلاوة طحين', 'حەلاوا ئاردی', 430, 5, 60, 19, 'serving:80', 'halawa'],
  ['sweet', 'halawa_carrot', 'Carrot halawa', 'حلاوة جزر', 'حەلاوا گێزەری', 280, 3, 45, 10, 'serving:100', 'halawa jizar'],
  ['sweet', 'sohan', 'Sohan (saffron brittle)', 'سوهان', 'سۆهان', 500, 6, 55, 28.5, 'piece:20', 'sohan'],
  ['sweet', 'dates_walnut', 'Dates stuffed with walnut', 'تمر بالجوز', 'قەسپ ب گوێزی', 340, 4, 62, 10, 'piece:12', 'tamr'],
  ['sweet', 'kunafa_cheese', 'Kunafa with cheese', 'كنافة نابلسية', 'کونافا ب پەنیری', 330, 8, 38, 16.5, 'piece:120', 'knafeh'],
  ['sweet', 'cream_caramel', 'Crème caramel', 'كريم كراميل', 'کرێم کەرامێل', 140, 4, 22, 4, 'cup:120', 'caramel'],

  // ---------- Street & restaurant food ----------
  ['fast', 'kebab_plate', 'Kebab plate (2 skewers, bread, grilled veg)', 'صحن كباب', 'قاپا کەبابی', 220, 12, 18, 11.3, 'plate:450', 'kabab'],
  ['fast', 'kebab_wrap', 'Kebab wrap (lavash, Duhok style)', 'لفة كباب لواش', 'لاڤاشا کەبابی', 265, 13, 24, 13, 'sandwich:250', 'kabab lafa'],
  ['fast', 'tawook_wrap', 'Chicken tawook wrap', 'لفة تاووق', 'لاڤاشا تاووقی', 215, 14, 22, 8, 'sandwich:250', 'tawook'],
  ['fast', 'liver_sandwich', 'Liver sandwich', 'لفة معلاك', 'ساندویچا جگەری', 220, 13, 24, 8, 'sandwich:200', 'meelaq kebda'],
  ['fast', 'doner_sandwich', 'Döner sandwich (beef)', 'دونر لحم', 'دۆنەر', 245, 13, 23, 11, 'sandwich:250', 'doner'],
  ['fast', 'iskender', 'Iskender kebab', 'إسكندر كباب', 'ئیسکەندەر', 190, 11, 12, 11, 'plate:400', 'iskender'],
  ['fast', 'kumpir', 'Kumpir (loaded baked potato)', 'كومبير', 'کومپیر', 165, 4.5, 18, 8.5, 'piece:450', 'kumpir'],
  ['fast', 'corn_cup', 'Corn cup with butter', 'ذرة بالكوب', 'گەنمەشامی د کوپ دا', 130, 3.5, 20, 4.5, 'cup:200', 'thura'],
  ['fast', 'falafel_plate', 'Falafel plate (with hummus & salad)', 'صحن فلافل', 'قاپا فەلافلێ', 210, 7, 20, 11.5, 'plate:350', 'falafel'],
  ['fast', 'fries_cheese', 'Loaded fries with cheese', 'بطاطا بالجبن', 'پەتاتێن سورکری ب پەنیری', 300, 7, 30, 17, 'serving:250', 'fries'],
  ['fast', 'chicken_meal', 'Fried chicken meal (2 pieces + fries)', 'وجبة بروستد', 'ژەما مریشکا سورکری', 270, 14, 22, 14, 'serving:450', 'broasted kfc'],
  ['fast', 'pasta_chicken', 'Creamy chicken pasta (restaurant)', 'باستا دجاج بالكريمة', 'پاستا ب مریشک و کرێمێ', 175, 9, 18, 7.3, 'plate:400', 'pasta alfredo'],
  ['fast', 'crispy_strips', 'Crispy chicken strips', 'ستربس', 'ستریپس', 260, 17, 15, 14.5, 'piece:40', 'strips'],

  // ---------- Drinks (per 100 ml) ----------
  ['drink', 'sahlab', 'Sahlab (hot milk drink)', 'سحلب', 'سەحلەب', 95, 3, 15, 2.5, 'cup:250', 'sahlab'],
  ['drink', 'milk_tea', 'Tea with milk & sugar', 'چاي بالحليب', 'چایێ ب شیری', 55, 1.5, 9, 1.5, 'cup:200 teaGlass:100', 'chai haleeb'],
  ['drink', 'tamarind', 'Tamarind drink', 'تمر هندي', 'تەمرهندی', 55, 0, 14, 0, 'glass:250', 'tamr hindi'],
  ['drink', 'qamar_din', 'Qamar al-din (apricot drink)', 'قمر الدين', 'قەمەرەدین', 60, 0.3, 15, 0, 'glass:250', 'apricot'],
  ['drink', 'mastaw', 'Mastaw (salted yogurt drink, homemade)', 'شنينة بيتية', 'ماستاو', 45, 2.3, 3.5, 2.4, 'glass:300', 'do ayran shnina'],
  ['drink', 'fruit_cocktail', 'Fresh fruit cocktail juice', 'عصير كوكتيل', 'کۆکتێلا مێوێ', 70, 1, 15, 0.8, 'glass:350', 'cocktail'],
];
