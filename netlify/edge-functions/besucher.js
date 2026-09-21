/**
 * Besucherstatistik – Erfassung
 * =============================
 *
 * Läuft als Edge Function vor jeder Seitenauslieferung. Nur so bekommen wir
 * auch die Aufrufe mit, bei denen gar kein Browser mitspielt: Die Startseite
 * ist eine statische Datei, ein Skript im Browser würde Suchmaschinen-Robots
 * und automatische Scanner nie erfassen – also genau das, was uns interessiert.
 *
 * Geschrieben wird ein kleiner Eintrag pro Anfrage in den Netlify-Blob-Speicher
 * "besucher". Verdichtet und wieder gelöscht werden diese Einträge von
 * netlify/functions/statistik.mjs.
 *
 * Datenschutz: Die IP-Adresse wird nie gespeichert. Abgelegt werden nur
 *   - eine Tageskennung: SHA-256 aus Salz + IP + Datum, auf 12 Zeichen gekürzt.
 *     Sie erlaubt, Anfragen desselben Absenders innerhalb eines Tages zu
 *     zählen, und ist am nächsten Tag eine andere.
 *   - der grobe Adressbereich (IPv4 nur die ersten zwei Blöcke, IPv6 nur den
 *     ersten), damit sich ein auffälliger Absender überhaupt einordnen lässt.
 *
 * Reihenfolge am Rand: Netlify führt Edge Functions, die ihren Pfad in der
 * eigenen Datei festlegen, alphabetisch nach Dateinamen aus. "besucher.js"
 * läuft damit vor "schutz.js" – und das muss so bleiben: schutz.js beantwortet
 * Scanner-Pfade selbst mit 404, ohne die Kette fortzusetzen. Liefe es zuerst,
 * fehlten in der Statistik ausgerechnet die Anfragen, wegen denen sie gebaut
 * wurde. Wird eine der beiden Dateien umbenannt, muss die Reihenfolge in
 * netlify.toml unter [[edge_functions]] festgelegt werden.
 *
 * Was diese Funktion NICHT sieht: Aufrufe von www.alae.app. Netlify leitet
 * die Nebendomain mit einer 301 auf alae.app um, und zwar auf Domain-Ebene –
 * noch bevor Edge Functions starten. Im Netlify-Log sind solche Zeilen an
 * der Dauer erkennbar (unter einer Millisekunde, keine Primitives). Wer der
 * Umleitung folgt, landet als zweite Anfrage hier und wird gezählt; wer sie
 * ignoriert, taucht nirgends auf. Automatische Scanner tun meist Letzteres.
 * Die Statistik unterschätzt den Scanner-Anteil also – abstellen liesse sich
 * das nur, indem man die www-Umleitung aufgibt, und die ist erwünscht.
 *
 * Umgebungsvariablen (Netlify → Project configuration → Environment variables):
 *   STATISTIK_SALZ   Empfohlen. Lange zufällige Zeichenkette. Ohne Salz sind
 *                    die Tageskennungen theoretisch rückrechenbar.
 *   STATISTIK_AUS    Optional. "1" schaltet die Erfassung komplett ab.
 *
 * Hinweis: Die Zeitzonen-Hilfen unten stehen wortgleich in
 * netlify/functions/statistik.mjs. Die zwei Dateien laufen in verschiedenen
 * Laufzeitumgebungen (Deno am Rand, Node in der Function) und teilen sich
 * bewusst keinen Code. Wird hier etwas geändert, muss es dort mitgeändert
 * werden.
 */

import { getStore } from '@netlify/blobs';

const SPEICHER = 'besucher';
const ZEITZONE = 'Europe/Zurich';
const MAX_PFAD = 200;
const MAX_UA = 180;
const MAX_VERWEIS = 100;

