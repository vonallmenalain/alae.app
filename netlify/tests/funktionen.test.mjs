/*
 * Tests für die Funktionen rund um Links mit Code: Zuschnitt der
 * Startseite, Weiterleitung /k/<code> und Bestätigung eines Besuchs.
 *
 *   npm test
 *
 * Die Verwaltung wird nachgestellt (fetch), ebenso der Kontext von Netlify.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import zuschnitt from '../edge-functions/zuschnitt/zuschnitt.js';
import weiterleitung from '../edge-functions/weiterleitung.js';
import besuch from '../functions/besuch.mjs';

const HTML = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const seite = () => new Response(HTML, { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8', ETag: '"abc"' } });

/** Stellt fetch für die Dauer eines Tests nach und hält die Anfragen fest. */
function verwaltung(t, antwort) {
  const anfragen = [];
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    anfragen.push({ url: String(url), init });
    return typeof antwort === 'function' ? antwort(String(url), init) : antwort.clone();
  });
  return anfragen;
}

test('Ohne Code oder mit falschem Code geht die Seite unverändert hinaus, ohne Frage an die Verwaltung', async (t) => {
  const anfragen = verwaltung(t, Response.json({ referenzen: [], zielgruppe: 'kmu' }));
  const kontext = { next: async () => seite() };
  for (const adresse of ['https://alae.app/', 'https://alae.app/?ref=', 'https://alae.app/?ref=zu-lang-und-falsch', 'https://alae.app/?ref=k7m2qd0']) {
    assert.equal(await zuschnitt(new Request(adresse), kontext), undefined, adresse);
  }
  assert.equal(await zuschnitt(new Request('https://alae.app/?ref=k7m2qdx', { method: 'HEAD' }), kontext), undefined);
  assert.equal(anfragen.length, 0);
});

test('Mit Code fragt die Funktion die Verwaltung und liefert die zugeschnittene Seite', async (t) => {
  const anfragen = verwaltung(t, Response.json({ referenzen: ['dreamteam', 'gripszug'], zielgruppe: 'verein' }));
  const antwort = await zuschnitt(new Request('https://alae.app/?ref=A7M2QDX'), { next: async () => seite() });
  assert.equal(anfragen[0].url, 'https://administration.alae.app/ref/a7m2qdx');
  assert.equal(antwort.status, 200);
  assert.equal(antwort.headers.get('cache-control'), 'private, no-store');
  assert.equal(antwort.headers.get('etag'), null);
  const html = await antwort.text();
  assert.match(html, /data-zielgruppe="verein"/);
  assert.ok(html.indexOf('id="dreamteam"') < html.indexOf('id="projekte"'));
  assert.equal(html.includes('id="fotos"'), false);

  // Ein zweiter Aufruf mit demselben Code fragt nicht nochmals
  await zuschnitt(new Request('https://alae.app/?ref=a7m2qdx'), { next: async () => seite() });
  assert.equal(anfragen.length, 1);
});

test('Unbekannter Code, Fehler oder Zeitüberschreitung: die übliche Seite', async (t) => {
  let fall = 'unbekannt';
  const anfragen = verwaltung(t, () => {
    if (fall === 'unbekannt') return new Response(null, { status: 404 });
    if (fall === 'stoerung') return new Response(null, { status: 503 });
    throw new DOMException('Zeit abgelaufen', 'TimeoutError');
  });
  const kontext = { next: async () => seite() };
  assert.equal(await zuschnitt(new Request('https://alae.app/?ref=b7m2qdx'), kontext), undefined);
  fall = 'stoerung';
  assert.equal(await zuschnitt(new Request('https://alae.app/?ref=c7m2qdx'), kontext), undefined);
  fall = 'zeit';
  assert.equal(await zuschnitt(new Request('https://alae.app/?ref=d7m2qdx'), kontext), undefined);
  // Eine Störung merkt sich die Funktion nicht: Beim nächsten Aufruf fragt sie wieder.
  fall = 'stoerung';
  await zuschnitt(new Request('https://alae.app/?ref=c7m2qdx'), kontext);
  assert.equal(anfragen.filter((a) => a.url.endsWith('/c7m2qdx')).length, 2);
});

