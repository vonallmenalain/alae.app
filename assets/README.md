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
| `buchhaltung.png` | Management Einzelfirma – Buchungserfassung und Journal | 1547 × 994 px |
| `Alain.png` | Porträt für den Abschnitt „Über mich" | 630 × 633 px |

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

## Unkenntlich gemachte Inhalte

Zwei Screenshots stammen aus geschützten Apps mit echten privaten Inhalten.
Darin sind unkenntlich gemacht:

**`foto-app.png`**

- die sechs Kinderfotos
- die Zeile mit Name des Kindes, Kindergarten und Klasse

**`share.png`**

- alle geteilten Fotos, auf denen Personen zu sehen sind

**`buchhaltung.png`**

- die Objektauswahl im Erfassungsformular (enthielt den Firmennamen)
- die Filterzeile „Zeige Objekte" mit den drei Objektnamen
- im Journal die Spalten Objekt, Text / Bemerkung und Betrag

Bewusst sichtbar geblieben sind dort Buchungsdaten sowie die Spalten Soll und
Haben: Das sind Konten aus einem Standardkontenrahmen (1000 Kasse, 3200
Verkaufserlöse und so weiter) und lassen keine Rückschlüsse auf die Firma zu.
Ohne sie wäre nicht erkennbar, dass es sich um eine doppelte Buchhaltung
handelt.

Scharf bleiben jeweils die Bedienelemente – bei `share.png` insbesondere das
Menü mit den zuschaltbaren Bereichen, das die App ja gerade auszeichnet.

**Wird einer dieser Screenshots ersetzt, muss die Weichzeichnung erneut
angewendet werden.** Sauberer wäre langfristig eine Demo-Ansicht mit
unverfänglichen Bildern und erfundenen Namen. Für den Fotoverkauf empfiehlt
sich zusätzlich eine schriftliche Freigabe der Fotografin.
