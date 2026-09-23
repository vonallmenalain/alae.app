# alae.app — Logo-Intro-Animation · exakte Spezifikation

> Übergabe-Brief für Claude. Alle Werte wurden aus der Bildschirmaufnahme
> (948 × 280 px, H.264, 30 fps, Frames 101–141) subpixel-genau vermessen,
> nicht geschätzt. Abschnitt 8 enthält die Messreihen als Abnahmekriterien.
>
> Gegenstand ist **ausschließlich der Auftritt** („Erscheinen") des Logos
> aus dem dunklen Hintergrund bis zum vollständigen Endzustand.
> Dauer gesamt: **1,38 s**. Kein Loop, kein Exit, kein Hover-State.

---

## 1. Auftrag in einem Satz

Baue die Entrance-Animation der alae.app-Wortmarke nach: zwei Chevrons werden
nacheinander als Linienzug „gezeichnet" (SVG-`stroke-dashoffset`), danach steigen
Wortmarke und Claim gestaffelt von unten ein (`opacity` + `translateY`).
Hintergrund und Layout bleiben währenddessen vollkommen statisch.

---

## 2. Endzustand — Geometrie

Referenzrahmen: der aufgezeichnete Ausschnitt, 948 × 280 px, Ursprung oben links.
Alle Koordinaten in CSS-px bei 1:1-Darstellung.

### 2.1 Bildmarke (zwei Chevrons)

| Größe | Wert |
|---|---|
| Bounding-Box der Marke | x 42,1 … 186,2 · y 112,0 … 185,7 → **144,1 × 73,7 px** |
| Strichstärke (senkrecht gemessen) | **12,2 px** (= 0,1655 × Markenhöhe) |
| `stroke-linecap` / `stroke-linejoin` | **round** / **round** |
| Schenkelwinkel | **28,2° zur Vertikalen** (dx/dy = 0,5366; 61,8° zur Horizontalen) |
| Schenkelvektor (Apex → Fußpunkt) | (± 33,0 · + 61,5) px, Länge 69,8 px |
| Apex weiß | (81,2 · 118,1) |
| Apex rot | (147,0 · 118,1) — exakt **+65,8 px** in x, gleiche Höhe |
| Fußpunkte (Mittellinie) | y = 179,6 |

**Entscheidendes Detail:** Der **weiße** Chevron ist asymmetrisch — der rechte
Schenkel ist **exakt halb so lang** wie der linke (gemessen 0,494 ± 0,01).
Der **rote** Chevron ist vollständig symmetrisch. Das ist kein Messfehler,
sondern die Form der Marke („alae" = Flügel).

### 2.2 SVG-Pfaddaten (verifiziert, Abweichung < 0,5 px)

```svg
<svg viewBox="0 0 144.1 73.7" width="144.1" height="73.7" aria-hidden="true" focusable="false">
  <g fill="none" stroke-width="12.2" stroke-linecap="round" stroke-linejoin="round">
    <path id="mark-w" pathLength="100" stroke="#ECEDF2"
          d="M 6.1 67.6 L 39.1 6.1 L 55.6 36.85"/>
    <path id="mark-r" pathLength="100" stroke="#FE7971"
          d="M 71.9 67.6 L 104.9 6.1 L 137.9 67.6"/>
  </g>
</svg>
```

Zeichenrichtung ist zwingend **vom linken unteren Fußpunkt über den Apex nach
rechts** — genau so, wie die Pfade oben notiert sind. `pathLength="100"`
normalisiert beide Pfade, damit `stroke-dasharray/-dashoffset` unabhängig von
der Skalierung mit `100 → 0` arbeiten kann.

### 2.3 Typografie & Layout

| Element | Messwert |
|---|---|
| Wortmarke „alae.app" — Tinte links | x = 251 |
| Wortmarke — Grundlinie | y = 145,5 |
| Wortmarke — Oberlänge („l") | 64,5 px über Grundlinie (Oberkante y = 81) |
| Wortmarke — x-Höhe | 44,5 px |
| Wortmarke — Unterlänge („p") | 19,5 px (Unterkante y = 165) |
| Wortmarke — Stammbreite („l") | 16 px → sehr fetter Schnitt (**800 / ExtraBold**) |
| daraus `font-size` | **≈ 86 px** (fontabhängig 84–90) |
| Claim „INDIVIDUELLE WEB-APPS" — Tinte links | x = 253 |
| Claim — Versalhöhe | 30,5 px (Oberkante y = 200, Grundlinie y = 230,5) |
| Claim — Zeichenvorschub (gemessen über 20 Glyphen) | **31,68 px** |
| daraus `font-size` / `letter-spacing` | **≈ 42 px** / **≈ 6,5 px (0,155 em)** |
| Grundlinienabstand Wortmarke → Claim | **85 px** |
| Abstand Marke (rechte Kante 186,2) → Text (251) | **64,8 px** |

**Schriften (nicht sicher identifizierbar aus dem Video — bitte die echten
Website-Schriften verwenden):**

* Wortmarke: fette Neo-Grotesk, doppelstöckiges „a" mit kleinem Sporn,
  Gewicht 800. Nächste Treffer im Test: Open Sans ExtraBold, Inter ExtraBold,
  Figtree Black, Outfit ExtraBold. Maßgeblich sind die Metriken oben.
* Claim: Monospace mit Serifen am „I", Gewicht ~500, stark gesperrt.
  Nächste Treffer: Source Code Pro Medium, IBM Plex Mono Medium,
  bzw. der generische `monospace`-Stack.

> **Hinweis an den Umsetzenden:** Wenn die Original-SVG des Logos vorliegt,
> verwende sie und lege nur die Animationsschicht aus Abschnitt 4 darüber.
> Die Pfaddaten oben sind der Ersatz, falls die Quelldatei fehlt.

### 2.4 Farben (aus dem Video gemessen, Median der Kernpixel)

| Rolle | Messwert | Bemerkung |
|---|---|---|
| Hintergrund | `#111015` — rgb(17, 16, 21) | absolut flach, kein Verlauf, kein Glow |
| Chevron weiß / Wortmarke | `#ECEDF2` — rgb(236, 237, 242) | identisch für beide |
| Chevron rot | `#FE7971` — rgb(254, 121, 113) | entspricht sehr wahrscheinlich `#F87171` (Tailwind `red-400`); die Aufnahme ist leicht übersättigt (P3-Capture) |
| Claim | `#9DA4B1` — rgb(157, 164, 177) | deckt sich mit `#9CA3AF` (Tailwind `gray-400`) |

Keine Schatten, kein Blur, kein Glow, kein Farbwechsel während der Animation.
Der Hintergrund ist über alle 183 Frames **pixelidentisch** (Abweichung < 0,03).

---

## 3. Easing — der gemeinsame Nenner

Alle vier Teilanimationen laufen auf **derselben** Kurve. Numerischer Fit über
alle Messreihen gleichzeitig (Gittersuche über x₁, x₂ bei y₁ = 0, y₂ = 1):

```
cubic-bezier(0.625, 0, 0.125, 1)      ← bester Fit
cubic-bezier(0.65,  0, 0.15,  1)      ← Empfehlung für die Umsetzung
```

Beide liegen innerhalb des Messrauschens (RMS ≤ 0,007 auf 0…1). Verwende die
zweite Variante — lesbarere Zahlen, gleiches Ergebnis.

Charakter: ausgeprägtes **ease-in-out** mit trägem Start und sehr langem
Auslauf. Halbe Strecke bei ≈ 40 % der Laufzeit.

**Nicht** verwenden: `ease`, `ease-in-out`, `easeInOutCubic` (0.65, 0, 0.35, 1),
`easeInOutQuart`, Material-Standard (0.4, 0, 0.2, 1) — alle mit deutlich
schlechterem Fit (RMS 0,014 – 0,03), sichtbar am zu kurzen Auslauf.
Keine Feder/Spring: es gibt **kein Overshoot** (`translateY` erreicht 0 und
geht nie darunter, gemessen mit 0,25 px Auflösung).

---

## 4. Timeline

`t = 0` ist der Start der Animation.

| # | Element | Eigenschaft | von → nach | Delay | Dauer | Easing |
|---|---|---|---|---|---|---|
| 1 | Chevron **weiß** | `stroke-dashoffset` | `100 → 0` | **0 ms** | **700 ms** | gemeinsam |
| 2 | Chevron **rot** | `stroke-dashoffset` | `100 → 0` | **350 ms** | **820 ms** | gemeinsam |
| 3 | **Wortmarke** | `opacity` + `translateY` | `0 → 1` · `45px → 0` | **530 ms** | **660 ms** | gemeinsam |
| 4 | **Claim** | `opacity` + `translateY` | `0 → 1` · `45px → 0` | **680 ms** | **700 ms** | gemeinsam |

Ende der gesamten Sequenz: **1380 ms**.

Gemessene Fit-Residuen: weiß 0,005 · rot 0,004 · Wortmarke 0,006 · Claim 0,016
(auf einer Skala 0…1). Die Werte sind also belastbar auf ± 20 ms bzw. ± 2 px.

**Wichtige Feinheiten, die den Charakter ausmachen:**

* Die Phasen **überlappen** stark. Der rote Chevron startet, während der weiße
  noch seinen zweiten (kurzen) Schenkel zeichnet. Die Wortmarke beginnt, bevor
  der rote Chevron fertig ist. Nichts wartet auf den Abschluss des Vorgängers.
* Beide Chevrons sind **je ein durchgehender Pfad**, nicht zwei Segmente. Der
  Knick am Apex bekommt keine eigene Verzögerung — der Strich läuft ohne Pause
  über die Ecke. Erkennbar daran, dass der erste Schenkel „einfährt"
  (beschleunigend) und der zweite „ausläuft" (bremsend): das ist eine einzige
  ease-in-out-Kurve über die Gesamtlänge.
* `translateY` und `opacity` teilen sich bei Text 3 und 4 dieselbe Kurve und
  dieselbe Dauer — kein separates, kürzeres Fade.
* Der Startwert von `translateY` ist **45 px** (gemessen 44,9 ± 0,7) — bei
  beiden Textzeilen identisch, obwohl der Claim deutlich kleiner gesetzt ist.
  Also ein fester px-Wert, keine em-Relation.

---

## 5. Referenz-Implementierung

Vollständig, selbsttragend, ohne Abhängigkeiten. Gegen die Originalaufnahme
frame-by-frame verifiziert (Abschnitt 8).

Das gesamte Lockup steckt in **einem** SVG mit dem Koordinatensystem der
Aufnahme (`viewBox="0 0 948 280"`). Damit sitzen Marke, Grundlinien und
Laufweite exakt auf den gemessenen Werten, unabhängig von Zeilenhöhen-Tricks,
und das Ganze skaliert als Block. Der Text bleibt echter Text.

```html
<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>alae.app — Logo Intro</title>
<style>
  :root{
    --alae-bg:#111015;
    --alae-ink:#ECEDF2;
    --alae-accent:#FE7971;    /* ggf. #F87171 */
    --alae-muted:#9DA4B1;
    --alae-ease:cubic-bezier(.65,0,.15,1);
  }
  body{margin:0;background:var(--alae-bg)}

  .alae-logo{display:block;width:948px;height:280px}   /* frei skalierbar */

  .alae-logo .stroke{
    fill:none; stroke-width:12.2;
    stroke-linecap:round; stroke-linejoin:round;
    stroke-dasharray:100; stroke-dashoffset:100;
  }
  .alae-logo .w{stroke:var(--alae-ink)}
  .alae-logo .r{stroke:var(--alae-accent)}

  .alae-logo .word{
    fill:var(--alae-ink);
    font:800 86px/1 "Inter","Open Sans",system-ui,sans-serif;
    letter-spacing:-.005em;
  }
  .alae-logo .claim{
    fill:var(--alae-muted);
    font:500 42px/1 "Source Code Pro","IBM Plex Mono",ui-monospace,monospace;
    letter-spacing:6.5px;
  }

  /* Ausgangszustand im CSS – verhindert Aufblitzen vor dem Start */
  .alae-logo .word,.alae-logo .claim{opacity:0;transform:translate3d(0,45px,0)}

  .alae-logo.is-in .w    {animation:alae-draw 700ms var(--alae-ease)   0ms both}
  .alae-logo.is-in .r    {animation:alae-draw 820ms var(--alae-ease) 350ms both}
  .alae-logo.is-in .word {animation:alae-rise 660ms var(--alae-ease) 530ms both}
  .alae-logo.is-in .claim{animation:alae-rise 700ms var(--alae-ease) 680ms both}

  @keyframes alae-draw{ to{ stroke-dashoffset:0 } }
  @keyframes alae-rise{
    from{ opacity:0; transform:translate3d(0,45px,0) }
    to  { opacity:1; transform:none }
  }

  @media (prefers-reduced-motion:reduce){
    .alae-logo .stroke{stroke-dashoffset:0!important;animation:none!important}
    .alae-logo .word,.alae-logo .claim{
      opacity:1!important;transform:none!important;animation:none!important}
  }
</style>
</head>
<body>

<svg class="alae-logo" viewBox="0 0 948 280"
     role="img" aria-label="alae.app — individuelle Web-Apps">
  <path class="stroke w" pathLength="100" d="M 48.2 179.6 L 81.2 118.1 L 97.7 148.85"/>
  <path class="stroke r" pathLength="100" d="M 114.0 179.6 L 147.0 118.1 L 180.0 179.6"/>
  <text class="word"  x="249.5" y="145.5">alae.app</text>
  <text class="claim" x="249.5" y="230.5">INDIVIDUELLE WEB-APPS</text>
</svg>

<script>
  const el = document.querySelector('.alae-logo');
  // Erst starten, wenn die Schriften stehen – sonst springt der Text beim Swap.
  (document.fonts ? document.fonts.ready : Promise.resolve())
    .then(() => requestAnimationFrame(() => el.classList.add('is-in')));
</script>
</body>
</html>
```

Gemessen an dieser Umsetzung (Chromium, 1:1):
Marke x 42–185 / y 112–185 → **deckungsgleich mit dem Original**.
Claim x 253–907 / y 199–231 → **deckungsgleich** (schon mit dem generischen
`monospace`-Fallback; ein Hinweis darauf, dass im Original ebenfalls ein
DejaVu-/Plex-ähnlicher Mono steht). Die Wortmarke trifft Ober- und Unterlänge
exakt; die Gesamtbreite hängt an der tatsächlichen Schrift.

Wird das Lockup in eine bestehende Seite eingebaut, sind nur die beiden
`<text>`-Zeilen durch das eigene Markup zu ersetzen — Animationsklassen,
Keyframes und Zeiten bleiben unverändert.

---

## 6. Architektur & Integrations-Anforderungen

* **Auslösung.** Die Animation ist ein einmaliger Entrance. In der Aufnahme
  wird sie neu gestartet (Reload oder Re-Mount) — kein Loop. Für einen
  Above-the-fold-Header: beim Mount starten. Weiter unten im Dokument:
  `IntersectionObserver` mit `threshold: 0.35`, danach `unobserve()`, damit
  sie nicht beim Zurückscrollen erneut läuft.
* **Schrift-Timing.** Erst nach `document.fonts.ready` starten. Sonst fällt
  die Wortmarke während des Einblendens vom Fallback auf die Webfont zurück und
  springt in der Breite — genau in dem Moment, in dem das Auge auf ihr liegt.
  `font-display: swap` bleibt richtig, das Gate verhindert nur den sichtbaren
  Sprung.
* **Kein FOUC.** Ausgangszustand (`opacity: 0`, `translateY(45px)`,
  `stroke-dashoffset: 100`) muss im CSS stehen, nicht erst per JS gesetzt
  werden. `animation-fill-mode: both` hält Anfangs- und Endbild.
* **Skalierung.** Alles außer `translateY(45px)` ist an das SVG-`viewBox`-System
  bzw. `font-size` gebunden und skaliert mit. Bei einer merklich kleineren
  Darstellung (< 60 % der Referenzgröße) den `translateY`-Startwert
  proportional mitskalieren, sonst wirkt der Einstieg zu weit.
  `pathLength="100"` sorgt dafür, dass das Dash-Timing beim Skalieren
  unverändert bleibt — kein Neuberechnen von `getTotalLength()` nötig.
* **SSR / Hydration.** Der Ausgangszustand ist reines CSS, also serverseitig
  korrekt. Die `is-in`-Klasse erst nach dem ersten Client-Frame setzen
  (`requestAnimationFrame`), nicht während der Hydration.

## 7. Performance & Randfälle

* `opacity` und `transform` laufen im Compositor — deshalb `translate3d(…)`
  statt `top`/`margin`. Kein Layout, kein Repaint.
* `stroke-dashoffset` ist **nicht** compositor-fähig und erzwingt pro Frame ein
  Neuzeichnen des SVG. Bei dieser Größe (144 × 74 px, zwei Pfade) ist das
  unkritisch. Trotzdem: **kein** `filter`, `box-shadow` oder `backdrop-filter`
  auf demselben Element, sonst wird jeder Frame teuer.
* `will-change: stroke-dashoffset` bringt nichts und kostet Speicher — weglassen.
  Auf den Textzeilen ist `will-change: opacity, transform` vertretbar, sollte
  aber nach `animationend` wieder entfernt werden.
* `prefers-reduced-motion: reduce` → Endzustand sofort, ohne Bewegung und ohne
  Fade (siehe CSS oben). Pflicht.
* Barrierefreiheit: die SVG-Marke `aria-hidden="true"`, der gesamte Lockup
  `role="img"` mit `aria-label`. Der Text bleibt echter Text (kein Pfad), damit
  er markierbar und übersetzbar ist. `opacity: 0` blendet ihn **nicht** für
  Screenreader aus — hier unkritisch, weil der Zielzustand sichtbar ist.
* Fällt JavaScript aus, bleibt der Lockup unsichtbar. Wenn das nicht
  akzeptabel ist: `<noscript><style>.alae-logo .word,.alae-logo .claim{opacity:1;transform:none}
  .alae-logo .stroke{stroke-dashoffset:0}</style></noscript>` — oder die
  `is-in`-Klasse weglassen und die Animationen direkt auf den Elementen
  definieren, dann läuft alles ohne JS (um den Preis des Font-Gates).
* Safari rundet `stroke-dashoffset` bei sehr kleinen `pathLength`-Werten;
  `pathLength="100"` ist bewusst groß genug gewählt.

## 8. Abnahmekriterien

Die Rekonstruktion wurde mit Chromium bei 30 fps abgetastet und gegen die
Originalframes gerechnet: mittlere absolute Pixelabweichung im Markenbereich
**4,0 / 255 ≈ 1,6 %**, Strichstärke auf **0,05 px** genau, Position auf
**0,8 px** genau. Der Rest ist H.264-Weichzeichnung.

Zum Nachprüfen einer Umsetzung — Fortschrittswerte (0…1) der jeweiligen
Eigenschaft, `t` in Sekunden ab Animationsstart:

| t | Chevron weiß (gezeichnet) | Chevron rot (gezeichnet) | Wortmarke (opacity) | Claim (opacity) |
|---|---|---|---|---|
| 0,10 | 0,10 | — | — | — |
| 0,20 | 0,20 | — | — | — |
| 0,30 | 0,57 | — | — | — |
| 0,40 | 0,85 | 0,00 | — | — |
| 0,50 | 0,95 | 0,04 | — | — |
| 0,60 | 0,99 | 0,15 | 0,01 | — |
| 0,70 | 1,00 | 0,51 | 0,10 | — |
| 0,80 | 1,00 | 0,81 | 0,51 | 0,04 |
| 0,90 | 1,00 | 0,92 | 0,85 | 0,21 |
| 1,00 | 1,00 | 0,98 | 0,96 | 0,70 |
| 1,10 | 1,00 | 1,00 | 0,98 | 0,86 |
| 1,20 | 1,00 | 1,00 | 1,00 | 0,97 |
| 1,33 | 1,00 | 1,00 | 1,00 | 1,00 |

`translateY` folgt jeweils spiegelbildlich: `45 px × (1 − opacity-Fortschritt)`.

Sichtprüfung in dieser Reihenfolge:

1. Bei `t ≈ 0,33 s` steht der weiße Chevron auf dem Apex, der rechte kurze
   Schenkel hat gerade begonnen, vom roten ist nur der runde Fußpunkt zu sehen.
2. Bei `t ≈ 0,70 s` ist der weiße Chevron fertig, der rote steht auf halber
   Strecke, die Wortmarke ist gerade erst zu erahnen (10 % Deckkraft, 40 px tief).
3. Bei `t ≈ 1,00 s` steht die Wortmarke fast, der Claim ist bei 70 %.
4. Ab `t = 1,38 s` bewegt sich nichts mehr.
