/* =========================================================================
   Gemeinsames Skript für die Rechtsseiten (Impressum, Datenschutz).
   Zwei Kleinigkeiten, die auf beiden Seiten identisch sind – deshalb hier
   statt zweimal inline, gleiche Überlegung wie bei assets/legal.css.

   Wird die Marke in index.html geändert, muss sie hier mitgeändert werden:
   Dort steht dasselbe Regelwerk für die Startseite.
   ========================================================================= */
(function () {
  'use strict';

  /* --- Jahr in der Fusszeile -------------------------------------------- */
  var jahr = document.getElementById('jahr');
  if (jahr) jahr.textContent = String(new Date().getFullYear());

  /* --- Farbe der Adressleiste -------------------------------------------
     Das Farbschema selbst setzt das Skript im <head>. Hier wird nur die
     theme-color nachgezogen, damit sie zur gespeicherten Wahl passt. Einen
     Umschalter gibt es auf diesen Seiten nicht, nur auf der Startseite. */
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.content = document.documentElement.getAttribute('data-theme') === 'light'
      ? '#fbfaf8' : '#0e1013';
  }

  /* --- Signet-Animation -------------------------------------------------
     Beim Laden zeichnet sich das Signet über das CSS. Beim Zeigen mit der
     Maus wiederholt es sich – höchstens alle drei Sekunden, damit nicht
     jede Mausbewegung eine neue Runde auslöst. Beim Wegfahren passiert
     bewusst nichts mehr.
     ---------------------------------------------------------------------- */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var LOGO_PAUSE = 3000;
  var LOGO_TEILE = '.brand-mark path, .brand-name, .brand small';

  document.querySelectorAll('.brand').forEach(function (marke) {
    var zuletzt = 0;
    function anstossen() {
      if (Date.now() - zuletzt < LOGO_PAUSE) return;
      zuletzt = Date.now();
      /* Eine laufende CSS-Animation beginnt nur dann von vorn, wenn sie
         zwischendurch tatsächlich weg war. Der Zugriff auf offsetWidth
         erzwingt die Neuberechnung dazwischen – und zwar am body, weil
         SVG-Elemente diese Eigenschaft gar nicht kennen. */
      var teile = marke.querySelectorAll(LOGO_TEILE);
      teile.forEach(function (teil) { teil.style.animation = 'none'; });
      void document.body.offsetWidth;
      teile.forEach(function (teil) { teil.style.animation = ''; });
    }
    marke.addEventListener('mouseenter', anstossen);
    marke.addEventListener('focus', anstossen);
  });
})();
