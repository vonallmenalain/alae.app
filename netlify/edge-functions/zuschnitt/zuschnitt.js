/**
 * Die Startseite pro Link
 * =======================
 *
 * Links aus der Verwaltung (Werbemails, Instagram, Google Ads …) führen auf
 * alae.app/?ref=<code>. Zu diesem Code fragt die Funktion die Verwaltung,
 * welche Referenzapps die Seite zeigen soll und für welche Zielgruppe sie
 * erzählt, und schneidet die Seite zu, bevor sie hinausgeht
 * (zuschneiden.js). So steht sie beim Besucher gleich richtig da, ohne
 * nachträgliches Umspringen, auch ohne Skript. Namen oder Adressen erfährt
 * alae.app dabei nie.
 *
 *   Frage:   GET https://administration.alae.app/ref/<code>
 *   Antwort: { "referenzen": ["dreamteam", "gripszug"], "zielgruppe": "verein" }
 *
 * Ohne Code, mit unbekanntem Code oder wenn die Verwaltung nicht rechtzeitig
 * antwortet, geht die Seite unverändert hinaus. Die Antworten merkt sich die
 * Funktion eine Minute lang, damit ein Besucher, der mehrmals lädt, nicht
 * jedes Mal fragt.
 *
 * Reihenfolge am Rand: Netlify führt Edge Functions, die ihren Pfad in der
 * eigenen Datei festlegen, alphabetisch nach Namen aus. "zuschnitt" läuft
 * nach "besucher" und "schutz"; die Statistik (besucher.js) sieht so die
 * zugeschnittene Antwort.
 */
import { zuschneiden } from './zuschneiden.js';

const VERWALTUNG = 'https://administration.alae.app';
const CODE = /^[2-9abcdefghjkmnpqrstuvwxyz]{7}$/;
const FRIST_MS = 1500;
const MERKEN_MS = 60_000;
const gemerkt = new Map();

/** Die Angaben der Verwaltung zu einem Code, sonst null. */
async function nachfragen(code) {
  const alt = gemerkt.get(code);
  if (alt && alt.bis > Date.now()) return alt.angaben;
  let angaben = null;
  try {
    const antwort = await fetch(`${VERWALTUNG}/ref/${code}`, { signal: AbortSignal.timeout(FRIST_MS) });
    if (antwort.ok) {
      const daten = await antwort.json();
      if (daten && Array.isArray(daten.referenzen) && typeof daten.zielgruppe === 'string') {
        angaben = { referenzen: daten.referenzen.filter((r) => typeof r === 'string'), zielgruppe: daten.zielgruppe };
      }
    } else if (antwort.status !== 404) {
      // Die Verwaltung ist gerade nicht erreichbar: nicht merken, beim
      // nächsten Aufruf nochmals fragen
      return null;
    }
  } catch (fehler) {
    console.error('zuschnitt: Verwaltung nicht erreichbar:', fehler && fehler.name);
    return null;
  }
  if (gemerkt.size > 500) gemerkt.clear();
  gemerkt.set(code, { angaben, bis: Date.now() + MERKEN_MS });
  return angaben;
}

export default async (request, context) => {
  if (request.method !== 'GET') return;
  const code = (new URL(request.url).searchParams.get('ref') || '').trim().toLowerCase();
  if (!CODE.test(code)) return;

  const angaben = await nachfragen(code);
  if (!angaben) return;

  const antwort = await context.next();
  const art = antwort.headers.get('content-type') || '';
  if (antwort.status !== 200 || !art.includes('text/html')) return antwort;

  const html = zuschneiden(await antwort.text(), angaben);
  const kopf = new Headers(antwort.headers);
  kopf.delete('content-length');
  kopf.delete('etag');
  kopf.set('cache-control', 'private, no-store');
  return new Response(html, { status: 200, headers: kopf });
};

export const config = {
  path: '/',
  // Fällt diese Funktion aus, liefert Netlify die Seite, wie sie ist.
  onError: 'bypass',
};
