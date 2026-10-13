import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanBarcode, isValidBarcode, productFromOff, productsFromSearch } from '../js/core/barcode.js';

test('cleanBarcode keeps digits only, including Arabic digits', () => {
  assert.equal(cleanBarcode(' 5449 0000-00996 '), '5449000000996');
  assert.equal(cleanBarcode('٥٤٤٩٠٠٠٠٠٠٩٩٦'), '5449000000996');
});

test('isValidBarcode checks length and EAN/UPC check digit', () => {
  assert.equal(isValidBarcode('5449000000996'), true); // EAN-13
  assert.equal(isValidBarcode('5449000000997'), false); // wrong check digit
  assert.equal(isValidBarcode('96385074'), true); // EAN-8
  assert.equal(isValidBarcode('036000291452'), true); // UPC-A
  assert.equal(isValidBarcode('12345'), false);
  assert.equal(isValidBarcode('abc'), false);
});

const coke = {
  status: 1,
  product: {
    product_name: 'Coca-Cola Original', product_name_ar: 'كوكا كولا', brands: 'Coca-Cola',
    serving_size: '1 can (330 ml)', serving_quantity: 330,
    nutriments: { 'energy-kcal_100g': 42.4, proteins_100g: 0, carbohydrates_100g: 10.6, fat_100g: 0 },
  },
};

test('productFromOff builds a per-serving custom food', () => {
  const food = productFromOff(coke, '5449000000996', 'ar');
  assert.equal(food.name, 'كوكا كولا');
  assert.equal(food.barcode, '5449000000996');
  assert.equal(food.servingG, 330);
  assert.equal(food.kcal, 140); // 42.4 * 3.3
  assert.equal(food.c, 35);
});

test('productFromOff falls back to 100 g, English name and kJ energy', () => {
  const p = { status: 1, product: { product_name: 'Biscuits', brands: 'Brand', nutriments: { energy_100g: 2092, proteins_100g: 6, carbohydrates_100g: 70, fat_100g: 20 } } };
  const food = productFromOff(p, '96385074', 'ku');
  assert.equal(food.name, 'Biscuits (Brand)');
  assert.equal(food.servingG, 100);
  assert.equal(food.kcal, 500);
});

test('productFromOff reads serving size given as text', () => {
  const p = { status: 1, product: { product_name: 'Chips', serving_quantity: '30', nutriments: { 'energy-kcal_100g': 500 } } };
  assert.equal(productFromOff(p, '96385074', 'en').servingG, 30);
});

test('productFromOff rejects impossible values and tiny servings', () => {
  const kj = { status: 1, product: { product_name: 'Oops', nutriments: { 'energy-kcal_100g': 2000 } } };
  assert.equal(productFromOff(kj, '96385074', 'en'), null);
  const tiny = { status: 1, product: { product_name: 'Sweetener', serving_quantity: 0.5, nutriments: { 'energy-kcal_100g': 400, carbohydrates_100g: 100 } } };
  assert.equal(productFromOff(tiny, '96385074', 'en').servingG, 100);
  const badMacro = { status: 1, product: { product_name: 'X', nutriments: { 'energy-kcal_100g': 100, fat_100g: 500 } } };
  assert.equal(productFromOff(badMacro, '96385074', 'en').f, 0);
});

test('productFromOff returns null when not found or without calories', () => {
  assert.equal(productFromOff({ status: 0 }, '1', 'en'), null);
  assert.equal(productFromOff({ status: 1, product: { product_name: 'X', nutriments: {} } }, '1', 'en'), null);
  assert.equal(productFromOff(null, '1', 'en'), null);
});

test('productsFromSearch turns Open Food Facts search results into foods, skipping bad ones', () => {
  const json = {
    products: [
      { code: '9002490100070', product_name: 'Red Bull', brands: 'Red Bull', serving_quantity: 250, nutriments: { 'energy-kcal_100g': 46, carbohydrates_100g: 11 } },
      { code: '9002490100070', product_name: 'Red Bull', brands: 'Red Bull', serving_quantity: 250, nutriments: { 'energy-kcal_100g': 46, carbohydrates_100g: 11 } },
      { code: '123', product_name: 'No calories', nutriments: {} },
      { code: '456', product_name: 'Broken', nutriments: { 'energy-kcal_100g': 5000 } },
      { product_name: 'Sugar free', brands: 'X', nutriments: { 'energy-kcal_100g': 3 } },
    ],
  };
  const list = productsFromSearch(json, 'en');
  assert.equal(list.length, 2);
  assert.equal(list[0].kcal, 115);
  assert.equal(list[0].barcode, '9002490100070');
  assert.equal(list[1].barcode, '');
  assert.deepEqual(productsFromSearch(null, 'en'), []);
});

test('calories that do not fit the label macros are corrected (kJ typed as kcal)', () => {
  const wrong = { status: 1, product: { product_name: 'Red Bull Energy Drink', serving_quantity: 250, nutriments: { 'energy-kcal_100g': 463, carbohydrates_100g: 11, proteins_100g: 0, fat_100g: 0 } } };
  assert.equal(productFromOff(wrong, '', 'en').kcal, 110); // 44 kcal/100 ml × 2.5
  const fine = { status: 1, product: { product_name: 'Oil', nutriments: { 'energy-kcal_100g': 884, fat_100g: 100 } } };
  assert.equal(productFromOff(fine, '', 'en').kcal, 884);
});

test('search results show the brand when the name lacks it', () => {
  const json = { products: [{ product_name: 'Energy Drink', brands: 'Red Bull', nutriments: { 'energy-kcal_100g': 46, carbohydrates_100g: 11 } }] };
  assert.equal(productsFromSearch(json, 'en')[0].name, 'Energy Drink (Red Bull)');
});

test('a 0 kcal sweetener with sugar alcohols is not turned into 400 kcal', () => {
  const sweetener = { status: 1, product: { product_name: 'Sweetener', nutriments: { 'energy-kcal_100g': 0, carbohydrates_100g: 99 } } };
  assert.equal(productFromOff(sweetener, '', 'en').kcal, 0);
});
