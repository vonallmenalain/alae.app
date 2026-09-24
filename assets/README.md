# assets

Code, Schrift, Bilder und Kurzfilme der Website.

## Kurzfilme

**Die Startseite zeigt zurzeit keine Filme** – die Scroll-Geschichte erzählt
die drei Apps selbst. Die Dateien bleiben als Reserve liegen, samt Rezept
unten, falls Filme später wieder dazukommen.

Acht Filme: der Aufmacher und einer je App der früheren Startseite. Zu jedem gehören
vier Dateien – die hohe und die quere Fassung, je mit einem Standbild, das vor
dem ersten Klick zu sehen ist.

| Film | Dateien (`…-hoch` / `…-quer`, je `.mp4` und `-poster.webp`) | Länge | Standbild ab |
| --- | --- | --- | --- |
| **Aufmacher (Hero)** | `intro-…` | 45,3 s | Sekunde 18 |
| Gripszug | `gripszug-…` | 24 s | Sekunde 3 |
| DreamTeam | `dt-…` | 22,5 s | Sekunde 1,5 |
| Jass App | `jass-…` | 23,4 s | Sekunde 4,5 |
| Volleyballturnier | `pvt-…` | 23,5 s | Sekunde 1,5 |
| Fotoverkauf | `foto-…` | 24 s | Sekunde 1,5 |
| Familien-Sharing | `share-…` | 22,6 s | Sekunde 1,5 |
| Einzelfirma | `buchhaltung-…` | 24,6 s | Sekunde 1,5 |

Die hohen Fassungen messen 720 × 1280 px, die queren 1280 × 720 px. Die sieben
Projektfilme liegen bei 0,8 bis 1,2 MB, der Aufmacher bei 1,8 MB – er ist knapp
doppelt so lang und eine Spur feiner kodiert. Jedes Standbild liegt bei 17 bis
41 KB.

### Der Aufmacher im Hero

Er ist der Pitch der ganzen Seite und weicht in zwei Punkten vom Rezept unten
ab:

- **60 Bilder/s statt 30.** Die Aufnahmen kamen mit 60, und der Film ist
  Bewegtgrafik: Text, der einfliegt, Bildschirme, die zur Seite gleiten. Das
  läuft mit 60 sichtbar weicher, und es kostet nur 0,25 MB mehr – bei den
  Projektfilmen gaben die Aufnahmen ohnehin nur 30 her.
- **`-crf 26` statt 27.** Ein Unterschied von rund 0,1 MB, und es ist das erste,
  was jemand von der Seite sieht.

