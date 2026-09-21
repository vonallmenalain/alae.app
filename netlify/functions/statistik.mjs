/**
 * Besucherstatistik – Auswertung für den Adminbereich
 * ===================================================
 *
 * Liest die Einträge, die netlify/edge-functions/besucher.js schreibt,
 * verdichtet sie zu Tageswerten und gibt sie als JSON an admin.html.
 *
 * Aufruf:  GET /api/statistik?tage=14
 *          Header: Authorization: Bearer <ADMIN_PASSWORT>
 *
 * Umgebungsvariablen (Netlify → Project configuration → Environment variables):
 *   ADMIN_PASSWORT               Pflicht. Ohne diese Variable ist der
 *                                Adminbereich gesperrt. Lang und zufällig
 *                                wählen – es gibt nur dieses eine Geheimnis.
 *   STATISTIK_AUFBEWAHRUNG_TAGE  Optional, Standard 90. Ältere Tageswerte
 *                                werden bei jedem Aufruf gelöscht.
 *
 * Verdichtung: Jede abgeschlossene Stunde wird einmal in den Tageswert
 * eingerechnet; die Einzeleinträge dieser Stunde werden danach gelöscht.
 * Gespeichert bleiben also nur Summen – und die laufende Stunde.
 *
 * Hinweis: Die Zeitzonen-Hilfe unten steht wortgleich in
 * netlify/edge-functions/besucher.js, siehe Kommentar dort.
 */

import { getStore } from '@netlify/blobs';

const SPEICHER = 'besucher';
const ZEITZONE = 'Europe/Zurich';
const STANDARD_TAGE = 14;
const MAX_TAGE = 90;
const STANDARD_AUFBEWAHRUNG = 90;

/* Wie viele Einträge eine Liste höchstens behält. Ohne Deckel würde ein
   einzelner Scanner mit tausend verschiedenen Pfaden den Tageswert aufblähen. */
const DECKEL = { pfade: 150, absender: 200, verweise: 60, browser: 60, auffaelligePfade: 80 };

/* Pfade, die kein normaler Besuch je aufruft: Suche nach WordPress, nach
   Konfigurationsdateien, nach offenen Schnittstellen. Treffer zählen als
   auffällig und erscheinen im Adminbereich zuoberst. */
const AUFFAELLIG = [
  /wp-(admin|login|content|includes)/i,
  /xmlrpc\.php/i,
  /\.env($|[^a-z])/i,
  /\.git($|\/)/i,
  /\.(sql|bak|old|zip|tar|gz|pem|key)$/i,
  /phpmyadmin|pma|adminer/i,
  /\.php($|\?)/i,
  /\/(cgi-bin|vendor|actuator|solr|struts|jenkins|telescope|_ignition)/i,
  /(eval-stdin|phpunit|shell|cmd|invoker)/i,
  /\/(config|credentials|secrets?)(\.|\/|$)/i,
  /\/\.(aws|ssh|vscode|idea|well-known\/security)/i,
  /aws\/credentials|id_rsa/i,
  /\/(owa|autodiscover|ews|boaform|hnap1|setup\.cgi)/i,
];

const ROBOT = /bot|crawler|spider|slurp|bingpreview|headless|python-requests|curl\/|wget|go-http|java\/|libwww|okhttp|scrapy|zgrab|masscan|nmap|httpx/i;

export default async (request) => {
  const geprueft = pruefen(request);
  if (geprueft) return geprueft;

  const url = new URL(request.url);
  const tage = Math.min(Math.max(Number(url.searchParams.get('tage')) || STANDARD_TAGE, 1), MAX_TAGE);

  const store = getStore({ name: SPEICHER, consistency: 'strong' });
  const jetzt = new Date();
  const heute = lokaleZeit(jetzt).datum;

  const daten = [];
  for (const datum of letzteTage(jetzt, tage)) {
    daten.push(await tageswert(store, datum, datum === heute ? lokaleZeit(jetzt).stunde : null));
  }

  await aufraeumen(store, jetzt);

  return json({
    erstellt: jetzt.toISOString(),
    zeitzone: ZEITZONE,
    tage: daten.reverse(), // ältester Tag zuerst, so wird auch gezeichnet
  });
};

/* --- Zugang -------------------------------------------------------------- */

function pruefen(request) {
  if (request.method !== 'GET') return json({ fehler: 'Nur GET erlaubt.' }, 405);

  const passwort = process.env.ADMIN_PASSWORT || '';
  if (!passwort) {
    console.error('ADMIN_PASSWORT ist nicht gesetzt – Adminbereich gesperrt.');
    return json({ fehler: 'Der Adminbereich ist noch nicht eingerichtet.' }, 503);
  }

  const kopf = request.headers.get('authorization') || '';
  const gesendet = kopf.startsWith('Bearer ') ? kopf.slice(7) : '';
  if (!gleich(gesendet, passwort)) {
    return json({ fehler: 'Passwort stimmt nicht.' }, 401);
  }
  return null;
}

