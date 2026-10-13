// One door to the AI: uses Groq when the user added a Groq key (fast, free),
// otherwise Gemini. Answers are checked and matched to the app's own foods.

import { AiError } from './aiError.js';
import { getGroqKey, groqChat, VISION_MODEL, TEXT_MODELS } from './groq.js';
import { getKey as getGeminiKey, geminiJson } from './gemini.js';
import {
  photoPrompt, linesPrompt, lookupPrompt, parseAiJson, cleanAiItems, matchAiItems, lookupToCustomFoods,
} from '../core/ai.js';

export { AiError };

/** 'groq' | 'gemini' | null */
export function aiProvider() {
  if (getGroqKey()) return 'groq';
  if (getGeminiKey()) return 'gemini';
  return null;
}

export const aiAvailable = () => aiProvider() !== null;

function readItems(text) {
  try {
    return cleanAiItems(parseAiJson(text));
  } catch {
    throw new AiError('failed', 'The AI answer could not be read.');
  }
}

async function askText(prompt) {
  if (aiProvider() === 'gemini') return geminiJson({ prompt });
  let last = null;
  for (const model of TEXT_MODELS) {
    try {
      return await groqChat({ model, messages: [{ role: 'user', content: prompt }], reasoning: { reasoning_effort: 'low' } });
    } catch (err) {
      if (err.code === 'badKey' || err.code === 'offline' || err.code === 'noKey') throw err;
      last = err;
    }
  }
  throw last;
}

/**
 * Foods in a photo, matched to the app's foods when possible.
 * @param {{base64: string, mime: string}} image
 */
export async function identifyPhoto(image, foods) {
  const prompt = photoPrompt();
  const text = aiProvider() === 'gemini'
    ? await geminiJson({ prompt, image })
    : await groqChat({
      model: VISION_MODEL,
      reasoning: { reasoning_effort: 'none' },
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:${image.mime};base64,${image.base64}` } },
        ],
      }],
    });
  return matchAiItems(readItems(text), foods);
}

/** Typed lines the app couldn't read → items with a `line` number (1-based). */
export async function understandLines(lines, foods) {
  if (!lines.length) return [];
  return matchAiItems(readItems(await askText(linesPrompt(lines))), foods);
}

/** "Search online": AI estimates for any food or drink, as custom foods (per serving). */
export async function lookupOnline(query) {
  return lookupToCustomFoods(readItems(await askText(lookupPrompt(query))));
}
