# assets

Bilder für die Landingpage.

## dt-top-manager.png

Screenshot der Top-Manager-Rangliste aus dem WM 2026 DreamTeam, 1101 × 831 px.

Beim Austauschen darauf achten, dass `width` und `height` am `<img>` in
`index.html` zur neuen Bildgrösse passen – die beiden Angaben verhindern, dass
die Seite beim Laden springt.

### Bilder klein halten

Screenshots mit Fotos werden als PNG schnell gross. Zwei Stufen:

1. **Verlustfrei**: Screenshots enthalten praktisch nie Transparenz. Wird der
   Alphakanal entfernt (RGBA → RGB), schrumpft die Datei deutlich, ohne dass
   sich ein einziges Pixel ändert. Für dieses Bild: 714 KB → 544 KB.
2. **Deutlich wirksamer**: als **WebP** exportieren statt als PNG. Für
   fotolastige Screenshots sind damit rund 100–150 KB realistisch. Danach in
   `index.html` nur die Dateiendung im `src` anpassen.

## Noch offen

Screenshots für die übrigen Projekte, dort stehen weiterhin
Platzhalter-Rahmen (`.shot-slot`) im HTML:

| Datei | Projekt | Nötig? |
| --- | --- | --- |
| `jass-*.png` | Jass App | optional, App ist öffentlich |
| `pvt-*.png` | Volleyballturnier | optional, App ist öffentlich |
| `photographic-*.png` | Fotoverkauf | **ja**, App ist geschützt |
| `share-*.png` | Familien-Sharing | **ja**, App ist geschützt |
| `portrait.jpg` | Über mich | empfohlen |

Bei den geschützten Apps vor der Veröffentlichung private Inhalte unkenntlich
machen oder Demodaten verwenden. Beim Fotoverkauf zusätzlich die Freigabe der
Fotografin einholen und keine erkennbaren Kinder zeigen.
