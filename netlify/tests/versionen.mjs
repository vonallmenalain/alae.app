/*
 * Prüfsumme in der Adresse von Skripten und Stylesheets
 * =====================================================
 *
 *   npm run versionen   setzt die Prüfsummen in allen Seiten neu
 *   npm test            schlägt fehl, solange eine nicht stimmt
 *
 * Netlify gibt alles unter /assets/ mit einer Woche Cache aus (netlify.toml),
 * die HTML-Seiten holt der Browser dagegen jedes Mal neu. Bliebe die Adresse
 * von story.js gleich, nähme ein Browser, der die Seite in dieser Woche
 * schon besucht hat, zur neuen index.html das alte Skript – und Kapitel,
 * die es noch nicht kennt, blieben schwarz. Darum steht hinter jedem Skript
 * und Stylesheet aus assets/ der Anfang seiner Prüfsumme (?v=…): Ändert
 * sich die Datei, ändert sich die Adresse, und jeder Browser holt sie neu.
 *
 * Liegt bei den Tests, weil /netlify/* nicht ausgeliefert wird.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const WURZEL = new URL('../../', import.meta.url);

/** Die Seiten der Website: jede .html-Datei im obersten Ordner. */
export const SEITEN = readdirSync(WURZEL).filter((datei) => datei.endsWith('.html')).sort();

// src="assets/….js" oder href="assets/….css", mit oder ohne ?v=…
const VERWEIS = /((?:src|href)=")(assets\/[\w./-]+?\.(?:js|css))(?:\?v=([\w-]*))?"/g;
// Jeder Verweis auf ein Skript oder Stylesheet in assets/, in welcher Form
// auch immer: Was VERWEIS davon nicht erkennt, bekäme keine Prüfsumme
const JEDER = /(?:src|href)=["']?[./]*assets\/[^"'\s>]*?\.(?:js|css)\b/g;

/** Der Anfang der Prüfsumme einer Datei, etwa „assets/story.js". Zeilenenden
    zählen nicht, damit unter Windows dieselbe herauskommt. */
export function pruefsumme(datei) {
  const text = readFileSync(new URL(datei, WURZEL), 'utf8').replace(/\r\n/g, '\n');
  return createHash('sha256').update(text).digest('hex').slice(0, 8);
}

/** Die Seite mit den richtigen Prüfsummen, dazu jeder Verweis, der nicht stimmte. */
export function nachfuehren(html) {
  const falsch = [];
  const neu = html.replace(VERWEIS, (ganz, attribut, datei, alt) => {
    const v = pruefsumme(datei);
    if (alt !== v) falsch.push({ datei, alt: alt ?? null, neu: v });
    return `${attribut}${datei}?v=${v}"`;
  });
  return { html: neu, falsch };
}

/** Verweise auf Skripte und Stylesheets in assets/, die nicht in der Form src="assets/…" stehen. */
export function unerkannt(html) {
  const erkannt = new Set([...html.matchAll(VERWEIS)].map((m) => m.index));
  return [...html.matchAll(JEDER)].filter((m) => !erkannt.has(m.index)).map((m) => m[0]);
}

// npm run versionen
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let geaendert = 0;
  for (const seite of SEITEN) {
    const pfad = new URL(seite, WURZEL);
    const { html, falsch } = nachfuehren(readFileSync(pfad, 'utf8'));
    for (const datei of unerkannt(html)) console.warn(`${seite}: ${datei} – bitte als src="assets/…" oder href="assets/…" schreiben`);
    if (falsch.length === 0) continue;
    writeFileSync(pfad, html);
    for (const f of falsch) console.log(`${seite}: ${f.datei}?v=${f.neu}${f.alt ? ` (war ${f.alt})` : ''}`);
    geaendert += falsch.length;
  }
  if (geaendert === 0) console.log('Alle Prüfsummen stimmen.');
}
