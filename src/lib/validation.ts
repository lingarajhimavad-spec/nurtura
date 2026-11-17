// Synchronized with firebase-blueprint.json schema boundaries

export const FIELD_LIMITS = {
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  DATE_PATTERN: /^\d{4}-\d{2}-\d{2}$/,
  TIME_PATTERN: /^\d{2}:\d{2}$/,
  USER_NAME_MAX: 100,
  BABY_NAME_MAX: 80,
  EMAIL_MAX: 160,
  HEALTH_CONDITIONS_MAX: 10,
  LOG_TITLE_MAX: 120,
  LOG_UNIT_MAX: 24,
  LOG_NOTES_MAX: 400,
  GROWTH_NOTES_MAX: 300,
  MILESTONE_TITLE_MAX: 140,
  DOCTOR_NAME_MAX: 100,
  MILESTONE_NOTES_MAX: 500,
  MEMORY_TITLE_MAX: 120,
  MEMORY_CAPTION_MAX: 500,
  IMAGE_DATA_MAX: 350000,
  RECORD_TITLE_MAX: 140,
  PROVIDER_NAME_MAX: 120,
  RECORD_SUMMARY_MAX: 800,
  POLICY_REF_MAX: 80,
  BOOKING_PROVIDER_MAX: 140,
  BOOKING_ADDRESS_MAX: 240,
  BOOKING_SCHEDULE_MAX: 40,
  BOOKING_NOTES_MAX: 400,
  THREAD_SPECIALTY_MAX: 80,
  THREAD_CLINIC_MAX: 120,
  THREAD_LAST_MSG_MAX: 500,
  MESSAGE_BODY_MAX: 1500,
  POST_HANDLE_MAX: 60,
  POST_TITLE_MAX: 140,
  POST_BODY_MAX: 2000,
  REPLY_BODY_MAX: 1200,
} as const;

export function clampString(val: string, maxLen: number): string {
  return val.trim().slice(0, maxLen);
}

export function clampNumber(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.min(max, Math.max(min, val));
}

export function generateSafeId(prefix = 'bm'): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  const raw = `${prefix}_${ts}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
  return raw.slice(0, 64);
}

export function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function currentTimeHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export async function compressImageToDataUrl(
  file: File,
  maxDimension = 760,
  maxLength = 260000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format.'));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.78;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > maxLength && quality > 0.3) {
          quality -= 0.12;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        if (dataUrl.length > maxLength) {
          reject(new Error('Image remains too large after compression. Choose a smaller photo.'));
          return;
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
