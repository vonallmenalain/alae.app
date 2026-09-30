/**
 * Besuch bestätigen: /api/besuch
 * ==============================
 *
 * Kam jemand über einen Link mit Code auf die Startseite (?ref=<code>) und
 * scrollt darin, meldet die Seite das einmal hierher (assets/besuch.js).
 * Die Funktion gibt es an die Verwaltung weiter, zusammen mit dem, was der
 * Browser ohnehin über sich sagt: Kennung, erste Sprache, Land und die
 * verweisende Seite. Die IP-Adresse geht nicht mit.
 *
 *   an: POST https://administration.alae.app/ref/<code>/besuch
 *
 * Der Weg über alae.app hat zwei Gründe: Die Content-Security-Policy
 * (netlify.toml) erlaubt der Seite nur Anfragen an alae.app selbst. Und die
 * Verwaltung nimmt einen Besuch nur mit dem gemeinsamen Schlüssel an, den
 * nur diese Funktion kennt; sonst könnte jeder, der einen Code kennt,
 * Besuche erfinden.
 *
 * Umgebungsvariable (Netlify → Project configuration → Environment
 * variables, derselbe Wert wie in der Verwaltung):
 *   BESUCH_SCHLUESSEL   Pflicht für diese Funktion. Ohne ihn gibt sie
 *                       nichts weiter; die Seite merkt davon nichts.
 *
 * Die Antwort ist immer dieselbe, auch zu unbekannten Codes und wenn die
 * Verwaltung nicht antwortet: Die Seite wartet nicht darauf, und verraten
 * wird nichts. Datenschutzerklärung, Ziffer 8.
 */
const VERWALTUNG = 'https://administration.alae.app';
const CODE = /^[2-9abcdefghjkmnpqrstuvwxyz]{7}$/;

function kurz(wert, laenge) {
  return typeof wert === 'string' ? wert.trim().slice(0, laenge) : '';
}

export default async (request, context) => {
  if (request.method !== 'POST') {
    return new Response(null, { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } });
  }
  let daten = null;
  try {
    daten = await request.json();
  } catch {
    // leer oder kein JSON: nichts weiterzugeben
  }
  const code = kurz(daten && daten.code, 7).toLowerCase();
  const schluessel = kurz(process.env.BESUCH_SCHLUESSEL, 500);
  if (CODE.test(code) && !schluessel) console.error('besuch: BESUCH_SCHLUESSEL fehlt, nichts weitergegeben');
  if (CODE.test(code) && schluessel) {
    const besuch = {
      ua: kurz(request.headers.get('user-agent'), 300),
      sprache: kurz(request.headers.get('accept-language'), 60),
      land: kurz(context && context.geo && context.geo.country && context.geo.country.code, 2),
      verweis: kurz(daten.verweis, 100),
    };
    try {
      const antwort = await fetch(`${VERWALTUNG}/ref/${code}/besuch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${schluessel}` },
        body: JSON.stringify(besuch),
        signal: AbortSignal.timeout(3000),
      });
      if (!antwort.ok) console.error('besuch: Verwaltung antwortet mit', antwort.status);
    } catch (fehler) {
      console.error('besuch: nicht weitergegeben:', fehler && fehler.name);
    }
  }
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
};

/* Eine Seite meldet höchstens einmal pro Aufruf. Zehn Meldungen pro Minute
   und Besucher reichen auch für jemanden, der mehrmals neu lädt. */
export const config = {
  path: '/api/besuch',
  rateLimit: {
    windowSize: 60,
    windowLimit: 10,
    aggregateBy: ['ip', 'domain'],
  },
};
