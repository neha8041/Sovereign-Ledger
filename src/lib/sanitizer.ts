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

/**
 * Filter out prompt instructions and chat session titles (e.g. "Journal & Audit (16:56)")
 */
export function isSessionTitleOrPromptPrefix(text?: string | null): boolean {
  if (!text || typeof text !== 'string') return true;
  const t = text.trim();
  if (t.length < 2) return true;

  // Chat session titles e.g. "Journal & Audit (16:56)", "Audit Session (10:30)", "Journal & Audit"
  if (/^Journal\s*&\s*Audit(?:\s*\([\d:]+\))?/i.test(t)) return true;
  if (/^Audit\s*Session(?:\s*\([\d:]+\))?/i.test(t)) return true;
  if (/^Journal\s*Reflection/i.test(t)) return true;
  if (/^Ledger\s*Audit/i.test(t)) return true;
  if (/^Financial\s*(?:Transaction\s*)?Audit/i.test(t)) return true;
  if (/^Audited\s*Vault\s*Vendor/i.test(t)) return true;
  if (/^Ingested\s*Vendor/i.test(t)) return true;
  if (/^Financial\s*Item/i.test(t)) return true;
  if (/^Document\s*Scan/i.test(t)) return true;
  if (/^Invoice\s*Document/i.test(t)) return true;
  if (/\.(pdf|png|jpe?g|webp)$/i.test(t)) return true;
  if (/^(?:unknown|n\/a|none|null|undefined|sample|test|invoice)$/i.test(t)) return true;

  // Prompt sentences starting with instructions e.g. "on the attached document...", "perform a 3-layer audit..."
  if (/^(?:on\s+the\s+attached|perform\s+(?:a\s+)?(?:complete\s+)?3-layer|please\s+audit)/i.test(t) && !/\b(?:CORP|LLC|INC|LTD)\b/i.test(t)) {
    return true;
  }

  return false;
}

/**
 * Strict legal corporate entity extractor (e.g. MASON-WILLIAMS CORP, PETERSON, HARRIS AND KIM CORP, RANDALL-GARDNER CORP)
 */
export function extractLegalEntityName(text: string): string | undefined {
  if (!text || typeof text !== 'string') return undefined;

  // Multi-word entity ending in corporate designation (CORP, LLC, INC, LTD, CO, etc.)
  // Handles punctuation like hyphens, commas, ampersands: "PETERSON, HARRIS AND KIM CORP", "MASON-WILLIAMS CORP"
  const legalEntityRegex = /\b([A-Z0-9][A-Z0-9\s&.,'-]{1,60}?\s+(?:CORP(?:ORATION)?|LLC|INC(?:ORPORATED)?|LTD|LIMITED|CO(?:MPANY)?|GMBH|LLP|PLC))\b/i;
  const match = text.match(legalEntityRegex);
  if (match && match[1]) {
    let candidate = match[1].trim();
    // Strip leading conversational/prompt prefixes (e.g. "on the attached document", "vendor", "from", "for")
    candidate = candidate.replace(/^(?:on\s+the\s+attached\s+(?:document|invoice|file|image|receipt)|attached\s+(?:document|invoice|file|image|receipt)|for\s+vendor|vendor\s+name\s*[:=-]|vendor\s*[:=-]|from\s*[:=-]|biller\s*[:=-]|company\s*[:=-]|merchant\s*[:=-]|the\s+|for\s+)\s*/i, '');
    candidate = candidate.replace(/^[^A-Za-z0-9]+/, '').replace(/[^A-Za-z0-9]+$/, '').trim();
    if (candidate.length >= 3 && !isSessionTitleOrPromptPrefix(candidate)) {
      return candidate.toUpperCase();
    }
  }
  return undefined;
}

/**
 * Sanitize vendor name: strip prompt/vault prefixes, chat session titles, and extract clean legal entity name.
 */
export function cleanVendorName(raw?: string | null): string | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^["'`“”]+|["'`“”]+$/g, '').trim();
  if (!cleaned) return undefined;

  // 1. If it matches a corporate entity inside, prioritize that legal entity name
  const legalEntity = extractLegalEntityName(cleaned);
  if (legalEntity) {
    return legalEntity;
  }

  // 2. Reject if it is a session title or placeholder
  if (isSessionTitleOrPromptPrefix(cleaned)) {
    return undefined;
  }

  // 3. Strip prompt instructions and conversational prefixes
  cleaned = cleaned.replace(/^(?:please\s+)?(?:perform\s+(?:a\s+)?(?:complete\s+)?(?:3-layer\s+)?(?:forensic\s+)?audit(?:\s+on)?|audit\s+the\s+attached|audit|on\s+the\s+attached\s+(?:document|invoice|file|image|receipt)|attached\s+(?:document|invoice|file|image|receipt)|for\s+vendor|vendor\s+name\s*[:=-]|vendor\s*[:=-]|from\s*[:=-]|biller\s*[:=-]|company\s*[:=-]|merchant\s*[:=-]|issued\s*by\s*[:=-])\s*/i, '');
  
  // Strip trailing notes, timestamps, or parentheticals
  cleaned = cleaned.replace(/\s*\((?:tax|po|subtotal|line|invoice|\d{1,2}:\d{2}).*$/i, '');
  cleaned = cleaned.replace(/\s*(?:,\s*tax\s*id.*|\s*-\s*invoice.*)$/i, '');
  cleaned = cleaned.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9.]+$/g, '').trim();

  // Re-verify clean result
  if (!cleaned || isSessionTitleOrPromptPrefix(cleaned)) {
    return undefined;
  }

  if (cleaned.length > 60 || /\b(?:document|attached|invoice|receipt|calculate|instructions|prompt|disbursement|journal)\b/i.test(cleaned)) {
    return undefined;
  }

  return cleaned;
}