export default async (request, context) => {
  const antwort = await context.next();

  try {
    if (Netlify.env.get('STATISTIK_AUS') !== '1') {
      // waitUntil: Die Antwort geht sofort raus, der Eintrag wird danach
      // geschrieben. Die Seite wird dadurch nicht langsamer.
      context.waitUntil(erfassen(request, context, antwort));
    }
  } catch (err) {
    // Statistik darf die Website niemals stören.
    console.error('Besucherstatistik: Eintrag nicht möglich.', err);
  }

  return antwort;
};

export const config = {
  path: '/*',
  excludedPath: [
    '/assets/*',
    '/.netlify/*',
    '/api/*',
    '/admin',
    '/admin.html',
  ],
  // Fällt diese Funktion aus, liefert Netlify die Seite ganz normal aus.
  onError: 'bypass',
};

async function erfassen(request, context, antwort) {
  const jetzt = new Date();
  const { datum, stunde } = lokaleZeit(jetzt);
  const url = new URL(request.url);
  const ip = context.ip || '';

  const eintrag = {
    z: jetzt.toISOString(),
    p: kuerzen(url.pathname, MAX_PFAD),
    q: url.search ? 1 : 0,
    m: request.method,
    s: antwort.status,
    l: (context.geo && context.geo.country && context.geo.country.code) || '??',
    b: await tageskennung(ip, datum),
    i: adressbereich(ip),
    u: kuerzen(request.headers.get('user-agent') || '', MAX_UA),
    r: verweisHost(request.headers.get('referer'), url.host),
  };

  const store = getStore(SPEICHER);
  const schluessel = `roh/${datum}/${stunde}/${jetzt.getTime()}-${zufall()}`;
  await store.setJSON(schluessel, eintrag);
}

/* --- Datenschutz-Hilfen -------------------------------------------------- */

/**
 * SHA-256 über Salz + IP + Datum, gekürzt auf 12 Zeichen. Aus der Kennung
 * lässt sich die IP-Adresse nicht zurückrechnen, solange das Salz geheim ist;
 * durch das Datum im Hash gilt sie ohnehin nur für einen Tag.
 */
async function tageskennung(ip, datum) {
  const salz = Netlify.env.get('STATISTIK_SALZ') || Netlify.env.get('SITE_ID') || 'alae';
  const roh = new TextEncoder().encode(`${salz}|${ip}|${datum}`);
  const hash = await crypto.subtle.digest('SHA-256', roh);
  return [...new Uint8Array(hash)]
    .slice(0, 6)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** IPv4 auf die ersten zwei Blöcke kürzen, IPv6 auf den ersten. */
function adressbereich(ip) {
  if (!ip) return '?';
  if (ip.includes(':')) {
    const erster = ip.split(':')[0];
    return `${erster || '0'}:…`;
  }
  const teile = ip.split('.');
  if (teile.length !== 4) return '?';
  return `${teile[0]}.${teile[1]}.x.x`;
}

/** Nur der Hostname der verweisenden Seite, nie die volle Adresse. */
function verweisHost(verweis, eigenerHost) {
  if (!verweis) return '';
  try {
    const host = new URL(verweis).host;
    return host && host !== eigenerHost ? kuerzen(host, MAX_VERWEIS) : '';
  } catch {
    return '';
  }
}

/* --- Kleinkram ----------------------------------------------------------- */

function kuerzen(wert, laenge) {
  return String(wert).slice(0, laenge);
}

function zufall() {
  return Math.random().toString(36).slice(2, 8);
}

/**
 * Datum und Stunde in Schweizer Zeit. Sonst lägen die Tagesgrenzen im Sommer
 * zwei Stunden daneben, und die Auswertung wäre verwirrend.
 */
function lokaleZeit(zeitpunkt) {
  const formatiert = new Intl.DateTimeFormat('sv-SE', {
    timeZone: ZEITZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(zeitpunkt);
  // ergibt "2026-09-21 14"
  return { datum: formatiert.slice(0, 10), stunde: formatiert.slice(11, 13) };
}
