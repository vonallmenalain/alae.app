# assets

Bilder für die Landingpage.

## Vorhandene Bilder

| Datei | Projekt | Grösse |
| --- | --- | --- |
| `dt-top-manager.png` | WM 2026 DreamTeam – Rangliste der Top Manager | 1101 × 831 px |
| `jass-app.png` | Jass App – Startbildschirm mit beiden Betriebsarten | 965 × 375 px |
| `pvt.png` | Volleyballturnier – Dashboard eines Teams | 1084 × 1246 px |
| `foto-app.png` | Fotoverkauf – Galerie einer Familie | 929 × 1211 px |
| `share.png` | Familien-Sharing – Fotobereich mit Bereiche-Menü | 1317 × 1136 px |

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

| Datei | Projekt | Nötig? |
| --- | --- | --- |
| `portrait.jpg` | Über mich | empfohlen |

## Unkenntlich gemachte Inhalte

Zwei Screenshots stammen aus geschützten Apps mit echten privaten Inhalten.
Darin sind unkenntlich gemacht:

**`foto-app.png`**

- die sechs Kinderfotos
- die Zeile mit Name des Kindes, Kindergarten und Klasse

**`share.png`**

- alle geteilten Fotos, auf denen Personen zu sehen sind

Scharf bleiben jeweils die Bedienelemente – bei `share.png` insbesondere das
Menü mit den zuschaltbaren Bereichen, das die App ja gerade auszeichnet.

**Wird einer dieser Screenshots ersetzt, muss die Weichzeichnung erneut
angewendet werden.** Sauberer wäre langfristig eine Demo-Ansicht mit
unverfänglichen Bildern und erfundenen Namen. Für den Fotoverkauf empfiehlt
sich zusätzlich eine schriftliche Freigabe der Fotografin.
