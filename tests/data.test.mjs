import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BANI_API, createBaniClient, normalizeVerse, matchesBani } from '../src/data.mjs';

test('the static app fetches directly from BaniDB and caches successful content', async () => {
  let calls = 0;
  const data = [{ ID: 1, transliteration: 'Test bani' }];
  const get = createBaniClient({ fetcher: async (url, options) => {
    calls++;
    assert.equal(url, `${BANI_API}banis`);
    assert.equal(options.credentials, 'omit');
    return Response.json(data);
  } });
  assert.deepEqual(await get('banis'), data);
  assert.deepEqual(await get('banis'), data);
  assert.equal(calls, 1);
});

test('provider errors remain actionable and failed requests can be retried', async () => {
  for (const [status, message] of [[404, /not available/], [429, /BaniDB is busy/], [502, /could not reach BaniDB/]]) {
    let calls = 0;
    const get = createBaniClient({ fetcher: async () => ++calls === 1 ? new Response('upstream details', { status }) : Response.json([]) });
    await assert.rejects(get('banis'), message);
    assert.deepEqual(await get('banis'), []);
    assert.equal(calls, 2);
  }
});

test('network and malformed provider responses produce friendly errors', async () => {
  const brokenNetwork = createBaniClient({ fetcher: async () => { throw new TypeError('Failed to fetch'); } });
  await assert.rejects(brokenNetwork('banis'), /could not reach BaniDB/);
  const brokenJson = createBaniClient({ fetcher: async () => new Response('<html>proxy error</html>') });
  await assert.rejects(brokenJson('banis'), /could not read the BaniDB response/);
  const providerError = createBaniClient({ fetcher: async () => Response.json({ error: true }) });
  await assert.rejects(providerError('banis'), /could not reach BaniDB/);
});

test('navigation cancellation aborts the in-flight request', async () => {
  const navigation = new AbortController();
  const get = createBaniClient({ fetcher: (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }) });
  const request = get('banis', navigation.signal);
  navigation.abort();
  await assert.rejects(request, { name: 'AbortError' });
});

test('a slow provider request times out without leaving the reader loading forever', async () => {
  const get = createBaniClient({ timeoutMs: 10, fetcher: (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }) });
  await assert.rejects(get('banis'), /taking longer than expected/);
});

test('BaniDB regular and nested bani verse shapes preserve Unicode and translator provenance', () => {
  const verse = { verseId: 12, shabadId: 4, verse: { unicode: 'TEST UNICODE', gurmukhi: 'legacy encoding' }, translation: { en: { bdb: 'Test translation' } }, transliteration: { en: 'Test transliteration' }, pageNo: 1 };
  assert.deepEqual(normalizeVerse(verse), normalizeVerse({ verse }));
  assert.equal(normalizeVerse(verse).gurmukhi, 'TEST UNICODE');
  assert.deepEqual(normalizeVerse(verse).translation, { text: 'Test translation', author: 'bdb' });
  assert.equal(normalizeVerse({}).gurmukhi, '');
});

test('Bani names can be found using both familiar tokens and provider transliterations', () => {
  const bani = { token: 'japji', transliteration: 'japujee saahib', gurmukhiUni: 'TEST BANI' };
  assert.equal(matchesBani(bani, 'Japji Sahib'), true);
  assert.equal(matchesBani(bani, 'japujee'), true);
  assert.equal(matchesBani(bani, 'unrelated'), false);
});
