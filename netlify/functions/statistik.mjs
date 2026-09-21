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

/* Vermerk, dass gerade verdichtet wird. Das spart doppelte Arbeit, wenn
   der Adminbereich zweimal geladen wird – eine echte Sperre ist es NICHT:
   Zwischen dem Lesen und dem Schreiben dieses Vermerks liegt ein
   Speicherzugriff, und in dieses Fenster passen zwei Aufrufe. Netlify Blobs
   8.2 kennt keine bedingten Schreibzugriffe (kein onlyIfNew, kein
   onlyIfMatch), ein wirklich atomares Sperren ist damit nicht möglich.

   Deshalb verlässt sich unten nichts auf Ausschluss: Die Verdichtung ist so
   gebaut, dass zwei gleichzeitige Durchläufe dasselbe Ergebnis liefern.
   Siehe den Kommentar bei tageswert(). */
const VERDICHTUNG_LAEUFT = 'meta/verdichtung';
const VERDICHTUNG_DAUER = 30000;

/* Vermerk, in welcher Stunde zuletzt aufgeräumt wurde. */
const AUFRAEUM_VERMERK = 'meta/aufgeraeumt';

/* Wie viele Speicherzugriffe gleichzeitig laufen dürfen. Alles auf einmal
   wäre bei einem Ansturm zu viel, eines nach dem anderen zu langsam.

   Die Grenze gilt für ALLE Zugriffe, auch für die äusseren Schleifen über
   Tage und Stunden. Ohne das käme ein Aufruf mit `tage=90` auf 90 Tage mal
   24 Stunden gleichzeitig – über zweitausend Abfragen auf einen Schlag,
   und die ersten, die das Tempolimit des Speichers treffen, scheitern. */
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

  const store = gedrosselt(getStore({ name: SPEICHER, consistency: 'strong' }), BLOCK);
  const jetzt = new Date();

  // Wer sich hier nicht anmelden kann, liest und zeigt nur an. Das spart
  // doppelte Arbeit; auf Ausschluss ist die Verdichtung nicht angewiesen.
  const verdichten = await verdichtungAnmelden(store, jetzt);

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

    // Die Tage nebeneinander statt nacheinander – aber in Blöcken, nicht
    // alle auf einmal: Bei `tage=90` wären es sonst 90 Tage mal 24 Stunden
    // gleichzeitig.
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
    if (verdichten) await verdichtungAbmelden(store);
  }
};

/* --- Vermerk "verdichtet gerade" -------------------------------------------------------------- */

/** true, wenn dieser Aufruf verdichten soll. Siehe VERDICHTUNG_LAEUFT:
    das hält nur doppelte Arbeit vom Hals, es schützt nichts. */
async function verdichtungAnmelden(store, jetzt) {
  const sperre = await store.get(VERDICHTUNG_LAEUFT, { type: 'json' }).catch(() => null);
  if (sperre && Number(sperre.bis) > jetzt.getTime()) return false;
  await store.setJSON(VERDICHTUNG_LAEUFT, { bis: jetzt.getTime() + VERDICHTUNG_DAUER });
  return true;
}

async function verdichtungAbmelden(store) {
  await store.setJSON(VERDICHTUNG_LAEUFT, { bis: 0 }).catch(() => {});
}

/**
 * Legt eine Drossel um den Speicher: Es laufen nie mehr als `grenze`
 * Zugriffe gleichzeitig, egal von wo sie kommen.
 *
 * Der Weg über den Speicher selbst und nicht über die einzelnen Schleifen
 * ist Absicht. Eine Grenze pro Schleife nützt nichts, weil sich die Ebenen
 * multiplizieren: Tage mal Stunden mal Einträge. Bei `tage=90` und je 40
 * gleichzeitig wären das fast tausend Abfragen auf einen Schlag – und wer
 * dabei das Tempolimit des Speichers reisst, bekommt Fehler zurück.
 * Hier ist die Grenze eine einzige, für alles zusammen.
 */
