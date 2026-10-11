// Product lookup in Open Food Facts (free, open database of packaged foods).

import { productFromOff } from '../core/barcode.js';

const API = 'https://world.openfoodfacts.org/api/v2/product/';
const FIELDS = 'product_name,product_name_ar,product_name_en,product_name_ku,generic_name,brands,nutriments,serving_size,serving_quantity';
const TIMEOUT_MS = 10000;

/**
 * @returns {Promise<{status: 'found', food: object} | {status: 'notFound'} | {status: 'offline'}>}
 */
export async function lookupBarcode(code, lang) {
  if (!navigator.onLine) return { status: 'offline' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API}${encodeURIComponent(code)}.json?fields=${FIELDS}`, { signal: controller.signal });
    if (res.status === 404) return { status: 'notFound' };
    if (!res.ok) return { status: 'offline' };
    const food = productFromOff(await res.json(), code, lang);
    return food ? { status: 'found', food } : { status: 'notFound' };
  } catch {
    return { status: 'offline' };
  } finally {
    clearTimeout(timer);
  }
}
