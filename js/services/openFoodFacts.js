// Product lookup in Open Food Facts (free, open database of packaged foods).

import { productFromOff, productsFromSearch } from '../core/barcode.js';

const API = 'https://world.openfoodfacts.org/api/v2/product/';
const FIELDS = 'image_front_url,image_front_small_url,product_name,product_name_ar,product_name_en,product_name_ku,generic_name,brands,nutriments,serving_size,serving_quantity';
const TIMEOUT_MS = 10000;

const IMAGE_HOST = 'images.openfoodfacts.org';

/** Only https images from the Open Food Facts image server are used. */
export function safeImageUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.host === IMAGE_HOST ? u.href : null;
  } catch {
    return null;
  }
}

/** Downloads a product's package photo; null if unavailable. */
export async function fetchProductImage(url) {
  const safe = safeImageUrl(url);
  if (!safe) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(safe, { signal: controller.signal });
    const blob = res.ok ? await res.blob() : null;
    return blob && blob.type.startsWith('image/') ? blob : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @returns {Promise<{status: 'found', food: object, imageUrl?: string} | {status: 'notFound'} | {status: 'offline'}>}
 */
export async function lookupBarcode(code, lang) {
  if (!navigator.onLine) return { status: 'offline' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API}${encodeURIComponent(code)}.json?fields=${FIELDS}`, { signal: controller.signal });
    if (res.status === 404) return { status: 'notFound' };
    if (!res.ok) return { status: 'offline' };
    const json = await res.json();
    const food = productFromOff(json, code, lang);
    const imageUrl = json?.product?.image_front_url || json?.product?.image_front_small_url;
    return food ? { status: 'found', food, imageUrl } : { status: 'notFound' };
  } catch {
    return { status: 'offline' };
  } finally {
    clearTimeout(timer);
  }
}

const SEARCH_API = 'https://world.openfoodfacts.org/cgi/search.pl';
const SEARCH_FIELDS = 'code,product_name,product_name_ar,product_name_en,product_name_ku,generic_name,brands,nutriments,serving_size,serving_quantity';

/**
 * Text search across ~3 million packaged products (drinks, snacks, sweets…).
 * @returns {Promise<{status: 'ok', foods: object[]} | {status: 'offline'|'busy'}>}
 */
export async function searchProducts(query, lang) {
  if (!navigator.onLine) return { status: 'offline' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const params = new URLSearchParams({
    search_terms: query.slice(0, 80), search_simple: '1', action: 'process', json: '1', page_size: '24', fields: SEARCH_FIELDS,
  });
  try {
    const res = await fetch(`${SEARCH_API}?${params}`, { signal: controller.signal });
    // The free database limits searches per minute: that's "busy", not "no internet".
    if (res.status === 429 || res.status === 503) return { status: 'busy' };
    if (!res.ok) return { status: 'busy' };
    return { status: 'ok', foods: productsFromSearch(await res.json(), lang) };
  } catch {
    return { status: 'offline' };
  } finally {
    clearTimeout(timer);
  }
}
