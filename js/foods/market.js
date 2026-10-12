// Packaged products sold in Duhok markets: Turkish, Iranian, international and local.
// Values are typical label values per 100 g (or 100 ml for drinks). Recipes and
// sizes change between countries and years, so scanning the barcode gives the exact
// numbers when the product is in the Open Food Facts database.
// Row: [category, id, English, Arabic, Badini, kcal, protein, carbs, fat, portions "unit:grams", extra search words]

export default [
  // ---------- Chips & salty snacks ----------
  ['market', 'lays_classic', 'Lay\'s Classic chips', 'ليز كلاسيك', 'لەیز کلاسیک', 536, 6.5, 53, 34, 'bag:40 handful:20', 'lays chips chipsy لیز لایز'],
  ['market', 'lays_flavor', 'Lay\'s flavoured (cheese, ketchup, chili)', 'ليز بنكهات', 'لەیز ب تامان', 525, 6.5, 53, 32.5, 'bag:40 handful:20', 'lays chips'],
  ['market', 'pringles', 'Pringles Original', 'برينغلز', 'پرینگلز', 530, 4.5, 52, 34, 'can:165 handful:30', 'pringles chips'],
  ['market', 'doritos', 'Doritos Nacho Cheese', 'دوريتوس', 'دۆریتۆس', 500, 7, 58, 26, 'bag:45 handful:28', 'doritos'],
  ['market', 'cheetos', 'Cheetos', 'شيتوس', 'چیتۆس', 545, 6, 55, 33, 'bag:30', 'cheetos'],
  ['market', 'cheetoz_pofak', 'Cheetoz / Pofak puffs (Iranian)', 'پفك شيتوز', 'پوفەک', 530, 7, 57, 30, 'bag:40', 'pofak cheetoz پفک'],
  ['market', 'mazmaz_chips', 'Maz Maz chips (Iranian)', 'چبس مزمز', 'چیپسێ مەزمەز', 540, 6, 52, 34.5, 'bag:50', 'mazmaz chips'],
  ['market', 'patos', 'Ülker Patos corn chips', 'باتوس', 'پاتۆس', 495, 6, 62, 25, 'bag:40', 'patos ulker'],
  ['market', 'chipsy', 'Chipsy chips', 'شيبسي', 'چیپسی', 530, 6, 52, 33, 'bag:30', 'chipsy'],
  ['market', 'pretzel_sticks', 'Salted sticks / pretzels', 'مملحات أصابع', 'چوکلێن خوێکری', 410, 10, 72, 8.5, 'bag:40 handful:20', 'kraker cubuk'],
  ['market', 'crax', 'Eti Crax crackers', 'إيتي كراكس', 'ئێتی کراکس', 470, 9, 62, 20, 'handful:30 bag:80', 'eti crax crackers'],
  ['market', 'indomie', 'Indomie instant noodles (1 pack)', 'اندومي', 'ئیندۆمی', 470, 9, 62, 20, 'piece:80', 'indomie noodles'],

  // ---------- Energy drinks & soft drinks (per 100 ml) ----------
  ['market', 'redbull', 'Red Bull', 'ريد بول', 'ڕێد بوڵ', 45, 0, 11, 0, 'can:250', 'redbull energy ریدبول ردبول ريدبول'],
  ['market', 'redbull_sf', 'Red Bull Sugarfree', 'ريد بول بدون سكر', 'ڕێد بوڵ بێ شەکر', 3, 0, 0.6, 0, 'can:250', 'redbull energy zero'],
  ['market', 'monster', 'Monster Energy', 'مونستر', 'مۆنستەر', 47, 0, 11.5, 0, 'can:500', 'monster energy مونستەر مونستر'],
  ['market', 'monster_zero', 'Monster Ultra (zero sugar)', 'مونستر ألترا', 'مۆنستەر ئولترا', 2, 0, 0.6, 0, 'can:500', 'monster energy zero'],
  ['market', 'power_horse', 'Power Horse', 'باور هورس', 'پاوەر هۆرس', 46, 0, 11, 0, 'can:250', 'powerhorse energy پاورهورس باورهورس'],
  ['market', 'sting', 'Sting Energy', 'ستينج', 'ستینگ', 48, 0, 12, 0, 'can:250 bottle:500', 'sting energy'],
  ['market', 'hype', 'Hype Energy', 'هايب', 'هایپ', 47, 0, 11.5, 0, 'can:250', 'hype energy'],
  ['market', 'pepsi', 'Pepsi', 'بيبسي', 'پێپسی', 43, 0, 11, 0, 'can:330 bottle:500 glass:250', 'pepsi cola'],
  ['market', 'mirinda', 'Mirinda Orange', 'ميرندا', 'میریندا', 46, 0, 11.5, 0, 'can:330 bottle:500', 'mirinda orange soda'],
  ['market', 'fanta', 'Fanta Orange', 'فانتا', 'فانتا', 45, 0, 11, 0, 'can:330', 'fanta soda'],
  ['market', 'mountain_dew', 'Mountain Dew', 'ماونتن ديو', 'ماونتن دیو', 48, 0, 12, 0, 'can:330', 'dew soda'],
  ['market', 'uludag', 'Uludağ Gazoz (lemon soda)', 'أولوداغ', 'ئولوداغ', 40, 0, 10, 0, 'bottle:250', 'gazoz uludag'],
  ['market', 'zamzam_cola', 'Zamzam Cola (Iranian)', 'زمزم كولا', 'زەمزەم کۆلا', 42, 0, 10.5, 0, 'can:330', 'zamzam'],
  ['market', 'barbican', 'Barbican malt drink', 'باربيكان', 'باربیکان', 40, 0.3, 9.5, 0, 'can:330', 'barbican malt'],
  ['market', 'lipton_ice', 'Lipton Ice Tea', 'ليبتون آيس تي', 'لیپتۆن ئایس تی', 28, 0, 7, 0, 'can:330 bottle:450', 'ice tea'],
  ['market', 'rani', 'Rani Float juice', 'عصير راني', 'ڕانی', 55, 0.2, 13.5, 0, 'can:240', 'rani juice'],
  ['market', 'cappy', 'Cappy juice', 'كابي', 'کاپی', 46, 0.2, 11, 0, 'bottle:330 glass:250', 'cappy juice'],
  ['market', 'sunquick', 'Sunquick (prepared)', 'سن كويك', 'سەنکوویک', 40, 0, 10, 0, 'glass:250', 'sunquick'],
  ['market', 'ayran_bottle', 'Bottled ayran (Sütaş / Pınar)', 'لبن عيران معبأ', 'ئایرانا بۆتل', 36, 1.7, 2.6, 2, 'bottle:250', 'ayran sutas pinar do'],
  ['market', 'choc_milk', 'Chocolate milk (Pınar / Kalleh)', 'حليب بالكاكاو', 'شیرێ کاکاو', 75, 3, 11, 2, 'bottle:200', 'kalleh pinar'],

  // ---------- Cakes, biscuits & chocolate: Turkish ----------
  ['market', 'halley', 'Ülker Halley', 'هالي', 'هالەی', 430, 4.5, 68, 15.5, 'piece:26', 'ulker halley'],
  ['market', 'eti_browni', 'Eti Browni Intense', 'إيتي براوني', 'ئێتی براونی', 450, 5.5, 52, 24.5, 'piece:45', 'eti browni brownie'],
  ['market', 'eti_popkek', 'Eti Popkek', 'إيتي بوبكيك', 'ئێتی پۆپکێک', 420, 5, 52, 21, 'piece:60', 'eti popkek cake'],
  ['market', 'dankek', 'Ülker Dankek cake', 'دانكيك', 'دانکێک', 410, 5, 55, 18.8, 'piece:50', 'ulker dankek cake'],
  ['market', 'biskrem', 'Ülker Biskrem', 'بسكريم', 'بیسکرێم', 490, 6, 66, 22, 'piece:10 bag:100', 'ulker biskrem'],
  ['market', 'albeni', 'Ülker Albeni', 'ألبيني', 'ئالبێنی', 480, 5, 62, 23.5, 'piece:40', 'ulker albeni'],
  ['market', 'gofret', 'Ülker chocolate wafer (Gofret)', 'ويفر أولكر', 'وێفەرێ ئولکەر', 525, 6, 62, 28, 'piece:36', 'ulker gofret wafer'],
  ['market', 'dido', 'Ülker Dido', 'ديدو', 'دیدۆ', 535, 6, 58, 31, 'piece:35', 'ulker dido'],
  ['market', 'eti_tutku', 'Eti Tutku biscuits', 'إيتي توتكو', 'ئێتی تووتکو', 470, 6, 66, 20, 'piece:8', 'eti tutku'],
  ['market', 'eti_cin', 'Eti Cin', 'إيتي جين', 'ئێتی جن', 490, 5, 65, 23.5, 'piece:15', 'eti cin'],
  ['market', 'eti_puf', 'Eti Puf', 'إيتي بوف', 'ئێتی پوف', 410, 4, 70, 13, 'piece:18', 'eti puf'],
  ['market', 'hanimeller', 'Ülker Hanımeller cookies', 'هانيملر', 'هانمەلەر', 510, 6, 60, 27.5, 'piece:10', 'ulker hanimeller'],
  ['market', 'burcak', 'Eti Burçak (digestive)', 'إيتي بورجاك', 'ئێتی بورچاک', 470, 8, 64, 20, 'piece:9', 'eti burcak digestive'],
  ['market', 'banada', 'Torku Banada (cocoa hazelnut spread)', 'باندا', 'باندا', 545, 6, 57, 32.5, 'tbsp:15', 'torku banada'],

  // ---------- Iranian ----------
  ['market', 'minoo_cream', 'Minoo cocoa cream biscuits', 'بسكويت مينو', 'مینوو', 480, 6, 66, 21, 'piece:10', 'minoo biscuit'],
  ['market', 'shirin_asal_cake', 'Shirin Asal cake', 'كيك شيرين عسل', 'کێکا شیرین عەسەل', 420, 5, 55, 20, 'piece:40', 'shirin asal cake'],
  ['market', 'kalleh_cheese', 'Kalleh cream cheese', 'جبن كاله', 'پەنیرێ کالە', 260, 10, 4, 23, 'tbsp:20', 'kalleh cheese'],

  // ---------- International ----------
  ['market', 'snickers', 'Snickers', 'سنيكرز', 'سنیکەرز', 488, 8.6, 60, 24, 'piece:50', 'snickers'],
  ['market', 'twix', 'Twix', 'تويكس', 'تویکس', 495, 4.7, 64, 24, 'piece:50', 'twix'],
  ['market', 'mars', 'Mars', 'مارس', 'مارس', 449, 4, 70, 17, 'piece:51', 'mars'],
  ['market', 'bounty', 'Bounty', 'باونتي', 'باونتی', 487, 3.7, 59, 26, 'piece:57', 'bounty'],
  ['market', 'kitkat', 'KitKat (4 fingers)', 'كيت كات', 'کیتکات', 518, 7, 59, 27, 'piece:41.5', 'kitkat'],
  ['market', 'galaxy', 'Galaxy chocolate', 'جالكسي', 'گالاکسی', 544, 6.6, 57, 32, 'piece:40', 'galaxy dove'],
  ['market', 'kinder_bueno', 'Kinder Bueno (2 bars)', 'كيندر بوينو', 'کیندەر بوینۆ', 572, 8.6, 50, 37, 'piece:43', 'kinder bueno'],
  ['market', 'kinder_bar', 'Kinder Chocolate bar', 'كيندر شوكولاتة', 'کیندەر شۆکۆلاتە', 566, 8.7, 54, 35, 'piece:12.5', 'kinder'],
  ['market', 'kinder_delice', 'Kinder Delice', 'كيندر ديليس', 'کیندەر دێلیس', 452, 6, 52, 24, 'piece:39', 'kinder delice cake'],
  ['market', 'nutella', 'Nutella', 'نوتيلا', 'نووتێلا', 539, 6.3, 57.5, 31, 'tbsp:15 tsp:5', 'nutella'],
  ['market', 'oreo', 'Oreo', 'أوريو', 'ئۆریۆ', 480, 5, 69, 20, 'piece:11', 'oreo'],
  ['market', 'lotus', 'Lotus Biscoff', 'لوتس', 'لۆتس', 484, 4.9, 72, 19, 'piece:7.8', 'lotus biscoff'],
  ['market', 'haribo', 'Haribo gummies', 'هاريبو', 'هاریبۆ', 343, 6.9, 77, 0.5, 'handful:25 bag:100', 'haribo gummy'],
  ['market', 'mms_peanut', 'M&M\'s Peanut', 'إم آند إمز', 'ئێم ئێند ئێمز', 512, 9.6, 57, 26, 'bag:45', 'mms'],
  ['market', 'toblerone', 'Toblerone', 'توبليرون', 'تۆبلێرۆن', 535, 5.4, 60, 29, 'slice:10 piece:35', 'toblerone'],
  ['market', 'ferrero', 'Ferrero Rocher', 'فيريرو روشيه', 'فێرێرۆ ڕۆشێ', 603, 8.2, 44, 43, 'piece:12.5', 'ferrero'],
  ['market', 'magnum', 'Magnum ice cream (classic)', 'ماغنوم', 'ماگنەم', 305, 3.5, 28, 20, 'piece:79', 'magnum ice cream'],
  ['market', 'cornetto', 'Cornetto ice cream', 'كورنيتو', 'کۆرنێتۆ', 285, 4, 35, 14, 'piece:75', 'cornetto ice cream'],
  ['market', 'croissant_pack', 'Packaged croissant (7Days / Eti)', 'كرواسون معبأ', 'کرواسۆنا پاکەت', 420, 6, 48, 22.5, 'piece:60', '7days croissant'],
  ['market', 'cake_roll', 'Packaged Swiss roll', 'كيك رول', 'کێکا لولکری', 390, 5, 58, 15.5, 'piece:40', 'swiss roll cake'],

  // ---------- Local (Kurdistan / Iraq) ----------
  ['market', 'local_yogurt', 'Local yogurt (tub, full fat)', 'لبن محلي', 'ماستێ ناڤخۆیی', 65, 3.5, 4.5, 3.6, 'cup:200 bowl:250', 'mast laban'],
  ['market', 'local_cheese', 'Local white cheese (pack)', 'جبن أبيض محلي', 'پەنیرێ سپی یێ ناڤخۆیی', 260, 16, 2, 21, 'slice:30', 'penir jibin'],
  ['market', 'local_juice', 'Local boxed juice', 'عصير علبة محلي', 'ئاڤا مێوێ یا ناڤخۆیی', 50, 0.1, 12.5, 0, 'can:200', 'juice'],
  ['market', 'local_cola', 'Local cola / soda', 'مشروب غازي محلي', 'کۆلا یا ناڤخۆیی', 42, 0, 10.5, 0, 'can:330 bottle:500', 'soda'],
  ['market', 'local_cake', 'Local packaged cake', 'كيك محلي معبأ', 'کێکا ناڤخۆیی', 400, 5, 55, 18, 'piece:50', 'cake keik'],
  ['market', 'local_biscuit', 'Local tea biscuits (pack)', 'بسكت محلي', 'پسکیتێ ناڤخۆیی', 450, 7, 70, 16, 'piece:8 bag:100', 'biscuit'],
  ['market', 'local_ice_cream', 'Local ice cream cone', 'موطة محلية', 'دۆندرمەیا ناڤخۆیی', 220, 3.5, 28, 10.5, 'piece:80', 'mota'],
  ['market', 'local_chips', 'Local chips (small bag)', 'چبس محلي', 'چیپسێ ناڤخۆیی', 530, 6, 53, 33, 'bag:25', 'chips'],
];