function gedrosselt(store, grenze) {
  let laufend = 0;
  const schlange = [];

  function naechsterDran() {
    if (laufend >= grenze || schlange.length === 0) return;
    laufend += 1;
    schlange.shift()();
  }

  function anstellen() {
    return new Promise((weiter) => {
      schlange.push(weiter);
      naechsterDran();
    });
  }

  function durchDieDrossel(zugriff) {
    return async (...args) => {
      await anstellen();
      try {
        return await zugriff(...args);
      } finally {
        laufend -= 1;
        naechsterDran();
      }
    };
  }

  return {
    get: durchDieDrossel(store.get.bind(store)),
    setJSON: durchDieDrossel(store.setJSON.bind(store)),
    delete: durchDieDrossel(store.delete.bind(store)),
    list: durchDieDrossel(store.list.bind(store)),
  };
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
 * Diese Funktion LÖSCHT KEINE Einzeleinträge – weder die, die sie gerade
 * einrechnet, noch die eines früheren Laufs. Das tut allein aufraeumen(),
 * und zwar erst, wenn der Tag vorbei ist.
 *
 * Warum so umständlich: Netlify Blobs 8.2 kann nicht atomar schreiben
 * (kein onlyIfNew, kein onlyIfMatch), es gibt also keine Möglichkeit, zwei
 * gleichzeitige Aufrufe sauber auseinanderzuhalten. Ein Aufruf kann seinen
 * Tageswert schreiben, nachdem ein anderer bereits einen neueren
 * geschrieben hat, und dessen Arbeit damit zurückdrehen.
 *
 * Dagegen hilft hier nur eines: dass die Rohdaten liegen bleiben. Solange
 * die Einzeleinträge eines Tages da sind, ist ein zurückgedrehter
 * Tageswert kein Verlust, sondern nur Arbeit, die der nächste Aufruf
 * nochmals macht. Erst wenn Löschen und Tageswert aneinander hängen, wird
 * daraus ein echter Verlust – deshalb hängt hier nichts aneinander.
 *
 * Was bleibt: Ein Aufruf, der genau im falschen Moment schreibt, kann
 * Zahlen kurzzeitig zu niedrig anzeigen, bis der nächste sie wieder
 * einrechnet. Das ist das Beste, was ohne atomare Schreibzugriffe zu
 * haben ist, und für eine Besucherstatistik allemal genug.
 *
 * Der Preis: Die Einzeleinträge bleiben bis zum nächsten Kalendertag
 * liegen statt bis zum Ende ihrer Stunde. Zweimal gezählt werden sie nie,
 * weil ihre Stunde in `stundenFertig` steht und nicht mehr gelesen wird.
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

  // Die offenen Stunden nebeneinander lesen, wieder in Blöcken. Bereits
  // verdichtete Stunden stehen in `stundenFertig` und kosten gar keinen
  // Zugriff mehr.
  const gelesen = await Promise.all(
    offen.map((stunde) =>
      stundeLesen(store, datum, stunde).then((eintraege) => ({ stunde, ...eintraege })),
    ),
  );

  const anzeige = kopie(gespeichert);
  let gespeichertGeaendert = false;

  for (const { stunde, vollstaendig, werte } of gelesen) {
    // Angezeigt wird alles, auch die laufende Stunde.
    for (const eintrag of werte) einrechnen(anzeige, eintrag);

    // Festgeschrieben nur, was abgeschlossen ist – und nur, wenn dieser
    // Aufruf verdichten soll.
    const abgeschlossen = datum < zeit.grenze.datum
      || (datum === zeit.grenze.datum && stunde < zeit.grenze.stunde);
    if (!abgeschlossen || !verdichten) continue;

    // Konnte auch nur ein Eintrag der Stunde nicht gelesen werden – etwa
    // weil der Speicher gerade bremst –, bleibt die Stunde offen. Sie
    // jetzt als fertig zu vermerken hiesse, die fehlenden Einträge nie
    // mehr zu zählen.
    if (!vollstaendig) continue;

    for (const eintrag of werte) einrechnen(gespeichert, eintrag);
    // Auch ohne Einträge vermerken – sonst wird die leere Stunde für immer
    // wieder abgefragt.
    fertig.add(stunde);
    gespeichertGeaendert = true;
  }

  if (gespeichertGeaendert) {
    gespeichert.stundenFertig = [...fertig].sort();
    aufraeumenListen(gespeichert);
    await store.setJSON(`tag/${datum}`, gespeichert);
  }

  aufraeumenListen(anzeige);
  return anzeige;
}

/**
 * Alle Einzeleinträge einer Stunde.
 *
 * `vollstaendig` sagt, ob wirklich jeder aufgelistete Eintrag gelesen
 * werden konnte. Fehlt einer, darf die Stunde nicht festgeschrieben
 * werden – siehe tageswert().
 */
