/*
 * Besuch bestätigen
 * =================
 *
 * Kam jemand über einen Link mit Code (?ref=<code>) und scrollt oder tippt
 * auf der Seite, meldet sie das einmal an /api/besuch
 * (netlify/functions/besuch.mjs). So sieht die Verwaltung, dass ein Mensch
 * die Seite angesehen hat, und nicht nur ein Programm, das Links abruft.
 * Mit dabei ist der Code und woher der Besuch kam (nur der Name der
 * verweisenden Seite), sonst nichts; kein Cookie, nichts im Browser
 * gespeichert. Datenschutzerklärung, Ziffer 8.
 */
(function () {
  var code = (new URLSearchParams(location.search).get('ref') || '').toLowerCase();
  if (!/^[2-9abcdefghjkmnpqrstuvwxyz]{7}$/.test(code) || !navigator.sendBeacon) return;

  var verweis = '';
  try {
    var host = document.referrer ? new URL(document.referrer).hostname : '';
    if (host && host !== location.hostname) verweis = host;
  } catch (e) { /* keine brauchbare Adresse */ }

  // Erst nach einer kurzen Weile zählt es: Wer die Seite nur kurz aufreisst
  // und gleich wieder schliesst, hat sie nicht angesehen. Gezählt wird, was
  // ein Mensch tut: Mausrad, Wischen, Klicken, Tasten. Das Ereignis
  // „scroll" allein nicht, denn die Seite springt beim Laden selbst ins
  // Kapitel eines Links.
  var ab = Date.now() + 1500, gemeldet = false;
  var ereignisse = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
  function melden() {
    if (gemeldet || Date.now() < ab) return;
    gemeldet = true;
    ereignisse.forEach(function (typ) { window.removeEventListener(typ, melden, true); });
    var inhalt = JSON.stringify({ code: code, verweis: verweis });
    navigator.sendBeacon('/api/besuch', new Blob([inhalt], { type: 'application/json' }));
  }
  ereignisse.forEach(function (typ) { window.addEventListener(typ, melden, { capture: true, passive: true }); });
})();
