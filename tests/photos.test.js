import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPhotoDataUrl, splitTransfer } from '../js/core/photoData.js';
import { BUILT_IN } from '../js/foods/index.js';
import { foodEmoji } from '../js/foods/emoji.js';

test('isPhotoDataUrl accepts small images only', () => {
  assert.equal(isPhotoDataUrl('data:image/jpeg;base64,/9j/4AAQSkZJRg=='), true);
  assert.equal(isPhotoDataUrl('data:image/svg+xml;base64,PHN2Zz4='), false);
  assert.equal(isPhotoDataUrl('data:text/html;base64,PGh0bWw+'), false);
  assert.equal(isPhotoDataUrl('javascript:alert(1)'), false);
  assert.equal(isPhotoDataUrl(`data:image/jpeg;base64,${'A'.repeat(3_100_000)}`), false);
  assert.equal(isPhotoDataUrl(42), false);
});

test('splitTransfer separates photos from data and drops bad photos', () => {
  const text = JSON.stringify({
    version: 1, log: {},
    photos: { dolma: 'data:image/jpeg;base64,/9j/4A==', evil: 'data:text/html;base64,PGh0bWw+' },
  });
  const { data, photos } = splitTransfer(text);
  assert.equal(JSON.parse(data).photos, undefined);
  assert.equal(JSON.parse(data).version, 1);
  assert.deepEqual(Object.keys(photos), ['dolma']);
});

test('every built-in food has a picture', () => {
  for (const f of BUILT_IN) assert.ok(foodEmoji(f), f.id);
  const tea = BUILT_IN.find((f) => f.id === 'tea_sugar');
  assert.equal(foodEmoji(tea), '🍵');
});
