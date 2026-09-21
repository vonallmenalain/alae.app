# assets

Bilder und Kurzfilme für die Landingpage.

## Kurzfilme

Jede der sieben Projektkarten zeigt einen Kurzfilm aus der App selbst. Zu jedem
Film gehören vier Dateien: die hohe und die quere Fassung, je mit einem
Standbild, das vor dem ersten Klick zu sehen ist.

| Projekt | Dateien (`…-hoch` / `…-quer`, je `.mp4` und `-poster.webp`) | Länge | Standbild ab |
| --- | --- | --- | --- |
| Gripszug | `gripszug-…` | 24 s | Sekunde 3 |
| DreamTeam | `dt-…` | 22,5 s | Sekunde 1,5 |
| Jass App | `jass-…` | 23,4 s | Sekunde 4,5 |
| Volleyballturnier | `pvt-…` | 23,5 s | Sekunde 1,5 |
| Fotoverkauf | `foto-…` | 24 s | Sekunde 1,5 |
| Familien-Sharing | `share-…` | 22,6 s | Sekunde 1,5 |
| Einzelfirma | `buchhaltung-…` | 24,6 s | Sekunde 1,5 |

Die hohen Fassungen messen 720 × 1280 px, die queren 1280 × 720 px; jede liegt
bei 0,8 bis 1,2 MB, jedes Standbild bei 17 bis 41 KB.

**Zwei Fassungen pro Film.** Das Skript wählt nach der Lage des Bildschirms aus:
`data-hoch` für stehende (Handy), `data-quer` für liegende (Computer, gedrehtes
Handy), je mit eigenem Standbild in `data-hoch-poster` beziehungsweise
`data-quer-poster`. Bei allen sieben Filmen liegen beide vor. Fehlt die
Querfassung, läuft die hohe überall. Gewechselt wird beim Laden und beim Drehen,
nie mitten im Abspielen.

**So sind die vorhandenen Dateien entstanden** (Quellen waren je zwei Aufnahmen
desselben Films: 1080 × 1920 und 1920 × 1080, zusammen rund 4 bis 8 MB pro
Fassung):

```
ffmpeg -i roh-hoch.mp4 -vf "scale=720:1280:flags=lanczos" \
       -c:v libx264 -crf 27 -preset slow -profile:v high -level 4.0 -pix_fmt yuv420p \
       -c:a aac -b:a 96k -ar 48000 -movflags +faststart NAME-hoch.mp4

ffmpeg -ss 1.5 -i roh-hoch.mp4 -frames:v 1 -vf "scale=720:1280:flags=lanczos" \
       -c:v libwebp -quality 80 NAME-hoch-poster.webp

ffmpeg -i roh-quer.mp4 -vf "scale=1280:720:flags=lanczos" \
       -c:v libx264 -crf 27 -preset slow -profile:v high -level 4.0 -pix_fmt yuv420p \
       -c:a aac -b:a 96k -ar 48000 -movflags +faststart NAME-quer.mp4

ffmpeg -ss 1.5 -i roh-quer.mp4 -frames:v 1 -vf "scale=1280:720:flags=lanczos" \
       -c:v libwebp -quality 80 NAME-quer-poster.webp
```

Worauf es ankommt:

- **`-movflags +faststart`** schiebt den Index an den Dateianfang. Ohne ihn lädt
  der Browser erst die ganze Datei, bevor das erste Bild kommt.
- **Eine Breite pro Fassung genügt.** Angezeigt wird die hohe höchstens 20 rem
  breit, die quere höchstens rund 1030 px; 720 beziehungsweise 1280 px bleiben
  auch auf feinen Bildschirmen scharf. Die vollen 1080 × 1920 und 1920 × 1080
  kosten ein Mehrfaches an Daten, ohne dass man es sieht.
- **`yuv420p`** ist Pflicht, sonst spielt Safari die Datei nicht ab.
- **`-ar 48000`** rechnet den Ton auf die übliche Abtastrate herunter. Die
  Aufnahmen der sechs neuen Filme kamen mit 96 kHz; das ist unnötig fein und
  nicht überall gern gesehen.
- **Standbild aus dem Film selbst** schneiden. Genau in der Mitte sitzt der
  Play-Knopf, deshalb zählt, was dort liegt. Bei Gripszug trifft die Mitte in
  beiden Fassungen den Himmel über dem Zug – daher Sekunde 3. Die sechs neuen
  Filme sind anders gebaut: Titelzeile, darunter das Gerät, unten eine
  Fusszeile. Quer bleibt die Mitte fast immer leer, hoch fällt sie auf den
  oberen Teil des Bildschirms im Gerät. Gewählt ist darum der Moment, in dem
  die erste Aussage des Films steht und das Gerät vollständig eingeblendet ist
  – Sekunde 1,5. Einzige Ausnahme ist die Jass App: Dort ist das Gerät zu
  diesem Zeitpunkt noch am Aufblenden, deshalb Sekunde 4,5, wo die Mitte auf
  ein leeres Eingabefeld fällt.
