# alae.app – Landingpage

Einseitige Website für alae.app: individuelle Web-Apps, genau nach den
Bedürfnissen der Kundschaft.

Alles steckt in **`index.html`** – kein Build-Schritt, keine externen Schriften
oder Skripte. Datei auf einen Webserver kopieren, fertig. Die einzige
Abhängigkeit in `package.json` gehört nicht zur Seite, sondern zu den beiden
Netlify-Funktionen (Speicher der Besucherstatistik).

## Aufbau der Seite

| Abschnitt | Zweck |
| --- | --- |
| Hero | Nutzenversprechen, ein Handlungsaufruf, der Aufmacherfilm (45 s), vier Vertrauenspunkte |
| Motivation | Wie es angefangen hat, Porträt und vier Fixpunkte |
| Referenzprojekte | Sieben echte Apps als Karussell, eine pro Ansicht – zuoberst Gripszug. Pro App nur der Titel (Name und was sie erreicht), der Kurzfilm, der Link zur App und der Schalter „Weitere Informationen zur App"; dahinter Ausgangslage, Problem, Lösung, Funktionen, Datenschutz, Technik und Ergebnis |
| Ablauf | Vier Schritte vom Erstgespräch bis zur Betreuung |
| Preise | Richtwert für kleine Projekte, Etappenmodell, Wahl nach der Entwicklung |
| FAQ | Unter „Fragen": Preis, Dauer, Quellcode, Datenschutz, Ausfallrisiko, Übernahme |
| Kontakt | Formular über die volle Breite, unter der Frage „Was ist deine Idee?" |

### Der Aufmacherfilm im Hero

Unter Überschrift, Knopf und der Zeile „Erstgespräch kostenlos und
unverbindlich" steht der Film, der die Seite erklärt – 45 s, in zwei Fassungen
wie die Projektfilme: hoch fürs Handy, quer für den Computer. Er läuft nie von
selbst, und vor dem ersten Klick wird kein Byte Film geladen; zu sehen ist ein
Standbild mit einem Knopf „Film ansehen". Länge und Ton stehen nirgends im
Bild – ein Abspielknopf sagt schon, dass da ein Film ist. Für Vorlesegeräte
steht beides im versteckten Satz des Knopfes.

Drei Entscheide, die man beim Ändern kennen sollte:

- **Er steht unter dem Handlungsaufruf, nicht darüber.** Wer gleich reden will,
  findet den Knopf ohne Scrollen; wer Belege will, findet den Film direkt
  darunter.
- **Quer ist die Grösse aus der Fensterhöhe gerechnet** (`46vh`), damit
  Überschrift, Knopf und Film zusammen ins Bild passen. Ein Abspielknopf, den
  man erst herunterscrollen muss, wird nicht gedrückt. Hoch darf der Film
  länger als der erste Bildschirm sein – dort sitzt die Bedienung deshalb
  mittig statt unten.
- **Am Skript hängt hier nichts.** Masse und Standbild kommen aus derselben
  Medienabfrage (`orientation`), nach der auch das Skript die Fassung wählt.
  Der Platz steht also beim ersten Zeichnen, und fällt das Skript aus, steht
  immer noch ein Bild statt eines leeren Kastens.

Es läuft immer nur ein Film: Jeder Abspielknopf hält die anderen sieben an.
Sonst spielten der Aufmacher und eine Projektkarte gegeneinander, sobald
jemand weiterscrollt und dort ebenfalls startet.

Standbild, Länge und die Gründe dafür stehen in `assets/README.md`.

### Karussell der Referenzprojekte

Die Sparte „Apps, die heute im Einsatz sind" zeigt eine App pro Ansicht, damit
der Kurzfilm die Hauptsache ist. Unter dem Film stehen nur zwei Dinge: der Link
zur App (wo es einen gibt) und „Weitere Informationen zur App". Erst dieser
Schalter klappt die Einzelheiten auf – Ausgangslage, Problem, umgesetzte
Lösung, Funktionen, Datenschutz, Technik, was im Kurzfilm zu sehen ist, und das
Ergebnis. Standardmässig ist der Bereich zu.

