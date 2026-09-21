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

/* Sperre gegen gleichzeitiges Verdichten. Zwei Aufrufe, die sich
   überschneiden, lesen dieselben Roheinträge und löschen sie beide – dabei
   kann einer Einträge wegräumen, die der andere noch nicht gelesen hat. Das
   passiert schneller als man denkt: Ein doppelt geladener Adminbereich
   genügt. Wer die Sperre nicht bekommt, zeigt die Zahlen trotzdem an,
   schreibt aber nichts fest und löscht nichts. */
const SPERRE = 'meta/verdichtung';
const SPERRE_DAUER = 30000;

/* Vermerk, an welchem Tag zuletzt aufgeräumt wurde. */
const AUFRAEUM_VERMERK = 'meta/aufgeraeumt';

/* Wie viele Speicherzugriffe gleichzeitig laufen dürfen. Alles auf einmal
   wäre bei einem Ansturm zu viel, eines nach dem anderen zu langsam. */
const BLOCK = 40;

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

  // Verdichten darf immer nur ein Aufruf gleichzeitig. Wer die Sperre nicht
  // bekommt, liest und zeigt an – mehr nicht.
  const verdichten = await sperreHolen(store, jetzt);

  try {
    const zeit = {
      // Alles ab hier liegt in der Zukunft und kann keine Einträge haben.
      jetzt: lokaleZeit(jetzt),
      // Eine Stunde gilt als abgeschlossen, wenn sie mehr als eine Stunde
      // zurückliegt. Der Abstand ist Absicht: Ein Eintrag, der genau auf der
      // Stundengrenze geschrieben wird, soll nicht in dem Moment weggeräumt
      // werden, in dem die Auswertung die Stunde für fertig erklärt.
      grenze: lokaleZeit(new Date(jetzt.getTime() - 3600000)),
    };

    // Die Tage nebeneinander statt nacheinander: vierzehn Tage waren vierzehn
    // Speicherzugriffe hintereinander, jeder mit seiner eigenen Wartezeit.
    const daten = await Promise.all(
      letzteTage(jetzt, tage).map((datum) => tageswert(store, datum, zeit, verdichten)),
    );

    if (verdichten) await aufraeumen(store, jetzt);

    return json({
      erstellt: jetzt.toISOString(),
      zeitzone: ZEITZONE,
      verdichtet: verdichten,
      tage: daten.reverse(), // ältester Tag zuerst, so wird auch gezeichnet
    });
  } finally {
    if (verdichten) await sperreFreigeben(store);
  }
};

/* --- Sperre -------------------------------------------------------------- */

/** true, wenn dieser Aufruf verdichten darf. */
async function sperreHolen(store, jetzt) {
  const sperre = await store.get(SPERRE, { type: 'json' }).catch(() => null);
  if (sperre && Number(sperre.bis) > jetzt.getTime()) return false;
  await store.setJSON(SPERRE, { bis: jetzt.getTime() + SPERRE_DAUER });
  return true;
}

async function sperreFreigeben(store) {
  await store.setJSON(SPERRE, { bis: 0 }).catch(() => {});
}

/** Arbeitet eine Liste in Blöcken ab: innerhalb eines Blocks gleichzeitig,
    die Blöcke nacheinander. */
async function inBloecken(werte, arbeit) {
  for (let i = 0; i < werte.length; i += BLOCK) {
    await Promise.all(werte.slice(i, i + BLOCK).map((wert) => arbeit(wert)));
  }
}

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
 * Wichtig: Als fertig vermerkt wird eine abgeschlossene Stunde auch dann,
 * wenn sie leer war. Vorher geschah das nur für Stunden mit Einträgen –
 * und weil die allermeisten Stunden leer sind, wurden sie bei JEDEM Aufruf
 * neu abgefragt. Ein Tag ohne Verkehr kostete so dauerhaft 24 Zugriffe,
 * vierzehn Tage entsprechend 336. Genau daher kamen die zweistelligen
 * Sekundenwerte.
 *
 * @param zeit { jetzt, grenze } – beides { datum, stunde } in Schweizer Zeit.
 */