async function stundeLesen(store, datum, stunde) {
  const { blobs } = await store.list({ prefix: `roh/${datum}/${stunde}/` });
  const schluessel = blobs.map((b) => b.key);

  const gelesen = await Promise.all(
    schluessel.map((k) => store.get(k, { type: 'json' }).catch(() => null)),
  );
  const werte = gelesen.filter(Boolean);

  return { vollstaendig: werte.length === schluessel.length, werte };
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
 * Läuft höchstens einmal pro Stunde. Vorher geschah das bei JEDEM Aufruf
 * des Adminbereichs – und dazu gehört ein `list` über sämtliche
 * Einzeleinträge. Bei ein paar tausend Scanner-Anfragen am Tag ist das die
 * teuerste Stelle der ganzen Funktion, und sie hat meist nichts zu tun.
 *
 * Stündlich statt täglich, damit die Einzeleinträge eines Tages bald nach
 * Mitternacht verschwinden und nicht erst beim nächsten Besuch des
 * Adminbereichs – die Datenschutzerklärung sagt "spätestens nach zwei
 * Tagen", und daran soll reichlich Luft bleiben.
 */
async function aufraeumen(store, jetzt) {
  const { datum: heute, stunde } = lokaleZeit(jetzt);
  const jetztStunde = `${heute} ${stunde}`;
  const vermerk = await store.get(AUFRAEUM_VERMERK, { type: 'json' }).catch(() => null);
  if (vermerk && vermerk.stunde === jetztStunde) return;

  const frist = Number(process.env.STATISTIK_AUFBEWAHRUNG_TAGE) || STANDARD_AUFBEWAHRUNG;
  const grenze = lokaleZeit(new Date(jetzt.getTime() - frist * 86400000)).datum;

  // Einzeleinträge werden STUNDENGENAU entsorgt, nicht tagesgenau. Sonst
  // entsteht um Mitternacht ein Loch: Verdichtet wird mit einer Stunde
  // Karenz (siehe `zeit.grenze` im Handler), also ist um 00:30 die Stunde
  // 23 von gestern noch offen – tagesgenaues Löschen würde sie trotzdem
  // mitnehmen, und der nächste Aufruf fände eine leere Stunde vor und
  // schriebe sie als fertig fest. Die Besuche dieser Stunde wären weg.
  //
  // 25 Stunden Abstand: mehr als die eine Stunde Karenz, und genug, dass
  // die Rohdaten eines Tages als Rückfallebene dienen können (siehe
  // tageswert()). Zugleich deutlich unter den zwei Tagen, die Ziffer 3
  // der Datenschutzerklärung zusagt.
  const rohGrenze = lokaleZeit(new Date(jetzt.getTime() - 25 * 3600000));
  const rohGrenzeSchluessel = `${rohGrenze.datum} ${rohGrenze.stunde}`;

  const { blobs } = await store.list({ prefix: 'tag/' });
  await Promise.all(
    blobs
      .filter((blob) => blob.key.slice(4) < grenze)
      .map((blob) => store.delete(blob.key)),
  );

  // Einzeleinträge. Das hier ist die EINZIGE Stelle, die Rohdaten löscht,
  // und sie geht nach der Uhr, nicht nach dem Verdichtungsstand.
  //
  // Der Unterschied ist der ganze Punkt. Löschte man eine Stunde, sobald
  // sie im Tageswert steht, hinge das Löschen an genau der Angabe, die
  // ein veralteter Schreiber zurückdrehen kann – und dann wäre die Stunde
  // weder im Tageswert noch aus den Rohdaten wiederherstellbar. So herum
  // bleiben die Rohdaten eines Tages den ganzen Tag lang liegen und
  // dienen als Rückfallebene: Was ein Aufruf versehentlich aus dem
  // Tageswert kippt, rechnet der nächste aus ihnen wieder ein.
  //
  // Was hier verfällt, ohne je verdichtet worden zu sein – etwa weil der
  // Adminbereich tagelang nicht geöffnet wurde –, ist verloren. Das war
  // schon immer so und steht so auch in der Datenschutzerklärung.
  const roh = await store.list({ prefix: 'roh/' });
  await Promise.all(
    roh.blobs
      // Schlüssel: roh/JJJJ-MM-TT/SS/...  (besucher.js)
      .filter((blob) => `${blob.key.slice(4, 14)} ${blob.key.slice(15, 17)}` < rohGrenzeSchluessel)
      .map((blob) => store.delete(blob.key)),
  );

  await store.setJSON(AUFRAEUM_VERMERK, { stunde: jetztStunde });
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