Geblättert wird mit dem roten Knopf „Nächste App", dem Pfeil zurück, den
Punkten darunter, den Pfeiltasten oder einem Wisch. Technisch ist es waagrechtes
Scrollen mit `scroll-snap` (CSS-Block „Apps im Einsatz"), kein Auf- und
Abblenden von Folien:

- Wischen, Trackpad und Tastatur funktionieren ohne eigenen Code.
- Alle sieben Apps stehen im Quelltext – auch für Suchmaschinen und
  Vorlesegeräte.
- Welche App gerade steht, liest das Skript („App-Karussell") aus der
  Scrollposition. Darum stimmen Zähler und Punkte auch nach einem Wisch.

Beim Wechsel räumt das Skript auf: ein laufender Film hält an, ein offener
Klappbereich geht zu. Standbild und Filmdatei werden erst geladen, wenn eine
Karte in Sicht kommt – sonst lüde die Seite sieben Standbilder für sechs Apps,
die niemand sieht.

Die früheren Abschnitte Ausgangslage, Der Ansatz und Leistungen sind in
„Motivation" aufgegangen (früher „Über mich", Anker `#motivation`). Damit ist
auch die Aufzählung der fünf Dienstleistungen entfallen, unter anderem das
Coaching zu KI-Werkzeugen.

Über jeder Abschnittsüberschrift steht das Signet der Marke – dieselben zwei
Pfade wie in der Kopfzeile, ohne Schriftzug. Es zeichnet sich, sobald der
Abschnitt eingeblendet wird, und wiederholt sich beim Zeigen mit der Maus,
höchstens aber alle drei Sekunden. Beim Wegfahren läuft bewusst nichts mehr.

## Vor der Veröffentlichung anpassen

Alle Stellen sind in `index.html` mit `TODO` markiert:

- [ ] **E-Mail-Adresse** – `kontakt@alae.app` (im Kontaktbereich, im Footer, in der
      Konstante `EMPFAENGER` im Skript und in den strukturierten Daten)
- [x] **Bilder aller sieben Projekte und Porträt** – eingebunden; jede der sieben
      Apps zeigt einen Kurzfilm in beiden Formaten (hoch und quer), beim DreamTeam steht
      im Klappbereich zusätzlich die Rangliste der WM 2026 als Bild. Die Filme zeigen
      erfundene Daten; damit entfällt das Unkenntlichmachen, das die Screenshots der
      drei geschützten Apps nötig machte (Details in `assets/README.md`)
- [ ] **Projekttexte prüfen** – bei allen sieben Apps stammen Ausgangslage und Problem
      von dir, Lösung, Funktionsliste und Ergebnis sind daraus abgeleitet und
      gegenzulesen; bei Gripszug besonders die Funktionsliste
- [ ] **Freigaben einholen** – von der Fotografin für Nennung und Kurzfilm, ebenso
      von der Einzelfirma für den Kurzfilm der Buchhaltung
- [x] **Impressum und Datenschutzerklärung** – als `impressum.html` und
      `datenschutz.html` angelegt, im Footer verlinkt
- [x] **Angaben in den Rechtsseiten** – Name, E-Mail und Website. Adresse,
      Telefonnummer und UID bleiben bewusst weg, siehe Abschnitt „Rechtsseiten"
- [ ] **Rechtsseiten prüfen lassen** – die Texte sind ein Entwurf, keine
      Rechtsberatung
- [x] **Vorschaubild für Social Media** – `assets/og-alae.jpg`, 1200 × 630 px,
      die Endtafel des Aufmacherfilms; `og:image` und `twitter:image` im `<head>`
      sind gesetzt (Einzelheiten in `assets/README.md`)
- [ ] **Richtwert CHF 100 prüfen** – steht im Abschnitt „Preise" und in der FAQ-Antwort
      „Was kostet eine individuelle App?". Bei einer Änderung beide Stellen anpassen

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

Soll das Formular wieder ohne Server auskommen, genügt es, das Attribut
`data-endpoint` am `<form>` zu entfernen.

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
Fusszeile, Signet-Animation der Marke). Die Startseite behält ihr CSS und ihr
Skript inline, damit sie ohne zweite Anfrage auskommt; für die zwei
Unterseiten wäre eine dreifache Kopie unwartbar.
**Wird das Farbschema in `index.html` geändert, müssen die Tokens am Anfang von
`legal.css` mitgeändert werden.**

