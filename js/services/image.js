// Shrinks a photo before sending it (faster upload, fewer AI tokens).
// Uses an <img> element so iPhone HEIC photos decode too.

const MAX_SIDE = 1024;
const JPEG_QUALITY = 0.82;

/**
 * @param {File} file
 * @param {number} [maxSide] longest side in pixels (keeps iPhone canvases under Safari's size limit)
 * @returns {Promise<{base64: string, mime: string, dataUrl: string}>}
 */
export function shrinkImage(file, maxSide = MAX_SIDE) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      resolve({ dataUrl, mime: 'image/jpeg', base64: dataUrl.slice(dataUrl.indexOf(',') + 1) });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('unreadable image'));
    };
    img.src = url;
  });
}
