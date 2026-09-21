/* =========================================================================
   Adminbereich (admin.html): Anmeldung, Abholen der Zahlen, Darstellung.

   Das Passwort bleibt im Sitzungsspeicher des Browsers und wird bei jeder
   Anfrage als "Authorization: Bearer" mitgeschickt. Es steht nirgends im
   Quelltext – geprüft wird es in netlify/functions/statistik.mjs.
   ========================================================================= */
(function () {
  'use strict';

  var SCHLUESSEL = 'alae-admin';
  /* Rückfall, wenn der Sitzungsspeicher gesperrt ist (privates Fenster). */
  var gemerkt = '';

  var anmeldung = document.getElementById('anmeldung');
  var auswertung = document.getElementById('auswertung');
  var formular = document.getElementById('anmeldeformular');
  var passwortfeld = document.getElementById('passwort');
  var anmeldefehler = document.getElementById('anmeldefehler');
  var ladefehler = document.getElementById('ladefehler');
  var zeitraum = document.getElementById('zeitraum');
  var stand = document.getElementById('stand');
  var tipp = document.getElementById('tipp');

  /* --- Kleinkram --------------------------------------------------------- */

  var jahr = document.getElementById('jahr');
  if (jahr) jahr.textContent = String(new Date().getFullYear());

  var themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.content = document.documentElement.getAttribute('data-theme') === 'light'
      ? '#fbfaf8' : '#0e1013';
  }

  function zahl(wert) {
    return new Intl.NumberFormat('de-CH').format(wert || 0);
  }

  function prozent(teil, ganzes) {
    if (!ganzes) return '0 %';
    return new Intl.NumberFormat('de-CH', { maximumFractionDigits: 1 }).format((teil / ganzes) * 100) + ' %';
  }

  function tagKurz(datum) {
    var d = new Date(datum + 'T12:00:00');
    return new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit' }).format(d);
  }

  function tagLang(datum) {
    var d = new Date(datum + 'T12:00:00');
    return new Intl.DateTimeFormat('de-CH', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(d);
  }

  function el(name, klasse, text) {
    var knoten = document.createElement(name);
    if (klasse) knoten.className = klasse;
    if (text !== undefined) knoten.textContent = text;
    return knoten;
  }

  /* --- Anmeldung --------------------------------------------------------- */

  formular.addEventListener('submit', function (ereignis) {
    ereignis.preventDefault();
    var passwort = passwortfeld.value;
    if (!passwort) return;
    merken(passwort);
    laden();
  });

  document.getElementById('aktualisieren').addEventListener('click', laden);
  zeitraum.addEventListener('change', laden);
  document.getElementById('abmelden').addEventListener('click', function () {
    vergessen();
    auswertung.hidden = true;
    anmeldung.hidden = false;
    passwortfeld.value = '';
    passwortfeld.focus();
  });

  function merken(passwort) {
    try { sessionStorage.setItem(SCHLUESSEL, passwort); } catch (e) { gemerkt = passwort; }
  }
  function holen() {
    try { return sessionStorage.getItem(SCHLUESSEL) || gemerkt; } catch (e) { return gemerkt; }
  }
  function vergessen() {
    gemerkt = '';
    try { sessionStorage.removeItem(SCHLUESSEL); } catch (e) { /* privates Fenster */ }
  }
  /* --- Zahlen holen ------------------------------------------------------ */

  function laden() {
    var passwort = holen();
    if (!passwort) return;

    anmeldefehler.hidden = true;
    ladefehler.hidden = true;
    stand.textContent = 'Wird geladen …';

    fetch('/api/statistik?tage=' + encodeURIComponent(zeitraum.value), {
      headers: { Authorization: 'Bearer ' + passwort },
      cache: 'no-store',
    })
      .then(function (antwort) {
        return antwort.json().catch(function () { return {}; }).then(function (daten) {
          return { status: antwort.status, daten: daten };
        });
      })
      .then(function (ergebnis) {
        if (ergebnis.status === 401) {
          vergessen();
          anmeldung.hidden = false;
          auswertung.hidden = true;
          stand.textContent = '';
          anmeldefehler.textContent = 'Passwort stimmt nicht.';
          anmeldefehler.hidden = false;
          passwortfeld.focus();
          return;
        }
        if (ergebnis.status !== 200) {
          stand.textContent = '';
          zeigeLadefehler(ergebnis.daten.fehler || 'Die Zahlen konnten nicht geladen werden.');
          return;
        }
        anmeldung.hidden = true;
        auswertung.hidden = false;
        zeichnen(ergebnis.daten);
      })
      .catch(function () {
        stand.textContent = '';
        zeigeLadefehler('Keine Verbindung zum Server.');
      });
  }

  function zeigeLadefehler(text) {
    if (!auswertung.hidden) {
      ladefehler.textContent = text;
      ladefehler.hidden = false;
    } else {
      anmeldefehler.textContent = text;
      anmeldefehler.hidden = false;
    }
  }

  /* --- Darstellung ------------------------------------------------------- */

  function zeichnen(daten) {
    var tage = daten.tage || [];
    stand.textContent = 'Stand: ' + new Intl.DateTimeFormat('de-CH', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    }).format(new Date(daten.erstellt));

    kennzahlen(tage);
    tagesDiagramm(tage);
    tagesTabelle(tage);
    stundenDiagramm(tage);
    listen(tage);
  }

  function summe(tage, feld) {
    return tage.reduce(function (s, tag) { return s + (tag[feld] || 0); }, 0);
  }

  /** Zählt die Werte gleicher Schlüssel über alle Tage zusammen. */
  function zusammen(tage, feld) {
    var gesamt = {};
    tage.forEach(function (tag) {
      Object.keys(tag[feld] || {}).forEach(function (name) {
        gesamt[name] = (gesamt[name] || 0) + tag[feld][name];
      });
    });
    return gesamt;
  }

  function sortiert(objekt, anzahl) {
    return Object.keys(objekt)
      .map(function (name) { return { name: name, wert: objekt[name] }; })
      .sort(function (a, b) { return b.wert - a.wert; })
      .slice(0, anzahl || 10);
  }

  function kennzahlen(tage) {
    var anfragen = summe(tage, 'anfragen');
    var auffaellig = summe(tage, 'auffaellig');
    var robots = summe(tage, 'robots');
    var absenderProTag = tage.reduce(function (s, tag) {
      return s + Object.keys(tag.absender || {}).length;
    }, 0);
    var schnitt = tage.length ? Math.round(absenderProTag / tage.length) : 0;

    var felder = [
      { titel: 'Anfragen', wert: zahl(anfragen), dazu: tage.length ? zahl(Math.round(anfragen / tage.length)) + ' pro Tag' : '' },
      { titel: 'Ohne Robots', wert: zahl(anfragen - robots), dazu: prozent(anfragen - robots, anfragen) + ' aller Anfragen' },
      { titel: 'Auffällig', wert: zahl(auffaellig), dazu: prozent(auffaellig, anfragen) + ' aller Anfragen', warnung: auffaellig > 0 },
      { titel: 'Absender pro Tag', wert: zahl(schnitt), dazu: 'im Durchschnitt' },
    ];

    var ziel = document.getElementById('kennzahlen');
    ziel.textContent = '';
    felder.forEach(function (feld) {
      var kachel = el('dl', 'kennzahl' + (feld.warnung ? ' warnung' : ''));
      kachel.appendChild(el('dt', null, feld.titel));
      var wert = el('dd', null, feld.wert);
      if (feld.dazu) wert.appendChild(el('span', 'dazu', feld.dazu));
      kachel.appendChild(wert);
      ziel.appendChild(kachel);
    });
  }

  /* --- Balken pro Tag ---------------------------------------------------- */

  var NS = 'http://www.w3.org/2000/svg';

  function svgEl(name, attribute) {
    var knoten = document.createElementNS(NS, name);
    Object.keys(attribute || {}).forEach(function (schluessel) {
      knoten.setAttribute(schluessel, attribute[schluessel]);
    });
    return knoten;
  }

  /** Rechteck mit abgerundeter Oberkante, unten bündig auf der Grundlinie. */
  function saeule(x, y, breite, hoehe, farbe) {
    var r = Math.min(4, breite / 2, hoehe);
    var d = 'M' + x + ' ' + (y + hoehe) +
            ' L' + x + ' ' + (y + r) +
            ' Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y +
            ' L' + (x + breite - r) + ' ' + y +
            ' Q' + (x + breite) + ' ' + y + ' ' + (x + breite) + ' ' + (y + r) +
            ' L' + (x + breite) + ' ' + (y + hoehe) + ' Z';
    return svgEl('path', { d: d, fill: farbe });
  }

  function tagesDiagramm(tage) {
    var ziel = document.getElementById('tage-diagramm');
    ziel.textContent = '';
    zeigeLegende();

    if (!tage.length) { ziel.appendChild(el('p', 'leer', 'Noch keine Daten.')); return; }

    var hoehe = 190, oben = 18, unten = 26, links = 34, rechts = 6;
    // Breite gedeckelt: Bei 90 Tagen würde das Diagramm sonst so stark
    // verkleinert, dass die Beschriftung unleserlich wird.
    var breite = Math.max(360, Math.min(tage.length * 30, 760));
    var feldBreite = (breite - links - rechts) / tage.length;
    var balkenBreite = Math.min(22, feldBreite * 0.62);
    var hoechst = Math.max.apply(null, tage.map(function (t) { return t.anfragen || 0; }).concat([1]));
    var skala = (hoehe - oben - unten) / hoechst;

    var svg = svgEl('svg', {
      viewBox: '0 0 ' + breite + ' ' + hoehe,
      role: 'group',
      'aria-label': 'Anfragen pro Tag als Balken. Einzelwerte stehen in der Tabelle unter dem Diagramm.',
    });

    // Grundlinie und zwei zurückhaltende Hilfslinien
    [0, 0.5, 1].forEach(function (anteil) {
      var y = hoehe - unten - (hoehe - oben - unten) * anteil;
      svg.appendChild(svgEl('line', {
        class: 'gitterlinie', x1: links, x2: breite - rechts, y1: y, y2: y,
        opacity: anteil === 0 ? 1 : 0.6,
      }));
      var beschriftung = svgEl('text', { class: 'achse', x: links - 6, y: y + 3, 'text-anchor': 'end' });
      beschriftung.textContent = zahl(Math.round(hoechst * anteil));
      svg.appendChild(beschriftung);
    });

    // Nur so viele Datumsangaben, wie nebeneinander Platz haben.
    var jedeNte = Math.max(1, Math.ceil(30 / feldBreite));

    tage.forEach(function (tag, i) {
      var x = links + i * feldBreite;
      var mitte = x + feldBreite / 2;
      var auffaellig = tag.auffaellig || 0;
      var normal = Math.max(0, (tag.anfragen || 0) - auffaellig);
      var gruppe = svgEl('g', {
        class: 'gruppe', tabindex: '0', role: 'img',
        'aria-label': tagLang(tag.datum) + ': ' + zahl(tag.anfragen) + ' Anfragen, davon ' +
                      zahl(auffaellig) + ' auffällig',
      });

      gruppe.appendChild(svgEl('rect', {
        class: 'balken-feld', x: x + 1, y: oben - 8,
        width: Math.max(1, feldBreite - 2), height: hoehe - oben - unten + 12, rx: 4,
      }));

      var grundlinie = hoehe - unten;
      var hNormal = normal * skala;
      var hAuffaellig = auffaellig * skala;
      var bx = mitte - balkenBreite / 2;

      if (normal > 0) {
        var yNormal = grundlinie - hNormal;
        // 2px Lücke zwischen den zwei Abschnitten, damit sie sich nicht berühren
        gruppe.appendChild(auffaellig > 0
          ? svgEl('rect', { x: bx, y: yNormal, width: balkenBreite, height: hNormal, fill: 'var(--reihe-normal)' })
          : saeule(bx, yNormal, balkenBreite, hNormal, 'var(--reihe-normal)'));
      }
      if (auffaellig > 0) {
        var yAuffaellig = grundlinie - hNormal - hAuffaellig - (normal > 0 ? 2 : 0);
        gruppe.appendChild(saeule(bx, yAuffaellig, balkenBreite, hAuffaellig, 'var(--reihe-auffaellig)'));
      }
      if (!tag.anfragen) {
        gruppe.appendChild(svgEl('line', {
          class: 'gitterlinie', x1: bx, x2: bx + balkenBreite, y1: grundlinie, y2: grundlinie,
        }));
      }

      // Von hinten gezählt, damit der jüngste Tag immer beschriftet ist.
      if ((tage.length - 1 - i) % jedeNte === 0) {
        var datumText = svgEl('text', { class: 'achse', x: mitte, y: hoehe - unten + 14, 'text-anchor': 'middle' });
        datumText.textContent = tagKurz(tag.datum);
        gruppe.appendChild(datumText);
      }
      // Der höchste Tag bekommt seine Zahl direkt an den Balken, nicht jeder.
      if ((tag.anfragen || 0) === hoechst && hoechst > 0) {
        var wertText = svgEl('text', {
          class: 'wert', x: mitte, y: grundlinie - hNormal - hAuffaellig - 8, 'text-anchor': 'middle',
        });
        wertText.textContent = zahl(tag.anfragen);
        gruppe.appendChild(wertText);
      }

      gruppe.addEventListener('mouseenter', function () { zeigeTipp(gruppe, tag, mitte, breite); });
      gruppe.addEventListener('focus', function () { zeigeTipp(gruppe, tag, mitte, breite); });
      gruppe.addEventListener('mouseleave', versteckeTipp);
      gruppe.addEventListener('blur', versteckeTipp);

      svg.appendChild(gruppe);
    });

    ziel.appendChild(svg);
  }

  function zeigeLegende() {
    var ziel = document.getElementById('legende');
    ziel.textContent = '';
    [['var(--reihe-normal)', 'Gewöhnliche Anfragen'], ['var(--reihe-auffaellig)', 'Auffällige Anfragen']]
      .forEach(function (paar) {
        var eintrag = el('span');
        var farbe = el('i');
        farbe.style.background = paar[0];
        eintrag.appendChild(farbe);
        eintrag.appendChild(document.createTextNode(paar[1]));
        ziel.appendChild(eintrag);
      });
  }

  function zeigeTipp(gruppe, tag, mitte, breite) {
    var laender = sortiert(tag.laender || {}, 3).map(function (e) {
      return e.name + ' ' + zahl(e.wert);
    }).join(' · ');
    tipp.innerHTML = '';
    tipp.appendChild(el('strong', null, tagLang(tag.datum)));
    tipp.appendChild(el('br'));
    tipp.appendChild(document.createTextNode(zahl(tag.anfragen) + ' Anfragen, ' + zahl(tag.auffaellig) + ' auffällig'));
    if (laender) {
      tipp.appendChild(el('br'));
      tipp.appendChild(document.createTextNode(laender));
    }
    tipp.hidden = false;
    var feld = gruppe.ownerSVGElement.getBoundingClientRect();
    tipp.style.left = (feld.width * (mitte / breite)) + 'px';
    tipp.style.top = (feld.height * 0.45) + 'px';
  }

  function versteckeTipp() { tipp.hidden = true; }

  function tagesTabelle(tage) {
    var ziel = document.getElementById('tage-tabelle');
    ziel.textContent = '';
    var tabelle = el('table', 'tabelle');
    var kopf = el('thead');
    kopf.innerHTML = '<tr><th>Tag</th><th>Anfragen</th><th>Auffällig</th><th>Robots</th><th>Absender</th></tr>';
    tabelle.appendChild(kopf);
    var koerper = el('tbody');
    tage.slice().reverse().forEach(function (tag) {
      var zeile = el('tr');
      [tagLang(tag.datum), zahl(tag.anfragen), zahl(tag.auffaellig), zahl(tag.robots),
       zahl(Object.keys(tag.absender || {}).length)].forEach(function (wert, i) {
        var zelle = el('td', i ? 'zahl' : null, wert);
        zeile.appendChild(zelle);
      });
      koerper.appendChild(zeile);
    });
    tabelle.appendChild(koerper);
    ziel.appendChild(tabelle);
  }

  /* --- Balken pro Stunde -------------------------------------------------- */

  function stundenDiagramm(tage) {
    var ziel = document.getElementById('stunden-diagramm');
    ziel.textContent = '';
    var werte = Array(24).fill(0);
    tage.forEach(function (tag) {
      (tag.stunden || []).forEach(function (wert, i) { werte[i] += wert || 0; });
    });
    var hoechst = Math.max.apply(null, werte.concat([1]));
    if (!werte.some(function (w) { return w > 0; })) {
      ziel.appendChild(el('p', 'leer', 'Noch keine Daten.'));
      return;
    }

    var breite = 480, hoehe = 130, oben = 10, unten = 22, links = 28;
    var feldBreite = (breite - links - 6) / 24;
    var skala = (hoehe - oben - unten) / hoechst;

    var svg = svgEl('svg', {
      viewBox: '0 0 ' + breite + ' ' + hoehe, role: 'img',
      'aria-label': 'Anfragen nach Tageszeit, Schweizer Zeit. Höchster Wert: ' + zahl(hoechst) + ' Anfragen.',
    });
    svg.appendChild(svgEl('line', {
      class: 'gitterlinie', x1: links, x2: breite - 6, y1: hoehe - unten, y2: hoehe - unten,
    }));
    var maxText = svgEl('text', { class: 'achse', x: links - 6, y: oben + 8, 'text-anchor': 'end' });
    maxText.textContent = zahl(hoechst);
    svg.appendChild(maxText);

    werte.forEach(function (wert, i) {
      var x = links + i * feldBreite;
      var h = wert * skala;
      if (wert > 0) {
        svg.appendChild(saeule(x + 1.5, hoehe - unten - h, feldBreite - 3, h, 'var(--reihe-normal)'));
      }
      if (i % 3 === 0) {
        var text = svgEl('text', {
          class: 'achse', x: x + feldBreite / 2, y: hoehe - unten + 13, 'text-anchor': 'middle',
        });
        text.textContent = String(i);
        svg.appendChild(text);
      }
    });
    ziel.appendChild(svg);
  }

  /* --- Listen ------------------------------------------------------------- */

  function listen(tage) {
    var ziel = document.getElementById('listen');
    ziel.textContent = '';

    ziel.appendChild(absenderKarte(tage));
    ziel.appendChild(listenKarte(
      'Auffällige Pfade', 'Aufrufe, die nach automatischem Absuchen aussehen.',
      sortiert(zusammen(tage, 'auffaelligePfade'), 12), 'Pfad', true,
    ));
    ziel.appendChild(listenKarte(
      'Häufigste Seiten', 'Welche Adressen aufgerufen wurden.',
      sortiert(zusammen(tage, 'pfade'), 12), 'Pfad',
    ));
    ziel.appendChild(listenKarte(
      'Herkunftsländer', 'Land des anfragenden Netzes, laut Netlify.',
      sortiert(zusammen(tage, 'laender'), 12), 'Land',
    ));
    ziel.appendChild(listenKarte(
      'Woher die Besuche kommen', 'Verweisende Seite, nur der Hostname. Leer heisst: direkt eingegeben oder aus einem Lesezeichen.',
      sortiert(zusammen(tage, 'verweise'), 10), 'Herkunft',
    ));
    ziel.appendChild(listenKarte(
      'Browser und Robots', 'Grob aus der Browserkennung abgeleitet.',
      sortiert(zusammen(tage, 'browser'), 12), 'Kennung',
    ));
    ziel.appendChild(listenKarte(
      'Antworten', 'HTTP-Status. Viele 404 heissen: Es wird nach etwas gesucht, das es nicht gibt.',
      sortiert(zusammen(tage, 'status'), 8), 'Status',
    ));
  }

  function listenKarte(titel, notiz, eintraege, spalte, auffaellig) {
    var karte = el('div', 'karte');
    karte.appendChild(el('h3', null, titel));
    karte.appendChild(el('p', 'notiz', notiz));

    if (!eintraege.length) {
      karte.appendChild(el('p', 'leer', 'Nichts erfasst.'));
      return karte;
    }

    var hoechst = eintraege[0].wert || 1;
    var umschlag = el('div', 'tabelle-wrap');
    var tabelle = el('table', 'tabelle');
    var kopf = el('thead');
    var kopfzeile = el('tr');
    kopfzeile.appendChild(el('th', null, spalte));
    kopfzeile.appendChild(el('th', null, 'Anfragen'));
    kopf.appendChild(kopfzeile);
    tabelle.appendChild(kopf);

    var koerper = el('tbody');
    eintraege.forEach(function (eintrag) {
      var zeile = el('tr');
      var name = el('td', null, eintrag.name || '(direkt)');
      var balken = el('span', 'anteil' + (auffaellig ? ' auffaellig' : ''));
      balken.style.width = Math.max(4, (eintrag.wert / hoechst) * 100) + '%';
      name.appendChild(balken);
      zeile.appendChild(name);
      zeile.appendChild(el('td', 'zahl', zahl(eintrag.wert)));
      koerper.appendChild(zeile);
    });
    tabelle.appendChild(koerper);
    umschlag.appendChild(tabelle);
    karte.appendChild(umschlag);
    return karte;
  }

  /**
   * Absender werden über den groben Adressbereich zusammengefasst – die
   * Tageskennung wechselt ja jeden Tag. Genau so fällt auf, wenn über Tage
   * hinweg immer dasselbe Netz anklopft.
   */
  function absenderKarte(tage) {
    var gesamt = {};
    tage.forEach(function (tag) {
      Object.keys(tag.absender || {}).forEach(function (kennung) {
        var absender = tag.absender[kennung];
        var name = (absender.bereich || '?') + ' · ' + (absender.land || '??');
        var eintrag = gesamt[name] || { anfragen: 0, auffaellig: 0, fehler: 0, tage: 0, browser: {} };
        eintrag.anfragen += absender.anfragen || 0;
        eintrag.auffaellig += absender.auffaellig || 0;
        eintrag.fehler += absender.fehler || 0;
        eintrag.tage += 1;
        eintrag.browser[absender.browser || 'unbekannt'] = (eintrag.browser[absender.browser || 'unbekannt'] || 0) + 1;
        gesamt[name] = eintrag;
      });
    });

    var eintraege = Object.keys(gesamt)
      .map(function (name) { return { name: name, daten: gesamt[name] }; })
      .sort(function (a, b) { return b.daten.anfragen - a.daten.anfragen; })
      .slice(0, 8);

    var karte = el('div', 'karte');
    karte.appendChild(el('h3', null, 'Absender'));
    karte.appendChild(el('p', 'notiz',
      'Nach Adressbereich und Land zusammengefasst; die vollständige IP-Adresse wird nicht gespeichert. ' +
      '„Auffällig“ markiert Absender, deren Anfragen überwiegend nach Absuchen aussehen.'));

    if (!eintraege.length) {
      karte.appendChild(el('p', 'leer', 'Nichts erfasst.'));
      return karte;
    }

    var umschlag = el('div', 'tabelle-wrap');
    var tabelle = el('table', 'tabelle');
    var kopf = el('thead');
    kopf.innerHTML = '<tr><th>Adressbereich</th><th>Anfragen</th><th>Tage</th></tr>';
    tabelle.appendChild(kopf);
    var koerper = el('tbody');
    var hoechst = eintraege[0].daten.anfragen || 1;

    eintraege.forEach(function (eintrag) {
      var daten = eintrag.daten;
      var verdaechtig = daten.auffaellig > 0 &&
        (daten.auffaellig / daten.anfragen >= 0.3 || daten.auffaellig >= 10);
      var zeile = el('tr');
      var name = el('td', null, eintrag.name);
      if (verdaechtig) name.appendChild(el('span', 'marke', 'auffällig'));
      var kennung = sortiert(daten.browser, 1)[0];
      name.appendChild(el('span', 'dazu', (kennung ? kennung.name : 'unbekannt') +
        (daten.fehler ? ' · ' + zahl(daten.fehler) + ' Fehlversuche' : '')));
      var balken = el('span', 'anteil' + (verdaechtig ? ' auffaellig' : ''));
      balken.style.width = Math.max(4, (daten.anfragen / hoechst) * 100) + '%';
      name.appendChild(balken);
      zeile.appendChild(name);
      zeile.appendChild(el('td', 'zahl', zahl(daten.anfragen)));
      zeile.appendChild(el('td', 'zahl', zahl(daten.tage)));
      koerper.appendChild(zeile);
    });
    tabelle.appendChild(koerper);
    umschlag.appendChild(tabelle);
    karte.appendChild(umschlag);
    return karte;
  }

  /* --- Start -------------------------------------------------------------- */

  if (holen()) {
    laden();
  } else {
    passwortfeld.focus();
  }
})();