/** Vergleich ohne Zeitunterschied, damit sich das Passwort nicht Zeichen für
    Zeichen erraten lässt. */
function gleich(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const laenge = Math.max(a.length, b.length);
  let unterschied = a.length ^ b.length;
  for (let i = 0; i < laenge; i++) {
    unterschied |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return unterschied === 0;
}

/* --- Verdichtung --------------------------------------------------------- */

/**
 * Tageswert eines Datums: gespeicherte Summen plus alles, was seit der
 * letzten Verdichtung dazugekommen ist. Abgeschlossene Stunden werden dabei
 * gespeichert und ihre Einzeleinträge gelöscht.
 *
 * @param laufendeStunde "14" wenn das Datum heute ist, sonst null.
 */
async function tageswert(store, datum, laufendeStunde) {
  const gespeichert = (await store.get(`tag/${datum}`, { type: 'json' })) || leererTag(datum);
  const fertig = new Set(gespeichert.stundenFertig || []);

  let gespeichertGeaendert = false;
  const anzeige = kopie(gespeichert);

  for (let i = 0; i < 24; i++) {
    const stunde = String(i).padStart(2, '0');
    if (fertig.has(stunde)) continue;

    const eintraege = await stundeLesen(store, datum, stunde);
    if (!eintraege.schluessel.length) continue;

    const abgeschlossen = laufendeStunde === null || stunde < laufendeStunde;
    if (abgeschlossen) {
      for (const eintrag of eintraege.werte) einrechnen(gespeichert, eintrag);
      fertig.add(stunde);
      gespeichert.stundenFertig = [...fertig].sort();
      gespeichertGeaendert = true;
      for (const schluessel of eintraege.schluessel) await store.delete(schluessel);
      for (const eintrag of eintraege.werte) einrechnen(anzeige, eintrag);
    } else {
      // Laufende Stunde: nur anzeigen, noch nicht festschreiben.
      for (const eintrag of eintraege.werte) einrechnen(anzeige, eintrag);
    }
  }

  if (gespeichertGeaendert) {
    aufraeumenListen(gespeichert);
    await store.setJSON(`tag/${datum}`, gespeichert);
  }

  aufraeumenListen(anzeige);
  return anzeige;
}

async function stundeLesen(store, datum, stunde) {
  const { blobs } = await store.list({ prefix: `roh/${datum}/${stunde}/` });
  const schluessel = blobs.map((b) => b.key);
  const werte = [];

  // In Blöcken lesen: alles auf einmal wäre bei einem Ansturm zu viel,
  // nacheinander zu langsam.
  for (let i = 0; i < schluessel.length; i += 40) {
    const teil = await Promise.all(
      schluessel.slice(i, i + 40).map((k) => store.get(k, { type: 'json' }).catch(() => null)),
    );
    for (const eintrag of teil) if (eintrag) werte.push(eintrag);
  }
  return { schluessel, werte };
}

function leererTag(datum) {
  return {
    datum,
    anfragen: 0,
    auffaellig: 0,
    robots: 0,
    stundenFertig: [],
    stunden: Array(24).fill(0),
    laender: {},
    pfade: {},
    status: {},
    absender: {},
    verweise: {},
    browser: {},
    auffaelligePfade: {},
  };
}

function einrechnen(tag, eintrag) {
  const stunde = stundeVon(eintrag.z);
  const pfad = (eintrag.p || '/') + (eintrag.q ? '?…' : '');
  const robot = ROBOT.test(eintrag.u || '');
  const merkwuerdig = istAuffaellig(pfad, eintrag.s);

  tag.anfragen += 1;
  if (robot) tag.robots += 1;
  if (merkwuerdig) tag.auffaellig += 1;
  if (stunde >= 0 && stunde < 24) tag.stunden[stunde] = (tag.stunden[stunde] || 0) + 1;

  zaehlen(tag.laender, eintrag.l || '??');
  zaehlen(tag.pfade, pfad);
  zaehlen(tag.status, String(eintrag.s || 0));
  zaehlen(tag.browser, browserName(eintrag.u || ''));
  if (eintrag.r) zaehlen(tag.verweise, eintrag.r);
  if (merkwuerdig) zaehlen(tag.auffaelligePfade, pfad);

  const kennung = eintrag.b || '?';
  const absender = tag.absender[kennung] || {
    anfragen: 0, auffaellig: 0, fehler: 0, land: eintrag.l || '??',
    bereich: eintrag.i || '?', browser: browserName(eintrag.u || ''), robot,
  };
  absender.anfragen += 1;
  if (merkwuerdig) absender.auffaellig += 1;
  if (Number(eintrag.s) >= 400) absender.fehler += 1;
  tag.absender[kennung] = absender;
}

/** Stunde des Eintrags in Schweizer Zeit, oder -1 wenn der Zeitstempel fehlt. */
function stundeVon(zeitstempel) {
  const zeitpunkt = new Date(zeitstempel || '');
  if (Number.isNaN(zeitpunkt.getTime())) return -1;
  return Number(lokaleZeit(zeitpunkt).stunde);
}

function istAuffaellig(pfad, status) {
  if (AUFFAELLIG.some((muster) => muster.test(pfad))) return true;
  // Ein 404 auf einen Pfad, den es nie gab, ist für sich noch kein Angriff –
  // aber es ist genau das Muster, das beim Absuchen entsteht.
  return Number(status) === 404 && pfad !== '/' && !pfad.startsWith('/?');
}

function browserName(ua) {
  if (!ua) return 'unbekannt';
  const bekannt = [
    [/googlebot/i, 'Googlebot'], [/bingbot/i, 'Bingbot'], [/duckduckbot/i, 'DuckDuckBot'],
    [/yandex/i, 'YandexBot'], [/baiduspider/i, 'Baiduspider'], [/applebot/i, 'Applebot'],
    [/(gptbot|oai-searchbot|chatgpt-user)/i, 'GPTBot'], [/claudebot|anthropic/i, 'ClaudeBot'],
    [/perplexitybot/i, 'PerplexityBot'], [/ahrefs/i, 'AhrefsBot'], [/semrush/i, 'SemrushBot'],
    [/facebookexternalhit|meta-external/i, 'Facebook'], [/twitterbot/i, 'Twitterbot'],
    [/linkedinbot/i, 'LinkedInBot'], [/whatsapp/i, 'WhatsApp'], [/telegrambot/i, 'Telegram'],
    [/uptimerobot|pingdom|statuscake/i, 'Überwachung'],
    [/python-requests|aiohttp|httpx/i, 'Python-Skript'], [/curl\//i, 'curl'], [/wget/i, 'wget'],
    [/go-http/i, 'Go-Skript'], [/java\//i, 'Java-Skript'], [/zgrab|masscan|nmap/i, 'Scanner'],
    [/headless/i, 'Headless-Browser'],
    [/edg\//i, 'Edge'], [/opr\/|opera/i, 'Opera'], [/firefox/i, 'Firefox'],
    [/chrome|crios/i, 'Chrome'], [/safari/i, 'Safari'],
  ];
  for (const [muster, name] of bekannt) if (muster.test(ua)) return name;
  return ROBOT.test(ua) ? 'anderer Robot' : 'anderer Browser';
}

function zaehlen(objekt, schluessel) {
  objekt[schluessel] = (objekt[schluessel] || 0) + 1;
}

/** Listen auf die grössten Einträge eindampfen, damit der Tageswert klein bleibt. */
function aufraeumenListen(tag) {
  tag.pfade = groesste(tag.pfade, DECKEL.pfade);
  tag.verweise = groesste(tag.verweise, DECKEL.verweise);
  tag.browser = groesste(tag.browser, DECKEL.browser);
  tag.auffaelligePfade = groesste(tag.auffaelligePfade, DECKEL.auffaelligePfade);
  tag.absender = groesste(tag.absender, DECKEL.absender, (a) => a.anfragen);
}

function groesste(objekt, anzahl, wert = (v) => v) {
  const eintraege = Object.entries(objekt);
  if (eintraege.length <= anzahl) return objekt;
  eintraege.sort((a, b) => wert(b[1]) - wert(a[1]));
  return Object.fromEntries(eintraege.slice(0, anzahl));
}

function kopie(objekt) {
  return JSON.parse(JSON.stringify(objekt));
}

/* --- Aufbewahrung -------------------------------------------------------- */

/** Löscht Tageswerte, die älter sind als die Aufbewahrungsfrist, und
    Einzeleinträge von Tagen, die längst verdichtet sein müssten. */
async function aufraeumen(store, jetzt) {
  const frist = Number(process.env.STATISTIK_AUFBEWAHRUNG_TAGE) || STANDARD_AUFBEWAHRUNG;
  const grenze = lokaleZeit(new Date(jetzt.getTime() - frist * 86400000)).datum;
  const vorgestern = lokaleZeit(new Date(jetzt.getTime() - 2 * 86400000)).datum;

  const { blobs } = await store.list({ prefix: 'tag/' });
  for (const blob of blobs) {
    if (blob.key.slice(4) < grenze) await store.delete(blob.key);
  }

  // Einzeleinträge, die keine Auswertung mehr erreicht hat (etwa weil der
  // Adminbereich tagelang nicht geöffnet wurde), verfallen ebenfalls.
  const roh = await store.list({ prefix: 'roh/' });
  for (const blob of roh.blobs) {
    const datum = blob.key.slice(4, 14);
    if (datum < vorgestern) await store.delete(blob.key);
  }
}

/* --- Kleinkram ----------------------------------------------------------- */

function letzteTage(jetzt, anzahl) {
  const tage = [];
  for (let i = 0; i < anzahl; i++) {
    tage.push(lokaleZeit(new Date(jetzt.getTime() - i * 86400000)).datum);
  }
  return tage;
}

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

function json(koerper, status = 200) {
  return new Response(JSON.stringify(koerper), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
