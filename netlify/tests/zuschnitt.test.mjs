/*
 * Tests für den Zuschnitt der Startseite pro Link.
 *
 *   npm test
 *
 * Sie laufen mit Node gegen die echte index.html, ohne Netlify. Liegen hier
 * und nicht neben den Funktionen, weil Netlify jede Datei dort als Teil
 * einer Funktion behandeln würde; ausgeliefert wird /netlify/* nicht
 * (netlify.toml).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { referenzBloecke, zuschneiden } from '../edge-functions/zuschnitt/zuschneiden.js';
import { ZIELGRUPPEN } from '../edge-functions/zuschnitt/zielgruppen.js';

const HTML = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

const sektionen = (html) => [...html.matchAll(/<section class="story" id="([\w-]+)"/g)].map((m) => m[1]);
const nummern = (html) => [...html.matchAll(/Referenzapp <!--nr-->(\d+)<!--\/nr-->: (\w+)/g)].map((m) => `${m[1]} ${m[2]}`);
const texte = (html) => {
  const gefunden = new Map();
  for (const m of html.matchAll(/<!--zg:([\w-]+)-->([\s\S]*?)<!--\/zg-->/g)) {
    if (!gefunden.has(m[1])) gefunden.set(m[1], []);
    gefunden.get(m[1]).push(m[2]);
  }
  return gefunden;
};

test('Ohne brauchbare Angaben bleibt die Seite, wie sie ist', () => {
  assert.equal(zuschneiden(HTML, null), HTML);
  assert.equal(zuschneiden(HTML, {}), HTML);
  assert.equal(zuschneiden(HTML, { referenzen: [], zielgruppe: 'kmu' }), HTML);
  // Referenzapps, die die Seite (noch) nicht kennt, ändern nichts
  assert.equal(zuschneiden(HTML, { referenzen: ['creart', 'gibt-es-nicht'], zielgruppe: 'kmu' }), HTML);
});

test('Die fünf Referenzapps stehen als Blöcke in index.html, je mit einem Kapitel', () => {
  const bloecke = referenzBloecke(HTML);
  assert.deepEqual(bloecke.map((b) => b.schluessel), ['gripszug', 'dreamteam', 'fotoverkauf', 'volleyball', 'buchhaltung']);
  for (const b of bloecke) {
    assert.equal((b.text.match(/<section\b/g) || []).length, 1, b.schluessel);
    assert.match(b.text, new RegExp(`data-referenz="${b.schluessel}"`));
  }
  assert.deepEqual(nummern(HTML), ['1 Gripszug', '2 DreamTeam', '3 Fotoverkauf', '4 Volleyballturnier', '5 Buchhaltung']);
});

test('Ein Link zeigt genau seine Referenzapps, in seiner Reihenfolge', () => {
  const html = zuschneiden(HTML, { referenzen: ['fotoverkauf', 'jass', 'gripszug', 'fotoverkauf'], zielgruppe: 'kmu' });
  assert.deepEqual(sektionen(html), ['software', 'fotos', 'projekte', 'ablauf', 'preise', 'motivation', 'gespraech']);
  assert.deepEqual(nummern(html), ['1 Fotoverkauf', '2 Gripszug']);
  assert.equal(html.includes('id="dreamteam"'), false);
  // „Referenzprojekte" in der Leiste führt zur ersten
  assert.match(html, /<a href="#fotos" data-referenzen>/);
  // Der Rest der Seite bleibt, wie er ist
  const ohne = (h) => h.slice(0, referenzBloecke(h)[0].anfang);
  assert.equal(ohne(html).replace('href="#fotos" data-referenzen', 'href="#projekte" data-referenzen'), ohne(HTML));
  assert.equal(html.slice(html.lastIndexOf('<!--/referenz-->')), HTML.slice(HTML.lastIndexOf('<!--/referenz-->')));
});

test('Jeder Text einer Zielgruppe hat seine Stelle in index.html, und gleiche Stellen sagen dasselbe', () => {
  const stellen = texte(HTML);
  for (const [schluessel, liste] of stellen) {
    assert.equal(new Set(liste).size, 1, `${schluessel} steht verschieden da`);
    assert.equal(liste[0].includes('<!--'), false, `${schluessel} ist verschachtelt`);
  }
  for (const [gruppe, eintraege] of Object.entries(ZIELGRUPPEN)) {
    for (const schluessel of Object.keys(eintraege)) {
      const getippt = HTML.includes(`data-zg-tippe="${schluessel}"`);
      assert.ok(stellen.has(schluessel) || getippt, `${gruppe}: ${schluessel} steht nicht in index.html`);
    }
  }
  // Beide Zielgruppen erzählen die ganze Geschichte, keine lässt eine Stelle aus
  const alle = [...stellen.keys(), 'wn-wunsch'].sort();
  for (const [gruppe, eintraege] of Object.entries(ZIELGRUPPEN)) {
    assert.deepEqual(Object.keys(eintraege).sort(), alle, gruppe);
  }
});

test('Für einen Verein erzählt die Seite vom Verein, im Rest bleibt sie gleich', () => {
  const html = zuschneiden(HTML, { referenzen: [], zielgruppe: 'verein' });
  assert.match(html, /<html[^>]* data-zielgruppe="verein">/);
  assert.match(html, /<h1 class="display"><!--zg:titel1-->Listen, Zettel, Excel\?<!--\/zg--><\/h1>/);
  assert.match(html, /<b class="wa-titel"><!--zg:wa-titel-->Sportclub Talbach<!--\/zg--><\/b>/);
  assert.match(html, /© 2009 <!--zg:wa-titel-->Sportclub Talbach<!--\/zg--> \|/);
  assert.match(html, /data-tippe="Grümpeli, 2 Kinder" data-zg-tippe="wn-wunsch"/);
  // In Kapitel 1 und 2 bleibt nichts von der Schreinerei; die Buchhaltung
  // weiter unten hat ihre eigene, als eines ihrer drei Objekte
  const erzaehlt = (h) => h.slice(h.indexOf('<section class="story" id="software"'), h.indexOf('<!--referenz:'));
  assert.equal(erzaehlt(html).includes('Schreinerei'), false);
  assert.equal(erzaehlt(html).includes('Garderobe'), false);
  // Ausserhalb der markierten Stellen ändert sich nichts
  const ohneMarken = (h) => h.replace(/<!--zg:[\w-]+-->[\s\S]*?<!--\/zg-->/g, '').replace(/data-tippe="[^"]*"/g, '').replace(/ data-zielgruppe="\w+"/, '');
  assert.equal(ohneMarken(html), ohneMarken(HTML));
});

test('Referenzapps und Zielgruppe zusammen, und eine unbekannte Zielgruppe ändert nichts', () => {
  const html = zuschneiden(HTML, { referenzen: ['dreamteam'], zielgruppe: 'schule' });
  assert.deepEqual(nummern(html), ['1 DreamTeam']);
  assert.match(html, /Schule Talbach/);
  assert.match(html, /<a href="#dreamteam" data-referenzen>/);
  assert.equal(zuschneiden(HTML, { referenzen: [], zielgruppe: '__proto__' }), HTML);
  assert.equal(zuschneiden(HTML, { referenzen: [], zielgruppe: 'rentner' }), HTML);
});

test('Das Volleyballturnier lässt sich wählen wie die anderen, auch als erstes', () => {
  const html = zuschneiden(HTML, { referenzen: ['volleyball', 'dreamteam'], zielgruppe: 'verein' });
  assert.deepEqual(sektionen(html), ['software', 'volleyball', 'dreamteam', 'ablauf', 'preise', 'motivation', 'gespraech']);
  assert.deepEqual(nummern(html), ['1 Volleyballturnier', '2 DreamTeam']);
  assert.match(html, /<a href="#volleyball" data-referenzen>/);
  // Der Anker der früheren Karte kommt mit seinem Kapitel
  assert.equal((html.match(/id="app-volleyball"/g) || []).length, 1);
  assert.equal(html.includes('id="projekte"'), false);
});

test('Die Buchhaltung zeigt keinen Firmennamen und keinen Link zur App', () => {
  const block = referenzBloecke(HTML).find((b) => b.schluessel === 'buchhaltung').text;
  assert.equal(/creart/i.test(block), false);
  assert.equal(block.includes('app-link'), false);
  const html = zuschneiden(HTML, { referenzen: ['buchhaltung'], zielgruppe: 'kmu' });
  assert.deepEqual(nummern(html), ['1 Buchhaltung']);
  assert.match(html, /<a href="#buchhaltung" data-referenzen>/);
  assert.equal((html.match(/id="app-buchhaltung"/g) || []).length, 1);
});