async function tageswert(store, datum, zeit, verdichten) {
  const gespeichert = (await store.get(`tag/${datum}`, { type: 'json' })) || leererTag(datum);
  const fertig = new Set(gespeichert.stundenFertig || []);

  const offen = [];
  for (let i = 0; i < 24; i++) {
    const stunde = String(i).padStart(2, '0');
    if (fertig.has(stunde)) continue;
    // Stunden, die noch bevorstehen, gar nicht erst abfragen. Beim Blick auf
    // den heutigen Tag am Vormittag sind das die meisten.
    if (datum === zeit.jetzt.datum && stunde > zeit.jetzt.stunde) continue;
    offen.push(stunde);
  }

  // Die offenen Stunden nebeneinander lesen. Bereits verdichtete Stunden
  // stehen in `stundenFertig` und kosten gar keinen Zugriff mehr.
  const gelesen = await Promise.all(
    offen.map((stunde) =>
      stundeLesen(store, datum, stunde).then((eintraege) => ({ stunde, ...eintraege })),
    ),
  );

  const anzeige = kopie(gespeichert);
  let gespeichertGeaendert = false;
  const zuLoeschen = [];

  for (const { stunde, schluessel, werte } of gelesen) {
    // Angezeigt wird alles, auch die laufende Stunde.
    for (const eintrag of werte) einrechnen(anzeige, eintrag);

    // Festgeschrieben nur, was abgeschlossen ist – und nur, wenn dieser
    // Aufruf die Sperre hat.
    const abgeschlossen = datum < zeit.grenze.datum
      || (datum === zeit.grenze.datum && stunde < zeit.grenze.stunde);
    if (!abgeschlossen || !verdichten) continue;

    for (const eintrag of werte) einrechnen(gespeichert, eintrag);
    // Auch ohne Einträge vermerken – sonst wird die leere Stunde für immer
    // wieder abgefragt.
    fertig.add(stunde);
    gespeichertGeaendert = true;
    zuLoeschen.push(...schluessel);
  }

  if (gespeichertGeaendert) {
    gespeichert.stundenFertig = [...fertig].sort();
    aufraeumenListen(gespeichert);

    // Reihenfolge ist wichtig: erst den Tageswert festschreiben, dann die
    // Einzeleinträge löschen. Vorher war es umgekehrt – bricht die Funktion
    // dazwischen ab, sind die Einträge weg und nirgends eingerechnet. So
    // herum bleiben sie im schlechtesten Fall liegen und werden beim
    // nächsten Aufräumen entsorgt; gezählt sind sie bereits.
    await store.setJSON(`tag/${datum}`, gespeichert);
    await inBloecken(zuLoeschen, (schluessel) => store.delete(schluessel));
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

/**
 * Löscht Tageswerte, die älter sind als die Aufbewahrungsfrist, und
 * Einzeleinträge von Tagen, die längst verdichtet sein müssten.
 *
 * Läuft höchstens einmal pro Tag. Vorher geschah das bei JEDEM Aufruf des
 * Adminbereichs – und dazu gehört ein `list` über sämtliche Einzeleinträge.
 * Bei ein paar tausend Scanner-Anfragen am Tag ist das die mit Abstand
 * teuerste Stelle der ganzen Funktion, und sie hat fast nie etwas zu tun.
 */
async function aufraeumen(store, jetzt) {
  const heute = lokaleZeit(jetzt).datum;
  const vermerk = await store.get(AUFRAEUM_VERMERK, { type: 'json' }).catch(() => null);
  if (vermerk && vermerk.datum === heute) return;

  const frist = Number(process.env.STATISTIK_AUFBEWAHRUNG_TAGE) || STANDARD_AUFBEWAHRUNG;
  const grenze = lokaleZeit(new Date(jetzt.getTime() - frist * 86400000)).datum;
  const vorgestern = lokaleZeit(new Date(jetzt.getTime() - 2 * 86400000)).datum;

  const { blobs } = await store.list({ prefix: 'tag/' });
  await inBloecken(
    blobs.filter((blob) => blob.key.slice(4) < grenze).map((blob) => blob.key),
    (schluessel) => store.delete(schluessel),
  );

  // Einzeleinträge, die keine Auswertung mehr erreicht hat (etwa weil der
  // Adminbereich tagelang nicht geöffnet wurde), verfallen ebenfalls.
  const roh = await store.list({ prefix: 'roh/' });
  await inBloecken(
    roh.blobs.filter((blob) => blob.key.slice(4, 14) < vorgestern).map((blob) => blob.key),
    (schluessel) => store.delete(schluessel),
  );

  await store.setJSON(AUFRAEUM_VERMERK, { datum: heute });
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
