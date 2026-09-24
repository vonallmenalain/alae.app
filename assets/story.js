/* =========================================================================
   Bewegung der Startseite (index.html)
   Aufbau: Heute → Kontaktformular → Kapitel-Navigation → (ab hier nur mit
   GSAP) Werkzeuge → Leinwand → Schleife → Kapitel (Ordnung mit Neuer
   Webauftritt, Gripszug, DreamTeam, Fotoverkauf, Ablauf, Preise, Über mich,
   Erstgespräch) → Kontakt und FAQ → Aufbau

   Jedes Kapitel ist eine Funktion, die eine Zeitleiste von 0 bis 100 baut
   (Ordnung: bis 200, es trägt die Szenen 1 bis 3 und den neuen
   Webauftritt) und optional eine tick-Funktion für das, was in jedem Bild
   neu gerechnet wird: Fäden, schwebende Zettel, Karten im Raum.
   ScrollTrigger stellt die Zeitleiste auf den Scrollstand; die gemeinsame
   Schleife ruft tick nur für Kapitel auf, die gerade im Bild sind.
   ========================================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var qa = function (s, el) { return [].slice.call((el || document).querySelectorAll(s)); };
  var q1 = function (s, el) { return (el || document).querySelector(s); };

  /* --- Heute ---------------------------------------------------------------
     Datum, Monat und die Monate im Diagramm kommen aus der Uhr des
     Besuchers. Ein Dashboard mit dem Datum von gestern sähe aus wie ein
     Bildschirmfoto – und genau das soll es nicht sein. */
  try {
    var jetzt = new Date();
    var tag = new Intl.DateTimeFormat('de-CH', { weekday: 'long', day: 'numeric', month: 'long' }).format(jetzt);
    var monat = new Intl.DateTimeFormat('de-CH', { month: 'long' }).format(jetzt);
    var kurz = new Intl.DateTimeFormat('de-CH', { month: 'short' });
    qa('[data-heute]').forEach(function (el) { el.textContent = tag; });
    qa('[data-monat]').forEach(function (el) { el.textContent = monat; });
    var labels = qa('#software .m span');
    labels.forEach(function (el, k) {
      var d = new Date(jetzt.getFullYear(), jetzt.getMonth() - (labels.length - 1 - k), 1);
      el.textContent = kurz.format(d).replace('.', '');
    });
  } catch (e) { /* ältere Browser: es bleibt beim Text im HTML */ }

  /* --- Kontaktformular ------------------------------------------------------
     Derselbe Versand wie auf der früheren Startseite: an die Netlify-Funktion
     unter data-endpoint; klappt das nicht, öffnet sich das E-Mail-Programm,
     damit keine Anfrage verloren geht. Steht vor der Prüfung auf GSAP,
     damit das Formular auch ohne die Bibliothek sendet. */
  var EMPFAENGER = 'kontakt@alae.app';
  (function formularVersand() {
    var form = document.getElementById('contactForm');
    if (!form) return;
    var note = document.getElementById('formNote'), submit = document.getElementById('formSubmit');
    var ruhig = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var feld = function (name) { var el = form.elements[name]; return el && el.value ? el.value.trim() : ''; };
    var mailtoOeffnen = function () {
      var zeilen = [
        'Name: ' + feld('name'), 'Firma: ' + (feld('organisation') || '–'), 'E-Mail: ' + feld('email'),
        'Telefon: ' + (feld('telefon') || '–'), '', 'Kurzbeschrieb Idee:', feld('nachricht'), '', '— gesendet über alae.app'
      ];
      var betreff = 'Anfrage über alae.app' + (feld('organisation') ? ' – ' + feld('organisation') : '');
      window.location.href = 'mailto:' + EMPFAENGER + '?subject=' + encodeURIComponent(betreff) + '&body=' + encodeURIComponent(zeilen.join('\n'));
    };
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!form.reportValidity()) return;
      var endpoint = form.getAttribute('data-endpoint');
      if (!endpoint) {
        mailtoOeffnen();
        if (note) note.textContent = 'Dein E-Mail-Programm wurde geöffnet. Falls nicht: schreib direkt an ' + EMPFAENGER + '.';
        return;
      }
      if (submit) submit.disabled = true;
      if (note) note.textContent = 'Wird gesendet …';
      fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: feld('name'), organisation: feld('organisation'), email: feld('email'),
          telefon: feld('telefon'), nachricht: feld('nachricht'), website: feld('website')
        })
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (daten) {
          if (!res.ok) throw new Error(daten.fehler || 'Fehler ' + res.status);
          return daten;
        });
      }).then(function () {
        /* Conversion für Google Ads erst hier melden, nach erfolgreichem
           Versand – nicht beim Klick, sonst zählten auch fehlgeschlagene
           Versuche. Die Spam-Falle antwortet ebenfalls mit Erfolg, deshalb
           nur, wenn das versteckte Feld leer ist. Die ID muss zum Google-Tag
           im <head> passen (AW-18354022652). */
        if (typeof window.gtag === 'function' && !feld('website')) {
          window.gtag('event', 'conversion', { send_to: 'AW-18354022652/ZHNoCLvCuoEdEPzR8K9E' });
        }
        var danke = document.createElement('div');
        danke.className = 'kt-danke';
        danke.innerHTML = '<svg viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="25"/><path d="M17 29l7.5 7.5L40 21" pathLength="1"/></svg>' +
          '<b>Danke, deine Anfrage ist angekommen.</b><p>Ich melde mich in der Regel innerhalb von 24 Stunden.</p>';
        var alt = [].slice.call(form.children).filter(function (el) { return !el.classList.contains('kt-rahmen'); });
        var tauschen = function () {
          alt.forEach(function (el) { el.remove(); });
          form.appendChild(danke);
          // Das Formular ist jetzt kürzer: alles darunter neu vermessen
          if (window.ScrollTrigger && root.classList.contains('js')) ScrollTrigger.refresh();
        };
        if (window.gsap && !ruhig) {
          gsap.to(alt, { opacity: 0, y: -10, duration: .35, stagger: .03, ease: 'power2.in', onComplete: function () {
            tauschen(); gsap.fromTo(danke, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .5, ease: 'power3.out' });
          } });
        } else tauschen();
      }).catch(function (err) {
        if (submit) submit.disabled = false;
        if (note) note.textContent = 'Das Senden hat nicht geklappt (' + err.message + '). Dein E-Mail-Programm wird geöffnet – oder schreib direkt an ' + EMPFAENGER + '.';
        mailtoOeffnen();
      });
    });
  })();
  var jahr = document.getElementById('year');
  if (jahr) jahr.textContent = String(new Date().getFullYear());

  /* --- Kapitel-Navigation ---------------------------------------------------
     Die acht Einträge sind die Kapitel der Seite. Ein Klick fährt weich
     hin: nahe Ziele direkt; weite hinter einem kurzen Schleier mit dem Titel
     des Ziels – dahinter springt die Seite, die Zeitleisten rasten ein, und
     die letzte Strecke gleitet sie ins Kapitel hinein. So ist man schnell
     dort und sieht trotzdem, wie das Kapitel beginnt.
     Läuft auch ohne GSAP. Die Story trägt dann die genaueren Landepunkte
     (navi.landung), den Beginn jedes Eintrags (navi.anfang) und das
     Einrasten der Zeitleisten (navi.einrasten) nicht bei. */
  var navi = { landung: null, anfang: null, einrasten: null, springen: null };
  (function kapitelNavigation() {
    var nav = document.getElementById('kapitel');
    if (!nav) return;
    var knopf = q1('.kp-knopf', nav), links = qa('.kp-liste a', nav), bar = q1('.bar');
    var ring = q1('.kp-ring-fort', nav), dunkel = q1('.kp-dunkel', nav);
    var schleier = q1('.kp-schleier'), sNr = q1('.kp-schleier-nr'), sTitel = q1('.kp-schleier-titel');
    var ids = links.map(function (a) { return a.getAttribute('href').slice(1); });
    // Ziele ausserhalb der Leiste und das Kapitel, zu dem sie gehören
    var GEHOERT = { dreamteam: 'projekte', fotos: 'projekte', kontakt: 'gespraech' };
    // Anker der früheren Startseite, damit alte Links an die passende Stelle führen
    var ALIAS = {
      top: 'software', main: 'software', 'app-gripszug': 'projekte', 'app-jass': 'projekte', 'app-volleyball': 'projekte',
      'app-sharing': 'projekte', 'app-buchhaltung': 'projekte', 'app-dreamteam': 'dreamteam', 'app-fotoverkauf': 'fotos'
    };
    var ruhig = function () { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); };
    var oben = function (el) { return el.getBoundingClientRect().top + window.pageYOffset; };
    var hoehe = function () { return window.innerHeight; };
    var maxY = function () { return Math.max(0, document.documentElement.scrollHeight - hoehe()); };
    var hin = function (y) { window.scrollTo(0, Math.round(Math.max(0, Math.min(maxY(), y)))); };
    var inOut = function (k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
    var aus = function (k) { return 1 - Math.pow(1 - k, 3); };
    nav.classList.add('is-bereit');

    // Wo ein Ziel „steht" (y) und von wo aus hineingeglitten wird (von)
    function landung(id) {
      var l = navi.landung && navi.landung(id);
      if (l) return l;
      var el = document.getElementById(id);
      if (!el) return null;
      var y = id === ids[0] ? 0 : oben(el);
      return { y: y, von: Math.max(0, y - hoehe() * .35) };
    }
    // Ab wo ein Eintrag als aktuell gilt
    function anfang(id) {
      var a = navi.anfang && navi.anfang(id);
      if (a != null) return a;
      var el = document.getElementById(id);
      return !el || id === ids[0] ? 0 : Math.max(0, oben(el) - hoehe() * .4);
    }

    // --- aktueller Eintrag, Füllung des Strichs, Ring am Pfeil
    var aktiv = -1, bitteAn = false, starts = [], schluessel = '';
    function zeigen() {
      bitteAn = false;
      var y = window.pageYOffset, m = maxY();
      var key = m + '|' + window.innerWidth + '|' + hoehe() + '|' + (navi.anfang ? 1 : 0);
      if (key !== schluessel) { schluessel = key; starts = ids.map(anfang); }
      var k = 0;
      for (var i = 1; i < starts.length; i++) if (y >= starts[i] - 2) k = i;
      var ende = k + 1 < starts.length ? starts[k + 1] : m;
      var p = ende > starts[k] ? Math.min(1, Math.max(0, (y - starts[k]) / (ende - starts[k]))) : 1;
      if (k !== aktiv) {
        links.forEach(function (a, i) {
          a.classList.toggle('is-jetzt', i === k);
          if (i === k) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
        });
        aktiv = k;
      }
      links[k].style.setProperty('--p', p.toFixed(3));
      if (ring) ring.style.strokeDashoffset = (1 - (m > 0 ? y / m : 0)).toFixed(4);
    }
    function bitte() { if (!bitteAn) { bitteAn = true; requestAnimationFrame(zeigen); } }
    window.addEventListener('scroll', bitte, { passive: true });
    window.addEventListener('resize', bitte);
    window.addEventListener('load', bitte);
    bitte();

    // --- Fahren
    var lauf = null;
    function abbrechen() {
      if (!lauf) return;
      cancelAnimationFrame(lauf.raf); clearTimeout(lauf.uhr);
      if (schleier) schleier.classList.remove('is-an');
      lauf = null;
    }
    function fahren(von, bis, dauer, kurve, fertig) {
      var t0 = null, mein = lauf;
      function schritt(t) {
        if (lauf !== mein) return;
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / dauer);
        hin(von + (bis - von) * kurve(k));
        if (k < 1) mein.raf = requestAnimationFrame(schritt);
        else { lauf = null; if (fertig) fertig(); }
      }
      mein.raf = requestAnimationFrame(schritt);
    }
    function springen(id, opt) {
      opt = opt || {};
      id = ALIAS[id] || id;
      var l = landung(id);
      if (!l) return false;
      abbrechen();
      var el = document.getElementById(id), y0 = window.pageYOffset, weit = Math.abs(l.y - y0);
      var fertig = function () {
        if (history.replaceState) history.replaceState(null, '', '#' + id);
        if (opt.fokus && el) {
          if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
          try { el.focus({ preventScroll: true }); } catch (e) { /* alte Browser */ }
        }
      };
      if (opt.sofort) { hin(l.y); if (navi.einrasten) navi.einrasten(); fertig(); return true; }
      lauf = { raf: 0, uhr: 0 };
      if (weit < 4) { lauf = null; fertig(); return true; }
      if (weit < hoehe() * 1.6 || !schleier) {
        fahren(y0, l.y, ruhig() ? 1 : Math.min(1150, 480 + weit / hoehe() * 400), inOut, fertig);
        return true;
      }
      var k = ids.indexOf(GEHOERT[id] || id);
      if (k >= 0) {
        sNr.textContent = String(k + 1).padStart(2, '0');
        // Wörter mit Bindestrich nicht am Bindestrich umbrechen (Web-App)
        sTitel.textContent = '';
        q1('.kp-titel', links[k]).textContent.split(' ').forEach(function (w, i) {
          if (i) sTitel.appendChild(document.createTextNode(' '));
          if (w.indexOf('-') < 0) { sTitel.appendChild(document.createTextNode(w)); return; }
          var nb = document.createElement('span'); nb.className = 'kp-nb'; nb.textContent = w; sTitel.appendChild(nb);
        });
      }
      schleier.classList.add('is-an');
      var mein = lauf, gleiten = !ruhig() && l.von < l.y;
      mein.uhr = setTimeout(function () {
        if (lauf !== mein) return;
        hin(gleiten ? l.von : l.y);
        if (navi.einrasten) navi.einrasten();
        // zwei Bilder Zeit, damit hinter dem Schleier alles gezeichnet ist
        mein.raf = requestAnimationFrame(function () {
          mein.raf = requestAnimationFrame(function () {
            if (lauf !== mein) return;
            schleier.classList.remove('is-an');
            if (gleiten) fahren(l.von, l.y, 1100, aus, fertig);
            else { lauf = null; fertig(); }
          });
        });
      }, ruhig() ? 240 : 400);
      return true;
    }
    navi.springen = springen;
    // Wer selbst scrollt, übernimmt – die Fahrt hört sofort auf
    ['wheel', 'touchstart', 'keydown'].forEach(function (typ) {
      window.addEventListener(typ, function (e) {
        if (!lauf) return;
        if (typ === 'keydown' && !/^(Arrow|Page|Home|End| $)/.test(e.key)) return;
        abbrechen();
      }, { passive: true });
    });

    // --- Aufklappen am Handy
    var yOffen = 0;
    function oeffnen() {
      if (bar) nav.style.setProperty('--kp-top', Math.round(bar.getBoundingClientRect().bottom - 4) + 'px');
      nav.classList.add('is-offen');
      knopf.setAttribute('aria-expanded', 'true');
      yOffen = window.pageYOffset;
    }
    function schliessen() {
      if (!nav.classList.contains('is-offen')) return;
      nav.classList.remove('is-offen');
      knopf.setAttribute('aria-expanded', 'false');
    }
    knopf.addEventListener('click', function () { if (nav.classList.contains('is-offen')) schliessen(); else oeffnen(); });
    dunkel.addEventListener('click', schliessen);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-offen')) { schliessen(); knopf.focus(); }
    });
    window.addEventListener('scroll', function () {
      if (nav.classList.contains('is-offen') && Math.abs(window.pageYOffset - yOffen) > 60) schliessen();
    }, { passive: true });
    // Am Desktop bleibt die Leiste nach dem Klick zu, bis die Maus sie verlässt
    nav.addEventListener('mouseleave', function () { nav.classList.remove('is-zu'); });

    // Sprungmarke von Hand geändert (Adresszeile, Zurück): Der Browser steht
    // dann schon am Anfang des Abschnitts – von dort an den Landepunkt
    window.addEventListener('hashchange', function () {
      var id = decodeURIComponent(location.hash.slice(1));
      if (ids.indexOf(id) >= 0 || GEHOERT[id] || ALIAS[id]) springen(id);
    });

    // --- Alle Sprünge innerhalb der Seite laufen hier durch
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = decodeURIComponent(a.getAttribute('href').slice(1));
      if (ids.indexOf(id) < 0 && !GEHOERT[id] && !ALIAS[id]) return;
      e.preventDefault();
      if (nav.contains(a)) { schliessen(); nav.classList.add('is-zu'); a.blur(); }
      springen(id, { fokus: true });
    });
  })();

  if (!window.gsap || !window.ScrollTrigger || !window.CustomEase) {
    root.classList.remove('js');
    return;
  }
  gsap.registerPlugin(ScrollTrigger, CustomEase);
  // Dieselben Kurven wie im CSS der Startseite, dazu die des Logos
  CustomEase.create('aOut', '.23,1,.32,1');
  CustomEase.create('aInOut', '.77,0,.175,1');
  CustomEase.create('aLogo', '.65,0,.15,1');

  /* --- Werkzeuge ------------------------------------------------------------ */
  var TAU = Math.PI * 2;
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smooth(a, b, v) { var t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function inOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  // Geseedeter Zufall: jedes Mal dasselbe Bild, nur die Bewegung lebt
  function mulberry(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // Überschriften in Wörter, damit sie gestaffelt kommen und gehen. Einmal
  // pro Element; beim Neuaufbau (Drehen des Geräts) bleiben die Wörter.
  // Ein Satzzeichen direkt nach einem hervorgehobenen Wort („Game</span>.")
  // kommt in dessen Kasten, in der Farbe des Satzes: Als eigener Kasten
  // dürfte die Zeile vor ihm umbrechen, und der Punkt stünde allein.
  function splitWords(el) {
    var out = [];
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment(), prev = n.previousSibling;
          n.textContent.split(/(\s+)/).forEach(function (p, i) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            if (i === 0 && prev && prev.nodeType === 1 && out.length && prev.contains(out[out.length - 1])) {
              var tail = document.createElement('span');
              tail.style.color = getComputedStyle(node).color;
              tail.textContent = p;
              out[out.length - 1].appendChild(tail);
              return;
            }
            var s = document.createElement('span');
            s.className = 'w'; s.textContent = p;
            frag.appendChild(s); out.push(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
    return out;
  }
  function words(el) {
    if (!el) return [];
    if (!el._w) el._w = splitWords(el);
    return el._w;
  }

  // Lage relativ zur Bühne, ohne Transformationen: offsetLeft und offsetTop
  // kennen weder Drehung noch Skalierung.
  function rel(el, stage) {
    var x = 0, y = 0, n = el;
    while (n && n !== stage) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight };
  }
  // Lage mit Transformationen, für Dinge, die das CSS selbst verschiebt
  function box(el, stage) {
    var a = el.getBoundingClientRect(), b = stage.getBoundingClientRect();
    return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height };
  }
  function radius(el) { return parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0; }
  function shown(el) { return el.getClientRects().length > 0; }

  // Zahlen mit Schweizer Apostroph; unter 0,5 ein Strich statt einer Null
  function group(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '’'); }
  function fmt(el, v) {
    el.textContent = (el.hasAttribute('data-chf') ? 'CHF ' : '') + (v < .5 ? '–' : group(v));
  }
  function counter(tl, el, at, dur, to) {
    var o = { v: 0 }, target = to != null ? to : +el.getAttribute('data-count');
    tl.fromTo(o, { v: 0 }, { v: target, duration: dur, ease: 'aOut', onUpdate: function () { fmt(el, o.v); } }, at);
  }
  // Wörter herein und hinaus, überall gleich
  function wordsIn(tl, w, at, st) {
    tl.fromTo(w, { yPercent: 70, opacity: 0, filter: 'blur(10px)' },
      { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 7, stagger: st || .45, ease: 'aOut' }, at);
  }
  function wordsOut(tl, w, at) {
    tl.to(w, { yPercent: -70, opacity: 0, filter: 'blur(8px)', duration: 5, stagger: .28, ease: 'power2.in' }, at);
  }
  // Text erscheint Buchstabe für Buchstabe, wie getippt (data-tippe)
  function type(tl, el, at, dur) {
    var txt = el.getAttribute('data-tippe'), o = { n: 0 };
    tl.fromTo(o, { n: 0 }, { n: txt.length, duration: dur, ease: 'none', onUpdate: function () { el.textContent = txt.slice(0, Math.round(o.n)); } }, at);
  }
  // Der Hintergrund jedes Kapitels ab dem zweiten blendet über dem vorigen ein
  function bgIn(tl, sec) {
    var bg = q1('.stage-bg', sec);
    if (sec.previousElementSibling && sec.previousElementSibling.hasAttribute('data-kapitel')) {
      tl.fromTo(bg, { opacity: 0 }, { opacity: 1, duration: 6, ease: 'none' }, 0);
    }
  }

  /* --- Leinwand ---------------------------------------------------------------
     Zwei Canvas übereinander: der Kern scharf, das Leuchten auf einer
     Fläche in Viertelgrösse, die der Browser weich hochrechnet. Der Kern
     bekommt höchstens PIXEL_BUDGET Bildpunkte, egal wie gross der
     Bildschirm ist. Vorher wurde das Leuchten als breiter Strich in voller
     Auflösung gemalt – auf einem 4K-Bildschirm achtmal so viele Punkte wie
     am Handy, darum stockte Szene 1 dort und nur dort. */
  var PIXEL_BUDGET = 2.2e6, GLOW = .25;
  var quality = 1;
  function Leinwand(core, glow) {
    this.core = core; this.glow = glow;
    this.c = core.getContext('2d'); this.g = glow.getContext('2d');
    this.w = 1; this.h = 1; this.dpr = 1;
  }
  Leinwand.prototype.size = function (w, h) {
    this.w = w; this.h = h;
    var fit = Math.sqrt(PIXEL_BUDGET / Math.max(1, w * h));
    this.dpr = Math.max(.5, Math.min(window.devicePixelRatio || 1, 2, fit) * quality);
    this.core.width = Math.max(1, Math.round(w * this.dpr));
    this.core.height = Math.max(1, Math.round(h * this.dpr));
    this.glow.width = Math.max(1, Math.round(w * GLOW));
    this.glow.height = Math.max(1, Math.round(h * GLOW));
  };
  Leinwand.prototype.begin = function () {
    var c = this.c, g = this.g;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, this.core.width, this.core.height);
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.glow.width, this.glow.height);
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.setTransform(GLOW, 0, 0, GLOW, 0, 0);
    // Additiv: Wo sich Fäden kreuzen, wird es heller – wie Licht, nicht wie Farbe
    c.globalCompositeOperation = g.globalCompositeOperation = 'lighter';
    c.lineJoin = 'bevel'; c.lineCap = 'butt';
    g.lineJoin = 'round'; g.lineCap = 'round';
  };
  Leinwand.prototype.line = function (pts, n, core, coreA, coreW, glow, glowA, glowW) {
    var c = this.c, g = this.g, j;
    c.beginPath(); c.moveTo(pts[0], pts[1]);
    for (j = 2; j < n * 2; j += 2) c.lineTo(pts[j], pts[j + 1]);
    c.globalAlpha = coreA; c.strokeStyle = core; c.lineWidth = coreW; c.stroke();
    g.beginPath(); g.moveTo(pts[0], pts[1]);
    for (j = 2; j < n * 2; j += 2) g.lineTo(pts[j], pts[j + 1]);
    g.globalAlpha = glowA; g.strokeStyle = glow; g.lineWidth = glowW; g.stroke();
  };
  // Verlauf, der die Fäden unter Text zurücknimmt (für beide Flächen)
  Leinwand.prototype.fade = function (x0, y0, x1, y1, stops) {
    var mk = function (ctx) {
      var gr = ctx.createLinearGradient(x0, y0, x1, y1);
      stops.forEach(function (s) { gr.addColorStop(s[0], 'rgba(0,0,0,' + s[1] + ')'); });
      return gr;
    };
    return { c: mk(this.c), g: mk(this.g) };
  };
  Leinwand.prototype.erase = function (fd, a) {
    var w = this.w, h = this.h;
    [[this.c, fd.c], [this.g, fd.g]].forEach(function (p) {
      p[0].globalCompositeOperation = 'destination-out';
      p[0].globalAlpha = a; p[0].fillStyle = p[1]; p[0].fillRect(0, 0, w, h);
    });
  };
  Leinwand.prototype.end = function () {
    this.c.globalCompositeOperation = this.g.globalCompositeOperation = 'source-over';
    this.c.globalAlpha = this.g.globalAlpha = 1;
  };
  Leinwand.prototype.wipe = function () {
    this.c.setTransform(1, 0, 0, 1, 0, 0); this.c.clearRect(0, 0, this.core.width, this.core.height);
    this.g.setTransform(1, 0, 0, 1, 0, 0); this.g.clearRect(0, 0, this.glow.width, this.glow.height);
  };

  /* --- Schleife ---------------------------------------------------------------
     Eine für alle Kapitel. Die Maus wirkt nicht direkt, sondern über eine
     Dämpfung: Das Bild folgt ihr mit etwas Trägheit, wie ein Gegenstand mit
     Gewicht, statt an ihr zu kleben.

     Dazu ein Regler: Braucht ein Bild im Mittel länger als 24 ms (unter
     rund 40 Bildern pro Sekunde), zeichnen die Fäden mit weniger
     Bildpunkten – erst drei Viertel, dann gut die Hälfte. Wer eine schnelle
     Grafikkarte hat, merkt davon nie etwas. */
  var ptr = { x: 0, y: 0, tx: 0, ty: 0, cx: -1, cy: -1, at: 0 };
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('pointermove', function (e) {
      ptr.tx = e.clientX / innerWidth * 2 - 1; ptr.ty = e.clientY / innerHeight * 2 - 1;
      ptr.cx = e.clientX; ptr.cy = e.clientY; ptr.at = performance.now();
    }, { passive: true });
    document.addEventListener('pointerleave', function () { ptr.tx = ptr.ty = 0; ptr.at = 0; });
  }
  var active = [], built = [], raf = 0, last = 0, t0 = 0;
  var perf = { n: 0, sum: 0, wait: 45, level: 0 };

  function govern(dt) {
    if (perf.level >= 2) return;
    if (perf.wait > 0) { perf.wait--; return; }
    if (dt >= .1) return;                       // Tab war weg: zählt nicht
    perf.n++; perf.sum += dt;
    if (perf.n < 40) return;
    var avg = perf.sum / perf.n;
    perf.n = perf.sum = 0;
    if (avg > .024) {
      perf.level++; perf.wait = 30;
      quality = perf.level === 1 ? .75 : .55;
      built.forEach(function (ch) { if (ch.rescale) ch.rescale(); });
    }
  }
  function loop(now) {
    raf = 0;
    if (!active.length) return;
    if (!t0) t0 = now;
    var dt = Math.min(.1, Math.max(.001, (now - last) / 1000));
    last = now;
    var k = 1 - Math.exp(-dt / .22);
    ptr.x += (ptr.tx - ptr.x) * k; ptr.y += (ptr.ty - ptr.y) * k;
    var t = (now - t0) / 1000;
    for (var i = 0; i < active.length; i++) active[i].tick(t, dt);
    govern(dt);
    raf = requestAnimationFrame(loop);
  }
  function setActive(ch, on) {
    var i = active.indexOf(ch);
    if (on && i < 0) active.push(ch);
    if (!on && i >= 0) active.splice(i, 1);
    if (active.length && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
  }

  /* --- Wegweiser: sieben Striche, einer pro Szene ---------------------------- */


  /* =========================================================================
     KAPITEL ORDNUNG – Massgeschneiderte Software (Szenen 1 bis 3) und
     Neuer Webauftritt
     Chaos aus Fäden und Zetteln → Ordnung, das Tablet entsteht → das Tablet
     dreht sich und zeigt, was es kann → sein Bildschirm zeigt die alte
     Website der Firma, die sich in die neue verwandelt, und daraus wird
     ihre App. Ein Kapitel, weil das Tablet durchgehend dasselbe bleibt.
     ========================================================================= */
  function ordnung(sec, env) {
    var stage = q1('.stage', sec);
    var cv = new Leinwand(q1('.threads', sec), q1('.threads-glow', sec));
    var device = q1('.device', sec), tiltEl = q1('.device-tilt', sec), bodyEl = q1('.device-body', sec);
    var glowEl = q1('.device-glow', sec), glare = q1('.screen-glare', sec);
    var screenEl = q1('.device-screen', sec), screenBg = q1('.screen-bg', sec);
    var papers = qa('.paper', sec).sort(function (a, b) { return a.dataset.slot - b.dataset.slot; });
    var tiles = papers.map(function (p) { return q1('.app [data-slot="' + p.dataset.slot + '"]', sec); });
    var chrome = qa('.app-chrome', sec);
    var bars = qa('.col i', sec), arc = q1('.arc', sec);
    var badge = q1('.badge', sec), badgePaths = qa('.badge path', sec);
    var links = qa('.link', sec), knots = qa('.knot', sec), callouts = qa('.callout', sec);
    var haze = q1('.haze', sec), cue = q1('.cue', sec);
    var kpiNums = qa('.kpi [data-count]', sec), donutNum = q1('.donut [data-count]', sec);
    var toast = q1('.app-toast', sec), restEl = q1('[data-rest]', sec);
    var anchors = [0, 1, 2, 3].map(function (k) { return qa('.anchor[data-a="' + k + '"]', sec); });
    var s1 = q1('.s1', sec);
    var W1 = words(q1('.s1 h1', sec)), W2 = words(q1('.s2 h2', sec)), W3 = words(q1('.s3 h2', sec));
    var rest1 = [q1('.s1 .kicker', sec), q1('.s1 .sub', sec)];
    var sub2 = q1('.s2 .sub', sec), sub3 = q1('.s3 .sub', sec);
    var portrait = env.portrait, reduced = env.reduced;

    // Kapitel 2: die zwei Websites im Bildschirm, dann wieder die App
    var appEl = q1('.app', sec), webAlt = q1('.web-alt', sec), webNeu = q1('.web-neu', sec);
    var waGrund = q1('.wa-grund', sec), waPapier = q1('.wa-papier', sec), wnGrund = q1('.wn-grund', sec);
    var sBadge = q1('.screen-badge', sec), toastWeb = q1('.app-toast--web', sec), navNeu = q1('.nav-neu', sec);
    var trNeu = q1('.tr-neu', sec), trRows = qa('.table .tr:not(.th):not(.tr-neu)', sec), trLast = trRows[trRows.length - 1];
    var wKicker = q1('.w-kicker', sec);
    var W5 = words(q1('.s5 h2', sec)), W6 = words(q1('.s6 h2', sec)), W7 = words(q1('.s7 h2', sec));
    var sub5 = q1('.s5 .sub', sec), sub6 = q1('.s6 .sub', sec), sub7 = q1('.s7 .sub', sec);
    // Paare: gleiches data-m auf beiden Seiten. Die Reihenfolge ist die der
    // Verwandlung – zuerst wird das Bild zur Bühne, dann folgt der Rest.
    var MORPH = ['bild', 'titel', 'logo', 'nav', 'text', 'cta', 'bewertung', 'leistungen'].map(function (k) {
      return { a: q1('.web-alt [data-m="' + k + '"]', sec), n: q1('.web-neu [data-m="' + k + '"]', sec) };
    });
    // Die alte Seite baut sich auf wie über eine langsame Leitung, Stück für Stück
    var altLoad = qa('.wa-kopf, .wa-nav, .wa-lauf, .wa-box-h, .wa-menu, .wa-willkommen, .wa-bild, .wa-text, .wa-mail, .wa-zaehler, .wa-bau, .wa-refs, .wa-aktuell, .wa-fuss', sec);
    var altFall = qa('.wa-lauf, .wa-box-h, .wa-menu, .wa-bau, .wa-aktuell, .wa-fuss', sec), altBild = q1('.wa-bild i', sec);
    var zDigit = qa('.wa-zaehler span', sec).pop();
    var neuPop = qa('.wn-knopf, .wn-kicker, .wn-chip--frei, .wn-burger', sec);
    var anfrage = q1('.wn-anfrage', sec), zeiger = q1('.wn-zeiger', sec), ctaEl = q1('.wn-cta', sec);
    var sendenEl = q1('.wn-senden', sec), gesendet = q1('.wn-gesendet', sec), tipper = qa('.wn-anfrage [data-tippe]', sec);
    var heroBox = q1('.wn-bild', sec), hero = new Leinwand(q1('.wn-faeden', sec), q1('.wn-faeden-glow', sec));

    /* Zustand der Fäden, bewegt von der Zeitleiste, gelesen beim Zeichnen:
         sweep  0 → 1  Ordnung wandert von rechts nach links durchs Knäuel
         wrap   0 → 1  die Fäden legen sich um die Kacheln
         lit    0 → 1  der Bildschirm geht an (kurzes Aufglühen)
         calm   0 → 1  die Fäden lösen sich und fliessen ruhig hinter dem Tablet
         veil   0 → 1  der Fluss tritt links zurück, unter den Hinweisen
         hero   0 → 1  Fäden im Bild der neuen Website (Kapitel 2)
         float, tilt, links: Schweben der Zettel, Neigen mit der Maus,
                             Hinweislinien nachführen */
    var S = { sweep: 0, wrap: 0, lit: 0, calm: 0, alpha: 1, float: 1, tilt: 0, links: 0, veil: 0, hero: 0 };
    var L = {}, W = 0, H = 0;
    var TILE_DELAY = [.22, .31, .40, .49, .58, .67];
    // Zettel im Chaos: Mitte x, Mitte y (Anteile der Bühne), Drehung, Tiefe
    var CHAOS_Q = [[.585, .23, -9, 1], [.875, .27, 7, .8], [.73, .74, 11, 1.1], [.955, .6, -7, .55], [.665, .5, -4, .9], [.87, .9, 5, .62]];
    var CHAOS_H = [[.22, .53, -9, 1], [.8, .49, 8, .8], [.27, .8, 10, 1.1], [.83, .74, -7, .6], [.52, .65, -4, .9], [.77, .92, 5, .62]];
    var ROW_Q = [.1, .255, .41, .59, .745, .9];

    function measure() {
      W = stage.clientWidth; H = stage.clientHeight;
      cv.size(W, H);
      var d = rel(device, stage); d.cx = d.x + d.w / 2; d.cy = d.y + d.h / 2; L.dev = d;
      L.slots = tiles.map(function (t) { var r = rel(t, stage); r.cx = r.x + r.w / 2; r.cy = r.y + r.h / 2; return r; });

      // Rahmen, um die sich die Fäden legen, mit Anzahl Fäden und Verzug
      var list = [{ el: screenEl, n: portrait ? 8 : 10, d: 0 }];
      if (!portrait) list.push({ el: q1('.app-side', sec), n: 4, d: .12 });
      tiles.forEach(function (t, k) { list.push({ el: t, n: portrait ? (k < 4 ? 4 : 5) : (k < 4 ? 5 : 8), d: TILE_DELAY[k] }); });
      if (!portrait) list.push({ el: q1('.donut', sec), n: 6, d: .62 });
      L.rects = list.map(function (r) { var b = rel(r.el, stage); b.r = radius(r.el); b.n = r.n; b.d = r.d; return b; });

      L.tx0 = -W * .08; L.tx1 = W * 1.08;
      L.kx = W * (portrait ? .5 : .675); L.ky = H * (portrait ? .67 : .52);
      L.krx = W * (portrait ? .5 : .31); L.kry = H * (portrait ? .2 : .37);
      L.by = d.cy; L.bsp = portrait ? 18 : 26; L.bamp = portrait ? 6 : 9;
      L.cy = d.cy + d.h * (portrait ? .04 : .08); L.csp = portrait ? 64 : 96; L.camp = portrait ? 10 : 16;
      L.mask = portrait ? cv.fade(0, 0, 0, H * .44, [[0, 1], [1, 0]]) : cv.fade(0, 0, W * .52, 0, [[0, 1], [1, 0]]);
      L.veil = cv.fade(0, 0, W * .5, 0, [[0, 1], [.62, .72], [1, 0]]);

      var C = portrait ? CHAOS_H : CHAOS_Q;
      var rowH = H * .13, rowY = L.by - H * .1;
      L.papers = papers.map(function (p, i) {
        var w = p.offsetWidth, h = p.offsetHeight, c = C[i], sl = L.slots[i];
        var o = { w: w, h: h, x0: c[0] * W, y0: c[1] * H, r0: c[2], blur: c[3] < .7 ? 1.3 : 0 };
        if (portrait) { o.x1 = o.x0 + (W * .5 - o.x0) * .12; o.y1 = o.y0 - H * .03; o.r1 = c[2] * .3; o.s1 = .92; }
        else { o.x1 = ROW_Q[i] * W; o.y1 = rowY; o.r1 = i % 2 ? 1.5 : -1.5; o.s1 = rowH / h; }
        o.s2 = Math.min(sl.w / w, sl.h / h) * .97;
        return o;
      });

      L.badge = { x: d.cx - badge.offsetWidth / 2, y: d.y + d.h * .42 - badge.offsetHeight / 2 };
      L.pose = portrait
        ? { x: 0, y: H * .465 - d.cy, s: .72, rx: 9, ry: 7, rz: -1.2 }
        : { x: W * .63 - d.cx, y: H * .585 - d.cy, s: .88, rx: 11, ry: 15, rz: -1.6 };
      // Kapitel 2: fast frontal, damit man die Websites lesen kann. Hoch
      // füllt das Tablet den Platz unter dem längsten Text.
      if (portrait) {
        var textUnten = Math.max.apply(null, qa('.s5, .s6, .s7', sec).map(function (el) { var r = rel(el, stage); return r.y + r.h; }));
        var frei = H - textUnten - H * .05 - 22;
        L.pose3 = { x: 0, y: textUnten + 22 + frei / 2 - d.cy, s: Math.max(.62, Math.min(1, frei / d.h)), rx: 5, ry: -6, rz: .5 };
      } else L.pose3 = { x: W * .615 - d.cx, y: H * .555 - d.cy, s: .92, rx: 4, ry: -10, rz: .8 };
      // Verwandlung: wo jedes neue Stück herkommt (alte Lage minus neue,
      // Grössenverhältnis). Gemessen ohne Transformationen, im Bildschirm.
      L.m = MORPH.map(function (p) {
        var a = rel(p.a, screenEl), n = rel(p.n, screenEl);
        return { dx: a.x - n.x, dy: a.y - n.y, sx: a.w / Math.max(1, n.w), sy: a.h / Math.max(1, n.h) };
      });
      L.scrW = screenEl.clientWidth; L.scrH = screenEl.clientHeight;
      var cb = rel(ctaEl, screenEl), sb = rel(sendenEl, screenEl);
      L.z0 = { x: L.scrW * 1.04, y: L.scrH * .78 };
      L.z1 = { x: cb.x + cb.w * .55, y: cb.y + cb.h * .5 };
      L.z2 = { x: sb.x + sb.w * .62, y: sb.y + sb.h * .5 };
      L.rowH = trRows[0].offsetHeight;
      L.rowPad = parseFloat(getComputedStyle(trRows[0]).paddingTop) || 0;
      L.hw = heroBox.clientWidth; L.hh = heroBox.clientHeight;
      hero.size(L.hw, L.hh);
      L.heroFade = hero.fade(0, 0, L.hw * (portrait ? .2 : .66), 0, [[0, .96], [1, 0]]);
    }

    /* Fäden: Jeder Faden ist eine Kurve aus M Punkten, u läuft von 0 (links)
       bis 1 (rechts). Für jeden Punkt gibt es vier Lagen – Knäuel, Strahl,
       Rahmen einer Kachel, ruhiger Fluss –, und die Zahlen aus S mischen
       zwischen ihnen. */
    var lines = [], N = 0, M = 0, pts = null, tmp = new Float32Array(4);
    function setupLines() {
      var R = mulberry(11);
      N = 0; L.rects.forEach(function (r) { N += r.n; });
      M = portrait ? 56 : 76;
      pts = new Float32Array(M * 2);
      lines = [];
      for (var i = 0; i < N; i++) {
        lines.push({
          f1: .8 + R() * 2.4, f2: 1.8 + R() * 3.2, g1: .8 + R() * 2.4, g2: 1.8 + R() * 3.2,
          p1: R() * TAU, p2: R() * TAU, q1: R() * TAU, q2: R() * TAU,
          rx: .5 + R() * .5, ry: .5 + R() * .5, sp: .1 + R() * .16, turns: .7 + R() * .6,
          y0: R(), y1: R(), bo: R() - .5, co: R() - .5, ph: R() * TAU,
          jd: R(), cd: R(), a: .42 + R() * .45, lw: .75 + R() * .75,
          rect: 0, inset: 0, start: 0, wd: 0
        });
      }
      var k = 0;
      L.rects.forEach(function (rc, ri) {
        for (var j = 0; j < rc.n; j++, k++) {
          var ln = lines[k];
          ln.rect = ri;
          ln.inset = (j - (rc.n - 1) / 2) * 1.7;   // mehrere Fäden, knapp nebeneinander
          ln.start = (j % 2) * .5 + j * .03;       // die Hälfte beginnt in der Ecke gegenüber
          ln.wd = rc.d;
        }
      });
    }
    function chaos(ln, u, t, o) {
      var s = u * TAU * ln.turns, ph = t * ln.sp;
      var x = L.kx + ptr.x * 16 + L.krx * ln.rx * (Math.sin(ln.f1 * s + ln.p1 + ph) * .62 + Math.sin(ln.f2 * s + ln.p2 - ph * .7) * .38);
      var y = L.ky + ptr.y * 12 + L.kry * ln.ry * (Math.cos(ln.g1 * s + ln.q1 - ph * .8) * .62 + Math.sin(ln.g2 * s + ln.q2 + ph * .5) * .38);
      // Die Enden laufen aus dem Bild hinaus – geschwungen, nicht gespannt
      var a = 1 - smooth(0, .17, u), b = smooth(.83, 1, u);
      if (a > 0) { x += (L.tx0 - x) * a; y += (H * (.1 + ln.y0 * .8) + Math.sin(u * 23 + ln.ph + ph * 2) * H * .06 - y) * a; }
      if (b > 0) { x += (L.tx1 - x) * b; y += (H * (.1 + ln.y1 * .8) + Math.sin(u * 19 + ln.p1 - ph * 2) * H * .06 - y) * b; }
      tmp[o] = x; tmp[o + 1] = y;
    }
    function beam(ln, u, t, o) {
      tmp[o] = L.tx0 + (L.tx1 - L.tx0) * u;
      tmp[o + 1] = L.by + ln.bo * L.bsp + Math.sin(u * 8 + t * .9 + ln.ph) * L.bamp * (1.15 - u * .8);
    }
    function calmPt(ln, u, t, o) {
      tmp[o] = L.tx0 + (L.tx1 - L.tx0) * u;
      tmp[o + 1] = L.cy + ln.co * L.csp + Math.sin(u * 5.5 + t * .45 + ln.ph) * L.camp;
    }
    // Punkt auf dem Umfang eines Rechtecks mit runden Ecken, im Uhrzeigersinn
    function rr(ln, u, o) {
      var rc = L.rects[ln.rect], k = ln.inset;
      var x = rc.x - k, y = rc.y - k, w = rc.w + 2 * k, h = rc.h + 2 * k;
      var r = Math.max(0, Math.min(rc.r + k, w / 2, h / 2));
      var sw = w - 2 * r, sh = h - 2 * r, q = Math.PI * r / 2;
      var s = ((u + ln.start) % 1) * (2 * sw + 2 * sh + 4 * q), px, py, an;
      if (s < sw) { px = x + r + s; py = y; }
      else if ((s -= sw) < q) { an = -Math.PI / 2 + s / r; px = x + w - r + Math.cos(an) * r; py = y + r + Math.sin(an) * r; }
      else if ((s -= q) < sh) { px = x + w; py = y + r + s; }
      else if ((s -= sh) < q) { an = s / r; px = x + w - r + Math.cos(an) * r; py = y + h - r + Math.sin(an) * r; }
      else if ((s -= q) < sw) { px = x + w - r - s; py = y + h; }
      else if ((s -= sw) < q) { an = Math.PI / 2 + s / r; px = x + r + Math.cos(an) * r; py = y + h - r + Math.sin(an) * r; }
      else if ((s -= q) < sh) { px = x; py = y + h - r - s; }
      else { s -= sh; an = Math.PI + (r ? s / r : 0); px = x + r + Math.cos(an) * r; py = y + r + Math.sin(an) * r; }
      tmp[o] = px; tmp[o + 1] = py;
    }

    function draw(t) {
      if (S.alpha < .005 || !N) { cv.wipe(); return; }
      cv.begin();
      var sw = S.sweep, front = 1.22 - sw * 1.6, boost = Math.sin(clamp01(S.lit) * Math.PI);
      for (var i = 0; i < N; i++) {
        var ln = lines[i];
        var f = front + (ln.jd - .5) * .22;
        var wr = inOut(clamp01((S.wrap - ln.wd * .55) / .45));
        var wc = inOut(clamp01((S.calm - ln.cd * .3) / .7));
        for (var j = 0; j < M; j++) {
          var u = j / (M - 1), x = 0, y = 0;
          if (wc >= 1) { calmPt(ln, u, t, 0); x = tmp[0]; y = tmp[1]; }
          else {
            if (wr >= 1) { rr(ln, u, 0); x = tmp[0]; y = tmp[1]; }
            else {
              var wb = sw >= 1 ? 1 : smooth(f - .2, f + .2, u);
              if (wb < 1) { chaos(ln, u, t, 0); x = tmp[0]; y = tmp[1]; }
              if (wb > 0) {
                beam(ln, u, t, 2);
                if (wb < 1) { x += (tmp[2] - x) * wb; y += (tmp[3] - y) * wb; } else { x = tmp[2]; y = tmp[3]; }
              }
              if (wr > 0) { rr(ln, u, 2); x += (tmp[2] - x) * wr; y += (tmp[3] - y) * wr; }
            }
            if (wc > 0) { calmPt(ln, u, t, 2); x += (tmp[2] - x) * wc; y += (tmp[3] - y) * wc; }
          }
          pts[j * 2] = x; pts[j * 2 + 1] = y;
        }
        var a = ln.a * S.alpha * (1 - .6 * wc);
        cv.line(pts, M, '#FFB0A8', Math.min(1, a * (.8 + .3 * boost)), ln.lw,
          '#FE7971', Math.min(1, a * (.09 + .15 * boost)), ln.lw * (6 + 5 * boost));
      }
      // Lichtkante: Hier kommt gerade Ordnung ins Knäuel (nur im Leuchten)
      if (sw > 0 && sw < 1) {
        var fx = L.tx0 + (L.tx1 - L.tx0) * clamp01(front), bw = W * .09, g = cv.g;
        var gr = g.createLinearGradient(fx - bw, 0, fx + bw, 0);
        gr.addColorStop(0, 'rgba(254,121,113,0)'); gr.addColorStop(.5, 'rgba(254,121,113,.14)'); gr.addColorStop(1, 'rgba(254,121,113,0)');
        g.globalAlpha = Math.sin(sw * Math.PI) * S.alpha; g.fillStyle = gr;
        g.fillRect(fx - bw, 0, bw * 2, H);
      }
      // Unter der Überschrift von Szene 1 und unter den Hinweisen von Szene 3
      // treten die Fäden zurück, damit der Text lesbar bleibt
      var m = 1 - smooth(0, .3, sw);
      if (m > 0) cv.erase(L.mask, m * .8);
      if (S.veil > 0 && !portrait) cv.erase(L.veil, S.veil * .9);
      cv.end();
    }

    // Zettel: innen schweben, in der Mitte der Maus folgen
    var PF = papers.map(function (p, i) {
      return { pf: q1('.pf', p), pp: q1('.pp', p), w: .55 + i * .12, ph: i * 1.7, dep: 1 };
    });
    (portrait ? CHAOS_H : CHAOS_Q).forEach(function (c, i) { PF[i].dep = c[3]; });
    function floats(t) {
      var a = S.float;
      if (a > 0 || PF[0].live) {
        for (var i = 0; i < PF.length; i++) {
          var f = PF[i];
          f.pf.style.transform = 'translate3d(0,' + (Math.sin(t * f.w + f.ph) * 7 * a).toFixed(2) + 'px,0) rotate(' +
            (Math.sin(t * f.w * .8 + f.ph * 1.3) * 1.6 * a).toFixed(2) + 'deg)';
          f.pp.style.transform = 'translate3d(' + (ptr.x * 20 * f.dep * a).toFixed(2) + 'px,' + (ptr.y * 13 * f.dep * a).toFixed(2) + 'px,0)';
        }
        PF[0].live = a > 0;
      }
      // Mit der Maus neigen, dazu ein kaum merkliches Schweben, sobald das Tablet steht
      if (S.tilt > 0 || tiltEl._live) {
        tiltEl.style.transform = 'translate3d(0,' + (Math.sin(t * .8) * 5 * S.tilt).toFixed(2) + 'px,0) rotateX(' +
          (-ptr.y * 3 * S.tilt + Math.sin(t * .6 + 1) * .5 * S.tilt).toFixed(3) + 'deg) rotateY(' + (ptr.x * 4 * S.tilt).toFixed(3) + 'deg)';
        tiltEl._live = S.tilt > 0;
      }
    }

    // Hinweislinien: vom Punkt am Tablet über einen Knick zum Text
    function placeLinks() {
      if (portrait) return;
      var sr = stage.getBoundingClientRect();
      for (var k = 0; k < 4; k++) {
        var an = null;
        for (var j = 0; j < anchors[k].length; j++) if (shown(anchors[k][j])) { an = anchors[k][j]; break; }
        if (!an) continue;
        var a = an.getBoundingClientRect(), c = callouts[k].getBoundingClientRect();
        var ax = a.left + a.width / 2 - sr.left, ay = a.top + a.height / 2 - sr.top;
        var ex = c.right - sr.left + 14, ey = c.top + c.height / 2 - sr.top;
        links[k].setAttribute('d', 'M' + ax.toFixed(1) + ',' + ay.toFixed(1) + 'L' + (ex + 30).toFixed(1) + ',' + ey.toFixed(1) + 'L' + ex.toFixed(1) + ',' + ey.toFixed(1));
        knots[k].setAttribute('cx', ax.toFixed(1)); knots[k].setAttribute('cy', ay.toFixed(1));
      }
    }

    /* Das Bild der neuen Website bekommt dieselben Fäden wie die Story –
       die Firma zeigt sich so lebendig wie die Seite, auf der man gerade ist. */
    var HL = [], HM = 40, hpts = new Float32Array(HM * 2);
    (function () { var R = mulberry(7); for (var i = 0; i < 14; i++) HL.push({ y: R(), a: .35 + R() * .5, w: .8 + R() * .7, ph: R() * TAU, f: 3 + R() * 3, sp: .3 + R() * .3 }); })();
    function heroDraw(t) {
      if (S.hero < .005) { if (hero._on) { hero.wipe(); hero._on = false; } return; }
      hero._on = true;
      hero.begin();
      var w = L.hw, h = L.hh;
      for (var i = 0; i < HL.length; i++) {
        var ln = HL[i];
        for (var j = 0; j < HM; j++) {
          var u = j / (HM - 1);
          hpts[j * 2] = -w * .05 + w * 1.1 * u;
          hpts[j * 2 + 1] = h * (.3 + ln.y * .55) + Math.sin(u * ln.f + t * ln.sp + ln.ph) * h * .07 + Math.sin(u * 9 - t * .4 + i) * h * .012;
        }
        var a = ln.a * S.hero;
        hero.line(hpts, HM, '#FFD9B0', a * .85, ln.w, '#FE7971', a * .16, ln.w * 7);
      }
      hero.erase(L.heroFade, .9);
      hero.end();
    }

    function tick(t) {
      floats(t);
      draw(t);
      heroDraw(t);
      if (S.links > 0) placeLinks();
    }

    /* Zeitleiste – Szenen 1 bis 3 von 0 bis 100, der neue Webauftritt
       von 100 bis 200:
         0–6     Szene 1 steht
         6–32    Ordnung wandert durchs Knäuel, die Zettel reihen sich auf
         21–31   Szene 2 kommt
         34–52   Fäden legen sich um die Kacheln, die Zettel landen darin
         51–66   der Bildschirm geht an, Diagramm und Auslastung füllen sich
         58–67   Plakette
         67–84   Szene 3: das Tablet dreht sich
         80–86   eine Zahlung kommt herein
         86–98   vier Hinweise, nacheinander
       Kapitel 2, Neuer Webauftritt (100 bis 200):
         100–114 Hinweise gehen, das Tablet dreht sich nach vorn
         103–114 der Bildschirm lädt die alte Website, Stück für Stück
         106–120 „Die Website von 2009?"
         121–140 die Verwandlung: Altes fällt weg, jedes Stück wandert an
                 seinen neuen Platz, die Fäden laufen durchs Bild
         127–150 „Modern, schnell und lebendig."
         151–172 ein Zeiger klickt „Offerte anfragen", die Anfrage wird
                 ausgefüllt und gesendet; „Und daraus wird deine App."
         173–184 die Website wird zur App: die Anfrage steht in den
                 Aufträgen, die Meldung kommt
         184–190 das Signet auf Glas
       Wer hier Zahlen ändert, prüft auch TILE_DELAY: Die Zettel landen erst,
       wenn ihr Rahmen steht, die Lage von .anker im CSS (Sprungmarke
       „Neuer Webauftritt" bei 103 von 200) und LANDUNG.webauftritt. */
    function buildMotion(tl) {
      var landAt = TILE_DELAY.map(function (dl) { return 34 + 18 * (.55 * dl + .45) - 8; });

      tl.to(cue, { opacity: 0, duration: 3, ease: 'none' }, 0);
      tl.to(W1, { yPercent: -80, opacity: 0, filter: 'blur(8px)', duration: 6, stagger: .45, ease: 'power2.in' }, 6);
      tl.to(rest1, { y: -30, opacity: 0, filter: 'blur(6px)', duration: 6, ease: 'power2.in' }, 6.5);
      tl.to(S, { sweep: 1, duration: 26, ease: 'sine.inOut' }, 6);
      tl.to(haze, { opacity: 1, duration: 30, ease: 'none' }, 8);
      tl.to(S, { float: .35, duration: 22, ease: 'none' }, 8);

      papers.forEach(function (p, i) {
        var c = function () { return L.papers[i]; };
        tl.fromTo(p, {
          x: function () { return c().x0 - c().w / 2; }, y: function () { return c().y0 - c().h / 2; },
          rotation: function () { return c().r0; }, scale: 1, filter: function () { return 'blur(' + c().blur + 'px)'; }
        }, {
          x: function () { return c().x1 - c().w / 2; }, y: function () { return c().y1 - c().h / 2; },
          rotation: function () { return c().r1; }, scale: function () { return c().s1; }, filter: 'blur(0px)',
          duration: 22, ease: 'power2.inOut'
        }, 9 + i * .9);
      });

      wordsIn(tl, W2, 21, .5);
      tl.fromTo(sub2, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 7, ease: 'aOut' }, 24.5);

      tl.to(S, { wrap: 1, duration: 18, ease: 'none' }, 34);
      tl.to(S, { float: 0, duration: 6, ease: 'none' }, 34);
      papers.forEach(function (p, i) {
        var c = function () { return L.papers[i]; }, at = landAt[i];
        tl.to(p, {
          x: function () { return L.slots[i].cx - c().w / 2; }, y: function () { return L.slots[i].cy - c().h / 2; },
          rotation: 0, scale: function () { return c().s2; }, duration: 9, ease: 'power3.inOut'
        }, at);
        // autoAlpha: Ist der Zettel weg, nimmt ihn der Browser ganz aus dem Bild
        tl.to(p, { autoAlpha: 0, filter: 'blur(3px)', duration: 2.4, ease: 'none' }, at + 7.2);
        tl.fromTo(tiles[i], { opacity: 0 }, { opacity: 1, duration: 2.4, ease: 'none' }, at + 6.4);
      });
      kpiNums.forEach(function (el, k) { counter(tl, el, 49 + k * .8, 7); });

      tl.to(S, { lit: 1, duration: 9, ease: 'none' }, 51);
      tl.fromTo(screenBg, { opacity: 0 }, { opacity: 1, duration: 5, ease: 'power1.inOut' }, 54);
      tl.fromTo(chrome, { opacity: 0 }, { opacity: 1, duration: 5, stagger: .5, ease: 'power1.inOut' }, 54.5);
      tl.fromTo(bodyEl, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 7, ease: 'aOut' }, 54);
      tl.fromTo([glowEl, glare], { opacity: 0 }, { opacity: 1, duration: 8, ease: 'none' }, 55);
      tl.to(S, { calm: 1, duration: 14, ease: 'none' }, 57);
      tl.fromTo(bars, { scaleY: 0 }, { scaleY: 1, duration: 6, stagger: .3, ease: 'aOut' }, 57);
      tl.fromTo(arc, { strokeDashoffset: 100 }, { strokeDashoffset: 14, duration: 8, ease: 'aOut' }, 58);
      counter(tl, donutNum, 58, 8);

      tl.fromTo(badge, { autoAlpha: 0, scale: .9, filter: 'blur(12px)', x: function () { return L.badge.x; }, y: function () { return L.badge.y + 24; } },
        { autoAlpha: 1, scale: 1, filter: 'blur(0px)', y: function () { return L.badge.y; }, duration: 7, ease: 'aOut' }, 58);
      tl.fromTo(badgePaths, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 5, stagger: 1.8, ease: 'aLogo' }, 59);

      wordsOut(tl, W2, 67);
      tl.to(sub2, { y: -20, opacity: 0, duration: 5, ease: 'power2.in' }, 67);
      tl.to(badge, { autoAlpha: 0, y: function () { return L.badge.y - 40; }, scale: 1.05, filter: 'blur(8px)', duration: 5, ease: 'power2.in' }, 68);
      tl.fromTo(device, { x: 0, y: 0, rotationX: 0, rotationY: 0, rotationZ: 0, scale: 1 }, {
        x: function () { return L.pose.x; }, y: function () { return L.pose.y; },
        rotationX: function () { return L.pose.rx; }, rotationY: function () { return L.pose.ry; },
        rotationZ: function () { return L.pose.rz; }, scale: function () { return L.pose.s; },
        duration: 15, ease: 'aInOut'
      }, 69);
      tl.to(S, { tilt: 1, duration: 8, ease: 'none' }, 76);
      tl.to(S, { veil: 1, duration: 10, ease: 'none' }, 72);
      wordsIn(tl, W3, 74);
      tl.fromTo(sub3, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 7, ease: 'aOut' }, 77);

      // Die App arbeitet: Eine Zahlung kommt herein, die offenen Rechnungen
      // gehen von 3 auf 2 und die Summe um den Betrag zurück.
      tl.fromTo(toast, { opacity: 0, y: -14, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: 3.5, ease: 'aOut' }, 80);
      var inv = { v: 3 }, rest = { v: 4870 };
      tl.fromTo(inv, { v: 3 }, { v: 2, duration: 1.5, ease: 'none', onUpdate: function () { fmt(kpiNums[2], inv.v); } }, 82.5);
      tl.fromTo(rest, { v: 4870 }, { v: 3630, duration: 3, ease: 'aOut', onUpdate: function () { restEl.textContent = group(rest.v); } }, 82.5);

      tl.to(S, { links: 1, duration: .01, ease: 'none' }, 85);
      callouts.forEach(function (c, k) {
        var at = 86 + k * 2.4;
        tl.fromTo(knots[k], { opacity: 0, scale: .3, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 2, ease: 'aOut' }, at);
        tl.fromTo(links[k], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 4, ease: 'power2.inOut' }, at + .4);
        tl.fromTo(c, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 4, ease: 'aOut' }, at + 2);
      });

      // --- Kapitel 2: Neuer Webauftritt
      tl.to(knots.concat(links, callouts), { opacity: 0, duration: 4, ease: 'power1.in' }, 100);
      tl.to(toast, { opacity: 0, y: -10, duration: 3, ease: 'power1.in' }, 100);
      wordsOut(tl, W3, 100);
      tl.to(sub3, { y: -20, opacity: 0, duration: 5, ease: 'power2.in' }, 100);
      tl.to(S, { links: 0, duration: .01, ease: 'none' }, 104.5);
      tl.to(S, { alpha: .75, duration: 10, ease: 'none' }, 100);
      tl.to(device, {
        x: function () { return L.pose3.x; }, y: function () { return L.pose3.y; },
        rotationX: function () { return L.pose3.rx; }, rotationY: function () { return L.pose3.ry; },
        rotationZ: function () { return L.pose3.rz; }, scale: function () { return L.pose3.s; },
        duration: 14, ease: 'aInOut'
      }, 100);
      // Der Bildschirm lädt die alte Seite
      tl.to(appEl, { opacity: 0, duration: 3, ease: 'power1.in' }, 103);
      tl.fromTo(webAlt, { autoAlpha: 0 }, { autoAlpha: 1, duration: .6, ease: 'none' }, 105.6);
      altLoad.forEach(function (el, i) {
        tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: .35, ease: 'none' }, 106 + i * .55);
      });
      tl.fromTo(altBild, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 4, ease: 'steps(5)' }, 110);
      tl.set(zDigit, { textContent: '8' }, 117);
      tl.fromTo(wKicker, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 4, ease: 'aOut' }, 105);
      wordsIn(tl, W5, 106);
      tl.fromTo(sub5, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 7, ease: 'aOut' }, 109);
      wordsOut(tl, W5, 120);
      tl.to(sub5, { y: -20, opacity: 0, duration: 5, ease: 'power2.in' }, 120);

      // Die Verwandlung
      altFall.forEach(function (el, i) {
        tl.to(el, { y: function () { return L.scrH * .9; }, rotation: i % 2 ? 9 : -11, opacity: 0, duration: 6, ease: 'power2.in' }, 121 + i * .6);
      });
      tl.to([waGrund, waPapier], { opacity: 0, duration: 6, ease: 'none' }, 123);
      tl.fromTo(webNeu, { autoAlpha: 0 }, { autoAlpha: 1, duration: .5, ease: 'none' }, 122.5);
      MORPH.forEach(function (p, i) {
        var at = 123 + i * 1.15, D = 7.5, m = function () { return L.m[i]; };
        tl.fromTo(p.n, {
          x: function () { return m().dx; }, y: function () { return m().dy; },
          scaleX: function () { return m().sx; }, scaleY: function () { return m().sy; }, transformOrigin: '0 0'
        }, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: D, ease: 'aInOut' }, at);
        tl.fromTo(p.n, { opacity: 0 }, { opacity: 1, duration: D * .45, ease: 'none' }, at + D * .18);
        tl.fromTo(p.a, { x: 0, y: 0, scaleX: 1, scaleY: 1, transformOrigin: '0 0' }, {
          x: function () { return -m().dx; }, y: function () { return -m().dy; },
          scaleX: function () { return 1 / m().sx; }, scaleY: function () { return 1 / m().sy; },
          duration: D, ease: 'aInOut'
        }, at);
        tl.to(p.a, { opacity: 0, duration: D * .4, ease: 'none' }, at + D * .1);
      });
      tl.fromTo(S, { hero: 0 }, { hero: 1, duration: 8, ease: 'none' }, 125);
      neuPop.forEach(function (el, i) {
        tl.fromTo(el, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 3, ease: 'aOut' }, 134.5 + i * .8);
      });
      // Danach trägt die neue Seite ihren Grund selbst, die alte geht
      tl.set(wnGrund, { opacity: 1 }, 139.5);
      tl.set(webAlt, { autoAlpha: 0 }, 139.6);
      wordsIn(tl, W6, 127);
      tl.fromTo(sub6, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 7, ease: 'aOut' }, 130);
      wordsOut(tl, W6, 150);
      tl.to(sub6, { y: -20, opacity: 0, duration: 5, ease: 'power2.in' }, 150);

      // Ein Zeiger fragt eine Offerte an
      tl.fromTo(zeiger, { opacity: 0, x: function () { return L.z0.x; }, y: function () { return L.z0.y; } }, { opacity: 1, duration: 1.5, ease: 'none' }, 151);
      tl.to(zeiger, { x: function () { return L.z1.x; }, y: function () { return L.z1.y; }, duration: 5, ease: 'power2.inOut' }, 151.5);
      [[157, ctaEl], [169.6, sendenEl]].forEach(function (c) {
        tl.to([zeiger, c[1]], { scale: .9, duration: .6, ease: 'power1.in' }, c[0]);
        tl.to([zeiger, c[1]], { scale: 1, duration: .9, ease: 'aOut' }, c[0] + .6);
      });
      tl.fromTo(anfrage, portrait ? { autoAlpha: 1, yPercent: 112 } : { autoAlpha: 1, xPercent: 116 },
        portrait ? { yPercent: 0, duration: 5, ease: 'aOut' } : { xPercent: 0, duration: 5, ease: 'aOut' }, 158.4);
      type(tl, tipper[0], 163, 2.4);
      type(tl, tipper[1], 165.8, 3);
      tl.to(zeiger, { x: function () { return L.z2.x; }, y: function () { return L.z2.y; }, duration: 3, ease: 'power2.inOut' }, 166.4);
      tl.fromTo(gesendet, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'none' }, 170.6);
      tl.to(zeiger, { opacity: 0, duration: 1.5, ease: 'none' }, 171.2);

      // … und daraus wird die App
      tl.to(webNeu, { scale: .9, autoAlpha: 0, duration: 5, ease: 'power2.in', transformOrigin: '50% 50%' }, 173);
      tl.to(S, { hero: 0, duration: 3, ease: 'none' }, 173);
      tl.to(appEl, { opacity: 1, duration: 4, ease: 'none' }, 175.5);
      tl.fromTo(trNeu, { maxHeight: 0, paddingTop: 0, paddingBottom: 0, borderTopWidth: 0, opacity: 0 }, {
        maxHeight: function () { return L.rowH; }, paddingTop: function () { return L.rowPad; }, paddingBottom: function () { return L.rowPad; },
        borderTopWidth: 1, opacity: 1, duration: 4, ease: 'aInOut'
      }, 178);
      tl.to(trLast, { maxHeight: 0, paddingTop: 0, paddingBottom: 0, borderTopWidth: 0, opacity: 0, duration: 4, ease: 'aInOut' }, 178);
      tl.fromTo(toastWeb, { opacity: 0, y: 14, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: 3.5, ease: 'aOut' }, 179);
      tl.fromTo(navNeu, { opacity: 0, scale: .4 }, { opacity: 1, scale: 1, duration: 2, ease: 'back.out(3)' }, 180);
      var offen = { v: 4 };
      tl.fromTo(offen, { v: 4 }, { v: 5, duration: 1.6, ease: 'none', onUpdate: function () { fmt(kpiNums[0], offen.v); } }, 180);
      wordsIn(tl, W7, 157);
      tl.fromTo(sub7, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 7, ease: 'aOut' }, 160);
      tl.fromTo(sBadge, { opacity: 0, scale: .9, filter: 'blur(10px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 6, ease: 'aOut' }, 184);
      tl.to({}, { duration: 8 }, 192);
    }

    /* Weniger Bewegung: vier stehende Bilder, die beim Scrollen ineinander
       überblenden. Nichts fliegt, nichts dreht sich, die Fäden bleiben
       still. */
    function buildStill(tl) {
      gsap.set([tiles, chrome, screenBg, bodyEl, glowEl, glare], { opacity: 1 });
      gsap.set(device, { opacity: 0 });
      kpiNums.concat([donutNum]).forEach(function (el) { fmt(el, +el.getAttribute('data-count')); });
      papers.forEach(function (p, i) {
        var c = L.papers[i];
        gsap.set(p, { x: c.x0 - c.w / 2, y: c.y0 - c.h / 2, rotation: c.r0 });
      });
      gsap.set(badge, { x: L.badge.x, y: L.badge.y });
      gsap.set([W2, W3, sub2, sub3], { opacity: 0 });
      // Kapitel 2 steht in drei Bildern bereit: alte Seite, neue Seite, App
      gsap.set(altLoad, { opacity: 1 });
      gsap.set(MORPH.map(function (p) { return p.n; }).concat(neuPop, [wnGrund]), { opacity: 1 });
      gsap.set([W5, W6, W7, sub5, sub6, sub7, wKicker], { opacity: 0 });

      tl.to(cue, { opacity: 0, duration: 3, ease: 'none' }, 0);
      tl.to([s1, q1('.papers', sec), cv.core, cv.glow], { opacity: 0, duration: 6, ease: 'none' }, 27);
      tl.to(device, { opacity: 1, duration: 6, ease: 'none' }, 30);
      tl.to([W2, sub2], { opacity: 1, duration: 6, ease: 'none' }, 30);
      tl.fromTo(badge, { opacity: 0 }, { opacity: 1, duration: 6, ease: 'none' }, 32);

      tl.to([W2, sub2, badge, device], { opacity: 0, duration: 4, ease: 'none' }, 62);
      tl.set(device, {
        x: function () { return L.pose.x; }, y: function () { return L.pose.y; },
        rotationX: function () { return L.pose.rx; }, rotationY: function () { return L.pose.ry; },
        rotationZ: function () { return L.pose.rz; }, scale: function () { return L.pose.s; }
      }, 66);
      tl.set(bars, { scaleY: 1 }, 66);
      tl.set(arc, { strokeDashoffset: 14 }, 66);
      tl.set(toast, { opacity: 1 }, 66);
      tl.set(links, { strokeDashoffset: 0 }, 66);
      tl.set(S, { links: 1 }, 66);
      tl.to(device, { opacity: 1, duration: 5, ease: 'none' }, 66);
      tl.to([W3, sub3], { opacity: 1, duration: 5, ease: 'none' }, 67);
      tl.fromTo([knots, links, callouts], { opacity: 0 }, { opacity: 1, duration: 5, ease: 'none' }, 70);

      tl.to([W3, sub3, knots, links, callouts, device, toast], { opacity: 0, duration: 4, ease: 'none' }, 100);
      tl.set(S, { links: 0 }, 104);
      tl.set(device, {
        x: function () { return L.pose3.x; }, y: function () { return L.pose3.y; },
        rotationX: function () { return L.pose3.rx; }, rotationY: function () { return L.pose3.ry; },
        rotationZ: function () { return L.pose3.rz; }, scale: function () { return L.pose3.s; }
      }, 104);
      tl.set(appEl, { opacity: 0 }, 104);
      tl.set(webAlt, { autoAlpha: 1 }, 104);
      tl.to(device, { opacity: 1, duration: 5, ease: 'none' }, 104);
      tl.to([wKicker, W5, sub5], { opacity: 1, duration: 5, ease: 'none' }, 105);
      tl.to([W5, sub5], { opacity: 0, duration: 4, ease: 'none' }, 122);
      tl.fromTo(webNeu, { autoAlpha: 0 }, { autoAlpha: 1, duration: 6, ease: 'none' }, 123);
      // die alte Seite liegt über der App – weg, sobald die neue deckt
      tl.set(webAlt, { autoAlpha: 0 }, 129.5);
      tl.to([W6, sub6], { opacity: 1, duration: 5, ease: 'none' }, 126);
      tl.to([W6, sub6], { opacity: 0, duration: 4, ease: 'none' }, 158);
      tl.set(trNeu, { maxHeight: function () { return L.rowH; }, paddingTop: function () { return L.rowPad; }, paddingBottom: function () { return L.rowPad; }, borderTopWidth: 1, opacity: 1 }, 160);
      tl.set(trLast, { maxHeight: 0, paddingTop: 0, paddingBottom: 0, borderTopWidth: 0, opacity: 0 }, 160);
      tl.set([toastWeb, navNeu, sBadge], { opacity: 1 }, 160);
      tl.set(kpiNums[0], { textContent: '5' }, 160);
      tl.to(appEl, { opacity: 1, duration: 6, ease: 'none' }, 160);
      tl.to(webNeu, { autoAlpha: 0, duration: 6, ease: 'none' }, 160);
      tl.to([W7, sub7], { opacity: 1, duration: 5, ease: 'none' }, 162);
      tl.to({}, { duration: 33 }, 167);
    }

    measure();
    setupLines();
    kpiNums.concat([donutNum]).forEach(function (el) { fmt(el, 0); });
    tipper.forEach(function (el) { el.textContent = reduced ? el.getAttribute('data-tippe') : ''; });
    var tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
    if (reduced) buildStill(tl); else buildMotion(tl);
    if (reduced) draw(0);

    return {
      tl: tl,
      tick: reduced ? null : tick,
      measure: measure,
      rescale: function () {
        cv.size(W, H); hero.size(L.hw, L.hh);
        L.mask = portrait ? cv.fade(0, 0, 0, H * .44, [[0, 1], [1, 0]]) : cv.fade(0, 0, W * .52, 0, [[0, 1], [1, 0]]);
        L.veil = cv.fade(0, 0, W * .5, 0, [[0, 1], [.62, .72], [1, 0]]);
        L.heroFade = hero.fade(0, 0, L.hw * (portrait ? .2 : .66), 0, [[0, .96], [1, 0]]);
      },
      refreshed: function () { if (reduced) draw(0); if (S.links > 0) placeLinks(); },
      onUpdate: function () {
        if (reduced && S.links > 0) placeLinks();
      },
      cleanup: function () {
        kpiNums.concat([donutNum]).forEach(function (el) { fmt(el, +el.getAttribute('data-count')); });
        restEl.textContent = '4’870';
        zDigit.textContent = '7';
        tipper.forEach(function (el) { el.textContent = el.getAttribute('data-tippe'); });
        hero.wipe(); hero._on = false;
      }
    };
  }


  /* =========================================================================
     KAPITEL GRIPSZUG – Szene 6, erste App
     ========================================================================= */
  function gripszug(sec, env) {
    var device = q1('.gz-device', sec), img = q1('.gz-screen img', sec), sky = q1('.gz-sky', sec);
    var rings = qa('.gz-ring', sec), chips = qa('.gz-chip', sec);
    var kicker = q1('.gz-copy .kicker', sec), Wg = words(q1('.gz-copy h2', sec)), sub = q1('.gz-copy .sub', sec);
    var areas = qa('.gz-areas li', sec), fills = qa('.gz-areas b', sec), nos = qa('.gz-no li', sec);
    var portrait = env.portrait, reduced = env.reduced;

    /* Zeitleiste:
         0–6    Hintergrund blendet über das Ende des neuen Webauftritts
         4–22   das Gerät kommt, das Bild wird farbig
         8–22   Titel
         26–58  fünf Wagen, fünf Bereiche – einer nach dem anderen
         60–72  keine Werbung, kein Abo, keine Käufe */
    function buildMotion(tl) {
      bgIn(tl, sec);
      tl.fromTo(sky, { opacity: 0 }, { opacity: 1, duration: 12, ease: 'none' }, 2);
      tl.fromTo(device, portrait
        ? { opacity: 0, y: 120, rotationX: 24, scale: .9, transformPerspective: 1400 }
        : { opacity: 0, x: 220, rotationY: -30, rotationX: 6, scale: .88, transformPerspective: 1600 },
      portrait
        ? { opacity: 1, y: 0, rotationX: 4, scale: 1, duration: 14, ease: 'aOut' }
        : { opacity: 1, x: 0, rotationY: -8, rotationX: 3, scale: 1, duration: 14, ease: 'aOut' }, 4);
      tl.fromTo(img, { filter: 'grayscale(1) brightness(.55)' }, { filter: 'grayscale(0) brightness(1)', duration: 10, ease: 'power1.inOut' }, 10);
      tl.fromTo(kicker, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 5, ease: 'aOut' }, 8);
      wordsIn(tl, Wg, 10);
      if (sub) tl.fromTo(sub, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 6, ease: 'aOut' }, 15);
      rings.forEach(function (r, k) {
        var at = 26 + k * 6.2;
        tl.fromTo(r, { opacity: 0, scale: .55 }, { opacity: 1, scale: 1, duration: 2.4, ease: 'aOut' }, at);
        tl.to(r, { opacity: 0, scale: 1.18, duration: 2.6, ease: 'power1.in' }, at + 4.2);
        tl.fromTo(chips[k], { opacity: 0 }, { opacity: 1, duration: 2, ease: 'none' }, at + .6);
        tl.fromTo(areas[k], { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 3.5, ease: 'aOut' }, at + .4);
        tl.fromTo(fills[k], { scaleX: 0 }, { scaleX: 1, duration: 4, ease: 'aOut' }, at + 1.4);
      });
      tl.fromTo(nos, { opacity: 0, y: 12, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: 4, stagger: 2.2, ease: 'aOut' }, 60);
      tl.to({}, { duration: 22 }, 78);
    }
    function buildStill(tl) {
      bgIn(tl, sec);
      gsap.set([kicker, sub, areas, nos, Wg, chips, device], { opacity: 1 });
      gsap.set(img, { filter: 'none' });
      gsap.set(fills, { scaleX: 1 });
      tl.fromTo([q1('.gz-copy', sec), device, sky], { opacity: 0 }, { opacity: 1, duration: 8, ease: 'none' }, 4);
      tl.to({}, { duration: 90 }, 10);
    }
    var tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
    if (reduced) buildStill(tl); else buildMotion(tl);
    return { tl: tl, tick: null };
  }


  /* =========================================================================
     KAPITEL DREAMTEAM – Referenzprojekt, zweite App
     Karten im Raum: Jede hat eine Lage (x, y, z) vor der Kamera. Die Kamera
     fliegt beim Scrollen hinein, die vorderen Karten ziehen am Rand vorbei.
     Danach werden elf Spieler ausgewählt, stellen sich als Team auf ein
     Spielfeld, und die Rangliste rechnet.

     Die Karten sind keine HTML-Elemente, sondern Bilder auf einer
     Zeichenfläche: Jede wird einmal in voller Schärfe vorgezeichnet und
     danach nur noch verschoben und skaliert. 26 Ebenen, die sich in jedem
     Bild neu vergrössern, liessen am Handy flackern und schnitten Karten
     beim Neuzeichnen kurz ab.

     Spieler und Klubs wie im Champions-League-Pool der App (dt.alae.app,
     data-cl2627.js). Fotos und Wappen liegen, sobald vorhanden, unter
     assets/dt/ (Liste DT_BILDER); fehlt eines, zeichnet die Karte eine
     Silhouette in den Klubfarben und das Kürzel des Klubs.
     ========================================================================= */
  var DT_KLUB = {
    541: { n: 'Real Madrid', k: 'RMA', a: '#F4F4F6', b: '#C9A227' },
    85: { n: 'Paris Saint Germain', k: 'PSG', a: '#0B2B5C', b: '#E23B3B' },
    50: { n: 'Manchester City', k: 'MCI', a: '#6CABDD', b: '#1C2C5B' },
    40: { n: 'Liverpool', k: 'LIV', a: '#C8102E', b: '#F6EB61' },
    157: { n: 'Bayern München', k: 'FCB', a: '#DC052D', b: '#FFFFFF' },
    42: { n: 'Arsenal', k: 'ARS', a: '#EF0107', b: '#FFFFFF' },
    529: { n: 'Barcelona', k: 'BAR', a: '#A50044', b: '#004D98' },
    505: { n: 'Inter', k: 'INT', a: '#0068A8', b: '#1A1A1A' },
    530: { n: 'Atletico Madrid', k: 'ATM', a: '#CB3524', b: '#272E61' },
    165: { n: 'Borussia Dortmund', k: 'BVB', a: '#FDE100', b: '#1A1A1A' },
    645: { n: 'Galatasaray', k: 'GAL', a: '#A90432', b: '#FDB912' }
  };
  // Das DreamTeam: 1-4-3-3, s = Platz auf dem Feld (siehe SLOTS), Captain Haaland
  var DT_TEAM = [
    { id: 730, n: 'Thibaut Courtois', c: 541, s: 0 },
    { id: 263482, n: 'Nuno Mendes', c: 85, s: 1 },
    { id: 22090, n: 'William Saliba', c: 42, s: 2 },
    { id: 31009, n: 'Alessandro Bastoni', c: 505, s: 3 },
    { id: 9, n: 'Achraf Hakimi', c: 85, s: 4 },
    { id: 181812, n: 'Jamal Musiala', c: 157, s: 5 },
    { id: 129718, n: 'Jude Bellingham', c: 541, s: 6 },
    { id: 133609, n: 'Pedri', c: 529, s: 7 },
    { id: 278, n: 'Kylian Mbappé', c: 541, s: 8 },
    { id: 1100, n: 'Erling Haaland', c: 50, s: 9, cap: true },
    { id: 386828, n: 'Lamine Yamal', c: 529, s: 10 }
  ];
  // Weitere Stars aus derselben Liste der App – sie fliegen vorbei oder
  // bleiben im Feld zurück
  var DT_ANDERE = [
    { id: 762, n: 'Vinícius Júnior', c: 541 }, { id: 184, n: 'Harry Kane', c: 157 },
    { id: 153, n: 'Ousmane Dembélé', c: 85 }, { id: 1460, n: 'Bukayo Saka', c: 42 },
    { id: 203224, n: 'Florian Wirtz', c: 40 }, { id: 25282, n: 'Gregor Kobel', c: 165 },
    { id: 756, n: 'Federico Valverde', c: 541 }, { id: 1496, n: 'Raphinha', c: 529 },
    { id: 502, n: 'Joshua Kimmich', c: 157 }, { id: 483, n: 'Khvicha Kvaratskhelia', c: 85 },
    { id: 217, n: 'Lautaro Martínez', c: 505 }, { id: 2864, n: 'Alexander Isak', c: 40 },
    { id: 18979, n: 'Viktor Gyökeres', c: 42 }, { id: 631, n: 'Phil Foden', c: 50 },
    { id: 1622, n: 'Gianluigi Donnarumma', c: 50 }
  ];
  // Welche Fotos und Wappen als Datei vorliegen (assets/dt/spieler/<id>.webp,
  // assets/dt/klubs/<id>.webp). Nur diese werden geladen, sonst gäbe jede
  // fehlende Datei einen Fehler in der Konsole.
  var DT_BILDER = { spieler: [], klubs: [] };
  var DT_CACHE = {};
  function dtBild(art, id, fertig) {
    if (DT_BILDER[art].indexOf(id) < 0) return null;
    var key = art + id, e = DT_CACHE[key];
    if (!e) {
      e = DT_CACHE[key] = { img: new Image(), ok: false, warten: [] };
      e.img.decoding = 'async';
      e.img.onload = function () { e.ok = true; e.warten.forEach(function (f) { f(); }); e.warten = []; };
      e.img.src = 'assets/dt/' + art + '/' + id + '.webp';
    }
    if (e.ok) return e.img;
    e.warten.push(fertig);
    return null;
  }
  var MANAGER = [
    { n: 'Leonie', t: 'FC Tiki-Taka', p: 1064, i: 'LE' },
    { n: 'Mika', t: 'Die Elfer', p: 1031, i: 'MI' },
    { n: 'Nora', t: 'Abseitsfalle', p: 1018, i: 'NO' },
    { n: 'Du', t: 'Dein DreamTeam', p: 1012, i: 'DU', me: true },
    { n: 'Timo', t: 'Real Rasen', p: 981, i: 'TI' },
    { n: 'Jana', t: 'Flankengott', p: 976, i: 'JA' }
  ];
  var DT_FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif';
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  // Eine Karte, 100 Einheiten breit, 138 hoch – aufgebaut wie in der App:
  // Foto, Name, Wappen, Klub
  function paintCard(cv, sp) {
    var ctx = cv.getContext('2d'), k = cv.width / 100, klub = DT_KLUB[sp.c];
    ctx.clearRect(0, 0, cv.width, cv.height);
    rrect(ctx, .6 * k, .6 * k, 98.8 * k, 136.8 * k, 7 * k);
    var g = ctx.createLinearGradient(0, 0, 0, cv.height);
    g.addColorStop(0, '#1B2849'); g.addColorStop(1, '#0B1328');
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = Math.max(1, .9 * k); ctx.strokeStyle = 'rgba(160,190,255,.2)'; ctx.stroke();
    var px = 10 * k, py = 8 * k, pw = 80 * k, ph = 73.6 * k;
    ctx.save(); rrect(ctx, px, py, pw, ph, 4.5 * k); ctx.clip();
    ctx.fillStyle = '#E6EAF1'; ctx.fillRect(px, py, pw, ph);
    var foto = dtBild('spieler', sp.id, sp.neu);
    if (foto) {
      // wie object-fit: cover, Gesicht eher oben
      var s = Math.max(pw / foto.width, ph / foto.height), fw = foto.width * s, fh = foto.height * s;
      ctx.drawImage(foto, px + (pw - fw) / 2, py + (ph - fh) * .25, fw, fh);
    } else {
      // Silhouette im Trikot des Klubs
      var sh = ctx.createLinearGradient(0, py, 0, py + ph);
      sh.addColorStop(0, '#CDD3DE'); sh.addColorStop(1, '#AEB6C4');
      ctx.fillStyle = sh;
      ctx.beginPath(); ctx.ellipse(50 * k, py + 30 * k, 13 * k, 15.5 * k, 0, 0, TAU); ctx.fill();
      ctx.fillRect(45 * k, py + 42 * k, 10 * k, 9 * k);
      ctx.fillStyle = klub.a;
      ctx.beginPath(); ctx.moveTo(px - 2 * k, py + ph);
      ctx.bezierCurveTo(px + 4 * k, py + 56 * k, px + 22 * k, py + 50 * k, 50 * k, py + 50 * k);
      ctx.bezierCurveTo(px + 58 * k, py + 50 * k, px + 76 * k, py + 56 * k, px + pw + 2 * k, py + ph);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = klub.b; ctx.lineWidth = 2.4 * k; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(43 * k, py + 51 * k); ctx.lineTo(50 * k, py + 58 * k); ctx.lineTo(57 * k, py + 51 * k); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(px, py + ph - 4 * k, pw, 4 * k);
    }
    ctx.restore();
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    var fs = 8.2 * k;
    ctx.font = '800 ' + fs + 'px ' + DT_FONT;
    while (ctx.measureText(sp.n).width > 90 * k && fs > 5 * k) { fs -= .25 * k; ctx.font = '800 ' + fs + 'px ' + DT_FONT; }
    ctx.fillStyle = '#FFFFFF'; ctx.fillText(sp.n, 50 * k, 93.5 * k);
    var cy = 106.5 * k, cr = 9.5 * k, logo = dtBild('klubs', sp.c, sp.neu);
    if (logo) {
      var ls = Math.min(2 * cr / logo.width, 2 * cr / logo.height);
      ctx.drawImage(logo, 50 * k - logo.width * ls / 2, cy - logo.height * ls / 2, logo.width * ls, logo.height * ls);
    } else {
      ctx.beginPath(); ctx.arc(50 * k, cy, cr, 0, TAU); ctx.fillStyle = klub.a; ctx.fill();
      ctx.lineWidth = 1.3 * k; ctx.strokeStyle = klub.b; ctx.stroke();
      ctx.fillStyle = klub.b; ctx.font = '900 ' + 5.4 * k + 'px ' + DT_FONT; ctx.textBaseline = 'middle';
      ctx.fillText(klub.k, 50 * k, cy + .3 * k); ctx.textBaseline = 'alphabetic';
    }
    ctx.font = '650 ' + 5.3 * k + 'px ' + DT_FONT; ctx.fillStyle = '#AFC0E0';
    ctx.fillText(klub.n, 50 * k, 126.5 * k);
  }
  // Überlagerungen, einmal vorgezeichnet: Auswahlrahmen, Häkchen, Captain
  function paintOverlays(k) {
    var m = 8 * k, o = {};
    o.pick = document.createElement('canvas'); o.pick.width = Math.round(100 * k + 2 * m); o.pick.height = Math.round(138 * k + 2 * m);
    var c = o.pick.getContext('2d');
    c.shadowColor = 'rgba(254,121,113,.85)'; c.shadowBlur = 7 * k;
    c.lineWidth = 2.4 * k; c.strokeStyle = '#FE7971';
    rrect(c, m - 2.2 * k, m - 2.2 * k, 104.4 * k, 142.4 * k, 8.6 * k); c.stroke();
    o.m = m;
    var badge = function (fill, draw) {
      var b = document.createElement('canvas'); b.width = b.height = Math.round(24 * k);
      var x = b.getContext('2d'), r = 10.5 * k;
      x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 2 * k; x.shadowOffsetY = k;
      x.beginPath(); x.arc(12 * k, 12 * k, r, 0, TAU); x.fillStyle = fill; x.fill();
      x.shadowColor = 'transparent'; draw(x); return b;
    };
    o.ok = badge('#FE7971', function (x) {
      x.strokeStyle = '#22100F'; x.lineWidth = 2.6 * k; x.lineCap = x.lineJoin = 'round';
      x.beginPath(); x.moveTo(7.6 * k, 12.3 * k); x.lineTo(10.8 * k, 15.4 * k); x.lineTo(16.6 * k, 8.9 * k); x.stroke();
    });
    o.cap = badge('#F5C542', function (x) {
      x.fillStyle = '#3A2A00'; x.font = '900 ' + 12 * k + 'px ' + DT_FONT; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('C', 12 * k, 12.8 * k);
    });
    return o;
  }

  function dreamteam(sec, env) {
    var stage = q1('.stage', sec), field = q1('.dt-field', sec), scrim = q1('.dt-scrim', sec), copyEl = q1('.dt-copy', sec);
    var kicker = q1('.dt-copy .kicker', sec), Wd = words(q1('.dt-copy h2', sec)), stepsList = q1('.dt-steps', sec), steps = qa('.dt-steps li', sec);
    var btn = q1('.dt-btn', sec), rank = q1('.dt-rank', sec), rowsBox = q1('.dt-rows', sec);
    var portrait = env.portrait, reduced = env.reduced;
    var NFELD = portrait ? 6 : 8, NPASS = portrait ? 5 : 7;
    var CAM0 = -2600, F = 900;
    var S = { cam: 0, form: 0, dim: 0 };
    var W = 0, H = 0, CW = 0, CH = 0, dpr = 1;
    var R = mulberry(23);

    // Spielfeld (SVG) und Zeichenfläche für die Karten – pro Format neu
    field.innerHTML = '';
    var pitch = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    pitch.setAttribute('class', 'dt-pitch');
    field.appendChild(pitch);
    var cv = document.createElement('canvas');
    cv.className = 'dt-cards';
    field.appendChild(cv);
    var ctx = cv.getContext('2d');
    var probe = document.createElement('i');
    probe.className = 'dt-mass';
    field.appendChild(probe);

    var cards = [];
    DT_TEAM.forEach(function (p) { cards.push({ p: p, team: true, pass: false, slot: p.s }); });
    DT_ANDERE.slice(0, NFELD + NPASS).forEach(function (p, i) { cards.push({ p: p, team: false, pass: i >= NFELD, slot: -1 }); });
    cards.forEach(function (c) { c.pick = 0; c.ok = 0; c.cap = 0; c.u = 0; c.v = 0; c.z = 0; });

    /* Feldkarten auf einem lockeren Raster: quer rechts vom Text, hoch unter
       ihm. u und v sind die Lage im Bild, wenn die Kamera angekommen ist
       (-1 bis 1). Die Spieler des Teams liegen vorn und so verteilt, dass
       jeder auf dem Weg zu seinem Platz niemanden kreuzt: Wer links spielt,
       steht auch im Feld links. */
    var SLOTS = [[0, .98], [-.72, .7], [-.25, .73], [.25, .73], [.72, .7], [-.52, .42], [0, .45], [.52, .42], [-.55, .14], [0, .1], [.55, .14]];
    var cols = portrait ? 3 : 5, rowsN = portrait ? 6 : 4, cells = [];
    for (var cy = 0; cy < rowsN; cy++) for (var cx = 0; cx < cols; cx++) cells.push({ cx: (cx + .5) / cols, cy: (cy + .5) / rowsN });
    // Zufällige, aber feste Auswahl der Zellen für das Team
    var order = cells.map(function (c, i) { return { i: i, r: R() }; }).sort(function (a, b) { return a.r - b.r; });
    var teamCells = order.slice(0, 11).map(function (o) { return cells[o.i]; }).sort(function (a, b) { return a.cx - b.cx || a.cy - b.cy; });
    var restCells = order.slice(11).map(function (o) { return cells[o.i]; });
    var teamBySlot = cards.filter(function (c) { return c.team; }).sort(function (a, b) {
      return (SLOTS[a.slot][0] - SLOTS[b.slot][0]) || (SLOTS[a.slot][1] - SLOTS[b.slot][1]);
    });
    function atCell(c, cell, z0, z1) {
      c.u = (portrait ? lerp(-.78, .78, cell.cx) : lerp(-.3, .9, cell.cx)) + (R() - .5) * .1;
      c.v = (portrait ? lerp(-.26, .86, cell.cy) : lerp(-.56, .7, cell.cy)) + (R() - .5) * .1;
      c.z = z0 + R() * (z1 - z0);
    }
    teamBySlot.forEach(function (c, i) { atCell(c, teamCells[i], 880, 1180); c.delay = (10 - c.slot) * .045; });
    cards.filter(function (c) { return !c.team && !c.pass; }).forEach(function (c, i) { atCell(c, restCells[i % restCells.length], 1300, 1750); });
    // Vorbeiflieger: Am Ende liegen sie hinter der Kamera. Unterwegs kommen
    // sie aus der Tiefe auf einen zu und ziehen am Rand vorbei, nach aussen
    // – quer nach rechts, oben rechts und unten, hoch zu den Seiten und nach
    // unten, nie über den Text (quer oben links, hoch oben).
    cards.forEach(function (c) {
      if (!c.pass) return;
      var an = portrait ? lerp(-.2, Math.PI + .2, R()) : lerp(-1.25, 2.3, R()), r0 = .55 + R() * .3;
      c.u = Math.cos(an) * r0; c.v = Math.sin(an) * r0;
      // So weit hinten, dass sie erst vorbeiziehen, wenn der Hintergrund
      // steht (12–22), und am Ende sicher hinter der Kamera liegen
      c.z = -600 + R() * 700;
    });
    // Ausgewählt wird in lockerer Reihenfolge, nicht von links nach rechts
    var pickOrder = teamBySlot.map(function (c) { return { c: c, r: R() }; }).sort(function (a, b) { return a.r - b.r; }).map(function (o) { return o.c; });

    // Vorzeichnen: zwei Grössen je Karte, die kleine für ferne Karten, damit
    // beim starken Verkleinern nichts flimmert
    var OV = null;
    function sprites() {
      var sw = Math.max(120, Math.min(400, Math.round(CW * dpr * 1.35)));
      cards.forEach(function (c) {
        if (!c.hi) { c.hi = document.createElement('canvas'); c.lo = document.createElement('canvas'); }
        c.hi.width = sw; c.hi.height = Math.round(sw * 1.38);
        c.lo.width = Math.round(sw * .4); c.lo.height = Math.round(sw * .4 * 1.38);
        var neu = function () { paintCard(c.hi, c.p); paintCard(c.lo, c.p); };
        c.p = Object.assign({}, c.p, { neu: neu });
        neu();
      });
      OV = paintOverlays(sw / 100);
    }

    // Rangliste
    rowsBox.innerHTML = '';
    var slotsCol = document.createElement('div');
    var rowEls = MANAGER.map(function (m) {
      var r = document.createElement('div');
      r.className = 'dt-row' + (m.me ? ' me' : '');
      r.innerHTML = '<span class="dt-no"></span><span class="dt-av">' + m.i + '</span><span class="dt-who"><b>' + m.n + '</b><small>' + m.t +
        '</small></span><span class="dt-pts"><span data-p>' + group(m.p) + '</span><small>Pkt</small></span>' + (m.me ? '<i class="dt-live">+86 · live</i>' : '');
      rowsBox.appendChild(r);
      return r;
    });
    MANAGER.forEach(function (m, k) {
      var n = document.createElement('span');
      n.className = 'dt-no dt-slotno'; n.textContent = k + 1;
      n.style.cssText = 'position:absolute; left:.6rem; width:1.9rem; top:0; z-index:2; pointer-events:none';
      slotsCol.appendChild(n);
    });
    rowsBox.appendChild(slotsCol);
    var crown = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    crown.setAttribute('viewBox', '0 0 32 24'); crown.setAttribute('class', 'dt-crown');
    crown.innerHTML = '<path d="M3 20 1.5 6l8 6L16 2l6.5 10 8-6L29 20Z" fill="#F5C542"/>';
    rowsBox.appendChild(crown);
    var meRow = rowEls[3], meNum = q1('[data-p]', meRow), live = q1('.dt-live', meRow);
    var slotNums = qa('.dt-slotno', rowsBox);

    var P = {};
    function measure() {
      W = stage.clientWidth; H = stage.clientHeight;
      CW = probe.offsetWidth; CH = CW * 1.38;
      var fit = Math.sqrt(PIXEL_BUDGET / Math.max(1, W * H));
      dpr = Math.max(.75, Math.min(window.devicePixelRatio || 1, 2, fit) * Math.max(quality, .75));
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      sprites();
      // Spielfeld als Trapez: oben schmal (weit weg), unten breit (nah)
      P = portrait
        ? { cx: W * .5, top: H * .33, bottom: H * .74, tw: W * .3, bw: W * .47, s0: .36, s1: .52 }
        : { cx: W * .6, top: H * .3, bottom: H * .9, tw: W * .2, bw: W * .34, s0: .34, s1: .5 };
      cards.forEach(function (c) {
        // Feldkarten stehen bei u, v, wenn die Kamera angekommen ist;
        // Vorbeiflieger dort, wenn sie noch 600 vor der Kamera sind – danach
        // wandern sie nach aussen aus dem Bild.
        var zr = c.pass ? 600 : c.z;
        c.x = c.u * (W / 2) * (zr / F);
        c.y = c.v * (H / 2) * (zr / F);
        if (c.team) {
          var s = SLOTS[c.slot], hw = lerp(P.tw, P.bw, s[1]);
          c.fx = P.cx + s[0] * hw * .86; c.fy = lerp(P.top, P.bottom, s[1]) - CH * lerp(P.s0, P.s1, s[1]) * .3;
          c.fs = lerp(P.s0, P.s1, s[1]);
        }
      });
      drawPitch();
      var rowH = rowEls[0].offsetHeight, rowStep = rowH + (portrait ? 5 : 6);
      P.row = rowStep;
      slotNums.forEach(function (n, k) { n.style.top = (k * rowStep) + 'px'; n.style.lineHeight = rowH + 'px'; });
      rowEls.forEach(function (r, k) { r.style.top = (k * rowStep) + 'px'; });
      crown.style.top = (-.95 * 16) + 'px';
      // Knopf unter dem Spielfeld
      P.btn = { x: P.cx - btn.offsetWidth / 2, y: P.bottom + (portrait ? 12 : -6) };
      /* Schlussbild: Das Team rückt als Ganzes zwischen Text und Rangliste.
         Quer mittig zwischen den beiden, der breite Rand des Spielfelds
         unten, wo beide schon enden; hoch in den Streifen zwischen Text und
         Rangliste, so gross, wie er Platz hat. Gerechnet um die Mitte der
         Bühne, dort liegt der Drehpunkt. */
      var cb = rel(copyEl, stage), rk = rel(rank, stage), sc;
      if (portrait) {
        var yA = cb.y + cb.h + 8, yB = rk.y - 8;
        var top = P.top - CH * P.s0 * .8, bot = P.bottom + CH * P.s1 * .2;
        sc = Math.max(.3, Math.min(.62, (yB - yA) / (bot - top)));
        P.end = { s: sc, x: -(P.cx - W / 2) * sc, y: (yA + yB) / 2 - H / 2 - ((top + bot) / 2 - H / 2) * sc };
      } else {
        sc = .6;
        var mid = (cb.x + cb.w + rk.x) / 2;
        P.end = { s: sc, x: mid - W / 2 - (P.cx - W / 2) * sc, y: H * .4 - (P.bottom - H / 2) * sc };
      }
    }
    function drawPitch() {
      pitch.setAttribute('width', W); pitch.setAttribute('height', H);
      pitch.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var pt = function (u, v) { var hw = lerp(P.tw, P.bw, v); return (P.cx + u * hw).toFixed(1) + ',' + lerp(P.top, P.bottom, v).toFixed(1); };
      var poly = function (arr) { return arr.map(function (a) { return pt(a[0], a[1]); }).join(' '); };
      var bands = '';
      for (var k = 0; k < 8; k++) {
        bands += '<polygon points="' + poly([[-1, k / 8], [1, k / 8], [1, (k + 1) / 8], [-1, (k + 1) / 8]]) + '" fill="' + (k % 2 ? '#1F6E3A' : '#237A41') + '"/>';
      }
      var lineAt = function (v) { return '<polyline points="' + poly([[-1, v], [1, v]]) + '"/>'; };
      var circle = '', n = 36;
      for (var j = 0; j <= n; j++) {
        var an = j / n * TAU, u = Math.cos(an) * .22, v = .3 + Math.sin(an) * .06;
        circle += (j ? ' ' : '') + pt(u, v);
      }
      pitch.innerHTML = '<defs><linearGradient id="dtFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".4" stop-color="#000" stop-opacity="0"/></linearGradient></defs>' +
        '<g>' + bands + '</g>' +
        '<g fill="none" stroke="rgba(255,255,255,.75)" stroke-width="2">' +
        '<polygon points="' + poly([[-1, 0], [1, 0], [1, 1], [-1, 1]]) + '"/>' + lineAt(.3) +
        '<polyline points="' + circle + '"/>' +
        '<polyline points="' + poly([[-.44, 1], [-.44, .8], [.44, .8], [.44, 1]]) + '"/>' +
        '<polyline points="' + poly([[-.2, 1], [-.2, .92], [.2, .92], [.2, 1]]) + '"/>' +
        '</g>' +
        '<polygon points="' + poly([[-1, 0], [1, 0], [1, 1], [-1, 1]]) + '" fill="url(#dtFade)"/>';
    }

    // Jedes Bild: Lage jeder Karte rechnen, nach Tiefe ordnen, zeichnen
    var vis = [];
    function place(t) {
      var camZ = lerp(CAM0, 0, S.cam);
      vis.length = 0;
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i], rest = !c.team && !c.pass;
        // Wer nicht ins Team kommt, fällt zurück in die Tiefe und verblasst
        var zc = c.z - camZ + (rest ? S.dim * 900 : 0);
        var o = smooth(4700, 3700, zc);
        if (c.pass) o *= smooth(140, 480, zc);
        if (rest) o *= 1 - S.dim;
        if (o < .003 || zc < 40) continue;
        var f = F / zc;
        var sx = W / 2 + c.x * f, sy = H / 2 + c.y * f, s = f * .92;
        if (!c.pass) { sx += ptr.x * 14 * f; sy += Math.sin(t * .55 + i * 1.3) * 5 * f + ptr.y * 9 * f; }
        if (c.team) {
          var w = inOut(clamp01((S.form - c.delay) / .55));
          sx = lerp(sx, c.fx, w); sy = lerp(sy, c.fy, w); s = lerp(s, c.fs, w);
        }
        c.sx = sx; c.sy = sy; c.s = s; c.o = o;
        // Nah vor fern; sobald das Team sich aufstellt, liegt es oben
        c.key = c.team && S.form > 0 ? 1e5 + c.slot : -zc;
        vis.push(c);
      }
      vis.sort(function (a, b) { return a.key - b.key; });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      for (var j = 0; j < vis.length; j++) {
        var d = vis[j], w2 = CW * d.s, h2 = CH * d.s, x = d.sx - w2 / 2, y = d.sy - h2 / 2;
        ctx.globalAlpha = d.o;
        ctx.drawImage(w2 * dpr < d.lo.width * 1.15 ? d.lo : d.hi, x, y, w2, h2);
        if (d.pick > .01) {
          var pw = w2 * OV.pick.width / d.hi.width, ph = h2 * OV.pick.height / d.hi.height;
          ctx.globalAlpha = d.o * d.pick;
          ctx.drawImage(OV.pick, d.sx - pw / 2, d.sy - ph / 2, pw, ph);
        }
        var bs = w2 * .24;
        if (d.ok > .01) {
          var ks = bs * (.5 + .5 * Math.min(1, d.ok * 1.25));
          ctx.globalAlpha = d.o * Math.min(1, d.ok);
          ctx.drawImage(OV.ok, x + w2 - ks * .62, y - ks * .38, ks, ks);
        }
        if (d.cap > .01) {
          var cs = bs * (.4 + .6 * Math.min(1, d.cap * 1.2));
          ctx.globalAlpha = d.o * Math.min(1, d.cap);
          ctx.drawImage(OV.cap, x - cs * .38, y - cs * .38, cs, cs);
        }
      }
      ctx.globalAlpha = 1;
    }
    function tick(t) { place(t); }

    /* Zeitleiste:
         0–6    Hintergrund blendet über Gripszug
         0–34   Flug ins Kartenfeld, Titel
         30–42  elf Spieler werden ausgewählt
         42–60  sie stellen sich als Team auf, das Spielfeld erscheint
         64–78  Team rückt zur Seite, die Rangliste kommt
         76–90  deine Punkte kommen live herein, du kletterst auf Platz 1 */
    function buildMotion(tl) {
      bgIn(tl, sec);
      tl.fromTo(S, { cam: 0 }, { cam: 1, duration: 34, ease: 'power2.out' }, 0);
      // Das Kartenfeld blendet mit dem Hintergrund ein, statt mitten im
      // vorigen Kapitel aufzutauchen
      tl.fromTo(field, { opacity: 0 }, { opacity: 1, duration: 6, ease: 'none' }, 0);
      // Dunkler Grund hinter dem Text, solange Karten dahinter vorbeiziehen
      tl.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 8, ease: 'none' }, 0);
      tl.to(scrim, { opacity: 0, duration: 8, ease: 'none' }, 62);
      tl.fromTo(kicker, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 5, ease: 'aOut' }, 5);
      wordsIn(tl, Wd, 7);
      tl.fromTo(stepsList, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 6, ease: 'aOut' }, 12);
      pickOrder.forEach(function (c, k) {
        var at = 30 + k * .9;
        tl.fromTo(c, { pick: 0 }, { pick: 1, duration: 2, ease: 'none' }, at);
        tl.fromTo(c, { ok: 0 }, { ok: 1, duration: 2, ease: 'none' }, at + .3);
        tl.to(c, { pick: 0, ok: 0, duration: 3.5, ease: 'none' }, 50);
        if (c.p.cap) tl.fromTo(c, { cap: 0 }, { cap: 1, duration: 2.4, ease: 'none' }, 57);
      });
      tl.fromTo(S, { form: 0, dim: 0 }, { form: 1, dim: 1, duration: 18, ease: 'none' }, 42);
      tl.fromTo(pitch, { opacity: 0, scaleY: .7, transformOrigin: '50% 100%' }, { opacity: 1, scaleY: 1, duration: 10, ease: 'aOut' }, 44);
      tl.fromTo(btn, { autoAlpha: 0, x: function () { return P.btn.x; }, y: function () { return P.btn.y + 16; } },
        { autoAlpha: 1, y: function () { return P.btn.y; }, duration: 4, ease: 'aOut' }, 58);
      tl.to(btn, { autoAlpha: 0, duration: 3, ease: 'none' }, 64);
      tl.fromTo(field, { x: 0, y: 0, scale: 1 }, {
        x: function () { return P.end.x; }, y: function () { return P.end.y; }, scale: function () { return P.end.s; },
        duration: 12, ease: 'aInOut'
      }, 64);
      tl.fromTo(rank, { autoAlpha: 0, x: portrait ? 0 : 40, y: portrait ? 40 : 0 }, { autoAlpha: 1, x: 0, y: 0, duration: 8, ease: 'aOut' }, 68);
      // Die Zeilen stehen über style.top an ihrem Platz (measure), y ist nur
      // der Platztausch. Ein gestaffeltes fromTo verliert seinen Anfang beim
      // Neuberechnen – darum auch die Deckkraft 0 im CSS.
      tl.fromTo(rowEls, { opacity: 0, x: 18 }, { opacity: 1, x: 0, duration: 4, stagger: .6, ease: 'aOut' }, 70);
      var pts = { v: 1012 };
      tl.fromTo(live, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 2, ease: 'aOut' }, 78);
      tl.fromTo(pts, { v: 1012 }, { v: 1098, duration: 6, ease: 'aOut', onUpdate: function () { meNum.textContent = group(pts.v); } }, 78.5);
      tl.fromTo(meRow, { y: 0 }, { y: function () { return -3 * P.row; }, duration: 5, ease: 'aInOut' }, 82);
      [0, 1, 2].forEach(function (k) { tl.fromTo(rowEls[k], { y: 0 }, { y: function () { return P.row; }, duration: 5, ease: 'aInOut' }, 82); });
      tl.to(live, { opacity: 0, duration: 3, ease: 'none' }, 88);
      tl.fromTo(crown, { opacity: 0, y: 6, scale: .5 }, { opacity: 1, y: 0, scale: 1, duration: 2.4, ease: 'back.out(3)' }, 87);
      tl.to({}, { duration: 8 }, 92);
    }
    function buildStill(tl) {
      bgIn(tl, sec);
      S.cam = 1; S.form = 1; S.dim = 1;
      cards.forEach(function (c) { if (c.p.cap) c.cap = 1; });
      gsap.set([kicker, stepsList, Wd, pitch], { opacity: 1 });
      gsap.set(field, { x: P.end.x, y: P.end.y, scale: P.end.s });
      gsap.set(rank, { autoAlpha: 1 });
      gsap.set(rowEls, { opacity: 1 });
      gsap.set(meRow, { y: -3 * P.row });
      gsap.set(rowEls.slice(0, 3), { y: P.row });
      meNum.textContent = group(1098);
      gsap.set(crown, { opacity: 1 });
      steps.forEach(function (s) { s.classList.add('on'); });
      tl.fromTo([q1('.dt-copy', sec), field, rank], { opacity: 0 }, { opacity: 1, duration: 8, ease: 'none' }, 4);
      tl.to({}, { duration: 90 }, 10);
    }

    measure();
    var tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
    if (reduced) buildStill(tl); else buildMotion(tl);
    if (reduced) place(0);
    return {
      tl: tl, tick: reduced ? null : tick, measure: measure,
      rescale: function () { measure(); },
      refreshed: function () { if (reduced) place(0); },
      onUpdate: function (p) {
        if (reduced) return;
        var u = p * 100;
        steps[0].classList.toggle('on', u >= 14);
        steps[1].classList.toggle('on', u >= 44);
        steps[2].classList.toggle('on', u >= 68);
      },
      cleanup: function () { field.innerHTML = ''; rowsBox.innerHTML = ''; steps.forEach(function (s) { s.classList.remove('on'); }); }
    };
  }


  /* =========================================================================
     KAPITEL FOTOVERKAUF – Szene 6, dritte App
     Erst das Alte: eine E-Mail mit vierzehn Anhängen, Bestellformular und
     Rechnung. Die Anhänge fliegen davon, und auf dem Telefon läuft der Weg
     der Eltern: Adresse, Code, die eigenen Fotos, bezahlen, herunterladen.
     ========================================================================= */
  function fotos(sec, env) {
    var glow = q1('.ft-glow', sec), mail = q1('.ft-mail', sec), atts = qa('.ft-att span', sec);
    var phone = q1('.ft-phone', sec), lock = q1('.ft-lock', sec), gal = q1('.ft-gal', sec), pics = qa('.ft-pic', sec);
    var wms = qa('.ft-wm', sec), sels = qa('.ft-sel', sec), dls = qa('.ft-dl', sec);
    var sheet = q1('.ft-sheet', sec), paid = q1('.ft-paid', sec), cartNum = q1('.ft-cart em', sec);
    var typers = qa('[data-tippe]', sec), caret = q1('.ft-caret', sec), shackle = q1('.ft-shackle', sec);
    var kicker = q1('.ft-copy .kicker', sec), Wf = words(q1('.ft-copy h2', sec)), pointsList = q1('.ft-points', sec), points = qa('.ft-points li', sec);
    var portrait = env.portrait, reduced = env.reduced;
    var PICKED = [0, 2, 4];
    var POINT_AT = [18, 34, 41, 71];

    /* Zeitleiste:
         0–6    Hintergrund blendet über das DreamTeam
         3–14   die E-Mail mit den Anhängen
         16–30  die Anhänge fliegen davon
         24–34  das Telefon kommt
         32–44  Adresse und Code werden eingetippt
         44–54  das Schloss geht auf, die eigenen Fotos erscheinen
         56–64  drei Fotos auswählen
         62–76  Warenkorb, bezahlen
         78–88  die Wasserzeichen verschwinden, das Original steht bereit */
    function buildMotion(tl) {
      bgIn(tl, sec);
      tl.fromTo(glow, { opacity: 0 }, { opacity: 1, duration: 10, ease: 'none' }, 2);
      tl.fromTo(mail, { opacity: 0, y: 30, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: 6, ease: 'aOut' }, 3);
      tl.fromTo(atts, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 3, stagger: .35, ease: 'aOut' }, 5);
      tl.fromTo(kicker, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 5, ease: 'aOut' }, 6);
      wordsIn(tl, Wf, 8);
      tl.fromTo(pointsList, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 6, ease: 'aOut' }, 12);
      var R = mulberry(5);
      atts.forEach(function (a, i) {
        var dx = (R() - .5) * 520, dy = -120 - R() * 260, rot = (R() - .5) * 80;
        tl.to(a, { x: dx, y: dy, rotation: rot, opacity: 0, duration: 7, ease: 'power2.in' }, 16 + i * .45);
      });
      tl.to(mail, { autoAlpha: 0, scale: .9, y: -20, duration: 6, ease: 'power2.in' }, 24);
      tl.fromTo(phone, portrait
        ? { opacity: 0, y: 140, rotationX: 20, transformPerspective: 1400 }
        : { opacity: 0, x: 200, rotationY: -26, transformPerspective: 1600 },
      portrait
        ? { opacity: 1, y: 0, rotationX: 0, duration: 10, ease: 'aOut' }
        : { opacity: 1, x: 0, rotationY: -6, duration: 10, ease: 'aOut' }, 24);
      type(tl, typers[0], 32, 5);
      type(tl, typers[1], 38, 4);
      tl.fromTo(caret, { opacity: 0 }, { opacity: 1, duration: .5, ease: 'none' }, 38);
      tl.to(caret, { opacity: 0, duration: .5, ease: 'none' }, 42.5);
      tl.fromTo(shackle, { y: 0 }, { y: -7, duration: 2.5, ease: 'back.out(2.2)' }, 43.5);
      tl.to(lock, { opacity: 0, y: -16, duration: 4, ease: 'power2.in' }, 46);
      tl.fromTo(gal, { opacity: 0 }, { opacity: 1, duration: 2, ease: 'none' }, 48);
      tl.fromTo(pics, { opacity: 0, y: 14, scale: .94 }, { opacity: 1, y: 0, scale: 1, duration: 4, stagger: .7, ease: 'aOut' }, 48.5);
      var cart = { v: 0 };
      PICKED.forEach(function (p, k) {
        tl.fromTo(sels[p], { opacity: 0, scale: .4 }, { opacity: 1, scale: 1, duration: 1.8, ease: 'back.out(3)' }, 56 + k * 2);
      });
      tl.fromTo(cart, { v: 0 }, { v: 3, duration: 5, ease: 'none', onUpdate: function () { cartNum.textContent = Math.floor(cart.v + .3); } }, 56.5);
      // y: 0 dazu, sonst liest GSAP die Verschiebung aus dem CSS als Pixel
      // und rechnet sie zu yPercent hinzu – der Warenkorb bliebe unten.
      tl.fromTo(sheet, { y: 0, yPercent: 110 }, { yPercent: 0, duration: 6, ease: 'aOut' }, 63);
      tl.fromTo(paid, { opacity: 0 }, { opacity: 1, duration: 2, ease: 'none' }, 71);
      tl.to(sheet, { yPercent: 110, duration: 5, ease: 'power2.in' }, 76);
      tl.to(wms, { opacity: 0, duration: 4, stagger: .5, ease: 'none' }, 79);
      PICKED.forEach(function (p, k) {
        tl.to(sels[p], { opacity: 0, duration: 2, ease: 'none' }, 80);
        tl.fromTo(dls[p], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 3, ease: 'aOut' }, 81 + k * .8);
      });
      tl.to({}, { duration: 10 }, 90);
    }
    function buildStill(tl) {
      bgIn(tl, sec);
      gsap.set([kicker, pointsList, Wf, phone, gal, pics], { opacity: 1 });
      gsap.set(lock, { opacity: 0 }); gsap.set(mail, { autoAlpha: 0 }); gsap.set(wms, { opacity: 0 });
      PICKED.forEach(function (p) { gsap.set(dls[p], { opacity: 1 }); });
      cartNum.textContent = '3';
      points.forEach(function (li) { li.classList.add('on'); });
      points[points.length - 1].classList.add('cur');
      tl.fromTo([q1('.ft-copy', sec), phone, glow], { opacity: 0 }, { opacity: 1, duration: 8, ease: 'none' }, 4);
      tl.to({}, { duration: 90 }, 10);
    }

    typers.forEach(function (el) { el.textContent = reduced ? el.getAttribute('data-tippe') : ''; });
    cartNum.textContent = '0';
    var tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
    if (reduced) buildStill(tl); else buildMotion(tl);
    return {
      tl: tl, tick: null,
      onUpdate: function (p) {
        if (reduced) return;
        var u = p * 100, cur = -1;
        points.forEach(function (li, k) { var on = u >= POINT_AT[k]; li.classList.toggle('on', on); if (on) cur = k; });
        points.forEach(function (li, k) { li.classList.toggle('cur', k === cur); });
      },
      cleanup: function () {
        typers.forEach(function (el) { el.textContent = el.getAttribute('data-tippe'); });
        points.forEach(function (li) { li.classList.remove('on', 'cur'); });
      }
    };
  }


  /* =========================================================================
     KAPITEL ABLAUF – vier Schritte
     Links die Schritte, rechts die Bau-Illustration. Der aktive Schritt
     zeigt seinen Text; Bild und Schritt wechseln an denselben Stellen der
     Zeitleiste (SCHRITT_AB).
     ========================================================================= */
  // ab hier gilt der nächste Schritt (der erste von Anfang an)
  var SCHRITT_AB = [0, 34, 56, 78];
  function ablauf(sec, env) {
    var kicker = q1('.ab-copy .kicker', sec), Wa = words(q1('.ab-copy h2', sec)), liste = q1('.ab-schritte', sec), schritte = qa('.ab-schritte li', sec);
    var bild = q1('.ab-bild', sec), svg = q1('.ab-bild svg', sec);
    var reduced = env.reduced;
    var bau = svg ? bauSzene(svg) : null;

    function buildMotion(tl) {
      bgIn(tl, sec);
      tl.fromTo(kicker, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 5, ease: 'aOut' }, 4);
      wordsIn(tl, Wa, 6);
      tl.fromTo(liste, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 6, ease: 'aOut' }, 10);
      if (bau) bau.motion(tl);
      tl.to({}, { duration: 4 }, 96);
    }
    function buildStill(tl) {
      bgIn(tl, sec);
      gsap.set([kicker, liste, Wa], { opacity: 1 });
      if (bau) bau.still(tl);
      tl.to({}, { duration: 90 }, 10);
    }
    var tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
    if (reduced) buildStill(tl); else buildMotion(tl);
    return {
      tl: tl, tick: bau && bau.tick && !reduced ? bau.tick : null, measure: bau && bau.measure,
      onUpdate: function (p) {
        var u = p * 100, cur = 0;
        SCHRITT_AB.forEach(function (at, k) { if (u >= at) cur = k; });
        schritte.forEach(function (li, k) { li.classList.toggle('on', k === cur); li.classList.toggle('fertig', k < cur); });
      },
      cleanup: function () { schritte.forEach(function (li) { li.classList.remove('on', 'fertig'); }); }
    };
  }
  /* Die Bau-Illustration (inline im HTML, alle Ebenen mit b-…):
       12–34  1 Erstgespräch: zwei Menschen am Tisch auf dem Bauplatz,
              drei Sprechblasen – eine Idee, ein Haus, ein Herz
       34–56  2 Konzept und Angebot: das Raster, der Plan zeichnet sich
              Linie für Linie, die Masse, die Offerte
       56–78  3 Entwicklung und Tests: Fundament, die Wände wachsen, Dach-
              stuhl, Gerüst und Kran; auf der Checkliste werden Haken gesetzt
       78–100 4 Go-live und Betreuung: das fertige Haus, es wird Abend, die
              Fenster gehen an, zwei winken, das Zeichen für die Betreuung */
  function bauSzene(svg) {
    var L = {};
    ['night', 'stars', 'grid', 'plan', 'dims', 'foundation', 'material', 'walls', 'frame', 'house', 'garden', 'scaffold', 'crane', 'crane-arm',
      'crane-load', 'crane-cable', 'people-end', 'people', 'bubble-1', 'bubble-2', 'bubble-3', 'offer', 'tests', 'care'
    ].forEach(function (k) { L[k] = q1('#b-' + k, svg); });
    var blasen = [L['bubble-1'], L['bubble-2'], L['bubble-3']];
    var lichter = qa('.licht', svg), wand = q1('#b-walls-clip rect', svg);
    var STRICH = ':is(path, circle, rect, ellipse, line, polyline)';
    var planTeile = qa('#b-plan > g', svg).map(function (g) { return qa(STRICH, g); });
    var masse = qa('#b-dims ' + STRICH, svg);
    var haken = [1, 2, 3].map(function (k) { return q1('#b-check-' + k, svg); });
    var WAND_ZU = { y: 640, height: 0 }, WAND_AUF = { y: 294, height: 346 };
    blasen.forEach(function (b) { gsap.set(b, { svgOrigin: b.getAttribute('data-origin') }); });
    gsap.set(L.care, { svgOrigin: '916 430' });
    gsap.set(L['crane-arm'], { svgOrigin: L['crane-arm'].getAttribute('data-pivot') });

    function motion(tl) {
      tl.fromTo(svg, { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1, duration: 11, ease: 'aOut', transformOrigin: '60% 70%' }, 3);
      // 1 Erstgespräch
      tl.fromTo(L.people, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 6, ease: 'aOut' }, 8);
      blasen.forEach(function (b, k) {
        tl.fromTo(b, { opacity: 0, scale: .3 }, { opacity: 1, scale: 1, duration: 4, ease: 'back.out(2.2)' }, 15 + k * 4.6);
      });
      // 2 Konzept und Angebot
      tl.to(blasen, { opacity: 0, scale: .85, duration: 3, ease: 'power2.in', stagger: .5 }, 31);
      tl.to(L.people, { opacity: .18, duration: 4, ease: 'none' }, 34);
      tl.fromTo(L.grid, { opacity: 0 }, { opacity: 1, duration: 5, ease: 'none' }, 34);
      tl.fromTo(L.plan, { opacity: 0 }, { opacity: 1, duration: 1, ease: 'none' }, 35.5);
      tl.fromTo(planTeile[0], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 6, ease: 'power1.inOut', stagger: .12 }, 35.5);
      tl.fromTo(planTeile[1], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 7, ease: 'power2.inOut', stagger: .3 }, 37.5);
      tl.fromTo(planTeile[2], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 4, ease: 'power2.out', stagger: .14 }, 41.5);
      tl.fromTo(L.dims, { opacity: 0 }, { opacity: 1, duration: 1, ease: 'none' }, 44);
      tl.fromTo(masse, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 3.5, ease: 'power2.out', stagger: .22 }, 44);
      tl.fromTo(L.offer, { opacity: 0, x: -46, y: 24, rotation: -5 }, { opacity: 1, x: 0, y: 0, rotation: 0, duration: 6, ease: 'aOut', svgOrigin: '234 520' }, 45);
      // 3 Entwicklung und Tests
      tl.to([L.offer, L.dims], { opacity: 0, duration: 3, ease: 'power2.in' }, 54.5);
      tl.to(L.people, { opacity: 0, duration: 3, ease: 'none' }, 55);
      tl.to(L.grid, { opacity: .3, duration: 4, ease: 'none' }, 56);
      tl.to(L.plan, { opacity: .5, duration: 4, ease: 'none' }, 56);
      tl.fromTo(L.foundation, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 4, ease: 'aOut' }, 56);
      tl.fromTo(L.crane, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 5, ease: 'aOut' }, 57);
      tl.fromTo(wand, { attr: WAND_ZU }, { attr: WAND_AUF, duration: 10, ease: 'power1.inOut' }, 58.5);
      tl.fromTo(L['crane-arm'], { rotation: -11 }, { rotation: 4, duration: 15, ease: 'power1.inOut' }, 59);
      tl.fromTo(L['crane-load'], { y: 0 }, { y: 24, duration: 7, ease: 'power1.inOut' }, 66);
      tl.fromTo(L['crane-cable'], { scaleY: 1 }, { scaleY: 1.6, duration: 7, ease: 'power1.inOut', transformOrigin: '50% 0%' }, 66);
      tl.fromTo(L.scaffold, { opacity: 0 }, { opacity: 1, duration: 4, ease: 'none' }, 61);
      tl.fromTo(L.frame, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 5, ease: 'aOut' }, 67);
      tl.fromTo(L.tests, { opacity: 0, x: -40, y: 18 }, { opacity: 1, x: 0, y: 0, duration: 6, ease: 'aOut' }, 62);
      haken.forEach(function (h, k) {
        tl.fromTo(h, { opacity: 0, strokeDashoffset: 1 }, { opacity: 1, strokeDashoffset: 0, duration: 2.4, ease: 'power2.out' }, 67 + k * 3);
      });
      // 4 Go-live und Betreuung
      tl.to(L.tests, { opacity: 0, x: -24, duration: 3, ease: 'power2.in' }, 77);
      tl.fromTo(L.house, { opacity: 0 }, { opacity: 1, duration: 6, ease: 'power1.inOut' }, 78);
      tl.to([L.scaffold, L.crane, L.material], { opacity: 0, duration: 4, ease: 'power2.in' }, 78.5);
      tl.to([L.grid, L.plan], { opacity: 0, duration: 4, ease: 'none' }, 78);
      tl.fromTo(L.garden, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 5, ease: 'aOut' }, 81);
      tl.fromTo(L.night, { opacity: 0 }, { opacity: 1, duration: 8, ease: 'power1.inOut' }, 81);
      tl.fromTo(L.stars, { opacity: 0 }, { opacity: 1, duration: 6, ease: 'none' }, 85);
      tl.fromTo(lichter, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power3.out', stagger: .85 }, 85);
      tl.fromTo(L['people-end'], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 4, ease: 'aOut' }, 89);
      tl.fromTo(L.care, { opacity: 0, scale: .4 }, { opacity: 1, scale: 1, duration: 4, ease: 'back.out(2)' }, 92);
    }
    // Weniger Bewegung: dieselben vier Bilder, nur überblendet
    function still(tl) {
      var s1 = [L.people].concat(blasen), s2 = [L.grid, L.plan, L.dims, L.offer];
      var s3 = [L.frame, L.scaffold, L.crane, L.material, L.tests].concat(haken), bleibt = [L.foundation, L.walls];
      var s4 = [L.house, L.night, L.stars, L.garden, L['people-end'], L.care].concat(lichter);
      gsap.set(svg, { opacity: 1 });
      gsap.set(planTeile[0].concat(planTeile[1], planTeile[2], masse, haken), { strokeDashoffset: 0 });
      gsap.set(wand, { attr: WAND_AUF });
      gsap.set(L.walls, { opacity: 0 });
      tl.fromTo(s1, { opacity: 0 }, { opacity: 1, duration: 3, ease: 'none' }, 5);
      tl.to(s1, { opacity: 0, duration: 3, ease: 'none' }, 32);
      tl.fromTo(s2, { opacity: 0 }, { opacity: 1, duration: 3, ease: 'none' }, 33);
      tl.to(s2, { opacity: 0, duration: 3, ease: 'none' }, 54);
      tl.fromTo(s3.concat(bleibt), { opacity: 0 }, { opacity: 1, duration: 3, ease: 'none' }, 55);
      tl.to(s3, { opacity: 0, duration: 3, ease: 'none' }, 76);
      tl.fromTo(s4, { opacity: 0 }, { opacity: 1, duration: 3, ease: 'none' }, 77);
    }
    return { motion: motion, still: still };
  }


  /* =========================================================================
     KAPITEL PREISE
     Erst die zwei Arten, wie ein Projekt verrechnet wird – ein Preisschild,
     das sich einpendelt, und eine Bahn mit drei Etappen, die nacheinander
     verrechnet werden –, dann die zwei Wege nach dem Go-live: die App
     wandert samt Schlüssel und Quellcode in eine Kiste, oder die Dienste
     kreisen um sie.
     ========================================================================= */
  function preise(sec, env) {
    var stage = q1('.stage', sec);
    var copyA = q1('.pr-copy--a', sec), copyB = q1('.pr-copy--b', sec);
    var kA = q1('.kicker', copyA), WA = words(q1('h2', copyA)), subA = q1('.sub', copyA);
    var kB = q1('.kicker', copyB), WB = words(q1('h2', copyB)), subB = q1('.sub', copyB);
    var tag = q1('.pr-tag', sec), schnur = q1('.pr-schnur path', sec), betrag = q1('.pr-betrag b', sec);
    var etappen = q1('.pr-etappen', sec), fill = q1('.pr-linie i', sec), punkt = q1('.pr-punkt', sec), halte = qa('.pr-halt', sec);
    var wege = qa('.pr-weg', sec), tablet = q1('.pr-tablet', sec), klappen = qa('.pr-klappe', sec), deckel = q1('.pr-deckel', sec);
    var schluessel = q1('.pr-schluessel', sec), code = q1('.pr-code', sec);
    var orbit = q1('.pr-orbit', sec), dienste = qa('.pr-dienst', sec);
    var reduced = env.reduced;
    var S = { orbit: 0, weg: 0 }, O = {};
    var HALT_AT = [.12, .5, .88];

    function measure() {
      var bahn = q1('.pr-bahn', sec), wegeBox = q1('.pr-wege', sec);
      // hoch: Preisschild, Etappen und Karten richten sich nach dem Text
      // darüber, damit auch auf kleinen Handys nichts übereinander liegt
      tag.style.top = etappen.style.top = wegeBox.style.top = '';
      O.shift = 0;
      if (env.portrait) {
        var unten = copyA.offsetTop + copyA.offsetHeight;
        if (tag.offsetTop < unten + 4) tag.style.top = (unten + 4) + 'px';
        var tagUnten = tag.offsetTop + tag.offsetHeight + 18, platz = stage.clientHeight - etappen.offsetHeight - 8;
        if (etappen.offsetTop < tagUnten) etappen.style.top = Math.min(tagUnten, platz) + 'px';
        // Reicht es nicht (kleine Handys), weicht der Text, sobald die
        // Etappen kommen, und das Schild rückt um so viel hoch
        if (tagUnten > platz) O.shift = Math.min(tagUnten - platz, subA.offsetHeight + 12);
        wegeBox.style.top = (copyB.offsetTop + copyB.offsetHeight + 22) + 'px';
      }
      O.bw = bahn.clientWidth - 32;
      O.w = orbit.clientWidth; O.h = orbit.clientHeight;
      O.dw = dienste.map(function (d) { return d.offsetWidth; });
      O.dh = dienste.map(function (d) { return d.offsetHeight; });
      // Halbachse so, dass auch der breiteste Dienst ganz links und ganz
      // rechts noch in der Karte bleibt; der gestrichelte Ring folgt
      O.rx = Math.max(20, Math.min(O.w * .42, O.w / 2 - Math.max.apply(null, O.dw) * .45 - 4));
      orbit.style.setProperty('--rx', O.rx.toFixed(1) + 'px');
    }
    // Die Dienste auf ihrer Ellipse: vorne grösser und über der App, hinten
    // kleiner und dahinter
    function kreise(t) {
      // dieselbe Ellipse wie .pr-bahnring im CSS (2 × --rx breit, 60 % hoch)
      var cx = O.w / 2, cy = O.h / 2, rx = O.rx * S.orbit, ry = O.h * .3 * S.orbit;
      for (var k = 0; k < dienste.length; k++) {
        var a = t * .32 + k * TAU / dienste.length, s = Math.sin(a), vorn = (s + 1) / 2;
        var sc = .78 + .22 * vorn;
        dienste[k].style.transform = 'translate3d(' + (cx + Math.cos(a) * rx - O.dw[k] / 2).toFixed(1) + 'px,' +
          (cy + s * ry - O.dh[k] / 2).toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')';
        dienste[k].style.opacity = (S.orbit * (.45 + .55 * vorn)).toFixed(3);
        dienste[k].style.zIndex = s > 0 ? 3 : 1;
      }
    }
    function tick(t) { if (S.weg > 0) kreise(t); }
    function schildHoch() { return O.shift ? -O.shift / tag.offsetHeight * 100 : 0; }

    /* Zeitleiste:
         0–6    Hintergrund blendet über den Ablauf
         4–14   „Was kostet das?"
         12–26  das Preisschild pendelt sich ein, der Betrag zählt hoch
         26–50  die Bahn: drei Etappen, jede wird verrechnet
         52–60  Wechsel zu „Und nach dem Go-live?"
         58–70  zwei Wege erscheinen
         64–80  die App geht in die Kiste / die Dienste gehen in Umlauf */
    function buildMotion(tl) {
      bgIn(tl, sec);
      tl.fromTo(kA, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 5, ease: 'aOut' }, 4);
      wordsIn(tl, WA, 5);
      tl.fromTo(subA, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 7, ease: 'aOut' }, 9);
      tl.fromTo(tag, { opacity: 0, y: -60, rotation: -16 }, { opacity: 1, y: 0, rotation: 0, duration: 12, ease: 'back.out(2.4)' }, 12);
      tl.fromTo(schnur, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 5, ease: 'power2.out' }, 12);
      var b = { v: 0 };
      tl.fromTo(b, { v: 0 }, { v: 100, duration: 8, ease: 'aOut', onUpdate: function () { betrag.textContent = Math.round(b.v); } }, 16);
      tl.fromTo(etappen, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 6, ease: 'aOut' }, 26);
      if (env.portrait) {
        tl.to(subA, { opacity: function () { return O.shift ? 0 : 1; }, duration: 4, ease: 'power2.in' }, 23);
        tl.fromTo(tag, { yPercent: 0 }, { yPercent: schildHoch, duration: 6, ease: 'aInOut' }, 23.5);
      }
      tl.fromTo(fill, { scaleX: 0 }, { scaleX: 1, duration: 18, ease: 'none' }, 31);
      tl.fromTo(punkt, { x: 0 }, { x: function () { return O.bw; }, duration: 18, ease: 'none' }, 31);
      // Phase 2
      wordsOut(tl, WA, 52);
      tl.to([kA, subA], { opacity: 0, y: -16, duration: 5, ease: 'power2.in' }, 52);
      tl.to([tag, etappen], { opacity: 0, y: -40, duration: 6, ease: 'power2.in' }, 52.5);
      tl.fromTo(kB, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 5, ease: 'aOut' }, 57);
      wordsIn(tl, WB, 58);
      tl.fromTo(subB, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 7, ease: 'aOut' }, 62);
      wege.forEach(function (w, k) {
        tl.fromTo(w, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 7, ease: 'aOut' }, 59 + k * 2.2);
      });
      tl.fromTo(S, { weg: 0 }, { weg: 1, duration: .01, ease: 'none' }, 59);
      // Weg 1: die App versinkt in der Kiste, die Klappen schliessen, Schlüssel und Code steigen auf
      tl.fromTo(tablet, { y: 0 }, { y: 46, duration: 7, ease: 'power2.inOut' }, 65);
      tl.to(klappen, { opacity: 0, duration: 2, ease: 'none' }, 71.4);
      tl.fromTo(deckel, { opacity: 0, y: -34 }, { opacity: 1, y: 0, duration: 4, ease: 'back.out(1.8)' }, 71);
      tl.fromTo([code, schluessel], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 5, ease: 'aOut', stagger: 1.2 }, 75);
      // Weg 2: die Dienste gehen in Umlauf
      tl.fromTo(S, { orbit: 0 }, { orbit: 1, duration: 12, ease: 'aOut' }, 67);
      tl.to({}, { duration: 14 }, 86);
    }
    function buildStill(tl) {
      bgIn(tl, sec);
      gsap.set([kA, subA, WA, tag, etappen], { opacity: 1 });
      gsap.set(schnur, { strokeDashoffset: 0 }); gsap.set(fill, { scaleX: 1 });
      gsap.set([kB, subB, WB, code, schluessel], { opacity: 0 });
      halte.forEach(function (h) { h.classList.add('on'); });
      if (env.portrait) {
        // kleine Handys: erst Text und Schild, dann Schild und Etappen
        var weg0 = function () { return O.shift ? 0 : 1; };
        tl.fromTo(etappen, { opacity: weg0 }, { opacity: 1, duration: 3, ease: 'none' }, 24);
        tl.fromTo([subA, tag], { opacity: 1 }, { opacity: weg0, duration: 3, ease: 'none' }, 20);
        tl.fromTo(tag, { yPercent: 0 }, { yPercent: schildHoch, duration: .01, ease: 'none' }, 23.5);
        tl.fromTo(tag, { opacity: weg0 }, { opacity: 1, duration: 3, ease: 'none', immediateRender: false }, 24);
      }
      tl.to([kA, subA, WA, tag, etappen], { opacity: 0, duration: 5, ease: 'none' }, 50);
      tl.set(tablet, { y: 46 }, 55);
      tl.set(klappen, { opacity: 0 }, 55);
      tl.set(deckel, { opacity: 1 }, 55);
      tl.set([code, schluessel], { opacity: 1 }, 55);
      tl.set(S, { orbit: 1, weg: 1 }, 55);
      tl.to([kB, subB, WB], { opacity: 1, duration: 5, ease: 'none' }, 56);
      tl.fromTo(wege, { opacity: 0 }, { opacity: 1, duration: 5, ease: 'none' }, 57);
      tl.to({}, { duration: 38 }, 62);
    }

    measure();
    betrag.textContent = reduced ? '100' : '0';
    var tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
    if (reduced) buildStill(tl); else buildMotion(tl);
    return {
      tl: tl, tick: reduced ? null : tick, measure: measure,
      refreshed: function () { if (reduced) kreise(0); },
      onUpdate: function (p) {
        if (reduced) { kreise(0); return; }
        var u = p * 100, lauf = clamp01((u - 31) / 18);
        halte.forEach(function (h, k) { h.classList.toggle('on', lauf >= HALT_AT[k]); });
      },
      cleanup: function () { betrag.textContent = '100'; halte.forEach(function (h) { h.classList.remove('on'); }); }
    };
  }


  /* =========================================================================
     KAPITEL ÜBER MICH
     Das Foto in der Mitte, rundherum fliegen die Stationen herein – aus der
     Tiefe hinter dem Foto, eine nach der anderen – und bleiben stehen.
     ========================================================================= */
  // Endlage der Karten (Mitte, Anteile der Bühne): quer zwei Spalten um das
  // Foto, hoch zwei Spalten darunter. Die Karten selbst stehen im HTML.
  var UEBER_Q = [[.455, .22], [.875, .2], [.44, .41], [.9, .39], [.455, .6], [.895, .58], [.47, .79], [.84, .8]];
  var UEBER_H = [[.26, .6], [.74, .6], [.26, .685], [.74, .685], [.26, .77], [.74, .77], [.26, .855], [.74, .87]];
  function ueber(sec, env) {
    var stage = q1('.stage', sec), kicker = q1('.um-copy .kicker', sec), Wu = words(q1('.um-copy h2', sec)), sub = q1('.um-copy .sub', sec);
    var foto = q1('.um-foto', sec), liste = q1('.um-karten', sec);
    var portrait = env.portrait, reduced = env.reduced;
    var karten = qa('.um-karte', sec), K = [], W = 0, H = 0, fz = { x: 0, y: 0 };
    function measure() {
      W = stage.clientWidth; H = stage.clientHeight;
      var f = rel(foto, stage); fz.x = f.x + f.w / 2; fz.y = f.y + f.h / 2;
      var pos = portrait ? UEBER_H : UEBER_Q;
      K = karten.map(function (el, k) {
        var w = el.offsetWidth, h = el.offsetHeight;
        var x = pos[k][0] * W - w / 2, y = pos[k][1] * H - h / 2;
        return { x: Math.max(8, Math.min(W - w - 8, x)), y: y, w: w, h: h };
      });
    }
    function tick(t) {
      // kaum merkliches Schweben, sobald die Karten stehen
      for (var k = 0; k < karten.length; k++) {
        if (!karten[k]._steht) continue;
        karten[k].style.translate = '0 ' + (Math.sin(t * .7 + k * 1.7) * 3).toFixed(2) + 'px';
      }
    }
    /* Zeitleiste:
         0–6    Hintergrund
         4–16   Überschrift und Text, das Foto
         16–78  acht Karten fliegen herein, eine nach der anderen */
    function buildMotion(tl) {
      bgIn(tl, sec);
      tl.fromTo(kicker, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 5, ease: 'aOut' }, 4);
      wordsIn(tl, Wu, 5);
      tl.fromTo(sub, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 7, ease: 'aOut' }, 10);
      tl.fromTo(foto, { opacity: 0, scale: .82, filter: 'blur(8px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 10, ease: 'aOut' }, 6);
      karten.forEach(function (el, k) {
        var at = 18 + k * 7.4, c = function () { return K[k]; };
        tl.fromTo(el, {
          x: function () { return fz.x - c().w / 2; }, y: function () { return fz.y - c().h / 2; },
          scale: .3, opacity: 0, filter: 'blur(6px)'
        }, {
          x: function () { return c().x; }, y: function () { return c().y; },
          scale: 1, opacity: 1, filter: 'blur(0px)', duration: 9, ease: 'aOut',
          onComplete: function () { el._steht = true; }, onReverseComplete: function () { el._steht = false; }
        }, at);
      });
      tl.to({}, { duration: 10 }, 90);
    }
    function buildStill(tl) {
      bgIn(tl, sec);
      gsap.set([kicker, Wu, sub, foto], { opacity: 1 });
      karten.forEach(function (el, k) { gsap.set(el, { x: K[k].x, y: K[k].y, opacity: 1 }); });
      tl.fromTo([q1('.um-copy', sec), foto, liste], { opacity: 0 }, { opacity: 1, duration: 8, ease: 'none' }, 4);
      tl.to({}, { duration: 88 }, 12);
    }
    measure();
    var tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
    if (reduced) buildStill(tl); else buildMotion(tl);
    return {
      tl: tl, tick: reduced ? null : tick, measure: measure,
      cleanup: function () { karten.forEach(function (el) { el._steht = false; el.style.translate = ''; }); }
    };
  }


  /* =========================================================================
     KONTAKT – Einblenden
     Der Rahmen zeichnet sich, die Felder steigen nacheinander auf. Den
     Versand regelt formularVersand() weiter oben – er läuft auch ohne GSAP.
     ========================================================================= */
  function kontaktEinblenden() {
    var sec = q1('#kontakt'), form = q1('#contactForm');
    if (!sec || !form) return;
    var rahmen = q1('.kt-rahmen rect', sec);
    var teile = qa('.kt-text > *', sec).concat(qa('.kt-form > :not(.kt-rahmen):not(.visually-hidden)', sec));
    var ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var zeigen = function () { gsap.set(teile, { opacity: 1, y: 0 }); gsap.set(rahmen, { strokeDashoffset: 0 }); };
    ScrollTrigger.create({
      trigger: sec, start: 'top 78%', once: true,
      onEnter: function () {
        if (ruhig) { zeigen(); return; }
        gsap.to(rahmen, { strokeDashoffset: 0, duration: 1.6, ease: 'aInOut' });
        gsap.fromTo(teile, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .7, stagger: .07, ease: 'aOut', delay: .15 });
      }
    });
    // Sicherheitsnetz: Wer per Tastatur oder Anker direkt hineinspringt,
    // sieht das Formular sofort
    form.addEventListener('focusin', zeigen);
  }


  /* =========================================================================
     FAQ – als Gespräch
     Die Liste im HTML ist die Quelle. Daraus werden Knöpfe; einer angetippt,
     erscheint die Frage als Nachricht, kurz „tippt …", dann die Antwort.
     Die erste Frage stellt sich von selbst, sobald das Fenster im Bild ist.
     ========================================================================= */
  function faqChat() {
    var sec = q1('#faq');
    if (!sec) return;
    var liste = q1('.fq-liste', sec), chat = q1('.fq-chat', sec), verlauf = q1('.fq-verlauf', sec), box = q1('.fq-fragen', sec);
    var ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var items = qa('.fq-eintrag', sec).map(function (e) { return { q: q1('dt', e).textContent, a: q1('dd', e).innerHTML }; });
    chat.hidden = false; liste.hidden = true;
    var busy = false, queue = [], offen = items.length;
    items.forEach(function (it, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'fq-frage'; b.textContent = it.q;
      b.addEventListener('click', function () { frage(i); });
      box.appendChild(b); it.btn = b;
    });
    function unten() { verlauf.scrollTop = verlauf.scrollHeight; }
    function blase(cls, html) {
      var d = document.createElement('div');
      d.className = 'fq-blase ' + cls; d.innerHTML = html;
      verlauf.appendChild(d);
      if (!ruhig) gsap.fromTo(d, { opacity: 0, y: 14, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .45, ease: 'aOut' });
      unten();
      return d;
    }
    function frage(i) {
      var it = items[i];
      if (it.gefragt) return;
      it.gefragt = true; it.btn.disabled = true;
      if (busy) { queue.push(i); return; }
      busy = true;
      blase('fq-blase--du', it.q.replace(/[<>&]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]; }));
      gsap.to(it.btn, { opacity: 0, scale: .92, duration: ruhig ? 0 : .25, ease: 'power2.in', onComplete: function () { it.btn.remove(); } });
      var warte = ruhig ? 0 : Math.min(1.7, .7 + it.a.length / 500);
      var tippt = null;
      gsap.delayedCall(ruhig ? 0 : .35, function () {
        if (!ruhig) tippt = blase('fq-blase--ich fq-tippt', '<i></i><i></i><i></i>');
        gsap.delayedCall(warte, function () {
          if (tippt) tippt.remove();
          blase('fq-blase--ich', it.a);
          offen--;
          busy = false;
          if (queue.length) frage.weiter(queue.shift());
          else if (!offen) blase('fq-blase--ich fq-schluss', 'Noch etwas offen? <a href="#kontakt">Schreib mir einfach</a> – das Erstgespräch ist kostenlos.');
        });
      });
    }
    frage.weiter = function (i) { items[i].gefragt = false; frage(i); };
    ScrollTrigger.create({ trigger: chat, start: 'top 72%', once: true, onEnter: function () { gsap.delayedCall(ruhig ? 0 : .5, function () { frage(0); }); } });
  }

  /* =========================================================================
     KAPITEL ERSTGESPRÄCH – Szene 7
     Die Fäden kommen als ruhiger Strom von links und legen sich auf die
     zwei Winkel des Signets. Dann zeichnet sich das echte Signet darüber,
     die Fäden treten zurück, Schriftzug und Zeile steigen nach – wie im
     Logo-Intro, mit denselben Kurven.
     ========================================================================= */
  function gespraech(sec, env) {
    var stage = q1('.stage', sec);
    var cv = new Leinwand(q1('.gs-threads', sec), q1('.gs-glow', sec));
    var mark = q1('.gs-mark', sec), paths = qa('.gs-mark path', sec), word = q1('.gs-word', sec), claim = q1('.gs-claim', sec);
    var Wg = words(q1('.gs-copy h2', sec)), sub = q1('.gs-copy .sub', sec), actions = q1('.gs-actions', sec);
    var portrait = env.portrait, reduced = env.reduced;
    var S = { alpha: 0, form: 0 }, W = 0, H = 0;
    var CHEV = [[[6.1, 67.6], [39.1, 6.1], [55.6, 36.85]], [[71.9, 67.6], [104.9, 6.1], [137.9, 67.6]]];
    var N = portrait ? 20 : 30, M = 44, pts = new Float32Array(M * 2), lines = [];
    var R = mulberry(31);
    for (var i = 0; i < N; i++) lines.push({ c: i % 2, off: (R() - .5) * 7, bo: R() - .5, ph: R() * TAU, d: R(), a: .5 + R() * .4, lw: .8 + R() * .7 });
    var P = [];
    function measure() {
      W = stage.clientWidth; H = stage.clientHeight;
      cv.size(W, H);
      var b = box(mark, stage), sx = b.w / 144.1, sy = b.h / 73.7;
      P = CHEV.map(function (poly) {
        var p = poly.map(function (q) { return [b.x + q[0] * sx, b.y + q[1] * sy]; });
        var l1 = Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]), l2 = Math.hypot(p[2][0] - p[1][0], p[2][1] - p[1][1]);
        return { p: p, l1: l1, l2: l2, cy: b.y + b.h * .6 };
      });
      L = { cy: b.y + b.h * .55 };
    }
    var L = {};
    function onChev(ch, u, off) {
      var c = P[ch], d = u * (c.l1 + c.l2), a, b, t;
      if (d <= c.l1) { a = c.p[0]; b = c.p[1]; t = d / c.l1; } else { a = c.p[1]; b = c.p[2]; t = (d - c.l1) / c.l2; }
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + off];
    }
    function draw(t) {
      if (S.alpha < .005) { cv.wipe(); return; }
      cv.begin();
      for (var i = 0; i < N; i++) {
        var ln = lines[i], w = inOut(clamp01((S.form - ln.d * .35) / .65));
        for (var j = 0; j < M; j++) {
          var u = j / (M - 1);
          var bx = -W * .08 + W * 1.16 * u, by = L.cy + ln.bo * (portrait ? 70 : 110) + Math.sin(u * 5 + t * .5 + ln.ph) * (portrait ? 10 : 16);
          var q = onChev(ln.c, u, ln.off * (1 - w));
          pts[j * 2] = bx + (q[0] - bx) * w; pts[j * 2 + 1] = by + (q[1] - by) * w;
        }
        var col = ln.c ? '#FFB0A8' : '#F3F4F7', gcol = ln.c ? '#FE7971' : '#C9CCD6';
        var a = ln.a * S.alpha;
        cv.line(pts, M, col, a * .8, ln.lw, gcol, a * .14, ln.lw * 7);
      }
      cv.end();
    }
    function tick(t) { draw(t); }

    /* Zeitleiste:
         0–6    Hintergrund blendet über den Fotoverkauf
         2–14   die Fäden fliessen herein
         12–44  sie legen sich auf die zwei Winkel
         38–60  das Signet wächst aus den Fäden, die Fäden gehen darin auf
         54–64  Schriftzug und Zeile
         63–78  Einladung und Knöpfe */
    /* Der Übergang von den Fäden zum Signet hat keine Stufe: Die Fäden
       liegen am Ende genau auf der Mittellinie der zwei Winkel. Dort
       erscheint das Signet zuerst so dünn wie ein Faden und wird dicker,
       während die Fäden darin verschwinden – über einen langen Scrollweg,
       damit auch ein kräftiger Dreh am Mausrad keinen Sprung macht. */
    function buildMotion(tl) {
      bgIn(tl, sec);
      tl.fromTo(S, { alpha: 0 }, { alpha: 1, duration: 12, ease: 'none' }, 2);
      tl.fromTo(S, { form: 0 }, { form: 1, duration: 32, ease: 'sine.inOut' }, 12);
      tl.fromTo(mark, { opacity: 0 }, { opacity: 1, duration: 10, ease: 'none' }, 38);
      tl.fromTo(paths, { strokeWidth: 1.3 }, { strokeWidth: 12.2, duration: 18, ease: 'sine.inOut' }, 40);
      tl.to(S, { alpha: 0, duration: 16, ease: 'sine.in' }, 44);
      tl.fromTo(word, { opacity: 0, y: 45 }, { opacity: 1, y: 0, duration: 7, ease: 'aLogo' }, 54);
      tl.fromTo(claim, { opacity: 0, y: 45 }, { opacity: 1, y: 0, duration: 7.5, ease: 'aLogo' }, 56.5);
      wordsIn(tl, Wg, 63);
      tl.fromTo(sub, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 6, ease: 'aOut' }, 68);
      tl.fromTo(actions, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 6, ease: 'aOut' }, 72);
      tl.to({}, { duration: 20 }, 80);
    }
    function buildStill(tl) {
      bgIn(tl, sec);
      gsap.set(mark, { opacity: 1 });
      gsap.set([word, claim, Wg, sub, actions], { opacity: 1 });
      tl.fromTo([q1('.gs-lockup', sec), q1('.gs-copy', sec)], { opacity: 0 }, { opacity: 1, duration: 8, ease: 'none' }, 4);
      tl.to({}, { duration: 90 }, 10);
    }
    measure();
    var tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
    if (reduced) buildStill(tl); else buildMotion(tl);
    return {
      tl: tl, tick: reduced ? null : tick, measure: measure,
      rescale: function () { cv.size(W, H); },
    };
  }


  /* =========================================================================
     AUFBAU
     Pro Format (quer, hoch) und für „weniger Bewegung" eigene Zeitleisten.
     gsap.matchMedia baut alles ab und neu auf, wenn sich eine der drei
     Bedingungen ändert – etwa beim Drehen des Tablets.
     ========================================================================= */
  var KAPITEL = { ordnung: ordnung, gripszug: gripszug, dreamteam: dreamteam, fotos: fotos, ablauf: ablauf, preise: preise, ueber: ueber, gespraech: gespraech };
  var sections = qa('[data-kapitel]');

  function buildAll(cond) {
    var env = { portrait: !!cond.hoch, reduced: !!cond.ruhig };
    built = [];
    sections.forEach(function (sec) {
      var make = KAPITEL[sec.getAttribute('data-kapitel')];
      if (!make) return;
      var ch = make(sec, env);
      ch.sec = sec;
      sec.classList.add('is-ready');
      ScrollTrigger.create({
        trigger: sec, start: 'top top', end: 'bottom bottom',
        animation: ch.tl, scrub: env.reduced ? true : .9, invalidateOnRefresh: true,
        onUpdate: function (self) { if (ch.onUpdate) ch.onUpdate(self.progress); },
        onToggle: function (self) { if (ch.aktiv) ch.aktiv(self.isActive); }
      });
      // Sichtbar ist ein Kapitel, bis es oben hinausgescrollt ist. Ab dem
      // zweiten beginnt das erst, wenn es oben angekommen ist – vorher liegt
      // seine Bühne unsichtbar über dem Ende des vorigen (CSS, „Bühne").
      var folgt = sec.previousElementSibling && sec.previousElementSibling.hasAttribute('data-kapitel');
      var stageEl = q1('.stage', sec);
      ScrollTrigger.create({
        trigger: sec, start: folgt ? 'top top' : 'top bottom', end: 'bottom top',
        onToggle: function (self) {
          if (folgt) stageEl.classList.toggle('is-da', self.isActive);
          setActive(ch, self.isActive && !!ch.tick);
        }
      });
      built.push(ch);
    });
    return function () {
      built.forEach(function (ch) {
        setActive(ch, false);
        if (ch.cleanup) ch.cleanup();
        if (ch.aktiv) ch.aktiv(false);
        ch.sec.classList.remove('is-ready');
        q1('.stage', ch.sec).classList.remove('is-da');
      });
      built = [];
    };
  }

  // Bei jeder Neuberechnung (Fenstergrösse) zuerst neu vermessen, damit die
  // Funktionswerte in den Zeitleisten die neuen Masse lesen.
  ScrollTrigger.addEventListener('refreshInit', function () { built.forEach(function (ch) { if (ch.measure) ch.measure(); }); });
  ScrollTrigger.addEventListener('refresh', function () { built.forEach(function (ch) { if (ch.refreshed) ch.refreshed(); }); });

  /* --- Für die Kapitel-Navigation ------------------------------------------
     Landepunkte als Anteile der Zeitleiste: von wo aus hineingeglitten wird
     (erst nach dem Überblenden des Hintergrunds, 0–6, sonst schiene das
     vorige Kapitel durch) und wo das Kapitel steht (Titel da, Bild
     aufgebaut). */
  var LANDUNG = {
    software: ['software', 0, 0],
    webauftritt: ['software', .505, .57],
    projekte: ['projekte', .065, .22],
    dreamteam: ['dreamteam', .065, .2],
    fotos: ['fotos', .065, .16],
    ablauf: ['ablauf', .065, .22],
    preise: ['preise', .065, .25],
    motivation: ['motivation', .065, .2],
    gespraech: ['gespraech', .36, .8]
  };
  function kapitelY(id, p) {
    var sec = document.getElementById(id);
    return sec.getBoundingClientRect().top + window.pageYOffset + p * (sec.offsetHeight - window.innerHeight);
  }
  navi.landung = function (id) {
    var l = LANDUNG[id];
    return l ? { von: kapitelY(l[0], l[1]), y: kapitelY(l[0], l[2]) } : null;
  };
  navi.anfang = function (id) {
    if (id === 'software') return 0;
    // „Neuer Webauftritt" beginnt in der Mitte des ersten Kapitels
    if (id === 'webauftritt') return kapitelY('software', .5);
    var sec = document.getElementById(id);
    return sec && sec.hasAttribute('data-kapitel') ? kapitelY(id, 0) : null;
  };
  // Nach einem Sprung sollen die Zeitleisten nicht hinterherlaufen
  navi.einrasten = function () {
    ScrollTrigger.update();
    ScrollTrigger.getAll().forEach(function (st) { var tw = st.getTween && st.getTween(); if (tw) tw.progress(1); });
  };

  gsap.matchMedia().add({
    hoch: '(orientation: portrait)',
    quer: '(orientation: landscape)',
    ruhig: '(prefers-reduced-motion: reduce)'
  }, function (context) { return buildAll(context.conditions); });
  kontaktEinblenden();
  faqChat();

  // Mit Sprungmarke geöffnet (etwa /#preise): nach dem Laden direkt auf den
  // Landepunkt des Kapitels, nicht an den Anfang seines Abschnitts
  if (location.hash.length > 1) {
    window.addEventListener('load', function () {
      requestAnimationFrame(function () {
        if (navi.springen) navi.springen(decodeURIComponent(location.hash.slice(1)), { sofort: true });
      });
    });
  }
})();
