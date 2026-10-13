// Service worker: keeps a copy of the app on the phone so it opens offline.
// Bump CACHE whenever any file changes so phones pick up the new version.

const CACHE = 'mycalories-v13';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './js/app.js',
  './js/core/ai.js',
  './js/core/barcode.js',
  './js/core/calc.js',
  './js/core/dates.js',
  './js/core/persist.js',
  './js/core/photoData.js',
  './js/core/planner.js',
  './js/core/quickEntry.js',
  './js/core/recipes.js',
  './js/core/search.js',
  './js/core/store.js',
  './js/foods/basics.js',
  './js/foods/breakfast.js',
  './js/foods/dishes.js',
  './js/foods/duhok.js',
  './js/foods/emoji.js',
  './js/foods/index.js',
  './js/foods/market.js',
  './js/foods/mealTemplates.js',
  './js/foods/recipes.js',
  './js/foods/sweets-drinks.js',
  './js/i18n/strings.js',
  './js/services/ai.js',
  './js/services/aiError.js',
  './js/services/gemini.js',
  './js/services/groq.js',
  './js/services/image.js',
  './js/services/openFoodFacts.js',
  './js/services/photos.js',
  './js/sheets/addFood.js',
  './js/sheets/barcodeScanner.js',
  './js/sheets/customFood.js',
  './js/sheets/foodDetail.js',
  './js/sheets/foodPhoto.js',
  './js/sheets/onlineSearch.js',
  './js/sheets/overrideEditor.js',
  './js/sheets/photoFood.js',
  './js/sheets/quickEntry.js',
  './js/sheets/recipeEditor.js',
  './js/sheets/savedMeals.js',
  './js/ui/camera.js',
  './js/ui/charts.js',
  './js/ui/controls.js',
  './js/ui/dom.js',
  './js/ui/foodThumb.js',
  './js/ui/icons.js',
  './js/ui/labels.js',
  './js/ui/sheet.js',
  './js/views/aiSettings.js',
  './js/views/backup.js',
  './js/views/goalSettings.js',
  './js/views/installCard.js',
  './js/views/month.js',
  './js/views/onboarding.js',
  './js/views/plan.js',
  './js/views/profileForm.js',
  './js/views/settings.js',
  './js/views/stats.js',
  './js/views/today.js',
  './js/views/week.js',
  './js/views/weight.js',
  './vendor/zxing.min.js',
];

const NETWORK_TIMEOUT_MS = 3000;

// cache: 'reload' skips the browser's HTTP cache, so a new version never mixes with old files.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function fromCache(request) {
  return caches.match(request, { ignoreSearch: true })
    .then((hit) => hit ?? (request.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
}

// Network first (so updates arrive when online), revalidating past the HTTP cache.
// On a slow or missing connection, fall back to the saved copy after a few seconds.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  const network = fetch(request, { cache: 'no-cache' }).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy));
    }
    return response;
  });
  const timeout = new Promise((resolve) => { setTimeout(resolve, NETWORK_TIMEOUT_MS); })
    .then(() => caches.match(request, { ignoreSearch: true }))
    .then((hit) => hit ?? network);
  event.respondWith(Promise.race([network, timeout]).catch(() => fromCache(request)));
});
