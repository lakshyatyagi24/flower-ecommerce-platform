import { throwApiError } from './http';
import { API_BASE, bearerHeaders } from './token';
import type { CsvDownload } from './types';

export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/** Client-side pre-check mirroring the server gate. Returns an error message, or null if OK. */
export function validateImageFile(file: File): string | null {
  if (!IMAGE_UPLOAD_TYPES.includes(file.type)) return 'Only JPEG, PNG, WebP or AVIF images are allowed.';
  if (file.size > IMAGE_UPLOAD_MAX_BYTES) return 'Image must be under 5 MB.';
  return null;
}

export async function uploadImage(
  file: File,
  folder: 'products' | 'sliders' | 'categories' = 'products',
): Promise<{ url: string }> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_BASE}/uploads?folder=${folder}`, {
    method: 'POST',
    headers: bearerHeaders(),
    body: fd,
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) throwApiError(res, payload);
  return payload;
}

function parseCsvMeta(res: Response, fallbackName: string): CsvDownload {
  const disposition = res.headers.get('content-disposition') || '';
  const filename = /filename="?([^";]+)"?/i.exec(disposition)?.[1] || fallbackName;
  const num = (name: string) => {
    const v = res.headers.get(name);
    return v !== null && /^\d+$/.test(v) ? parseInt(v, 10) : null;
  };
  return {
    filename,
    rows: num('x-export-rows'),
    total: num('x-export-total'),
    truncated: res.headers.get('x-export-truncated') === 'true',
  };
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    // Revoking immediately can cancel the download in Firefox/Safari; give the browser time to start it.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}

/** Downloads a CSV with the bearer token (a plain link cannot send it; the token never goes in a URL). */
export async function downloadCsv(path: string, fallbackName: string): Promise<CsvDownload> {
  const res = await fetch(`${API_BASE}${path}`, { headers: bearerHeaders() });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throwApiError(res, payload);
  }
  const meta = parseCsvMeta(res, fallbackName);
  triggerBlobDownload(await res.blob(), meta.filename);
  return meta;
}