Beide Seiten sind zusätzlich ohne Dateiendung erreichbar (`/impressum`,
`/datenschutz`) – dafür sorgen Weiterleitungen in `netlify.toml`. Auch
`admin.html` baut auf `legal.css` auf und ergänzt nur `assets/admin.css`.

### Angaben zur Person

Impressum und Datenschutzerklärung nennen **Name, E-Mail und Website** – mehr
nicht. Keine Postadresse, keine Telefonnummer, keine UID: Es besteht kein
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

Die Datenschutzerklärung beschreibt den tatsächlichen Stand der Website: keine
Cookies, keine externen Anfragen, als einziger Browser-Speicher der Eintrag
`alae-theme` für das gewählte Farbschema, als Dienstleister nur Netlify,
Resend, Cloudflare und Google. **Kommt ein weiterer Dienst dazu – etwa
Terminbuchung, Newsletter oder Statistik –, muss die Tabelle in Ziffer 6 ergänzt
und der Abschnitt „Keine Cookies, keine fremden Dienste" überprüft werden.**

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

Die Content-Security-Policy hält fest, dass die Seite nichts von fremden
Servern lädt. **Wird später doch etwas Externes eingebunden** – eine Schrift,
ein Analysewerkzeug, ein eingebettetes Video –, muss es in `netlify.toml`
freigegeben werden, sonst blockiert der Browser es kommentarlos.

## Deployment

Die Seite selbst ist eine statische Datei und funktioniert auf jedem Hosting.
Kontaktformular und Besucherstatistik brauchen dagegen Netlify (Functions, Edge
Functions und Blobs); bei einem Umzug fallen sie ersatzlos weg.

- **Cloudflare Pages** – Repository verbinden, kein Build-Befehl, Ausgabeverzeichnis `/`
- **GitHub Pages** – in den Repository-Einstellungen aktivieren; für die eigene
  Domain eine Datei `CNAME` mit dem Inhalt `alae.app` ergänzen
- **Eigener Server / QNAP** – `index.html` ins Web-Verzeichnis kopieren

Der Schutz oben ist allerdings auf Netlify zugeschnitten: Edge Functions,
Functions und `netlify.toml` gibt es dort. Bei einem Wechsel müsste das
Gegenstück der neuen Plattform eingerichtet werden – sonst steht die Seite
wieder offen.

## Bewegung

Zwei Kurven für die ganze Seite, als Tokens in `:root`:

| Token | Kurve | Wofür |
| --- | --- | --- |
| `--ease-out` | `cubic-bezier(.23, 1, .32, 1)` | alles, was kommt oder geht |
| `--ease-in-out` | `cubic-bezier(.77, 0, .175, 1)` | was bleibt und sich nur verwandelt |

`--ease-out` startet schnell und läuft aus – genau umgekehrt wie die
eingebauten Kurven von CSS, die am Anfang bummeln. Und der Anfang ist der
Moment, auf den man schaut: Dasselbe Bild wirkt mit `--ease-out` schneller als
mit `ease`, bei gleicher Dauer.

Dauer nach Aufgabe: **Druck 80 ms**, Loslassen 200 ms, Hover 160 ms, Klappen
und Menüs 200–300 ms. Über 300 ms gerät Bedienung ins Zähe; länger darf nur,
was erzählt statt bedient – das Einblenden beim Scrollen mit 450 ms.

