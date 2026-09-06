/**
 * Safely format a number to fixed decimal places, handling undefined, null, NaN, or non-numeric strings.
 * Prevents "Cannot read properties of undefined (reading 'toFixed')" crashes.
 */
export function safeToFixed(value: any, decimals: number = 2, fallback: string = '0.00'): string {
  if (value === undefined || value === null) return fallback;
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num) || !isFinite(num)) return fallback;
  return num.toFixed(decimals);
}

/**
 * Utility to strip undefined values recursively from objects
 * to prevent Firestore setDoc / updateDoc crashes.
 */
export function sanitizePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => sanitizePayload(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizePayload(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}
