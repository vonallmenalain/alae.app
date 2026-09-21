/**
 * Erste Verteidigungslinie vor der statischen Seite.
 *
 * Die Funktion läuft im Netlify-Edge-Netz, also noch bevor eine Datei
 * ausgeliefert oder die Kontakt-Funktion gestartet wird. Sie erledigt drei
 * Dinge:
 *
 *   1. Tempolimit  – über `config.rateLimit`. Das übernimmt die Plattform,
 *                    nicht dieser Code: Wer die Grenze reisst, bekommt von
 *                    Netlify automatisch 429, ohne dass die Seite belastet
 *                    wird.
 *   2. Scanner-Pfade – die üblichen Abfragen nach WordPress, PHP, .env oder
 *                    .git beantworten wir sofort mit 404. Nichts davon
 *                    existiert hier; jede Antwort darüber hinaus wäre nur
 *                    eine Auskunft an den Scanner.
 *   3. Methoden     – geschrieben wird auf dieser Seite nur beim
 *                    Kontaktformular. Alles andere ausser Lesen fällt raus.
 *
 * Bewusst NICHT hier: Sperren nach Land oder IP. Die Muster unten treffen
 * das Verhalten, nicht die Herkunft – ein Schweizer Besucher mit Browser
 * merkt von alldem nichts, ein Scanner aus den USA schon.
 */

/* Pfade, die es auf alae.app nicht gibt und nie geben wird. Wer sie abfragt,
   sucht eine fremde Sicherheitslücke. Die Liste ist bewusst auf eindeutige
   Fälle beschränkt: lieber ein Scanner zu wenig gesperrt als eine echte
   Seite. */
const SCANNER_MUSTER = [
  /* WordPress – der mit Abstand häufigste Scan im Netz */
  /^\/wp-(admin|login|content|includes|json|config|cron|signup|comments-post)/i,
  /^\/(wordpress|wp|blog|old|new|site|cms|test|backup)\/wp-/i,
  /^\/xmlrpc\.php$/i,

  /* PHP allgemein – die Seite ist statisch, es gibt kein PHP */
  /\.php[0-9]?$/i,
  /^\/(phpmyadmin|pma|myadmin|mysqladmin|phpinfo|adminer)(\/|$)/i,

  /* Geheimnisse und Versionsverwaltung */
  /^\/\.(env|git|svn|hg|aws|ssh|vscode|idea|DS_Store|htaccess|htpasswd)/i,
  /^\/(config|secrets|credentials|dump|backup|database|db)\.(json|ya?ml|sql|zip|tar|gz|bak|old)$/i,
  /\.(sql|bak|old|swp|log)$/i,

  /* Admin- und Verwaltungsoberflächen fremder Systeme */
  /^\/(administrator|admin\.php|cgi-bin|solr|jenkins|manager\/html|owa|autodiscover)(\/|$)/i,
  /^\/(actuator|console|telescope|_ignition|server-status|server-info)(\/|$)/i,
  /^\/vendor\/(phpunit|composer)/i,

  /* Shell- und Ausführungsversuche */
  /^\/(shell|cmd|eval-stdin|alfa|wso|c99|r57)(\.|\/|$)/i,
];

/* Schreibende Anfragen sind nur an das Kontaktformular erlaubt. */
const SCHREIB_PFADE = new Set([
  '/api/kontakt',
  '/.netlify/functions/kontakt',
]);

const LESE_METHODEN = new Set(['GET', 'HEAD', 'OPTIONS']);

export default async (request, context) => {
  const pfad = new URL(request.url).pathname;

  if (SCANNER_MUSTER.some((muster) => muster.test(pfad))) {
    return abweisen(request, context, pfad, 'Scanner-Pfad', 404);
  }

  if (!LESE_METHODEN.has(request.method) && !SCHREIB_PFADE.has(pfad)) {
    return abweisen(request, context, pfad, 'Methode nicht erlaubt', 405);
  }

  /* Nichts zurückgeben heisst: Anfrage ist in Ordnung, Netlify liefert die
     Seite wie bisher aus. */
  return undefined;
};

/**
 * Kurze, nichtssagende Antwort – plus eine Zeile ins Netlify-Log, damit
 * später nachvollziehbar ist, wonach gesucht wurde. Bewusst ohne IP-Adresse:
 * Für die Auswertung reicht Land und Pfad, alles andere wäre unnötig
 * personenbezogen.
 */
function abweisen(request, context, pfad, grund, status) {
  const land = context?.geo?.country?.code || '??';
  console.log(`abgewiesen: ${grund} | ${request.method} ${pfad} | ${land}`);

  return new Response(status === 404 ? 'Nicht gefunden\n' : 'Methode nicht erlaubt\n', {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export const config = {
  path: '/*',

  /* Bilder, Video und CSS liefert das CDN aus dem Cache. Sie hier
     mitzuprüfen würde nur Aufrufe der Edge-Funktion kosten, ohne dass ein
     Scanner dort etwas zu holen hätte. */
  excludedPath: ['/assets/*'],

  /* Tempolimit pro Besucher: 120 Seitenaufrufe in 60 Sekunden. Ein Mensch
     kommt beim Lesen der drei Seiten auf eine Handvoll, ein Scanner schafft
     das in Sekunden. Darüber antwortet Netlify selbst mit 429. */
  rateLimit: {
    windowSize: 60,
    windowLimit: 120,
    aggregateBy: ['ip', 'domain'],
  },
};