**Das Standbild ist bewusst nicht die Titeltafel.** Der Film beginnt mit
„Web-App für deinen Alltag" und endet mit „Erstgespräch kostenlos und
unverbindlich" – Wort für Wort die Überschrift und die Zeile unter dem Knopf.
Als Standbild wäre das zweimal derselbe Satz. Sekunde 18 zeigt stattdessen eine
App: Der Text verspricht die Idee, das Bild zeigt das Ergebnis. Dass die
Bildmitte dort nicht frei ist, spielt hier keine Rolle – anders als bei den
Karten sitzt die Bedienung nicht mittig, quer sogar unten links (CSS-Block
„Aufmacherfilm").

**Wird der Film ersetzt**, sind Länge und Standbild an zwei Stellen
nachzuführen: der versteckte Satz im Abspielknopf in `index.html` („45
Sekunden, mit Ton") und die Tabelle hier. Und wenn die neue Fassung mit einer
anderen Aussage beginnt als die Überschrift, ist der Grund für das Standbild
aus der Mitte neu zu prüfen.

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
- **Bildrate nicht anfassen.** Ohne `fps`-Filter übernimmt ffmpeg die der
  Aufnahme – 30 bei den Projektfilmen, 60 beim Aufmacher. Herunterrechnen
  spart bei diesen Filmen kaum etwas (0,25 MB bei 45 s) und kostet sichtbar
  Weichheit, weil es Bewegtgrafik ist und keine Kameraaufnahme.
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
| `Alain.png` | Porträt im Kapitel „Über mich" und im FAQ-Gespräch | 630 × 633 px |
| `gripszug.webp` | Illustration der fünf Trainingsbereiche, im Tablet des Kapitels Gripszug | 2000 × 1125 px |
| `og-alae.jpg` | Vorschaubild für Social Media und Messenger | 1200 × 630 px |

Die übrigen Zeichnungen – die Kinder im Fotoverkauf, das Haus im Ablauf, die
Symbole und die Schweizer Karte unter „Über mich", die alte und die neue
Website im Tablet – sind SVG direkt in `index.html`. So bleiben sie scharf,
kosten keine eigene Anfrage, und das Skript kann ihre Teile einzeln bewegen.

### `og-alae.jpg` – das Vorschaubild

Es steht nicht auf der Seite, sondern nur in den `og:`-Angaben im `<head>`. Zu
sehen ist es, wenn jemand die Adresse in einem Chat, einer E-Mail oder einem
Netzwerk teilt.

Es ist die Endtafel des Aufmachers, Sekunde 44,5: Signet, Name und das Angebot,
mittig auf dunklem Grund. Eine Vorschau erscheint als Briefmarke – feine
Schrift und Bildschirmfotos werden darin zu Matsch, ein Signet mit drei Zeilen
bleibt lesbar. 1200 × 630 px ist das Verhältnis 1,905 : 1, etwas breiter als
16 : 9; aus dem queren Film sind darum oben und unten je 36 px weggeschnitten.

```
ffmpeg -ss 44.5 -i roh-quer.mp4 -frames:v 1 \
       -vf "crop=1920:1008:0:36,scale=1200:630:flags=lanczos" \
       -q:v 3 og-alae.jpg
```

**Als JPEG und nicht als WebP**, obwohl die Seite sonst WebP nutzt: Nicht jeder
Dienst, der Vorschauen zieht, zeigt WebP an. Die 23 KB sind ohnehin klein, weil
das Bild fast nur Fläche ist.

**Die Adressen im `<head>` sind absolut** (`https://alae.app/assets/…`).
Relative wertet kein Netzwerk aus – das ist der häufigste Grund, warum eine
Vorschau leer bleibt. Wird die Datei umbenannt, sind `og:image` und
`twitter:image` mit nachzuführen, bei anderen Massen auch `og:image:width` und
`og:image:height`. Freigegeben ist der Zugriff von fremden Diensten über
`Cross-Origin-Resource-Policy` für `/assets/*` in `netlify.toml`.

`dt-top-manager.png` ist der einzige Screenshot, der noch eingebunden ist: Der
Film des DreamTeam zeigt den heutigen Champions-League-Betrieb, die Rangliste
aus der WM 2026 gibt es nur als Bild. Sie steht im Klappbereich „Weitere
Informationen zur App", nicht mehr direkt in der Ansicht.

Beim Austauschen darauf achten, dass `width` und `height` am `<img>` in
`index.html` zur neuen Bildgrösse passen – die beiden Angaben verhindern, dass
die Seite beim Laden springt.

### Nicht mehr eingebunden, bleiben als Reserve liegen

Die Screenshots stammen aus der Zeit vor den Kurzfilmen. Die Dateien bleiben
liegen, falls einmal wieder ein Bild gebraucht wird. `gripszug.webp` dagegen
ist im Einsatz (Tabelle oben): Die Leuchtringe und -rahmen im Kapitel
Gripszug sind in Anteilen dieses Bildes vermessen – wird es ersetzt, sind sie
neu zu setzen.

| Datei | Projekt | Grösse |
| --- | --- | --- |
| `dt-champions-league.webp` | DreamTeam – Teamansicht im Champions-League-Betrieb | 1401 × 1192 px |
| `dt-top-manager.png` | DreamTeam – Rangliste der Top Manager (WM 2026) | 1101 × 831 px |
| `jass-app.png` | Jass App – Startbildschirm mit beiden Betriebsarten | 965 × 375 px |
| `pvt.png` | Volleyballturnier – Dashboard eines Teams | 1084 × 1246 px |
| `foto-app.png` | Fotoverkauf – Galerie einer Familie | 929 × 1211 px |
| `share.png` | Familien-Sharing – Fotobereich mit Bereiche-Menü | 1317 × 1136 px |
| `buchhaltung.png` | Management Einzelfirma – Buchungserfassung und Journal | 1547 × 994 px |

### `dt/` – Spielerfotos und Klubwappen für DreamTeam

| Ordner | Inhalt | Grösse |
| --- | --- | --- |
| `dt/spieler/<Nummer>.webp` | 26 Spielerfotos, 150 × 150 px, weisser Grund | je 3 bis 4 KB |
| `dt/klubs/<Nummer>.webp` | 11 Klubwappen, höchstens 150 × 150 px, durchsichtig | je 4 bis 10 KB |

Zusammen rund 160 KB. Die Nummern sind die von api-football, dieselben wie in
der App (`DT_TEAM`, `DT_ANDERE` und `DT_KLUB` im Skript). Quelle ist
`https://media.api-sports.io/football/players/<Nummer>.png` beziehungsweise
`…/teams/<Nummer>.png`; die PNG sind unverändert gross als WebP gespeichert
(Qualität 86). Das Skript lädt nur, was in `DT_BILDER` steht – **kommt ein
Spieler oder Klub dazu, gehört seine Nummer dorthin**, sonst zeigt seine Karte
die Silhouette. Zu den Rechten siehe README, „Die Scroll-Geschichte".

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

**Die Startseite hält es genauso.** Im Fotoverkauf ist das Kind gezeichnet –
auf allen sechs Fotos dasselbe –, Adresse und Code sind erfunden. DreamTeam
zeigt echte Spieler und Klubs mit Foto und Wappen, wie die App selbst
(`dt/`, siehe unten). Die Manager der Rangliste sind erfunden.

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

## Bibliotheken und Schrift der Startseite

Die Startseite (siehe README, „Die Scroll-Geschichte") braucht als einzige
Seite eine Bibliothek und eine eigene Schrift. Beides liegt hier und wird von
alae.app selbst ausgeliefert, nicht von einem fremden Server. Darum lässt die
Sicherheitsrichtlinie in `netlify.toml` es ohne Änderung zu.

| Datei | Was | Grösse (komprimiert) |
| --- | --- | --- |
| `vendor/gsap.min.js` | GSAP 3.15.0, der Kern | 73 KB (28 KB) |
| `vendor/ScrollTrigger.min.js` | ScrollTrigger 3.15.0: Zeitleiste folgt dem Scrollstand | 45 KB (18 KB) |
| `vendor/CustomEase.min.js` | CustomEase 3.15.0: dieselben Kurven wie im CSS | 7 KB (4 KB) |
| `fonts/caveat-600.woff2` | Caveat SemiBold, Handschrift der Zettel | 17 KB |
| `fonts/OFL-Caveat.txt` | Lizenz der Schrift (SIL Open Font License) | – |

Dazu der eigene Code: `story.css` (109 KB, komprimiert 27 KB), `story.js`
(138 KB, komprimiert 41 KB) und `index.html` selbst (135 KB, komprimiert
36 KB – der grösste Teil sind die Zeichnungen als SVG).

**GSAP** ist seit 2025 samt allen Plugins kostenlos, auch für kommerzielle
Seiten. Die Bedingungen stehen unter <https://gsap.com/standard-license>, der
Hinweis darauf im Kopf jeder Datei; der muss drinbleiben. Die Dateien sind
unverändert aus dem npm-Paket `gsap@3.15.0` (Ordner `dist/`). Zum
Aktualisieren alle drei aus derselben Version nehmen, sonst passen Kern und
Plugins nicht zusammen.

**Caveat** stammt aus dem npm-Paket `@fontsource/caveat@5.3.0`, Datei
`caveat-latin-600-normal.woff2`. Sie ist auf die Zeichen verkleinert, die ein
deutscher Text braucht: 51 → 17 KB, ohne die wechselnden Buchstabenformen
(`calt`). Kommt auf einem Zettel ein neues Sonderzeichen dazu, fällt nur dieses
eine auf eine Ersatzschrift zurück – dann neu zuschneiden:

```
pyftsubset caveat-latin-600-normal.woff2 \
  --unicodes="U+0020-007E,U+00C4,U+00D6,U+00DC,U+00E4,U+00F6,U+00FC,U+00E0,U+00E8,U+00E9,U+00B7,U+2013,U+2019,U+201C,U+201E,U+2026" \
  --flavor=woff2 --layout-features="kern" --output-file=caveat-600.woff2
```
