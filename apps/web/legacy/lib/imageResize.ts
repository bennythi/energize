/**
 * Client-side Image-Resize via Canvas. Reduziert Upload-Volumen,
 * normalisiert Format zu JPEG und stript EXIF-Daten.
 */

export interface ResizedImage {
  blob: Blob;
  width: number;
  height: number;
  type: string;
}

const DEFAULT_MAX_DIM = 1600;
const DEFAULT_QUALITY = 0.85;

export async function resizeImage(
  file: File,
  maxDim = DEFAULT_MAX_DIM,
  quality = DEFAULT_QUALITY,
): Promise<ResizedImage> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const { width, height } = scaleDown(img.naturalWidth, img.naturalHeight, maxDim);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context nicht verfügbar');
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob fehlgeschlagen'))),
        'image/jpeg',
        quality,
      );
    });

    return { blob, width, height, type: 'image/jpeg' };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
    img.src = src;
  });
}

function scaleDown(w: number, h: number, max: number): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = w > h ? max / w : max / h;
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}