test('Was keine Seite ist, geht unverändert durch', async (t) => {
  verwaltung(t, Response.json({ referenzen: ['dreamteam'], zielgruppe: 'verein' }));
  const bild = new Response('x', { status: 200, headers: { 'Content-Type': 'image/png' } });
  assert.equal(await zuschnitt(new Request('https://alae.app/?ref=e7m2qdx'), { next: async () => bild }), bild);
  const fehlt = new Response('weg', { status: 404, headers: { 'Content-Type': 'text/html' } });
  assert.equal(await zuschnitt(new Request('https://alae.app/?ref=e7m2qdx'), { next: async () => fehlt }), fehlt);
});

test('alae.app/k/<code> führt über die Verwaltung, ein falscher Code an den Anfang', () => {
  const ziel = (pfad) => weiterleitung(new Request(`https://alae.app${pfad}`));
  let antwort = ziel('/k/k7m2qdx');
  assert.equal(antwort.status, 302);
  assert.equal(antwort.headers.get('location'), 'https://administration.alae.app/k/k7m2qdx');
  assert.equal(antwort.headers.get('cache-control'), 'no-store');
  assert.equal(ziel('/k/K7M2QDX/').headers.get('location'), 'https://administration.alae.app/k/k7m2qdx');
  for (const pfad of ['/k/', '/k/k7m2qd0', '/k/../admin', '/k/k7m2qdx/mehr']) {
    assert.equal(ziel(pfad).headers.get('location'), '/', pfad);
  }
});

/** Der gemeinsame Schlüssel mit der Verwaltung, erfunden, für die Dauer eines Tests */
function schluessel(t, wert = 'erfundener-schluessel') {
  process.env.BESUCH_SCHLUESSEL = wert;
  t.after(() => { delete process.env.BESUCH_SCHLUESSEL; });
}

test('Ein Besuch geht mit den Angaben des Browsers an die Verwaltung, ohne IP-Adresse', async (t) => {
  schluessel(t);
  const anfragen = verwaltung(t, new Response(null, { status: 204 }));
  const anfrage = new Request('https://alae.app/api/besuch', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone)',
      'Accept-Language': 'de-CH,de;q=0.9',
      'X-Forwarded-For': '203.0.113.7',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code: 'K7M2QDX', verweis: 'mail.google.com' }),
  });
  const antwort = await besuch(anfrage, { geo: { country: { code: 'CH' } } });
  assert.equal(antwort.status, 204);
  assert.equal(anfragen.length, 1);
  assert.equal(anfragen[0].url, 'https://administration.alae.app/ref/k7m2qdx/besuch');
  assert.equal(anfragen[0].init.method, 'POST');
  assert.equal(anfragen[0].init.headers.Authorization, 'Bearer erfundener-schluessel');
  const koerper = JSON.parse(anfragen[0].init.body);
  assert.deepEqual(koerper, { ua: 'Mozilla/5.0 (iPhone)', sprache: 'de-CH,de;q=0.9', land: 'CH', verweis: 'mail.google.com' });
  assert.equal(anfragen[0].init.body.includes('203.0'), false);
});

test('Ein Besuch ohne gültigen Code geht nirgends hin, die Antwort ist dieselbe', async (t) => {
  schluessel(t);
  const anfragen = verwaltung(t, () => { throw new Error('nicht erreichbar'); });
  const post = (koerper) => besuch(new Request('https://alae.app/api/besuch', { method: 'POST', body: koerper }), {});
  assert.equal((await post(JSON.stringify({ code: 'falsch' }))).status, 204);
  assert.equal((await post('kein json')).status, 204);
  assert.equal(anfragen.length, 0);
  // Auch wenn die Verwaltung nicht antwortet
  assert.equal((await post(JSON.stringify({ code: 'k7m2qdx' }))).status, 204);
  assert.equal(anfragen.length, 1);
  assert.equal((await besuch(new Request('https://alae.app/api/besuch'), {})).status, 405);
});

test('Ohne gemeinsamen Schlüssel gibt die Funktion keinen Besuch weiter', async (t) => {
  delete process.env.BESUCH_SCHLUESSEL;
  const anfragen = verwaltung(t, new Response(null, { status: 204 }));
  const antwort = await besuch(
    new Request('https://alae.app/api/besuch', { method: 'POST', body: JSON.stringify({ code: 'k7m2qdx' }) }),
    {},
  );
  assert.equal(antwort.status, 204);
  assert.equal(anfragen.length, 0);
});
