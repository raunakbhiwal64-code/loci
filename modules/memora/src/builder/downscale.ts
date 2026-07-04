/**
 * Photo helpers for the custom-palace builder. Every image the child adds —
 * from the in-app camera OR the device file picker — is drawn through a
 * <canvas> and re-encoded as JPEG. That re-encode strips EXIF/GPS and shrinks
 * the file so the dataURL we store is small and location-free. Photos never
 * leave the device; only the downscaled JPEG dataURL is ever persisted.
 */

/** Longest edge (px) we keep a stored photo at. */
export const MAX_EDGE = 1000;
/** JPEG quality for the re-encode. */
export const JPEG_QUALITY = 0.8;

/**
 * Pure clamp math: given a source width/height and a max long-edge, return the
 * target size that fits inside MAX_EDGE while preserving the aspect ratio.
 * Never upscales (an image already smaller than the cap is left as-is).
 */
export function fitWithin(
  width: number,
  height: number,
  maxEdge: number = MAX_EDGE
): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 };
  const longEdge = Math.max(width, height);
  if (longEdge <= maxEdge) return { width: Math.round(width), height: Math.round(height) };
  const scale = maxEdge / longEdge;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/**
 * Draw a source image/frame onto a canvas at the downscaled size and return a
 * JPEG dataURL. The re-encode strips EXIF/GPS. Runtime-only (needs a real
 * canvas); the clamp math lives in fitWithin so it can be unit-tested.
 */
export function encodeDownscaledJpeg(
  source: CanvasImageSource,
  srcWidth: number,
  srcHeight: number,
  maxEdge: number = MAX_EDGE,
  quality: number = JPEG_QUALITY
): string {
  const { width, height } = fitWithin(srcWidth, srcHeight, maxEdge);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const cx = canvas.getContext("2d");
  if (!cx) throw new Error("Canvas 2D context unavailable");
  cx.drawImage(source, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Load a File (from the device picker) into an <img>, downscale it and return a
 * fresh JPEG dataURL. Resolves with the downscaled string only — the original
 * File/dataURL is never returned or stored.
 */
export function downscaleFile(file: File, maxEdge: number = MAX_EDGE): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that image"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file wasn't an image we can use"));
      img.onload = () => {
        try {
          resolve(encodeDownscaledJpeg(img, img.naturalWidth, img.naturalHeight, maxEdge));
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
