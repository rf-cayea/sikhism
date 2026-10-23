export const englishText = row => {
  const translations = row?.translation?.en;
  if (typeof translations === 'string') return { text: translations, author: '' };
  if (!translations || typeof translations !== 'object') return { text: '', author: '' };
  const entry = Object.entries(translations).find(([, value]) => typeof value === 'string' && value.trim());
  return entry ? { text: entry[1], author: entry[0] } : { text: '', author: '' };
};
export const translationNames = { bdb: 'BaniDB', ssk: 'Dr. Sant Singh Khalsa', ms: 'Bhai Manmohan Singh' };

// Search metadata without changing the provider's displayed text. Tokens carry
// familiar names such as "japji" while transliterations may use "japujee saahib".
const searchText = value => String(value || '').normalize('NFKC').toLowerCase()
  .replace(/[()]/g, '').replace(/([aeiou])\1+/g, '$1');
export const matchesBani = (bani, query) => {
  const index = searchText([
    bani.token, bani.transliteration, bani.transliterations?.en,
    bani.transliterations?.english, bani.gurmukhiUni,
  ].filter(Boolean).join(' '));
  return searchText(query).split(/\s+/).filter(Boolean).every(word => index.includes(word));
};

export const normalizeVerse = entry => {
  const row = entry?.verse?.verse ? entry.verse : entry;
  return {
    id: row?.verseId,
    shabadId: row?.shabadId,
    gurmukhi: row?.verse?.unicode || '',
    transliteration: row?.transliteration?.en || row?.transliteration?.english || '',
    translation: englishText(row),
    page: row?.pageNo,
  };
};
export const BANI_API = 'https://api.banidb.com/v2/';
const connectionError = 'We could not reach BaniDB. Please try again shortly. You can still explore Learn Sikhi.';

export function createBaniClient({ fetcher = globalThis.fetch, timeoutMs = 15_000 } = {}) {
  // Short-lived browser memory only: no scripture is written to localStorage.
  const cache = new Map();
  return async function getBani(path, signal) {
    if (signal?.aborted) throw signal.reason;
    const cached = cache.get(path);
    if (cached?.expires > Date.now()) return cached.data;

    const controller = new AbortController();
    const abort = () => controller.abort(signal.reason);
    signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), timeoutMs);
    try {
      let response;
      try {
        response = await fetcher(`${BANI_API}${path}`, {
          signal: controller.signal,
          credentials: 'omit',
          headers: { Accept: 'application/json' },
          redirect: 'error',
        });
      } catch (error) {
        if (signal?.aborted) throw error;
        throw new Error(controller.signal.reason?.name === 'TimeoutError'
          ? 'BaniDB is taking longer than expected. Please try again.' : connectionError);
      }
      if (!response.ok) {
        throw new Error(response.status === 404 ? 'This reading is not available from BaniDB.'
          : response.status === 429 ? 'BaniDB is busy. Please try again in a moment.' : connectionError);
      }
      let data;
      try { data = await response.json(); }
      catch (error) {
        if (signal?.aborted) throw error;
        throw new Error('We could not read the BaniDB response. Please try again.');
      }
      if (!data || typeof data !== 'object' || data.error) throw new Error(connectionError);
      if (signal?.aborted) throw signal.reason;
      if (cache.size >= 100) cache.delete(cache.keys().next().value);
      cache.set(path, { data, expires: Date.now() + 120_000 });
      return data;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    }
  };
}

export const getBani = createBaniClient();
