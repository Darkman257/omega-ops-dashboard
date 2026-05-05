/**
 * Normalizes text for robust search across Arabic and English.
 * - Converts to lowercase and trims whitespace.
 * - Simplifies Arabic characters (Hamza variants, Taa Marbuta, Alif Maqsura).
 * - Removes Arabic diacritics (Tashkeel).
 * - Ensures numbers are treated as searchable strings.
 */
export function normalizeSearchText(value: unknown): string {
  if (value === null || value === undefined) return '';
  
  let text = String(value).toLowerCase().trim();

  // Remove Arabic diacritics (tashkeel)
  // Range: \u064B to \u0652
  text = text.replace(/[\u064B-\u0652]/g, '');

  // Normalize Alif variants (أ, إ, آ) to bare Alif (ا)
  text = text.replace(/[أإآ]/g, 'ا');

  // Normalize Taa Marbuta (ة) to Haa (ه)
  text = text.replace(/ة/g, 'ه');

  // Normalize Alif Maqsura (ى) to Yaa (ي)
  text = text.replace(/ى/g, 'ي');

  return text;
}

/**
 * Checks if a search query matches any of the provided target values.
 */
export function matchesSearch(query: string, ...targets: (unknown)[]): boolean {
  if (!query) return true;
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  return targets.some(target => {
    const normalizedTarget = normalizeSearchText(target);
    return normalizedTarget.includes(normalizedQuery);
  });
}
