# assets

Bilder und Kurzfilme für die Landingpage.

## Vorhandene Dateien

| Datei | Projekt | Grösse |
| --- | --- | --- |
| `gripszug-hoch.mp4` | Gripszug – Kurzfilm, hohe Fassung | 720 × 1280 px, 24 s |
| `gripszug-hoch-poster.webp` | Standbild dazu (Sekunde 3 des Films) | 720 × 1280 px |
| `gripszug-quer.mp4` | Gripszug – derselbe Kurzfilm, quere Fassung | 1280 × 720 px, 24 s |
| `gripszug-quer-poster.webp` | Standbild dazu (Sekunde 3 des Films) | 1280 × 720 px |
| `gripszug.webp` | Gripszug – Illustration der fünf Trainingsbereiche; seit dem Kurzfilm nicht mehr eingebunden, bleibt als Reserve liegen | 2000 × 1125 px |
| `dt-top-manager.png` | DreamTeam – Rangliste der Top Manager (WM 2026) | 1101 × 831 px |
| `dt-champions-league.webp` | DreamTeam – Teamansicht im heutigen Champions-League-Betrieb | 1401 × 1192 px |
| `jass-app.png` | Jass App – Startbildschirm mit beiden Betriebsarten | 965 × 375 px |
| `pvt.png` | Volleyballturnier – Dashboard eines Teams | 1084 × 1246 px |
| `foto-app.png` | Fotoverkauf – Galerie einer Familie | 929 × 1211 px |
| `share.png` | Familien-Sharing – Fotobereich mit Bereiche-Menü | 1317 × 1136 px |
| `buchhaltung.png` | Management Einzelfirma – Buchungserfassung und Journal | 1547 × 994 px |
| `Alain.png` | Porträt für den Abschnitt „Motivation" | 630 × 633 px |

Beim Austauschen darauf achten, dass `width` und `height` am `<img>` in
`index.html` zur neuen Bildgrösse passen – die beiden Angaben verhindern, dass
die Seite beim Laden springt.

## Kurzfilme

Eine Projektkarte kann statt eines Bildes einen Kurzfilm zeigen (`figure.proj-clip`,
zurzeit nur Gripszug). Dazu gehören immer zwei Dateien: der Film und ein Standbild,
das vor dem ersten Klick zu sehen ist.

**Zwei Fassungen pro Film.** Das Skript wählt nach der Lage des Bildschirms aus:
`data-hoch` für stehende (Handy), `data-quer` für liegende (Computer, gedrehtes
Handy), je mit eigenem Standbild in `data-hoch-poster` beziehungsweise
`data-quer-poster`. Bei Gripszug liegen beide vor. Fehlt die Querfassung, läuft
die hohe überall. Gewechselt wird beim Laden und beim Drehen, nie mitten im
Abspielen.

**So sind die vorhandenen Dateien entstanden** (Quellen waren zwei Aufnahmen
desselben Films: 1080 × 1920 mit rund 9 MB und 1920 × 1080 mit rund 11 MB):

```
ffmpeg -i roh-hoch.mp4 -vf "scale=720:1280:flags=lanczos" \
       -c:v libx264 -crf 27 -preset slow -profile:v high -level 4.0 -pix_fmt yuv420p \
       -c:a aac -b:a 96k -movflags +faststart gripszug-hoch.mp4

ffmpeg -ss 3 -i roh-hoch.mp4 -frames:v 1 -vf "scale=720:1280:flags=lanczos" \
       -c:v libwebp -quality 80 gripszug-hoch-poster.webp

ffmpeg -i roh-quer.mp4 -vf "scale=1280:720:flags=lanczos" \
       -c:v libx264 -crf 27 -preset slow -profile:v high -level 4.0 -pix_fmt yuv420p \
       -c:a aac -b:a 96k -movflags +faststart gripszug-quer.mp4

ffmpeg -ss 3 -i roh-quer.mp4 -frames:v 1 -vf "scale=1280:720:flags=lanczos" \
       -c:v libwebp -quality 80 gripszug-quer-poster.webp
```

Worauf es ankommt:

- **`-movflags +faststart`** schiebt den Index an den Dateianfang. Ohne ihn lädt
  der Browser erst die ganze Datei, bevor das erste Bild kommt.
- **Eine Breite pro Fassung genügt.** Angezeigt wird die hohe höchstens 20 rem
  breit, die quere höchstens rund 1030 px; 720 beziehungsweise 1280 px bleiben
  auch auf feinen Bildschirmen scharf. Die vollen 1080 × 1920 und 1920 × 1080
  kosten ein Mehrfaches an Daten, ohne dass man es sieht: So liegt jede Fassung
  bei rund 1 MB statt bei 9 und 11 MB.
- **`yuv420p`** ist Pflicht, sonst spielt Safari die Datei nicht ab.
- **Standbild aus dem Film selbst** schneiden, und zwar aus einem Bild, dessen
  Mitte frei ist: Genau dort sitzt der Play-Knopf. Bei Gripszug liegt deshalb
  Sekunde 3 zugrunde – in beiden Fassungen fällt die Mitte in den Himmel über
  dem Zug, und der Zug ist da vollständig eingefahren.
- **Ton** bleibt drin, wenn der Film welchen hat. Abgespielt wird erst nach einem
  Klick, nie von selbst.

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
   `jass-app.png` – sind als PNG dagegen gut aufgehoben. `gripszug.webp` liegt
   bereits als WebP vor: 2000 × 1125 px in rund 92 KB, `dt-champions-league.webp`
   1401 × 1192 px in rund 93 KB.

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
