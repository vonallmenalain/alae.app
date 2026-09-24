# alae.app – Landingpage

Einseitige Website für alae.app: individuelle Web-Apps, genau nach den
Bedürfnissen der Kundschaft.

Die Startseite ist **`index.html`**: eine Geschichte im Vollbild, bei der beim
Scrollen ein Bild ins nächste übergeht, in acht Kapiteln. Die Gestaltung steht
in `assets/story.css`, die Bewegung in `assets/story.js` (eine Funktion pro
Kapitel). Es gibt keinen Build-Schritt: Dateien auf einen Webserver kopieren,
fertig. Ausser dem Google-Tag für Google Ads (siehe „Google Ads" unten) kommt
alles von alae.app selbst, auch die Bibliothek GSAP und die Schrift. Die
einzige Abhängigkeit in `package.json` gehört nicht zur Seite, sondern zu den
Netlify-Funktionen (Speicher der Besucherstatistik).

`story.html` war die Adresse des Entwurfs und leitet jetzt auf die Startseite
weiter, samt Sprungmarke.

## Aufbau der Seite

| Nr. | Kapitel in der Leiste | Abschnitt (`id`) | Was man sieht |
| --- | --- | --- | --- |
| 01 | Massgeschneiderte Software | `software`, erste Hälfte | „Chaos, Zettel, Excel?": ein Knäuel aus Lichtfäden mit sechs Zetteln. Ordnung wandert durchs Knäuel, die Fäden legen sich um die Kacheln eines Dashboards, jeder Zettel landet als Kachel, das Signet erscheint auf Milchglas. Dann dreht sich das Tablet, eine Zahlung kommt herein, vier Hinweise zeigen auf die Stellen im Dashboard |
| 02 | Neuer Webauftritt | `software`, zweite Hälfte (Sprungmarke `webauftritt`) | Das Tablet bleibt. Es lädt die Website einer Schreinerei von 2009 – Lauftext, Besucherzähler, Baustellen-GIF –, die sich Stück für Stück in eine moderne verwandelt. Ein Zeiger schickt darüber eine Offerten-Anfrage ab, und die Website wird zur App: Die Anfrage steht als neuer Auftrag im Dashboard |
| 03 | Referenzprojekte | `projekte`, `dreamteam`, `fotos` | Gripszug: fünf Wagen, fünf Bereiche. DreamTeam: Flug durch ein Feld aus Spielerkarten, elf Stars werden gewählt, stellen sich auf, die Rangliste rechnet live. Fotoverkauf: eine E-Mail mit Anhängen löst sich auf, auf dem Telefon der Weg der Eltern bis zum Download |
| 04 | 4 Schritte zur Web-App | `ablauf` | Links die vier Schritte, rechts ein Haus, das entsteht: Gespräch auf dem Bauplatz, Plan und Offerte, Rohbau mit Kran und Checkliste, das fertige Haus am Abend |
| 05 | Preis | `preise` | Ein Preisschild pendelt sich ein, drei Etappen werden nacheinander verrechnet. Dann die zwei Wege nach dem Go-live: Die App wandert samt Schlüssel und Quellcode in eine Kiste – oder die Dienste kreisen um sie |
| 06 | Über mich | `motivation` | Das Porträt, aus dem die acht Stationen herausfliegen: Studium, Finanzexperte, Controller, Familie, Vibe Coder, Volleyball, Skifahren, Wohnort Oberburg mit Karte der Schweiz |
| 07 | Projekt besprechen | `gespraech`, `kontakt` | Die Fäden vom Anfang legen sich auf das Signet, „Lass uns über deine Idee reden." Direkt darunter das Formular, das sich beim Hineinscrollen aufbaut |
| 08 | FAQ | `faq` | Kein Akkordeon, sondern ein Gespräch mit Alain: Eine Frage antippen, sie erscheint als Nachricht, kurz „tippt …", dann die Antwort |

Die Anker der früheren Startseite (`#top`, `#main`, `#app-gripszug`,
`#app-dreamteam`, `#app-fotoverkauf` und die der entfernten Apps) führen an
die passende Stelle, damit alte Links und Anzeigen nicht ins Leere zeigen.

### Kapitel-Navigation

Statt eines Menüs gibt es eine Leiste mit den acht Kapiteln (Block
„Kapitel-Navigation" in CSS und Skript):

- **Am Computer** ist sie eine schmale Reihe von Strichen am linken Rand. Der
  Strich des aktuellen Kapitels ist länger, in Koralle und so weit gefüllt, wie
  das Kapitel gelesen ist. Fährt man darüber, öffnet sie sich zu einer
  Glasfläche mit Nummern und Titeln. Sie öffnet erst nach 70 ms, damit sie beim
  Vorbeifahren nicht aufspringt, und schliesst 220 ms nach dem Verlassen, damit
  ein kleiner Schlenker sie nicht zuklappt. Mit der Tastatur öffnet sie sich,
  sobald ein Eintrag den Fokus hat.
- **Am Handy und Tablet** (ohne Maus oder schmaler als 60 rem) steht neben dem
  Signet ein dezenter Pfeil. Sein Ring zeigt, wie weit die Seite gelesen ist.
  Ein Tippen klappt die Kapitel unter der Kopfzeile auf; zu gehen sie mit der
  Wahl, einem Tippen daneben, Escape oder sobald man scrollt.
- **Das Springen:** Nahe Ziele (weniger als 1,6 Bildschirmhöhen) fährt die
  Seite direkt an, in 0,5 bis 1,15 s. Weite Ziele liegen hinter einem kurzen
  Schleier mit Nummer und Titel des Kapitels (0,4 s). Dahinter springt die
  Seite, die Zeitleisten rasten ein, statt hinterherzulaufen, und die letzte
  Strecke gleitet sie ins Kapitel hinein, während der Schleier geht (1,1 s).
  So ist man schnell dort und sieht trotzdem, wie das Kapitel beginnt. Wer
  selbst scrollt, übernimmt sofort.
- **Landepunkte** stehen in `LANDUNG` im Skript, als Anteil der Zeitleiste:
  von wo hineingeglitten wird (erst nach dem Überblenden des Hintergrunds,
  sonst schiene das vorige Kapitel durch) und wo das Kapitel steht. Alle
  Sprünge innerhalb der Seite laufen darüber, auch „Projekt besprechen" in der
  Kopfzeile und die Links in den FAQ-Antworten. Die Adresse zeigt danach das
  Kapitel (`#preise`), und wer die Seite mit einer solchen Adresse öffnet,
  landet direkt am Landepunkt.
- Die Leiste funktioniert auch ohne GSAP, dann fährt sie einfach an den Anfang
  des Abschnitts. Ohne Skript ist sie am Computer eine Liste von Links, die
  sich beim Darüberfahren öffnet.

## Die Scroll-Geschichte

Entscheide, die man beim Weiterbauen kennen sollte:

- **Das Scrollen treibt die Geschichte an, übernimmt aber nie.** Jedes Kapitel
  hat eine Zeitleiste von 0 bis 100 (`ordnung`, der Abschnitt `software`, bis
  200, es trägt die Kapitel 01 und 02), die dem Scrollstand folgt, mit 0,9 s
  Nachlauf, damit ein Mausrad nicht ruckt. Rückwärts scrollen spielt
  rückwärts. Es gibt kein Einrasten beim Scrollen und kein automatisches
  Weiterlaufen – nur die Leiste springt.
- **Jedes Kapitel ist eine eigene Sektion mit eigener Bühne**, die per CSS
  klebt (`position: sticky`), nicht über das Pinning von GSAP. Der Browser
  hält sie selbst fest, auch am iPhone, wenn die Adressleiste ein- und
  ausfährt.
- **Überblendung statt Schnitt:** Ab dem zweiten Kapitel rückt jede Sektion
  eine Bildschirmhöhe nach oben und liegt über dem Ende der vorigen. Ihr
  Hintergrund blendet in den ersten 6 % ein, das alte Bild gleitet darunter
  weg. Bis ein Kapitel oben angekommen ist, bleibt seine Bühne ganz
  unsichtbar (`is-da`), sonst schöbe sie sich durchsichtig über das vorige.
  Kontakt, FAQ und Fusszeile sind danach gewöhnliche Abschnitte.
- **Kaum etwas davon ist ein Bild.** Zettel, Tablet, Dashboard, die beiden
  Websites, Preisschild, Kiste und Karten sind HTML und SVG, die Fäden ein
  Canvas. Das bleibt auf jedem Bildschirm scharf, der Text ist echt, und jedes
  Teil kann sich einzeln bewegen. Bilder sind nur die Illustration von
  Gripszug (aus der App), die Spielerfotos und Klubwappen bei DreamTeam, das
  Porträt und die Zeichnungen: die Kinder im Fotoverkauf, das Haus im
  Ablauf, die Symbole und die Schweizer Karte unter „Über mich" – die
  Zeichnungen alle als SVG im HTML. Die KI-Bilder in `Bildvorlagen/` sind
  Stilvorgabe, nicht Inhalt.
- **Die zwei Websites im Tablet** haben feste Stücke, die einander
  entsprechen (`data-m`: Logo, Navigation, Titel, Bild, Text, Knopf, Leistungen,
  Bewertung). Bei der Verwandlung wandert jedes Stück der neuen Seite von der
  Lage und Grösse seines alten Gegenstücks an seinen Platz; das Alte fällt
  darunter weg. Gemessen wird ohne Transformationen (`rel`), deshalb stört die
  Drehung des Tablets nicht.
- **DreamTeam zeigt echte Spieler:** die elf Stars des Teams (ein Torhüter,
  vier Verteidiger, drei Mittelfeldspieler, drei Stürmer), die am Schluss auf
  dem Platz stehen, und rundherum Spieler aus der Liste „Champions League vor
  Start" der DreamTeam-App, mit ihren Klubs (`DT_TEAM`, `DT_ANDERE`, `DT_KLUB`
  im Skript). Die Karten werden auf einem Canvas gezeichnet – vorab als Bilder
  in zwei Auflösungen, pro Bild nur noch nach Tiefe sortiert und
  hingestellt. Das ruckelt und flackert auch am Handy nicht, und keine Karte
  wird am Rand abgeschnitten. Fotos und Wappen kommen von
  `media.api-sports.io`, wie in der App, liegen aber als WebP auf alae.app
  selbst (`assets/dt/`, Einzelheiten in `assets/README.md`) – so braucht es
  keine Änderung an der Sicherheitsrichtlinie, und der Browser fragt keinen
  fremden Server an. Welche vorliegen, steht in `DT_BILDER`; fehlt eines,
  zeichnet die Karte eine Silhouette und ein Kürzel in den Klubfarben.
  **Zu den Rechten:** api-sports liefert Logos und Bilder nach eigener Angabe
  nur zur Identifikation und hat selbst keine Rechte daran; sie liegen bei
  Klubs, Ligen und Fotografen. Die Bilder stehen bewusst trotzdem auf der
  Seite. Kommt eine Beanstandung, genügt es, `DT_BILDER` zu leeren – dann
  zeigen alle Karten wieder Silhouetten und Kürzel.
- **Der Fotoverkauf zeigt überall dasselbe gezeichnete Kind** – als Porträt,
  ganz, beim Spielen weiter weg, auf dem Klassen- und dem Gruppenfoto. Adresse
  und Code sind erfunden (`eltern@example.ch`), wie im Kurzfilm der App.
- **Das Dashboard hat eine feste Auflösung:** quer 1180 px, hoch 820 px,
  1em = 10 px. Die Schrift folgt über `cqw` der Breite des Bildschirms im
  Gerät. Das Dashboard wächst und schrumpft also als Ganzes wie ein echter
  Bildschirm und bricht nie um. Dasselbe gilt für die zwei Websites und die
  App im Telefon des Fotoverkaufs. Die Zahlen sind erfunden, passen aber
  zueinander (September = August × 1,12), Datum und Monate kommen aus der Uhr
  des Besuchers.
- **Der Anfangszustand steht im CSS, nicht im Skript.** GSAP setzt beim
  Neuberechnen (andere Fenstergrösse) seine Werte zurück, und ein gestaffeltes
  `fromTo` bringt seinen Anfang danach erst wieder, wenn es an der Reihe ist.
  Stünde der Anfang nur im Skript, tauchten Texte und Teile späterer Szenen
  kurz auf.
- **Die Fäden sind auf grossen Bildschirmen gedeckelt.** Die Zeichenfläche
  bekommt höchstens 2,2 Millionen Bildpunkte, das Leuchten wird auf einer
  Fläche in Viertelgrösse gemalt und vom Browser weich hochgerechnet. An einem
  4K-Bildschirm sind das rund 2,4 statt 8,3 Megapixel pro Bild. Braucht ein
  Bild trotzdem im Mittel über 24 ms, zeichnen die Fäden in zwei Stufen mit
  weniger Bildpunkten.
- **Das Signet wächst aus den Fäden** („Projekt besprechen"): Am Ende liegen
  die Fäden genau auf der Mittellinie der zwei Winkel. Dort erscheint das
  Signet so dünn wie ein Faden und wird dicker, während die Fäden darin
  aufgehen – es gibt keinen Moment, in dem das eine verschwindet und das
  andere auftaucht.
- **Das Formular** baut sich beim Hineinscrollen auf: Der Rahmen zeichnet
  sich, die Felder steigen nacheinander auf. Gesendet wird wie bisher (siehe
  „Kontaktformular"), auch ohne GSAP.
- **Das FAQ-Gespräch** entsteht aus der Liste im HTML (`dl.fq-liste`), die
  auch ohne Skript dasteht und für Suchmaschinen lesbar bleibt. Die erste
  Frage stellt sich von selbst, sobald das Fenster im Bild ist.
- **Weniger Bewegung** (`prefers-reduced-motion`): stehende Bilder, die
  ineinander überblenden. Nichts fliegt, nichts dreht sich, die Fäden bleiben
  still; die Leiste springt ohne Gleiten, nur mit dem Schleier.
- **Ohne Skript oder ohne GSAP** steht eine ruhige Seite da: jedes Kapitel mit
  Text und Endbild untereinander – das eingeschaltete Tablet, die drei Apps,
  alle vier Schritte offen mit dem fertigen Haus, Preisschild und Etappen, die
  Stationen als Karten, die Einladung, das Formular und die Fragen als Liste.

Die Bibliothek ist **GSAP 3.15** (`gsap`, `ScrollTrigger`, `CustomEase`) in
`assets/vendor/`, die Handschrift der Zettel **Caveat** in `assets/fonts/`
(Einzelheiten in `assets/README.md`). Beides kommt von alae.app selbst. Darum
braucht es keine Änderung an der Sicherheitsrichtlinie in `netlify.toml`.

Stellschrauben:

- **Tempo:** `--len` an jedem Kapitel ist sein Scrollweg in vh (`software`
  940, `projekte` 300, `dreamteam` 480, `fotos` 420, `ablauf` 400, `preise`
  380, `motivation` 380, `gespraech` 260). Mehr heisst langsamer, die Abfolge
  bleibt dieselbe. Wer ihn ändert, prüft die Landepunkte in `LANDUNG`.
- **Abfolge:** Der Zeitplan steht als Tabelle über jeder `buildMotion` im
  Skript. Wer in `ordnung` Zahlen ändert, prüft auch `TILE_DELAY` (die Zettel
  landen erst, wenn ihr Rahmen steht) und die Sprungmarke `.anker` im CSS.
- **Texte:** direkt im HTML. Spieler und Klubs von DreamTeam stehen im Skript,
  weil es die Karten zeichnet.

## Vor der Veröffentlichung anpassen

- [ ] **E-Mail-Adresse** – `kontakt@alae.app` (im Kontaktbereich, in der
      Fusszeile, in der Einladung „Projekt besprechen", in der Konstante
      `EMPFAENGER` in `assets/story.js` und in den strukturierten Daten am Ende
      von `index.html`)
- [ ] **Texte gegenlesen** – alle acht Kapitel, besonders die neuen: Neuer
      Webauftritt, die vier Schritte, Preis, die Stationen unter „Über mich"
      und die Antworten im FAQ-Gespräch
- [ ] **DreamTeam-Bilder** – die Karten zeigen echte Spielerfotos und
      Klubwappen von api-sports (siehe „Die Scroll-Geschichte"). Bei der
      rechtlichen Prüfung mit abklären
- [x] **Impressum und Datenschutzerklärung** – als `impressum.html` und
      `datenschutz.html` angelegt, in der Fusszeile verlinkt
- [x] **Angaben in den Rechtsseiten** – Name, E-Mail und Website. Adresse,
      Telefonnummer und UID bleiben bewusst weg, siehe Abschnitt „Rechtsseiten"
- [ ] **Rechtsseiten prüfen lassen** – die Texte sind ein Entwurf, keine
      Rechtsberatung. Den Knopf für die helle Darstellung gibt es auf der neuen
      Startseite nicht mehr; der Absatz zu `alae-theme` in Ziffer 2 der
      Datenschutzerklärung beschreibt damit etwas, das nicht mehr entstehen kann
- [x] **Vorschaubild für Social Media** – `assets/og-alae.jpg`, 1200 × 630 px;
      `og:image` und `twitter:image` im `<head>` sind gesetzt (Einzelheiten in
      `assets/README.md`)
- [ ] **Richtwert CHF 100 prüfen** – steht im Kapitel „Preis" (Preisschild) und
      in der FAQ-Antwort „Was kostet eine individuelle App?". Bei einer Änderung
      beide Stellen anpassen

## Kontaktformular

Das Formular sendet an `/api/kontakt`. Dahinter steht die Netlify-Funktion
`netlify/functions/kontakt.mjs`, die die Anfrage über **Resend** als E-Mail
weiterleitet – mit `reply_to` auf die anfragende Person, damit „Antworten"
direkt funktioniert.

Nötig ist eine Umgebungsvariable in Netlify:

| Variable | Pflicht | Bedeutung |
| --- | --- | --- |
| `RESEND_API_KEY` | ja | API-Schlüssel aus dem Resend-Dashboard |
| `KONTAKT_EMPFAENGER` | nein | Zieladresse, Standard `vonallmenalain@gmail.com` |
| `KONTAKT_ABSENDER` | nein | Absender, Standard `formular@alae.app`, Domain muss in Resend verifiziert sein |

Der Schlüssel darf **nie** in `index.html` stehen – dort wäre er für jeden
Besucher lesbar. Genau deshalb der Umweg über die Funktion.

Schlägt der Versand fehl, öffnet sich als Rückfall das E-Mail-Programm, damit
keine Anfrage verloren geht. Ein verstecktes Feld (`website`) dient als
Spam-Falle: Ist es ausgefüllt, verwirft die Funktion die Anfrage stillschweigend.

Eine Einwilligungs-Checkbox gibt es nicht. Über dem Absende-Knopf steht
stattdessen ein Hinweis mit Link auf Ziffer 4 der Datenschutzerklärung (Anker
`#kontaktformular`); als Rechtsgrundlage nennt sie dort die Anbahnung eines
Vertrags und das berechtigte Interesse. Kommt eine Checkbox zurück, muss
Ziffer 4 mit. Die Funktion liest nur die bekannten Felder – zusätzliche, etwa
ein `einverstanden` aus einer älteren Fassung der Seite, ignoriert sie, statt
die Anfrage abzulehnen.

Soll das Formular wieder ohne Server auskommen, genügt es, das Attribut
`data-endpoint` am `<form>` zu entfernen.

Der Versand steht in `assets/story.js` unter „Kontaktformular" und läuft vor
der Prüfung auf GSAP – das Formular sendet also auch, wenn die Bibliothek
nicht ankommt.

## Adminbereich: Besucherstatistik

Unter **`/admin`** liegt eine geschützte Auswertung der Zugriffe: Anfragen pro
Tag, Herkunftsländer, häufigste Seiten, verweisende Seiten, Browser und Robots –
und eine eigene Spalte für auffällige Anfragen, also das automatische Absuchen
nach WordPress-Pfaden, `.env`-Dateien und ähnlichem. Die Seite ist nirgends
verlinkt, trägt `noindex` und zeigt ohne Passwort nichts an.

Drei Teile arbeiten zusammen:

| Datei | Aufgabe |
| --- | --- |
| `netlify/edge-functions/besucher.js` | Erfasst jede Anfrage am Rand des Netzes, noch bevor die statische Datei ausgeliefert wird |
| `netlify/functions/statistik.mjs` | Verdichtet die Einträge zu Tageswerten und gibt sie unter `/api/statistik` aus – nur mit Passwort |
| `admin.html` mit `assets/admin.css` und `assets/admin.js` | Stellt die Zahlen dar |

**Was die Statistik nicht enthält:** Aufrufe von `www.alae.app`. Netlify leitet
die Nebendomain mit einer 301 auf `alae.app` um, und zwar auf Domain-Ebene –
bevor Edge Functions überhaupt starten. Wer der Umleitung folgt, wird als
zweite Anfrage gezählt; wer sie ignoriert, taucht nirgends auf. Automatische
Scanner tun meist Letzteres, der tatsächliche Scanner-Anteil liegt also höher
als die Zahlen zeigen. Abstellen liesse sich das nur, indem man die
www-Umleitung aufgibt – und die ist erwünscht.

Im Netlify-Log sind diese Umleitungen an drei Dingen erkennbar: Status 301
(blau, kein Fehler), eine Dauer unter einer Millisekunde und ein leeres Feld
unter „Primitives“. Mit dem Schalter **Full** statt **Shortened** über der
Liste wird der vollständige Host sichtbar.

Die Erfassung läuft bewusst am Rand und nicht im Browser: Ein Skript in der
Seite würde genau die Zugriffe verpassen, um die es geht – Robots und Scanner
führen kein JavaScript aus.

**Nötige Umgebungsvariablen in Netlify:**

| Variable | Pflicht | Bedeutung |
| --- | --- | --- |
| `ADMIN_PASSWORT` | ja | Zugang zu `/admin`. Ohne diese Variable bleibt der Bereich gesperrt. Lang und zufällig wählen |
| `STATISTIK_SALZ` | empfohlen | Geheimer Zusatz für die Tageskennung. Ohne ihn liesse sich theoretisch ausprobieren, welche IP-Adresse hinter einer Kennung steckt |
| `STATISTIK_AUFBEWAHRUNG_TAGE` | nein | Standard 90. Ältere Tageswerte werden gelöscht |
| `STATISTIK_AUS` | nein | `1` schaltet die Erfassung ab |

Die Einrichtung Schritt für Schritt steht in
[`docs/adminbereich-einrichten.md`](docs/adminbereich-einrichten.md).

**Was gespeichert wird – und was nicht:** Keine IP-Adresse. Statt ihrer eine
Tageskennung (SHA-256 aus Salz, Adresse und Datum, gekürzt) und der grobe
Adressbereich, bei IPv4 nur die ersten zwei Blöcke. Einzelne Anfragen werden
spätestens nach zwei Tagen zu Tagessummen verdichtet und dabei gelöscht.
Gespeichert wird alles in Netlify Blobs, also im selben Projekt – es verlässt
kein Datensatz das Hosting. **Ziffer 3 der Datenschutzerklärung beschreibt
genau das; wird an der Erfassung etwas geändert, muss sie mitgeändert werden.**

## E-Mail-Adresse kontakt@alae.app

Empfang und Versand sind zwei getrennte Dinge:

- **Empfangen** übernimmt Cloudflare Email Routing (kostenlos): Es leitet
  Nachrichten an `kontakt@alae.app` an das private Postfach weiter.
- **Versenden** übernimmt Resend – für das Kontaktformular über die Funktion
  oben, und für Antworten aus Gmail über Resends SMTP-Zugang.

Die Einrichtung Schritt für Schritt steht in
[`docs/email-kontakt-einrichten.md`](docs/email-kontakt-einrichten.md) – mit
Reihenfolge, den nötigen DNS-Einträgen, den SMTP-Daten für Gmail und einer
Test-Checkliste.

## Rechtsseiten

`impressum.html` und `datenschutz.html` teilen sich das Stylesheet
`assets/legal.css` und das Skript `assets/legal.js` (Jahreszahl in der
Fusszeile, Signet-Animation der Marke). Die Startseite hat ihr eigenes
Stylesheet (`assets/story.css`) und kennt nur den dunklen Modus; die
Rechtsseiten behalten ihr Schema mit heller und dunkler Fassung.

Beide Seiten sind zusätzlich ohne Dateiendung erreichbar (`/impressum`,
`/datenschutz`) – dafür sorgen Weiterleitungen in `netlify.toml`. Auch
`admin.html` baut auf `legal.css` auf und ergänzt nur `assets/admin.css`.

### Angaben zur Person

Impressum und Datenschutzerklärung nennen **Name, E-Mail und Website**, das
Impressum zusätzlich die Rechtsform (Einzelunternehmen, nicht im
Handelsregister eingetragen) – mehr nicht. Keine Postadresse, keine
Telefonnummer, keine UID: Es besteht kein
Eintrag im Handelsregister, und der Kontakt läuft ausschliesslich über
`kontakt@alae.app`.

Die Angaben stehen in beiden Dateien; **wird eine geändert, muss die andere
mitgeändert werden.** Kommt später eine Adresse dazu, gehört sie in die
`dl.angaben` beider Seiten und in die strukturierten Daten am Ende von
`index.html`.

Für Schweizer Websites, die Leistungen im elektronischen Geschäftsverkehr
anbieten, verlangt Art. 3 Abs. 1 lit. s UWG neben der Identität auch eine
Postadresse. Ob eine reine Informationsseite ohne Bestellmöglichkeit darunter
fällt, ist umstritten. Das gehört zu den Punkten, die eine juristische Prüfung
der Rechtsseiten klären sollte.

Die Datenschutzerklärung beschreibt den tatsächlichen Stand der Website:
Cookies und externe Anfragen nur über den Google-Tag auf der Startseite
(Ziffer 7), als eigener Browser-Speicher nur der Eintrag `alae-theme` für das
gewählte Farbschema, als Dienstleister Netlify, Resend, Cloudflare und Google.
**Kommt ein weiterer Dienst dazu – etwa Terminbuchung, Newsletter oder
Statistik –, muss die Tabelle in Ziffer 6 ergänzt und Ziffer 2 „Cookies und
fremde Dienste" überprüft werden.**

## Google Ads

Ganz oben im `<head>` von `index.html`, direkt nach `<meta charset>`, steht
der Google-Tag (`AW-18354022652`) – Googles Code, ergänzt um Standardwerte
für den Consent Mode v2. Einen Einwilligungsdialog gibt es bewusst nicht; die
Standardwerte gelten also dauerhaft:

| Herkunft des Besuchs | `ad_storage` | `ad_user_data` | `ad_personalization` | `analytics_storage` |
| --- | --- | --- | --- | --- |
| EWR und Vereinigtes Königreich | verweigert | verweigert | verweigert | verweigert |
| alle übrigen Länder, auch die Schweiz | erlaubt | erlaubt | verweigert | verweigert |

Dazu kommen `ads_data_redaction` (wo keine Cookies erlaubt sind, werden
Klick-Kennungen geschwärzt) und `allow_ad_personalization_signals: false` im
`config`. Gemessen werden damit nur Conversions: Remarketing ist
ausgeschaltet, und bei Besuchen aus dem EWR und dem Vereinigten Königreich
setzt der Tag keine Cookies.

- **Reihenfolge.** Beide `consent default` stehen vor `js` und `config`, der
  ganze Block zudem vor dem Laden von gtag.js – anders als in Googles
  Vorlage, damit die Werte gelten, bevor der Tag etwas sendet. Der Aufruf mit
  `region` hat für diese Länder Vorrang vor dem allgemeinen; die beiden nicht
  zusammenführen.
- **Prüfen.** In den Entwicklerwerkzeugen unter „Netzwerk" tragen die
  Anfragen an Google den Parameter `gcs`: aus der Schweiz `G110` (Anzeigen
  erlaubt, Analyse verweigert), aus dem EWR `G100` – dann auch ohne Cookie
  `_gcl_au`.

Drei Dinge hängen am Tag:

- **Conversion „Anfrage"** – gemeldet im Submit-Handler des Kontaktformulars
  (`assets/story.js`), erst nach erfolgreichem Versand und nicht bei
  ausgefüllter Spam-Falle. Das
  Label `AW-18354022652/ZHNoCLvCuoEdEPzR8K9E` gehört zur Conversion-Aktion mit
  Auswahl „Seitenaufbau". Bewusst nicht als Code im `<head>`, wie Google es
  vorschlägt: Das ist für eine eigene Danke-Seite gedacht, hier zählte sonst
  jeder Seitenaufruf als Anfrage.
- **Content-Security-Policy** in `netlify.toml` – ohne die Google-Adressen dort
  blockiert der Browser das Skript kommentarlos.
- **Datenschutzerklärung** – Ziffer 7 beschreibt, was der Tag tut; die
  Kurzfassung und Ziffer 2 nennen die Consent-Werte (kein Remarketing, keine
  Cookies aus dem EWR und dem Vereinigten Königreich). Werden die
  Standardwerte geändert, müssen diese Stellen mit.

Wird der Tag entfernt, alle drei Stellen mitziehen. `<meta charset>` muss in
den ersten 1024 Bytes der Datei bleiben und steht deshalb vor dem Tag; über
ihm kommt nichts dazu.

## Schutz vor automatisierten Anfragen

Auf die Seite laufen laufend Anfragen von Programmen, die reihum bekannte
Sicherheitslücken abklopfen – WordPress, PHP, `.env`, `.git`. Nichts davon
gibt es hier, aber jede Anfrage kostet Rechenzeit und verstopft die Logs.
Dagegen stehen drei Dinge, alle auf Netlify und ohne Zutun im Browser:

| Massnahme | Wo | Wirkung |
| --- | --- | --- |
| Scanner-Pfade sperren | `netlify/edge-functions/schutz.js` | Typische Suchpfade bekommen sofort 404, die Seite wird gar nicht erst geladen |
| Nur Lesen erlauben | dieselbe Datei | `POST`, `PUT` und Ähnliches gehen nur ans Kontaktformular, sonst 405 |
| Tempolimit | `config.rateLimit` in derselben Datei | 120 Seitenaufrufe pro Minute und Besucher, darüber antwortet Netlify mit 429 |
| Tempolimit Formular | `netlify/functions/kontakt.mjs` | 5 Absendeversuche pro Minute und Besucher |
| Sicherheits-Kopfzeilen | `netlify.toml` | Content-Security-Policy, HSTS und Verwandte |

Gesperrt wird nach Verhalten, nicht nach Herkunft: Es gibt keine Länder- oder
IP-Sperre, ein normaler Besucher merkt von alldem nichts. Die Liste der
Scanner-Muster steht oben in `schutz.js` und ist bewusst eng gefasst – lieber
ein Scanner zu wenig gesperrt als eine echte Seite.

Abgewiesene Anfragen schreiben eine Zeile mit Methode, Pfad und Land ins
Netlify-Log. Absichtlich ohne IP-Adresse: Für die Auswertung reicht das, und
personenbezogen wird es so gar nicht erst.

Abgewiesene Anfragen erscheinen ausserdem in der Besucherstatistik unter
`/admin`, als „auffällig" gezählt. Das hängt an der Reihenfolge: Netlify führt
Edge Functions, die ihren Pfad in der eigenen Datei festlegen, alphabetisch
nach Dateinamen aus, also `besucher.js` vor `schutz.js`. **Wird eine der beiden
Dateien umbenannt, muss die Reihenfolge in `netlify.toml` unter
`[[edge_functions]]` festgelegt werden** – sonst fehlen in der Statistik
ausgerechnet die Anfragen, wegen denen sie gebaut wurde.

Die Content-Security-Policy hält fest, dass die Seite ausser dem Google-Tag
nichts von fremden Servern lädt; die Google-Adressen stehen einzeln in
`netlify.toml`. **Wird später weiteres Externes eingebunden** – eine Schrift,
ein Analysewerkzeug, ein eingebettetes Video –, muss es in `netlify.toml`
freigegeben werden, sonst blockiert der Browser es kommentarlos.

## Deployment

Die Seite selbst ist eine statische Datei und funktioniert auf jedem Hosting.
Kontaktformular und Besucherstatistik brauchen dagegen Netlify (Functions, Edge
Functions und Blobs); bei einem Umzug fallen sie ersatzlos weg.

- **Cloudflare Pages** – Repository verbinden, kein Build-Befehl, Ausgabeverzeichnis `/`
- **GitHub Pages** – in den Repository-Einstellungen aktivieren; für die eigene
  Domain eine Datei `CNAME` mit dem Inhalt `alae.app` ergänzen
- **Eigener Server / QNAP** – `index.html`, die Rechtsseiten und den Ordner
  `assets/` ins Web-Verzeichnis kopieren

Der Schutz oben ist allerdings auf Netlify zugeschnitten: Edge Functions,
Functions und `netlify.toml` gibt es dort. Bei einem Wechsel müsste das
Gegenstück der neuen Plattform eingerichtet werden – sonst steht die Seite
wieder offen.

## Bewegung

Zwei Kurven für die ganze Seite, als Tokens in `:root` und gleichlautend als
`CustomEase` im Skript:

| Token | Kurve | Wofür |
| --- | --- | --- |
| `--ease-out` / `aOut` | `cubic-bezier(.23, 1, .32, 1)` | alles, was kommt oder geht |
| `--ease-in-out` / `aInOut` | `cubic-bezier(.77, 0, .175, 1)` | was bleibt und sich nur verwandelt |

Dazu `aLogo` (`.65, 0, .15, 1`) für das Zeichnen des Signets, wie im
Logo-Intro. `--ease-out` startet schnell und läuft aus – genau umgekehrt wie
die eingebauten Kurven von CSS, die am Anfang bummeln. Und der Anfang ist der
Moment, auf den man schaut.

Regeln, die überall gelten:

- **Was erzählt, hängt am Scrollen; was bedient, an der Uhr.** Die Kapitel
  folgen dem Scrollstand. Knöpfe, die Leiste, der Schleier, das Formular und
  das FAQ-Gespräch laufen mit festen Dauern: Druck 80 ms, Hover 160 ms,
  Klappen und Menüs 200–300 ms.
- **Jede Bedienung antwortet auf den Druck, nicht auf das Loslassen.** Knöpfe
  gehen beim Drücken leicht nach (`scale(.97)`, 80 ms) und kommen gelassen
  zurück.
- **Bewegung auf Hover nur hinter `@media (hover: hover) and (pointer: fine)`.**
  Auf einem Handy rastet `:hover` nach dem Antippen ein. Deshalb gibt es die
  aufklappende Leiste auch nur dort; Handy und Tablet bekommen den Pfeil.
- **Möglichst nur `transform` und `opacity`.** Beides kostet den Browser bloss
  das Zusammensetzen. Die grossen Flächen (Fäden, DreamTeam) sind Canvas, die
  Zettel eigene Ebenen.
- **Rücksicht heisst sanfter, nicht gar nichts.** Bei
  `prefers-reduced-motion` fällt jede Verschiebung weg, die Blende bleibt.

## Technische Eigenschaften

- Die Startseite ist immer dunkel. Die Rechtsseiten sind es als Voreinstellung
  über `data-theme="dark"` und lesen eine früher gespeicherte Wahl
  (`alae-theme` im Local Storage) weiterhin. Die Startseite selbst speichert
  nichts im Browser. **Kommt Browser-Speicher dazu, muss Ziffer 2 der
  Datenschutzerklärung ergänzt werden**
- Responsiv ab 320 px, keine horizontale Scrollleiste; hoch und quer haben je
  eigene Zeitleisten, beim Drehen baut sich alles neu auf
- Tastaturbedienbar, „Direkt zum Kontakt"-Link, sichtbarer Fokus,
  `prefers-reduced-motion`, `prefers-reduced-transparency`
- Semantisches HTML mit strukturierten Daten (`ProfessionalService`) für Suchmaschinen
- Einziger fremder Dienst ist der Google-Tag für Google Ads auf der
  Startseite (Cookies, Anfragen an Google, siehe „Google Ads"). Sonst keine
  Cookies, keine externen Anfragen. Die eigene Besucherstatistik
  läuft auf dem Server und speichert keine IP-Adressen (siehe unten)
