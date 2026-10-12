# MyCalories

A calorie tracker for **Iraqi and Kurdish food**, in **Kurdish Badini**, **Arabic** and **English**.
It runs as a web app that you add to your iPhone Home Screen. Once installed, it opens full screen with its own icon and works offline.

## Features

- **391 foods**: dolma (5 kinds), yaprakh, kubba (Halab, Mosul, burghul, kutilk, siniya, hamuth, shalgham), biryani, quzi, tashreeb, pacha, maqluba, every marga stew, timman, savar, girar, tirshik, mehîr, qelî, kada, kulêre, kebab/tikka/shifta, Duhok street food (kebab wraps, döner, iskender, kumpir, pide, gözleme), sweets (kleicha, baklawa, burma, sohan, ma'amoul), drinks, fruits, vegetables
- **Market products** (76): Turkish (Ülker, Eti, Torku), Iranian (Maz Maz, Pofak, Minoo, Kalleh), international (Lay's, Pringles, Red Bull, Monster, Snickers, Kinder, Nutella…) and local products
- **Food templates**: about 110 dishes are built from ingredients (rice, meat, oil, bread, sauces…). Open a dish → *View & edit ingredients* to change each one, so *your* shawarma has *your* calories
- **Meal planner**: a full day of meals that fits your calorie goal (simple or traditional food), with *Swap* and *Add to diary*
- **Local portions**: plate, half plate, piece, samoon, istikan, skewer, sandwich, cup, tablespoon… or exact **grams**
- **Search in any language**: `dolma`, `دولمة` and `دۆلمە` all find the same dish
- **Daily goal**: calculated from sex, age, height, weight, activity and goal (lose / keep / gain), or your own number
- **Protein / carbs / fat** for every food and every day
- **Meals**: breakfast, lunch, dinner, snacks, with **copy from yesterday** and **Undo**
- **Stats**: week view (Saturday → Friday): bar chart, weekly total vs weekly goal, daily average
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
- **Pictures for every food** (colour food icons), and you can add your own photo to any food; scanned products get their package photo
- **Move your data** from Safari to the Home Screen app (Copy my data → Restore my data), and the app reopens where you left it
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
