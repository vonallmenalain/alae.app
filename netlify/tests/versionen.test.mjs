/*
 * Tests für die Prüfsumme in der Adresse von Skripten und Stylesheets.
 *
 *   npm test
 *
 * Schlägt einer fehl, setzt `npm run versionen` die Prüfsummen neu. Warum
 * es sie braucht, steht in versionen.mjs.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { SEITEN, nachfuehren, pruefsumme, unerkannt } from './versionen.mjs';

const lesen = (seite) => readFileSync(new URL(`../../${seite}`, import.meta.url), 'utf8');

test('Jede Seite lädt Skripte und Stylesheets aus assets/ mit der Prüfsumme der Datei', () => {
  for (const seite of SEITEN) {
    const falsch = nachfuehren(lesen(seite)).falsch.map((f) => `${f.datei}: ?v=${f.alt ?? '(fehlt)'} statt ?v=${f.neu}`);
    assert.deepEqual(falsch, [], `${seite} – npm run versionen setzt die Prüfsummen neu`);
  }
});

test('Jeder Verweis auf ein Skript oder Stylesheet in assets/ steht so da, dass er eine Prüfsumme bekommt', () => {
  for (const seite of SEITEN) assert.deepEqual(unerkannt(lesen(seite)), [], seite);
});

test('Die Startseite lädt Stylesheet, Skript und Bibliotheken der Geschichte mit Prüfsumme', () => {
  const html = lesen('index.html');
  for (const datei of ['story.css', 'story.js', 'besuch.js', 'vendor/gsap.min.js', 'vendor/ScrollTrigger.min.js', 'vendor/CustomEase.min.js']) {
    assert.ok(html.includes(`"assets/${datei}?v=${pruefsumme(`assets/${datei}`)}"`), datei);
  }
});

test('Fehlt die Prüfsumme oder ist sie alt, setzt nachfuehren die richtige', () => {
  const v = pruefsumme('assets/story.js');
  assert.match(v, /^[0-9a-f]{8}$/);
  const { html, falsch } = nachfuehren('<script src="assets/story.js"></script>\n<link rel="stylesheet" href="assets/story.css?v=00000000">');
  assert.equal(html, `<script src="assets/story.js?v=${v}"></script>\n<link rel="stylesheet" href="assets/story.css?v=${pruefsumme('assets/story.css')}">`);
  assert.deepEqual(falsch.map((f) => [f.datei, f.alt]), [['assets/story.js', null], ['assets/story.css', '00000000']]);
  // Stimmt alles, bleibt die Seite, wie sie ist
  assert.deepEqual(nachfuehren(html), { html, falsch: [] });
  // Verweise in anderer Form fallen auf, statt still ohne Prüfsumme zu bleiben
  assert.deepEqual(unerkannt(`<script src='assets/story.js'></script><script src="/assets/besuch.js"></script>${html}`), ["src='assets/story.js", 'src="/assets/besuch.js']);
});
