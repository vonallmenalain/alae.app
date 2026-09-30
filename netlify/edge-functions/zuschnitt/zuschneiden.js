/**
 * Schneidet die Startseite auf einen Link zu
 * ==========================================
 *
 * Bekommt index.html und die Angaben der Verwaltung zu einem Code
 * ({ referenzen, zielgruppe }, siehe zuschnitt.js) und gibt die Seite so
 * zurück, wie sie für diesen Link aussehen soll:
 *
 *   Referenzapps  Die Kapitel stehen in index.html als Blöcke
 *                 <!--referenz:schluessel--> … <!--/referenz-->. Gezeigt
 *                 werden die gewählten, in der gewählten Reihenfolge; ihre
 *                 Nummer („Referenzapp 2") steht zwischen <!--nr--> und
 *                 <!--/nr-->. Der Eintrag „Referenzprojekte" in der
 *                 Kapitel-Leiste (data-referenzen) führt zur ersten, und
 *                 darunter stehen dieselben Apps in derselben Reihenfolge
 *                 (<!--leiste:schluessel--> … <!--/leiste-->).
 *                 Kennt die Seite keine der gewählten, bleibt alles, wie es
 *                 ist.
 *   Zielgruppe    Die Texte aus zielgruppen.js ersetzen die markierten
 *                 Stellen <!--zg:schluessel--> … <!--/zg-->.
 *
 * Nur Zeichenketten, kein DOM: Das läuft am Rand des Netzes vor jeder
 * Auslieferung mit Code und lässt sich ohne Netlify prüfen
 * (netlify/tests/zuschnitt.test.mjs). Was hier eingesetzt wird, kommt aus
 * index.html und zielgruppen.js, nie aus der Anfrage.
 */
import { ZIELGRUPPEN } from './zielgruppen.js';

const BLOCK = /<!--referenz:([\w-]+)-->[\s\S]*?<!--\/referenz-->/g;
const EINTRAG = /<!--leiste:([\w-]+)-->[\s\S]*?<!--\/leiste-->/g;
const TEXT = /<!--zg:([\w-]+)-->[\s\S]*?<!--\/zg-->/g;
const GETIPPT = /data-tippe="[^"]*"(\s+data-zg-tippe="([\w-]+)")/g;

/** Die Blöcke der Referenzapps, wie sie in index.html stehen. */
export function referenzBloecke(html) {
  return [...html.matchAll(BLOCK)].map((m) => ({ schluessel: m[1], text: m[0], anfang: m.index, ende: m.index + m[0].length }));
}

function referenzenZuschneiden(html, referenzen) {
  const bloecke = referenzBloecke(html);
  if (bloecke.length === 0 || !Array.isArray(referenzen)) return html;
  const nach = new Map(bloecke.map((b) => [b.schluessel, b]));
  const gewaehlt = [...new Set(referenzen)].filter((r) => nach.has(r)).map((r) => nach.get(r));
  if (gewaehlt.length === 0) return html;

  const erster = bloecke[0].anfang;
  const letzter = bloecke[bloecke.length - 1].ende;
  let nr = 0;
  const neu = gewaehlt
    .map((b) => b.text.replace(/<!--nr-->\d+<!--\/nr-->/g, () => `<!--nr-->${++nr}<!--/nr-->`))
    .join('\n\n');
  const zugeschnitten = html.slice(0, erster) + neu + html.slice(letzter);

  // „Referenzprojekte" in der Leiste führt zur ersten gezeigten App, und
  // darunter stehen genau die gezeigten
  const id = /<section[^>]*\sid="([\w-]+)"/.exec(gewaehlt[0].text)?.[1];
  const leiste = leisteZuschneiden(zugeschnitten, gewaehlt.map((b) => b.schluessel));
  return id ? leiste.replace(/href="#[\w-]+"(\s+data-referenzen)/g, `href="#${id}"$1`) : leiste;
}

/** Die Einträge der Referenzapps unter „Referenzprojekte", in dieser Reihenfolge. */
function leisteZuschneiden(html, schluessel) {
  const eintraege = [...html.matchAll(EINTRAG)];
  if (eintraege.length === 0) return html;
  const nach = new Map(eintraege.map((m) => [m[1], m[0]]));
  const erster = eintraege[0].index;
  const letzter = eintraege[eintraege.length - 1].index + eintraege[eintraege.length - 1][0].length;
  // Der Zeilenumbruch samt Einzug, wie er in index.html zwischen zwei Einträgen steht
  const zwischen = eintraege.length > 1 ? html.slice(erster + eintraege[0][0].length, eintraege[1].index) : '\n';
  const neu = schluessel.filter((s) => nach.has(s)).map((s) => nach.get(s)).join(zwischen);
  return html.slice(0, erster) + neu + html.slice(letzter);
}

function zielgruppeEinsetzen(html, zielgruppe) {
  const texte = Object.hasOwn(ZIELGRUPPEN, zielgruppe) ? ZIELGRUPPEN[zielgruppe] : null;
  if (!texte) return html;
  const attribut = (text) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return html
    .replace(TEXT, (ganz, schluessel) =>
      Object.hasOwn(texte, schluessel) ? `<!--zg:${schluessel}-->${texte[schluessel]}<!--/zg-->` : ganz,
    )
    .replace(GETIPPT, (ganz, rest, schluessel) =>
      Object.hasOwn(texte, schluessel) ? `data-tippe="${attribut(texte[schluessel])}"${rest}` : ganz,
    )
    .replace(/<html\b([^>]*)>/, (ganz, attribute) =>
      /data-zielgruppe=/.test(attribute) ? ganz : `<html${attribute} data-zielgruppe="${zielgruppe}">`,
    );
}

/** Die Seite für diesen Link. Ohne brauchbare Angaben bleibt sie, wie sie ist. */
export function zuschneiden(html, angaben) {
  if (!angaben || typeof angaben !== 'object') return html;
  return zielgruppeEinsetzen(referenzenZuschneiden(html, angaben.referenzen), angaben.zielgruppe);
}