- **Ton** bleibt drin, wenn der Film welchen hat. Alle sieben haben Musik.
  Abgespielt wird erst nach einem Klick, nie von selbst.

## Bilder

| Datei | Projekt | Grösse |
| --- | --- | --- |
| `dt-top-manager.png` | DreamTeam – Rangliste der Top Manager (WM 2026) | 1101 × 831 px |
| `Alain.png` | Porträt für den Abschnitt „Motivation" | 630 × 633 px |

`dt-top-manager.png` ist der einzige Screenshot, der noch eingebunden ist: Der
Film des DreamTeam zeigt den heutigen Champions-League-Betrieb, die Rangliste
aus der WM 2026 gibt es nur als Bild.

Beim Austauschen darauf achten, dass `width` und `height` am `<img>` in
`index.html` zur neuen Bildgrösse passen – die beiden Angaben verhindern, dass
die Seite beim Laden springt.

### Nicht mehr eingebunden, bleiben als Reserve liegen

Seit die Kurzfilme da sind, zeigen die Karten keine Screenshots mehr. Die
Dateien bleiben liegen, falls ein Film einmal ersetzt werden muss.

| Datei | Projekt | Grösse |
| --- | --- | --- |
| `gripszug.webp` | Gripszug – Illustration der fünf Trainingsbereiche | 2000 × 1125 px |
| `dt-champions-league.webp` | DreamTeam – Teamansicht im Champions-League-Betrieb | 1401 × 1192 px |
| `jass-app.png` | Jass App – Startbildschirm mit beiden Betriebsarten | 965 × 375 px |
| `pvt.png` | Volleyballturnier – Dashboard eines Teams | 1084 × 1246 px |
| `foto-app.png` | Fotoverkauf – Galerie einer Familie | 929 × 1211 px |
| `share.png` | Familien-Sharing – Fotobereich mit Bereiche-Menü | 1317 × 1136 px |
| `buchhaltung.png` | Management Einzelfirma – Buchungserfassung und Journal | 1547 × 994 px |

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

## Echte Inhalte, unkenntlich gemachte Inhalte

**Die Kurzfilme zeigen durchwegs erfundene Daten** – gezeichnete Bilder statt
Fotos, erfundene Namen, Objekte und Beträge. Bei den drei geschützten Apps ist
das der eigentliche Gewinn gegenüber den früheren Screenshots: Dort musste
unkenntlich gemacht werden, was die Filme gar nicht erst zeigen.

- **Fotoverkauf**: gezeichnete Kinderbilder, `eltern@example.ch` als Adresse.
- **Familien-Sharing**: gezeichnete Ferienbilder, erfundene Namen und Beträge.
- **Einzelfirma**: kein Firmenname, drei erfundene Objekte (Ferienhaus,
  Fotostudio, Schreinerei), erfundene Buchungstexte und Beträge. Die Konten
  stammen aus einem Standardkontenrahmen (1000 Kasse, 3200 Verkaufserlöse und
  so weiter).

Echt sind dagegen die Angaben im Film zum **Volleyballturnier**: Datum, Ort und
Verein stehen so auch in der öffentlich erreichbaren App unter `pvt.alae.app`.

**Wird ein Film ersetzt, ist das erneut zu prüfen.** Ein Mitschnitt aus dem
laufenden Betrieb einer geschützten App gehört nicht auf die Landingpage.

### Die nicht mehr eingebundenen Screenshots

In den drei Dateien, die aus geschützten Apps stammen, ist weiterhin
unkenntlich gemacht:

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
Haben: Das sind Konten aus einem Standardkontenrahmen und lassen keine
Rückschlüsse auf die Firma zu. Ohne sie wäre nicht erkennbar, dass es sich um
eine doppelte Buchhaltung handelt.

Scharf bleiben jeweils die Bedienelemente – bei `share.png` insbesondere das
Menü mit den zuschaltbaren Bereichen, das die App ja gerade auszeichnet.

**Wird eine dieser Dateien wieder eingebunden, muss die Weichzeichnung
weiterhin stimmen.** Für den Fotoverkauf empfiehlt sich zusätzlich eine
schriftliche Freigabe der Fotografin.
