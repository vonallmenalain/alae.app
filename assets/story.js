/* =========================================================================
   Story – Bewegung für story.html
   Aufbau: Heute → Werkzeuge → Leinwand → Schleife → Kapitel (Ordnung,
   Vergleich, Gripszug, DreamTeam, Fotoverkauf, Erstgespräch) → Aufbau

   Jedes Kapitel ist eine Funktion, die eine Zeitleiste von 0 bis 100 baut
   (Ordnung: bis 134, es trägt vier Szenen) und optional eine tick-Funktion
   für das, was in jedem Bild neu gerechnet wird: Fäden, schwebende
   Zettel, Karten im Raum, die Lupe. ScrollTrigger stellt die Zeitleiste
   auf den Scrollstand; die gemeinsame Schleife ruft tick nur für Kapitel
   auf, die gerade im Bild sind.
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
    var labels = qa('#ordnung .m span');
    labels.forEach(function (el, k) {
      var d = new Date(jetzt.getFullYear(), jetzt.getMonth() - (labels.length - 1 - k), 1);
      el.textContent = kurz.format(d).replace('.', '');
    });
  } catch (e) { /* ältere Browser: es bleibt beim Text im HTML */ }

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
  var wege = q1('.wege'), wegeDots = wege ? qa('i', wege) : [], wegeAt = 0;
  function setScene(n) {
    if (!wege || n === wegeAt) return;
    wegeAt = n;
    wegeDots.forEach(function (d, k) { d.classList.toggle('on', k === n); });
  }


  /* =========================================================================
     KAPITEL ORDNUNG – Szenen 1 bis 4
     Chaos aus Fäden und Zetteln → Ordnung, das Tablet entsteht → das Tablet
     dreht sich und zeigt, was es kann → die Schalter.
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
    var W1 = words(q1('.s1 h1', sec)), W2 = words(q1('.s2 h2', sec)), W3 = words(q1('.s3 h2', sec)), W4 = words(q1('.s4 h2', sec));
    var rest1 = [q1('.s1 .kicker', sec), q1('.s1 .sub', sec)];
    var sub2 = q1('.s2 .sub', sec), sub3 = q1('.s3 .sub', sec);
    var card = q1('.switches', sec), swLabels = qa('.sw-l', sec);
    var sws = qa('.sw', sec), knobs = qa('.sw em', sec), ons = qa('.sw b', sec);
    var hundert = q1('[data-hundert]', sec), flag = q1('.switches .flag', sec);
    var los = qa('.lo', sec), errs = qa('.lo-err', sec), notes = qa('.lo-note', sec);
    var portrait = env.portrait, reduced = env.reduced;

    /* Zustand der Fäden, bewegt von der Zeitleiste, gelesen beim Zeichnen:
         sweep  0 → 1  Ordnung wandert von rechts nach links durchs Knäuel
         wrap   0 → 1  die Fäden legen sich um die Kacheln
         lit    0 → 1  der Bildschirm geht an (kurzes Aufglühen)
         calm   0 → 1  die Fäden lösen sich und fliessen ruhig hinter dem Tablet
         veil   0 → 1  der Fluss tritt links zurück, unter den Hinweisen
         float, tilt, links: Schweben der Zettel, Neigen mit der Maus,
                             Hinweislinien nachführen */
    var S = { sweep: 0, wrap: 0, lit: 0, calm: 0, alpha: 1, float: 1, tilt: 0, links: 0, veil: 0 };
    var L = {}, W = 0, H = 0;
    var TILE_DELAY = [.22, .31, .40, .49, .58, .67];
    // Zettel im Chaos: Mitte x, Mitte y (Anteile der Bühne), Drehung, Tiefe
    var CHAOS_Q = [[.585, .23, -9, 1], [.875, .27, 7, .8], [.73, .74, 11, 1.1], [.955, .6, -7, .55], [.665, .5, -4, .9], [.87, .9, 5, .62]];
    var CHAOS_H = [[.22, .53, -9, 1], [.8, .49, 8, .8], [.27, .8, 10, 1.1], [.83, .74, -7, .6], [.52, .65, -4, .9], [.77, .92, 5, .62]];
    var ROW_Q = [.1, .255, .41, .59, .745, .9];
    // Reste des Chaos in Szene 4: drei Fehlerzellen, drei Zettel
    var LO_Q = [[.15, .43, -6], [.5, .33, 5], [.2, .84, 3], [.07, .62, -8], [.5, .85, 7], [.34, .27, -4]];
    var LO_H = [[.13, .2, -6], [.8, .18, 5], [.14, .47, 4], [.87, .42, 8], [.84, .29, -7], [.1, .34, -5]];

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
      var LO = portrait ? LO_H : LO_Q;
      L.lo = los.map(function (el, i) {
        return { x: LO[i][0] * W - el.offsetWidth / 2, y: LO[i][1] * H - el.offsetHeight / 2, r: LO[i][2] };
      });

      L.badge = { x: d.cx - badge.offsetWidth / 2, y: d.y + d.h * .42 - badge.offsetHeight / 2 };
      L.pose = portrait
        ? { x: 0, y: H * .465 - d.cy, s: .72, rx: 9, ry: 7, rz: -1.2 }
        : { x: W * .63 - d.cx, y: H * .585 - d.cy, s: .88, rx: 11, ry: 15, rz: -1.6 };
      L.pose2 = portrait
        ? { x: 0, y: H * .335 - d.cy, s: .5, rx: 7, ry: -8, rz: .8 }
        : { x: W * .33 - d.cx, y: H * .58 - d.cy, s: .7, rx: 8, ry: -16, rz: 1.2 };
      // Weg des Schalterknopfs: Spur minus Knopf minus zweimal der Rand
      var inset = parseFloat(getComputedStyle(knobs[0]).left) || 3;
      L.sw = sws[0].offsetWidth - knobs[0].offsetWidth - inset * 2;
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

    function tick(t) {
      floats(t);
      draw(t);
      if (S.links > 0) placeLinks();
    }

    /* Zeitleiste – Zahlen in Prozent des Scrollwegs der Szenen 1 bis 3,
       Szene 4 hängt hinten an (100 bis 134):
         0–6     Szene 1 steht
         6–32    Ordnung wandert durchs Knäuel, die Zettel reihen sich auf
         21–31   Szene 2 kommt
         34–52   Fäden legen sich um die Kacheln, die Zettel landen darin
         51–66   der Bildschirm geht an, Diagramm und Auslastung füllen sich
         58–67   Plakette
         67–84   Szene 3: das Tablet dreht sich
         80–86   eine Zahlung kommt herein
         86–98   vier Hinweise, nacheinander
         100–116 Szene 4: Hinweise gehen, das Tablet schwenkt nach links
         110–117 die Karte mit den Schaltern
         118–131 vier Schalter, jeder räumt etwas weg
       Wer hier Zahlen ändert, prüft auch TILE_DELAY: Die Zettel landen erst,
       wenn ihr Rahmen steht. */
    var SW_AT = [118, 122, 126, 130];
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

      // --- Szene 4: Die Schalter
      tl.to(knots.concat(links, callouts), { opacity: 0, duration: 4, ease: 'power1.in' }, 100);
      tl.to(toast, { opacity: 0, y: -10, duration: 3, ease: 'power1.in' }, 100);
      wordsOut(tl, W3, 100);
      tl.to(sub3, { y: -20, opacity: 0, duration: 5, ease: 'power2.in' }, 100);
      tl.to(S, { links: 0, duration: .01, ease: 'none' }, 104.5);
      tl.to(S, { veil: .45, duration: 8, ease: 'none' }, 102);
      tl.to(device, {
        x: function () { return L.pose2.x; }, y: function () { return L.pose2.y; },
        rotationX: function () { return L.pose2.rx; }, rotationY: function () { return L.pose2.ry; },
        rotationZ: function () { return L.pose2.rz; }, scale: function () { return L.pose2.s; },
        duration: 14, ease: 'aInOut'
      }, 102);
      wordsIn(tl, W4, 106);
      los.forEach(function (el, i) {
        tl.fromTo(el, {
          x: function () { return L.lo[i].x; }, y: function () { return L.lo[i].y + 14; },
          rotation: function () { return L.lo[i].r; }, opacity: 0, scale: .85
        }, { y: function () { return L.lo[i].y; }, opacity: 1, scale: 1, duration: 4, ease: 'aOut' }, 107 + i * .6);
      });
      tl.fromTo(card, { opacity: 0, x: 60, scale: .96, filter: 'blur(10px)' },
        { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)', duration: 7, ease: 'aOut' }, 110);
      tl.set(hundert, { textContent: '0' }, 0);
      SW_AT.forEach(function (at, k) {
        tl.fromTo(knobs[k], { x: 0 }, { x: function () { return L.sw; }, duration: 1.6, ease: 'aOut' }, at);
        tl.fromTo(sws[k], { backgroundColor: '#D5D9DF' }, { backgroundColor: '#22C55E', duration: 1.2, ease: 'none' }, at);
        tl.fromTo(ons[k], { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'none' }, at + .3);
        tl.fromTo(swLabels[k], { color: '#9AA0AA' }, { color: '#16181D', duration: 1.2, ease: 'none' }, at);
      });
      // Was die Schalter wegräumen
      tl.to(errs, { opacity: 0, scale: .6, y: '-=14', duration: 2.4, stagger: .3, ease: 'power2.in' }, SW_AT[0] + .8);
      notes.forEach(function (el, i) {
        tl.to(el, { opacity: 0, x: '+=' + (i % 2 ? 90 : -90), y: '-=120', rotation: '+=' + (i % 2 ? 24 : -24), duration: 3, ease: 'power2.in' }, SW_AT[1] + .8 + i * .3);
      });
      var hun = { v: 0 };
      tl.fromTo(hun, { v: 0 }, { v: 100, duration: 2.6, ease: 'aOut', onUpdate: function () { hundert.textContent = Math.round(hun.v); } }, SW_AT[2] + .3);
      tl.fromTo(flag, { opacity: 0, scale: .4 }, { opacity: 1, scale: 1, duration: 1.6, ease: 'back.out(3)' }, SW_AT[3] + .5);
      tl.to({}, { duration: 2 }, 132);
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
      gsap.set([W2, W3, W4, sub2, sub3], { opacity: 0 });
      gsap.set(knobs, { x: L.sw }); gsap.set(sws, { backgroundColor: '#22C55E' }); gsap.set(ons, { opacity: 1 });
      gsap.set(swLabels, { color: '#16181D' }); gsap.set(flag, { opacity: 1 });

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
        x: function () { return L.pose2.x; }, y: function () { return L.pose2.y; },
        rotationX: function () { return L.pose2.rx; }, rotationY: function () { return L.pose2.ry; },
        rotationZ: function () { return L.pose2.rz; }, scale: function () { return L.pose2.s; }
      }, 104);
      tl.to(device, { opacity: 1, duration: 5, ease: 'none' }, 104);
      tl.to(W4, { opacity: 1, duration: 5, ease: 'none' }, 105);
      tl.to(card, { opacity: 1, duration: 5, ease: 'none' }, 106);
      tl.to({}, { duration: 23 }, 111);
    }

    measure();
    setupLines();
    kpiNums.concat([donutNum]).forEach(function (el) { fmt(el, 0); });
    var tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
    if (reduced) buildStill(tl); else buildMotion(tl);
    if (reduced) draw(0);

    return {
      tl: tl,
      tick: reduced ? null : tick,
      measure: measure,
      rescale: function () { cv.size(W, H); L.mask = portrait ? cv.fade(0, 0, 0, H * .44, [[0, 1], [1, 0]]) : cv.fade(0, 0, W * .52, 0, [[0, 1], [1, 0]]); L.veil = cv.fade(0, 0, W * .5, 0, [[0, 1], [.62, .72], [1, 0]]); },
      refreshed: function () { if (reduced) draw(0); if (S.links > 0) placeLinks(); },
      onUpdate: function (p) {
        var u = p * tl.duration();
        setScene(u < 21 ? 0 : u < 67 ? 1 : u < 100 ? 2 : 3);
        if (reduced && S.links > 0) placeLinks();
      },
      cleanup: function () {
        kpiNums.concat([donutNum]).forEach(function (el) { fmt(el, +el.getAttribute('data-count')); });
        restEl.textContent = '4’870';
        hundert.textContent = '100';
      }
    };
  }


  /* =========================================================================
     KAPITEL VERGLEICH – Szene 5
     ========================================================================= */
  function vergleich(sec, env) {
    var stage = q1('.stage', sec);
    var view = q1('.cmp-view', sec), win = q1('.cmp-std-win', sec), inner = q1('.cmp-std', sec), line = q1('.cmp-line', sec);
    var lens = q1('.lens', sec), lensView = q1('.lens-view', sec);
    var portrait = env.portrait, reduced = env.reduced;
    var Wa = words(q1('.cmp-alae .cmp-h', sec)), Ws = words(q1('.cmp-std .cmp-h', sec));
    // Die Lupe zeigt eine Kopie der Szene. Sie steht immer im Endzustand
    // (CSS unter .lens-view), weil die Lupe erst kommt, wenn alles steht.
    if (!lensView.firstChild) {
      var copy = view.cloneNode(true);
      qa('[id]', copy).forEach(function (el) { el.removeAttribute('id'); });
      lensView.appendChild(copy);
    }
    var ua = q1('.ua', sec), uaCards = qa('.cmp-alae .ua-card', sec), flows = qa('.cmp-alae .ua-flow path', sec);
    var labA = q1('.lab-alae', sec), labS = q1('.lab-std', sec), capA = q1('.cap-alae', sec), capS = q1('.cap-std', sec);
    var sheets = qa('.cmp-std .us-sheet', sec), unotes = qa('.cmp-std .us-note', sec), tangle = q1('.cmp-std .us-tangle path', sec), bangs = qa('.cmp-std .us-bang', sec);
    var S = { lens: 0, lp: 0 }, W = 0, H = 0, R = 0, Z = 1.8;
    var pos = { x: 0, y: 0, init: false };
    // Die Lage setzt GSAP, nicht style.transform: Die Zeitleiste skaliert
    // die Lupe beim Erscheinen, und zwei Schreiber auf transform
    // überschrieben sich gegenseitig.
    var setX = gsap.quickSetter(lens, 'x', 'px'), setY = gsap.quickSetter(lens, 'y', 'px');

    function measure() {
      W = stage.clientWidth; H = stage.clientHeight;
      R = lens.offsetWidth / 2;
      lensView.style.width = W + 'px'; lensView.style.height = H + 'px';
    }
    function lensTarget() {
      var p = S.lp, x, y;
      if (portrait) { x = W * (.5 + .08 * Math.sin(p * Math.PI)); y = H * lerp(.33, .74, p); }
      else { x = W * lerp(.3, .73, p); y = H * (.56 - .06 * Math.sin(p * Math.PI)); }
      // Mit der Maus: Die Lupe folgt ihr, solange sie sich bewegt
      if (ptr.at && performance.now() - ptr.at < 2500) {
        var b = stage.getBoundingClientRect();
        if (ptr.cx >= b.left && ptr.cx <= b.right && ptr.cy >= b.top && ptr.cy <= b.bottom) { x = ptr.cx - b.left; y = ptr.cy - b.top; }
      }
      return { x: x, y: y };
    }
    function placeLens(x, y) {
      setX(x - R); setY(y - R);
      lensView.style.transform = 'translate3d(' + (R - x * Z).toFixed(1) + 'px,' + (R - y * Z).toFixed(1) + 'px,0) scale(' + Z + ')';
    }
    function tick(t, dt) {
      if (S.lens <= 0) { pos.init = false; return; }
      var tg = lensTarget();
      if (!pos.init) { pos.x = tg.x; pos.y = tg.y; pos.init = true; }
      var k = 1 - Math.exp(-dt / .1);
      pos.x += (tg.x - pos.x) * k; pos.y += (tg.y - pos.y) * k;
      placeLens(pos.x, pos.y);
    }

    /* Zeitleiste:
         0–6    Hintergrund blendet über Szene 4
         4–18   die alae.app-Seite baut sich auf, Überschrift
         16–40  die helle Seite schiebt sich von rechts herein (hoch: von unten)
         40–50  die beiden Sätze darunter
         46–92  die Lupe, von der dunklen zur hellen Seite */
    function buildMotion(tl) {
      bgIn(tl, sec);
      tl.fromTo(ua, { opacity: 0, y: 30, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: 8, ease: 'aOut' }, 4);
      tl.fromTo(uaCards, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 4, stagger: .7, ease: 'aOut' }, 8);
      tl.fromTo(flows, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 4, stagger: 1.5, ease: 'power2.inOut' }, 13);
      tl.fromTo(labA, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 5, ease: 'aOut' }, 6);
      wordsIn(tl, Wa, 8, .5); wordsIn(tl, Ws, 8, .5);
      var ax = portrait ? 'y' : 'x';
      var o1 = {}, t1 = {}, o2 = {}, t2 = {}, o3 = {}, t3 = {};
      o1[ax] = function () { return portrait ? H : W; }; t1[ax] = function () { return (portrait ? H : W) * .5; };
      o2[ax] = function () { return -(portrait ? H : W); }; t2[ax] = function () { return -(portrait ? H : W) * .5; };
      o3[ax] = function () { return portrait ? H : W; }; t3[ax] = function () { return (portrait ? H : W) * .5; };
      [[win, o1, t1], [inner, o2, t2], [line, o3, t3]].forEach(function (a) {
        a[1].xPercent = 0; a[1].yPercent = 0;
        a[2].duration = 24; a[2].ease = 'power2.inOut';
        tl.fromTo(a[0], a[1], a[2], 16);
      });
      tl.fromTo(sheets, { opacity: 0, y: -24, rotation: '+=6' }, { opacity: 1, y: 0, rotation: '-=6', duration: 6, stagger: 1.4, ease: 'aOut' }, 20);
      tl.fromTo(unotes, { opacity: 0, y: -60 }, { opacity: 1, y: 0, duration: 5, stagger: 1.1, ease: 'power3.out' }, 24);
      tl.fromTo(tangle, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 14, ease: 'none' }, 24);
      tl.fromTo(bangs, { opacity: 0, scale: .4 }, { opacity: 1, scale: 1, duration: 2.4, stagger: 1.4, ease: 'back.out(3)' }, 33);
      tl.fromTo(labS, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 5, ease: 'aOut' }, 30);
      tl.fromTo([capA, capS], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 6, stagger: 2, ease: 'aOut' }, 40);
      tl.fromTo(lens, { opacity: 0, scale: .6 }, { opacity: 1, scale: 1, duration: 6, ease: 'aOut' }, 46);
      tl.fromTo(S, { lens: 0 }, { lens: 1, duration: .01, ease: 'none' }, 46);
      tl.fromTo(S, { lp: 0 }, { lp: 1, duration: 38, ease: 'sine.inOut' }, 54);
      tl.to({}, { duration: 8 }, 92);
    }
    function buildStill(tl) {
      bgIn(tl, sec);
      gsap.set([ua, uaCards, labA, labS, capA, capS, sheets, unotes, bangs, Wa, Ws, lens], { opacity: 1 });
      gsap.set(flows.concat([tangle]), { strokeDashoffset: 0 });
      gsap.set(lens, { opacity: 0 });
      tl.fromTo(q1('.cmp', sec), { opacity: 0 }, { opacity: 1, duration: 8, ease: 'none' }, 4);
      tl.to(lens, { opacity: 1, duration: 8, ease: 'none' }, 40);
      tl.set(S, { lens: 1 }, 40);
      tl.to({}, { duration: 52 }, 48);
    }

    measure();
    var tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
    if (reduced) buildStill(tl); else buildMotion(tl);
    return {
      tl: tl, tick: reduced ? null : tick, measure: measure,
      aktiv: function (on) { root.classList.toggle('hell', on); },
      refreshed: function () {
        if (!reduced) return;
        placeLens(W * (portrait ? .5 : .3), H * (portrait ? .3 : .52));
      },
      onUpdate: function () { setScene(4); if (reduced) placeLens(W * (portrait ? .5 : .3), H * (portrait ? .3 : .52)); }
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
         0–6    Hintergrund blendet über den Vergleich
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
    return { tl: tl, tick: null, onUpdate: function () { setScene(5); } };
  }


  /* =========================================================================
     KAPITEL DREAMTEAM – Szene 6, zweite App
     Karten im Raum: Jede hat eine Lage (x, y, z) in einem Raum vor der
     Kamera. Die Kamera fliegt beim Scrollen hinein, die vorderen Karten
     ziehen am Rand vorbei. Danach werden elf Karten ausgewählt, stellen
     sich als Team auf ein Spielfeld, und die Rangliste rechnet.
     Alles erfunden: Spieler, Klubs, Wappen, Manager.
     ========================================================================= */
  var CLUBS = [
    { n: 'FC Aarestadt', k: 'FCA', a: '#D62D3A', b: '#FFFFFF', s: 0 },
    { n: 'Real Rigi', k: 'RR', a: '#F2F2F4', b: '#C9A227', s: 1 },
    { n: 'Lakeside 09', k: 'L09', a: '#1F5FBF', b: '#FFFFFF', s: 2 },
    { n: 'Sporting Jura', k: 'SJ', a: '#1E8E4E', b: '#FFFFFF', s: 0 },
    { n: 'Dynamo Säntis', k: 'DS', a: '#12264F', b: '#E23A3A', s: 1 },
    { n: 'Union Léman', k: 'UL', a: '#5BB4E5', b: '#0E2A55', s: 2 },
    { n: 'Emmental United', k: 'EU', a: '#F2B632', b: '#1A1A1A', s: 0 },
    { n: 'Inter Ticino', k: 'IT', a: '#0F1F3D', b: '#3DA5E0', s: 1 }
  ];
  var PLAYERS = ['Noah Brunner', 'Elias Kovač', 'Mateo Silva', 'Luca Frei', 'Jonas Keller', 'Samir Haddad', 'Leon Wyss',
    'Dario Conti', 'Yannick Morel', 'Kai Imhof', 'Tim Oberli', 'Adrian Nkosi', 'Levin Graf', 'Nico Arnold', 'Milan Horvat',
    'Aaron Mensah', 'Julian Bosch', 'Ben Hofer', 'Rafael Ortiz', 'Emil Lindqvist', 'Liam Byrne', 'Marco Bianchi',
    'Finn Sutter', 'Ilyas Benali', 'Oscar Petit', 'Joel Baumann'];
  var MANAGER = [
    { n: 'Leonie', t: 'FC Tiki-Taka', p: 1064, i: 'LE' },
    { n: 'Mika', t: 'Die Elfer', p: 1031, i: 'MI' },
    { n: 'Nora', t: 'Abseitsfalle', p: 1018, i: 'NO' },
    { n: 'Du', t: 'Dein DreamTeam', p: 1012, i: 'DU', me: true },
    { n: 'Timo', t: 'Real Rasen', p: 981, i: 'TI' },
    { n: 'Jana', t: 'Flankengott', p: 976, i: 'JA' }
  ];
  var SKIN = ['#F1C7A1', '#E3B08A', '#C68A5E', '#9A6440', '#6E4630', '#F4D2B5'];
  var HAIR = ['#2B1D14', '#5A3A22', '#1B1B1B', '#B5532A', '#D9A441', '#3D2B1F'];
  function avatar(i, club) {
    var R = mulberry(100 + i * 7);
    var skin = SKIN[Math.floor(R() * SKIN.length)], hair = HAIR[Math.floor(R() * HAIR.length)], style = Math.floor(R() * 4);
    var hairSvg = [
      '<path d="M32 37c0-14 8-20 18-20s18 6 18 20c-5-6-11-8-18-8s-13 2-18 8Z" fill="' + hair + '"/>',
      '<path d="M31 40c-2-16 8-23 19-23s21 7 19 23c-2-6-5-9-8-10-4 3-9 3-13 2-5 0-10-2-13-5-2 3-3 7-4 13Z" fill="' + hair + '"/>',
      '<g fill="' + hair + '"><circle cx="38" cy="25" r="7"/><circle cx="47" cy="22" r="7.5"/><circle cx="57" cy="24" r="7"/><circle cx="64" cy="31" r="5.5"/><circle cx="34" cy="32" r="5.5"/></g>',
      '<path d="M33 35c0-10 7-15 17-15s17 5 17 15c-5-3-11-4-17-4s-12 1-17 4Z" fill="' + hair + '" opacity=".92"/>'
    ][style];
    return '<svg viewBox="0 0 100 92"><rect width="100" height="92" fill="#E6EAF1"/>' +
      '<path d="M8 92c3-18 18-26 42-26s39 8 42 26Z" fill="' + club.a + '"/>' +
      '<path d="M8 92c3-18 18-26 42-26s39 8 42 26" fill="none" stroke="rgba(0,0,0,.12)" stroke-width="1.5"/>' +
      '<path d="M40 67l10 9 10-9" fill="none" stroke="' + club.b + '" stroke-width="3.2" stroke-linejoin="round"/>' +
      '<rect x="43" y="52" width="14" height="16" rx="6" fill="' + skin + '"/><rect x="43" y="52" width="14" height="16" rx="6" fill="rgba(0,0,0,.12)"/>' +
      '<ellipse cx="33.5" cy="43" rx="3.2" ry="4.6" fill="' + skin + '"/><ellipse cx="66.5" cy="43" rx="3.2" ry="4.6" fill="' + skin + '"/>' +
      '<ellipse cx="50" cy="41" rx="17" ry="19.5" fill="' + skin + '"/>' + hairSvg +
      '<path d="M41 38.5q3.5-2 7 0M52 38.5q3.5-2 7 0" stroke="' + hair + '" stroke-width="1.7" fill="none" stroke-linecap="round"/>' +
      '<g fill="#1F1712"><ellipse cx="44.5" cy="43.5" rx="1.9" ry="2.2"/><ellipse cx="55.5" cy="43.5" rx="1.9" ry="2.2"/></g>' +
      '<path d="M45.5 51.5q4.5 3.2 9 0" stroke="#7A3E2A" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>';
  }
  function crest(club) {
    var shape = [
      '<path d="M50 5 89 17v31c0 25-18 38-39 47C29 86 11 73 11 48V17Z" fill="' + club.a + '" stroke="' + club.b + '" stroke-width="5"/>',
      '<circle cx="50" cy="50" r="42" fill="' + club.a + '" stroke="' + club.b + '" stroke-width="5"/><circle cx="50" cy="50" r="33" fill="none" stroke="' + club.b + '" stroke-width="1.5" opacity=".7"/>',
      '<path d="M22 8h56l14 14v48L50 95 8 70V22Z" fill="' + club.a + '" stroke="' + club.b + '" stroke-width="5"/>'
    ][club.s];
    var fs = club.k.length > 2 ? 24 : 30;
    return '<svg viewBox="0 0 100 100">' + shape + '<text x="50" y="' + (club.s === 0 ? 57 : 60) + '" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="' + fs + '" fill="' + club.b + '">' + club.k + '</text></svg>';
  }

  function dreamteam(sec, env) {
    var stage = q1('.stage', sec), field = q1('.dt-field', sec), scrim = q1('.dt-scrim', sec), copyEl = q1('.dt-copy', sec);
    var kicker = q1('.dt-copy .kicker', sec), Wd = words(q1('.dt-copy h2', sec)), stepsList = q1('.dt-steps', sec), steps = qa('.dt-steps li', sec);
    var btn = q1('.dt-btn', sec), rank = q1('.dt-rank', sec), rowsBox = q1('.dt-rows', sec);
    var portrait = env.portrait, reduced = env.reduced;
    var NCARD = portrait ? 22 : 26, NPASS = portrait ? 5 : 7;
    var CAM0 = -2600, F = 900;
    var S = { cam: 0, form: 0, dim: 0 };
    var W = 0, H = 0, CW = 0, CH = 0;
    var R = mulberry(23);

    // Karten und Spielfeld erzeugen – pro Format neu, die Anzahl weicht ab
    field.innerHTML = '';
    var pitch = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    pitch.setAttribute('class', 'dt-pitch');
    field.appendChild(pitch);
    var cards = [];
    for (var i = 0; i < NCARD; i++) {
      var club = CLUBS[i % CLUBS.length];
      var el = document.createElement('div');
      el.className = 'dt-card';
      el.innerHTML = '<div class="dt-in"><div class="dt-face">' + avatar(i, club) + '</div><b class="dt-name">' + PLAYERS[i] +
        '</b><span class="dt-crest">' + crest(club) + '</span><small class="dt-club">' + club.n + '</small></div>' +
        '<i class="dt-pick"></i><i class="dt-ok"></i>';
      field.appendChild(el);
      cards.push({ el: el, pass: i < NPASS, fx: 0, fy: 0, fs: 1, slot: -1, delay: 0, u: 0, v: 0, z: 0, zi: 0, zNow: -1 });
    }
    // Feldkarten auf einem lockeren Raster, damit sie das Bild gleichmässig
    // füllen – quer rechts vom Text, hoch unter ihm. u und v sind die Lage
    // im Bild, wenn die Kamera angekommen ist (-1 bis 1).
    var fieldCards = cards.filter(function (c) { return !c.pass; });
    var cols = portrait ? 3 : 5, rowsN = Math.ceil(fieldCards.length / cols);
    fieldCards.forEach(function (c, k) {
      var cx = (k % cols + .5) / cols, cy = (Math.floor(k / cols) + .5) / rowsN;
      c.u = (portrait ? lerp(-.78, .78, cx) : lerp(-.3, .9, cx)) + (R() - .5) * .12;
      c.v = (portrait ? lerp(-.26, .86, cy) : lerp(-.56, .7, cy)) + (R() - .5) * .12;
      c.z = 900 + R() * 800;
    });
    // Vorbeiflieger: Am Ende liegen sie hinter der Kamera. Unterwegs kommen
    // sie aus der Tiefe auf einen zu und ziehen am Rand vorbei, nach aussen
    // – quer nach rechts, oben und unten, hoch zu den Seiten und nach unten,
    // nie über den Text.
    cards.forEach(function (c) {
      if (!c.pass) return;
      var an = portrait ? lerp(-.2, Math.PI + .2, R()) : lerp(-1.9, 1.9, R()), r0 = .55 + R() * .3;
      c.u = Math.cos(an) * r0; c.v = Math.sin(an) * r0;
      c.z = -900 + R() * 750;
    });
    // Stapelung nach Tiefe: nah vor fern. Die Tiefenordnung ändert sich beim
    // Flug nie, weil alle Karten gleich weit auf die Kamera zukommen.
    cards.slice().sort(function (a, b) { return b.z - a.z; }).forEach(function (c, k) { c.zi = 10 + k; });
    // Die elf nächsten Feldkarten bilden das Team
    var SLOTS = [[0, .98], [-.72, .7], [-.25, .73], [.25, .73], [.72, .7], [-.52, .42], [0, .45], [.52, .42], [-.55, .14], [0, .1], [.55, .14]];
    var team = fieldCards.slice().sort(function (a, b) { return a.z - b.z; }).slice(0, 11);
    // Aufstellung: die Karten links im Bild gehen auf die linken Positionen
    team.sort(function (a, b) { return a.u - b.u; });
    var bySlotU = SLOTS.map(function (s, k) { return { k: k, u: s[0] + s[1] * .01 }; }).sort(function (a, b) { return a.u - b.u; });
    team.forEach(function (c, k) { c.slot = bySlotU[k].k; c.delay = (10 - c.slot) * .045; });
    var captain = team.filter(function (c) { return c.slot === 9; })[0] || team[0];
    var capEl = document.createElement('i'); capEl.className = 'dt-cap'; capEl.textContent = 'C'; captain.el.appendChild(capEl);
    var picks = team.map(function (c) { return q1('.dt-pick', c.el); }), oks = team.map(function (c) { return q1('.dt-ok', c.el); });

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
      CW = cards[0].el.offsetWidth; CH = cards[0].el.offsetHeight;
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
        if (c.slot >= 0) {
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

    function place(t) {
      var camZ = lerp(CAM0, 0, S.cam);
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i], team = c.slot >= 0, rest = !team && !c.pass;
        // Wer nicht ins Team kommt, fällt zurück in die Tiefe und verblasst
        var zc = c.z - camZ + (rest ? S.dim * 900 : 0);
        var o = smooth(4700, 3700, zc);
        if (c.pass) o *= smooth(140, 480, zc);
        if (rest) o *= 1 - S.dim;
        if (o < .003 || zc < 40) { if (c.o !== 0) { c.el.style.visibility = 'hidden'; c.o = 0; } continue; }
        var f = F / zc;
        var sx = W / 2 + c.x * f, sy = H / 2 + c.y * f, s = f * .92;
        if (!c.pass) { sx += ptr.x * 14 * f; sy += Math.sin(t * .55 + i * 1.3) * 5 * f + ptr.y * 9 * f; }
        if (team) {
          var w = inOut(clamp01((S.form - c.delay) / .55));
          sx = lerp(sx, c.fx, w); sy = lerp(sy, c.fy, w); s = lerp(s, c.fs, w);
        }
        // Stapelung nach Tiefe; sobald das Team sich aufstellt, liegt es oben
        var zi = team && S.form > 0 ? 60 + c.slot : c.zi;
        if (zi !== c.zNow) { c.el.style.zIndex = zi; c.zNow = zi; }
        if (c.o === 0) c.el.style.visibility = '';
        c.o = o;
        c.el.style.transform = 'translate3d(' + (sx - CW / 2).toFixed(1) + 'px,' + (sy - CH / 2).toFixed(1) + 'px,0) scale(' + s.toFixed(4) + ')';
        c.el.style.opacity = o.toFixed(3);
      }
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
      team.forEach(function (c, k) {
        var at = 30 + k * .9;
        tl.fromTo(picks[k], { opacity: 0 }, { opacity: 1, duration: 2, ease: 'none' }, at);
        tl.fromTo(oks[k], { opacity: 0, scale: .4 }, { opacity: 1, scale: 1, duration: 2, ease: 'back.out(3)' }, at + .3);
      });
      tl.fromTo(S, { form: 0, dim: 0 }, { form: 1, dim: 1, duration: 18, ease: 'none' }, 42);
      tl.to(picks, { opacity: 0, duration: 4, ease: 'none' }, 50);
      tl.to(oks, { opacity: 0, scale: .6, duration: 3, ease: 'power1.in' }, 50);
      tl.fromTo(pitch, { opacity: 0, scaleY: .7, transformOrigin: '50% 100%' }, { opacity: 1, scaleY: 1, duration: 10, ease: 'aOut' }, 44);
      tl.fromTo(capEl, { opacity: 0, scale: .3 }, { opacity: 1, scale: 1, duration: 2.4, ease: 'back.out(3)' }, 57);
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
      gsap.set([kicker, stepsList, Wd, pitch, capEl], { opacity: 1 });
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
      refreshed: function () { if (reduced) place(0); },
      onUpdate: function (p) {
        setScene(5);
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

    function type(tl, el, at, dur) {
      var txt = el.getAttribute('data-tippe'), o = { n: 0 };
      tl.fromTo(o, { n: 0 }, { n: txt.length, duration: dur, ease: 'none', onUpdate: function () { el.textContent = txt.slice(0, Math.round(o.n)); } }, at);
    }

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
        setScene(5);
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
          var q = onChev(ln.c, u, ln.off * (1 - w * .6));
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
         14–46  sie legen sich auf die zwei Winkel
         42–52  das Signet zeichnet sich, die Fäden treten zurück
         50–62  Schriftzug und Zeile
         60–78  Einladung und Knöpfe */
    function buildMotion(tl) {
      bgIn(tl, sec);
      tl.fromTo(S, { alpha: 0 }, { alpha: 1, duration: 12, ease: 'none' }, 2);
      tl.fromTo(S, { form: 0 }, { form: 1, duration: 32, ease: 'none' }, 14);
      tl.fromTo(paths[0], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 6, ease: 'aLogo' }, 42);
      tl.fromTo(paths[1], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 7, ease: 'aLogo' }, 45);
      tl.to(S, { alpha: .18, duration: 8, ease: 'none' }, 46);
      tl.fromTo(word, { opacity: 0, y: 45 }, { opacity: 1, y: 0, duration: 6.6, ease: 'aLogo' }, 50);
      tl.fromTo(claim, { opacity: 0, y: 45 }, { opacity: 1, y: 0, duration: 7, ease: 'aLogo' }, 52);
      wordsIn(tl, Wg, 60);
      tl.fromTo(sub, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 6, ease: 'aOut' }, 65);
      tl.fromTo(actions, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 6, ease: 'aOut' }, 69);
      tl.to({}, { duration: 22 }, 78);
    }
    function buildStill(tl) {
      bgIn(tl, sec);
      gsap.set(paths, { strokeDashoffset: 0 });
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
      onUpdate: function () { setScene(6); }
    };
  }


  /* =========================================================================
     AUFBAU
     Pro Format (quer, hoch) und für „weniger Bewegung" eigene Zeitleisten.
     gsap.matchMedia baut alles ab und neu auf, wenn sich eine der drei
     Bedingungen ändert – etwa beim Drehen des Tablets.
     ========================================================================= */
  var KAPITEL = { ordnung: ordnung, vergleich: vergleich, gripszug: gripszug, dreamteam: dreamteam, fotos: fotos, gespraech: gespraech };
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

  if (wege && sections.length) {
    ScrollTrigger.create({
      trigger: sections[0], endTrigger: sections[sections.length - 1], start: 'top center', end: 'bottom center',
      onToggle: function (self) { wege.classList.toggle('is-on', self.isActive); }
    });
  }

  gsap.matchMedia().add({
    hoch: '(orientation: portrait)',
    quer: '(orientation: landscape)',
    ruhig: '(prefers-reduced-motion: reduce)'
  }, function (context) { return buildAll(context.conditions); });
})();
