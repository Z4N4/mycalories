// Checks for photos coming from a backup file or a pasted transfer.

const MAX_PHOTO_CHARS = 3_000_000; // ~2 MB image
const PHOTO_PREFIX = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

/** True for a base64 JPEG/PNG/WebP data URL of reasonable size. */
export function isPhotoDataUrl(value) {
  return typeof value === 'string' && value.length < MAX_PHOTO_CHARS && PHOTO_PREFIX.test(value);
}

/**
 * Splits a backup/transfer text into the app data and the photos.
 * @returns {{ data: string, photos: Record<string, string> }}
 */
export function splitTransfer(text) {
  const raw = JSON.parse(text);
  const photos = raw && typeof raw === 'object' && raw.photos && typeof raw.photos === 'object' ? raw.photos : {};
  const { photos: _photos, ...rest } = raw ?? {};
  const clean = Object.fromEntries(Object.entries(photos).filter(([, v]) => isPhotoDataUrl(v)));
  return { data: JSON.stringify(rest), photos: clean };
}
