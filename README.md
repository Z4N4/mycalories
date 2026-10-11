# MyCalories

A calorie tracker for **Iraqi and Kurdish food**, in **Kurdish Badini**, **Arabic** and **English**.
It runs as a web app that you add to your iPhone Home Screen. Once installed, it opens full screen with its own icon and works offline.

## Features

- **232 foods**: dolma, yaprakh, kubba (Halab, Mosul, burghul, kutilk), biryani, quzi, tashreeb, pacha, maqluba, all the marga stews, timman, savar, kebab/tikka/shifta, samoon, kahi & geymar, kleicha, baklawa, chai, laban, shawarma, falafel, fruits, vegetables and more
- **Local portions**: plate, half plate, piece, samoon, istikan, skewer, sandwich, cup, tablespoon… or exact **grams**
- **Search in any language**: `dolma`, `دولمة` and `دۆلمە` all find the same dish
- **Daily goal**: calculated from sex, age, height, weight, activity and goal (lose / keep / gain), or your own number
- **Protein / carbs / fat** for every food and every day
- **Meals**: breakfast, lunch, dinner, snacks, with **copy from yesterday** and **Undo**
- **Week view** (Saturday → Friday): bar chart, weekly total vs weekly goal, daily average
- **Month view**: calendar with every day colored green (within goal) or orange (over)
- **Weight tracking** with a chart
- **Barcode scanning**: live camera, typed number, or a photo of the barcode. Products come from the free
  [Open Food Facts](https://world.openfoodfacts.org) database; unknown products are entered once from the label
  and remembered (works offline after that)
- **Calories from a photo**: Google Gemini (free tier) recognizes the dishes, matches them to the food list and
  estimates the grams. You check the amounts before anything is added. Needs a free key from
  [aistudio.google.com/apikey](https://aistudio.google.com/apikey), entered in Settings and stored only on the phone
- **Favorites, recent foods, and your own foods**; you can also change the numbers of any built-in dish
- **Private**: everything stays on your phone. **Backup / restore** as a file from Settings
- Light and dark mode follow the iPhone setting

## Install on iPhone

1. Open the app link in **Safari** (it has to be Safari).
2. Tap the **Share** button (square with an arrow ⬆️).
3. Scroll down and tap **Add to Home Screen**, then **Add**.
4. Open **MyCalories** from your Home Screen.

> Keep the Home Screen version. Data saved there stays on the phone; Safari may clear data for
> websites you only open in a tab. Export a backup from **Settings → Backup** now and then.

## Calorie values

Values are per-100 g averages for home-style cooking, checked so that calories match
protein × 4 + carbs × 4 + fat × 9. Home dishes vary with the oil and meat used, so treat them as
estimates. If your family's recipe differs, open the food and tap **Change this food's numbers**.
This app is not medical advice.

## For developers

No build step: plain HTML, CSS and JavaScript modules.

```bash
npm test               # unit tests (node --test)
npm run coverage       # with coverage
npm run serve          # http://localhost:5173
```

| Folder | What's inside |
|---|---|
| `js/core/` | Pure logic: dates (Saturday weeks), calorie math, search, state changes, storage |
| `js/foods/` | Food database (one row per food, 3 languages) |
| `js/i18n/` | All text in Badini, Arabic, English |
| `js/views/`, `js/sheets/` | Screens and bottom sheets |
| `js/ui/` | DOM helper, icons, charts, sheets, form controls |
| `js/services/` | Network: Open Food Facts lookup, Gemini photo analysis, photo resizing |
| `vendor/` | [@zxing/library](https://github.com/zxing-js/library) 0.23 barcode decoder (Apache-2.0), loaded on demand |
| `tools/` | Local server and icon generator |

When you change any file, bump `CACHE` in `sw.js` so installed phones download the new version.