Vier Regeln, die überall gelten:

- **Jede Bedienung antwortet auf den Druck, nicht auf das Loslassen.** Knöpfe,
  Links, Blätterpfeile, Punkte, Klappschalter und der Abspielknopf gehen beim
  Drücken leicht nach (`scale(.97)`, 80 ms) und kommen gelassen zurück
  (200 ms). Das ist die Asymmetrie echter Tasten. Bei breiten Zeilen wie im
  FAQ übernimmt die Farbe – eine Zeile über die volle Breite zu stauchen sieht
  nach Gummi aus.
- **Bewegung auf Hover nur hinter `@media (hover: hover) and (pointer: fine)`.**
  Auf einem Handy rastet `:hover` nach dem Antippen ein; ohne Gatter bliebe
  ein Knopf angehoben, bis man woanders hintippt. Reine Farbwechsel dürfen
  ungegattert bleiben, ein eingerasteter Farbton fällt niemandem auf.
- **Nur `transform` und `opacity`.** Beides kostet den Browser bloss das
  Zusammensetzen, nicht Layout und Zeichnen. Zwei bewusste Ausnahmen: die
  Breite des aktiven Karussell-Punkts (mit `transform` würden die runden Enden
  verzerren, und es sind sieben winzige Flächen) und die Höhe der
  Klappbereiche – dafür gibt es keinen Weg über die Grafikkarte.
- **Rücksicht heisst sanfter, nicht gar nichts.** Bei
  `prefers-reduced-motion` fällt jede Verschiebung weg, die Blende bleibt; der
  Druck wird kurz abgeblendet statt gestaucht. Ein Knopf ganz ohne Rückmeldung
  wirkt tot.

Die Klappbereiche („Weitere Informationen zur App", FAQ) gehen sanft auf und
zu, wo der Browser es kann: `interpolate-size` und `::details-content` können
von null auf die tatsächliche Höhe animieren. Chrome kann beides, Safari und
Firefox noch nicht – dort klappt es wie bisher. Alles steht in `@supports`,
nichts hängt davon ab.

**Bewusst keine Federn (Springs).** Sie wären für gestenhafte Bewegung das
richtige Werkzeug, brauchen aber eine JS-Bibliothek – und damit fiele „kein
Build-Schritt, keine externen Skripte". Die eine Stelle, wo die Physik wirklich
zählt, löst das Karussell schon mit nativem `scroll-snap`: Es läuft 1:1 am
Finger mit, trägt Impuls und ist jederzeit unterbrechbar.

## Technische Eigenschaften

- Dunkelmodus als Voreinstellung über `data-theme="dark"` am `<html>` jeder der
  drei Seiten; die Systemeinstellung wird bewusst nicht mehr gefolgt. Der Knopf
  rechts neben „Kontakt" schaltet auf hell um und merkt sich die Wahl unter
  `alae-theme` im Local Storage. Gesetzt wird sie von einem kurzen Skript im
  `<head>` – dort und nicht weiter unten, sonst blitzt beim Laden kurz die
  falsche Farbe auf. Dieses Skript steht wortgleich in allen drei Dateien,
  damit die Wahl auch auf den Rechtsseiten gilt. **Kommt weiterer
  Browser-Speicher dazu, muss Ziffer 2 der Datenschutzerklärung ergänzt
  werden**
- Responsiv ab 320 px, keine horizontale Scrollleiste
- Tastaturbedienbar, „Direkt zum Inhalt“-Link, sichtbarer Fokus,
  `prefers-reduced-motion`, `prefers-reduced-transparency`
- Semantisches HTML mit strukturierten Daten (`ProfessionalService`) für Suchmaschinen
- Keine Cookies, keine fremden Analyse- oder Werbedienste, keine externen
  Anfragen – damit auch kein Cookie-Banner nötig. Die eigene Besucherstatistik
  läuft auf dem Server und speichert keine IP-Adressen (siehe unten)
