// Breads, breakfast, dairy and eggs.
// Row: [category, id, English, Arabic, Badini, kcal, protein, carbs, fat (per 100 g), portions "unit:grams", extra search words]

export default [
  // ---------- Breads ----------
  ['bread', 'samoon', 'Samoon', 'صمون', 'سەموون', 270, 9, 54, 1.5, 'piece:80', 'samun bread nan'],
  ['bread', 'khubz_tannour', 'Tannour bread (Iraqi flatbread)', 'خبز تنور', 'نانێ تەنووری', 270, 9, 55, 1.2, 'piece:120', 'khubz nan tenure tanoor bread نانێ تەنوورێ'],
  ['bread', 'nan_saj', 'Saj bread (thin Kurdish bread)', 'خبز صاج', 'نانێ ساجێ', 280, 9, 57, 1.5, 'piece:60', 'lavash nan tiri nane tiri selik bread نانێ تیری سێلک'],
  ['bread', 'pita', 'Arabic pita bread', 'خبز عربي', 'نانێ عەرەبی', 275, 9, 55, 1.2, 'piece:70', 'khubz bread'],
  ['bread', 'toast', 'Toast bread', 'خبز توست', 'نانێ تۆست', 265, 9, 49, 3.2, 'slice:28', 'bread'],
  ['bread', 'kaak', 'Iraqi sesame kaak', 'كعك', 'کەعک', 420, 10, 66, 13, 'piece:25', 'kahk biscuit'],
  ['bread', 'manakish', 'Manakish zaatar', 'مناقيش زعتر', 'مەناقیش', 310, 7, 40, 14, 'piece:120', 'zaatar'],
  ['bread', 'fatayer', 'Cheese fatayer', 'فطائر جبن', 'فەتایەر ب پەنیری', 290, 10, 33, 13, 'piece:80', 'pastry'],
  ['bread', 'croissant', 'Croissant', 'كرواسون', 'کرواسۆن', 406, 8, 46, 21, 'piece:60', 'kruasan'],

  // ---------- Breakfast ----------
  ['breakfast', 'kahi', 'Kahi (layered pastry)', 'كاهي', 'کاهی', 380, 6, 45, 20, 'piece:120', 'kahi geymar'],
  ['breakfast', 'geymar', 'Geymar (clotted cream)', 'قيمر', 'قەیماغ', 380, 2.5, 3, 40, 'tbsp:20 serving:50', 'gaimar qaimar qeymer'],
  ['breakfast', 'dibis', 'Date syrup (dibis)', 'دبس', 'دۆشاو', 290, 1.5, 72, 0.2, 'tbsp:20 tsp:7', 'dibs dims dates syrup دمس دیمس'],
  ['breakfast', 'tahini', 'Tahini (rashi)', 'راشي / طحينة', 'ڕاشی', 595, 17, 21, 54, 'tbsp:15', 'tahina rashi'],
  ['breakfast', 'honey', 'Honey', 'عسل', 'هنگڤین', 304, 0.3, 82, 0, 'tbsp:21 tsp:7', 'asal'],
  ['breakfast', 'jam', 'Jam', 'مربى', 'مرەبا', 250, 0.4, 62, 0.1, 'tbsp:20 tsp:7', 'murabba'],
  ['breakfast', 'egg_boiled', 'Boiled egg', 'بيض مسلوق', 'هێکا کەلاندی', 155, 13, 1.1, 11, 'piece:50', 'egg beyd hek'],
  ['breakfast', 'egg_fried', 'Fried egg', 'بيض مقلي', 'هێکا سورکری', 196, 13.6, 0.8, 15, 'piece:46', 'egg beyd hek'],
  ['breakfast', 'omelette', 'Omelette', 'عجة / أومليت', 'ئۆملێت', 155, 11, 1.5, 12, 'serving:120', 'egg eggs ujja'],
  ['breakfast', 'egg_tomato', 'Eggs with tomato', 'طماطة وبيض', 'هێک و باجانێن سۆر', 120, 7, 4, 8.5, 'plate:250', 'shakshuka'],
  ['breakfast', 'cheese_white', 'White cheese (Kurdish/Arabic)', 'جبن أبيض', 'پەنیرێ سپی', 265, 17, 2, 21, 'slice:30 tbsp:20', 'jibin penir'],
  ['breakfast', 'cheese_halloumi', 'Halloumi / akkawi cheese', 'جبن حلوم', 'پەنیرێ حەلوم', 320, 22, 2, 25, 'slice:30', 'jibin'],
  ['breakfast', 'cheese_triangle', 'Cheese triangle (spread)', 'جبن مثلثات', 'پەنیرێ سێگۆشە', 240, 11, 6, 19, 'piece:17', 'kiri la vache qui rit'],
  ['breakfast', 'cheese_yellow', 'Yellow cheese (cheddar)', 'جبن أصفر', 'پەنیرێ زەر', 400, 25, 1.3, 33, 'slice:20', 'jibin'],
  ['breakfast', 'labneh', 'Labneh', 'لبنة', 'لەبنە', 175, 6, 4, 15, 'tbsp:30', 'labna'],
  ['breakfast', 'olives', 'Olives', 'زيتون', 'زەیتوون', 115, 0.8, 6, 11, 'piece:4 handful:40', 'zaytun'],
  ['breakfast', 'butter', 'Butter', 'زبدة', 'نیڤشک', 717, 0.9, 0.1, 81, 'tbsp:14 tsp:5', 'zibda'],
  ['breakfast', 'cornflakes', 'Cornflakes (dry)', 'كورن فليكس', 'کۆرن فلێکس', 357, 7.5, 84, 0.4, 'bowl:30 cup:28', 'cereal'],
  ['breakfast', 'oats', 'Oats (dry)', 'شوفان', 'شۆفان', 380, 13, 67, 7, 'cup:80 tbsp:10', 'oatmeal'],
  ['breakfast', 'sujuk', 'Sujuk (spicy sausage)', 'سجق', 'سجوق', 330, 18, 2, 28, 'piece:30 slice:10', 'sausage'],
  ['breakfast', 'basturma', 'Basturma', 'بسطرمة', 'بەستورمە', 250, 30, 1, 14, 'slice:10', 'pastirma'],
  ['breakfast', 'mortadella', 'Mortadella / luncheon meat', 'مرتديلا', 'مۆرتەدێلا', 310, 15, 3, 26, 'slice:20', 'luncheon'],

  // ---------- Dairy ----------
  ['dairy', 'yogurt', 'Yogurt (full fat)', 'لبن رائب', 'ماست', 62, 3.5, 4.7, 3.3, 'bowl:200 cup:245 tbsp:15', 'mast laban zabadi'],
  ['dairy', 'yogurt_low', 'Yogurt (low fat)', 'لبن قليل الدسم', 'ماستێ کێم چەوری', 50, 4, 5.5, 1.3, 'bowl:200 cup:245', 'mast laban'],
  ['dairy', 'milk', 'Milk (full fat)', 'حليب', 'شیر', 62, 3.2, 4.8, 3.3, 'glass:250 cup:240', 'haleeb shir'],
  ['dairy', 'milk_low', 'Milk (low fat)', 'حليب قليل الدسم', 'شیرێ کێم چەوری', 46, 3.4, 5, 1.5, 'glass:250 cup:240', 'haleeb shir'],
  ['dairy', 'cream', 'Cream (qishta)', 'قشطة', 'قەشتە', 300, 2.5, 3, 31, 'tbsp:15', 'qishta cream'],
];
