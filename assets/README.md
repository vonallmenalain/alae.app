# assets

Bilder für die Landingpage.

## Vorhandene Bilder

| Datei | Projekt | Grösse |
| --- | --- | --- |
| `dt-top-manager.png` | WM 2026 DreamTeam – Rangliste der Top Manager | 1101 × 831 px |
| `jass-app.png` | Jass App – Startbildschirm mit beiden Betriebsarten | 965 × 375 px |

Beim Austauschen darauf achten, dass `width` und `height` am `<img>` in
`index.html` zur neuen Bildgrösse passen – die beiden Angaben verhindern, dass
die Seite beim Laden springt.

## Bilder klein halten

Screenshots werden als PNG schnell unnötig gross. Zwei Stufen:

1. **Verlustfrei**: Screenshots enthalten praktisch nie Transparenz. Wird der
   Alphakanal entfernt (RGBA → RGB) und ein passender Zeilenfilter gewählt,
   schrumpft die Datei deutlich, ohne dass sich ein einziges Pixel ändert.
   Bisher erreicht: `dt-top-manager.png` 714 → 544 KB, `jass-app.png`
   130 → 53 KB.
2. **Bei fotolastigen Bildern deutlich wirksamer**: als **WebP** exportieren
   statt als PNG. Für einen Screenshot wie `dt-top-manager.png` sind damit rund
   100–150 KB realistisch. Danach in `index.html` nur die Dateiendung im `src`
   anpassen. Reine Oberflächen-Screenshots mit flächigen Farben – wie
   `jass-app.png` – sind als PNG dagegen gut aufgehoben.

## Noch offen

Für diese Projekte stehen weiterhin Platzhalter-Rahmen (`.shot-slot`) im HTML:

| Datei | Projekt | Nötig? |
| --- | --- | --- |
| `pvt-*.png` | Volleyballturnier | optional, App ist öffentlich |
| `photographic-*.png` | Fotoverkauf | **ja**, App ist geschützt |
| `share-*.png` | Familien-Sharing | **ja**, App ist geschützt |
| `portrait.jpg` | Über mich | empfohlen |

Bei den geschützten Apps vor der Veröffentlichung private Inhalte unkenntlich
machen oder Demodaten verwenden. Beim Fotoverkauf zusätzlich die Freigabe der
Fotografin einholen und keine erkennbaren Kinder zeigen.
