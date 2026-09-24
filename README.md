# alae.app – Landingpage

Einseitige Website für alae.app: individuelle Web-Apps, genau nach den
Bedürfnissen der Kundschaft.

Alles steckt in **`index.html`** – kein Build-Schritt, keine externen Schriften
oder Skripte ausser dem Google-Tag für Google Ads (siehe „Google Ads" unten). Datei auf einen Webserver kopieren, fertig. Die einzige
Abhängigkeit in `package.json` gehört nicht zur Seite, sondern zu den beiden
Netlify-Funktionen (Speicher der Besucherstatistik).

Der Entwurf der neuen Startseite, eine Scroll-Story im Vollbild, steht
getrennt davon in `story.html` (siehe „Story (Prototyp)").

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

## Story (Prototyp)

`story.html` ist der Entwurf für die neue Startseite: eine Geschichte im
Vollbild, bei der beim Scrollen ein Bild ins nächste übergeht. Gebaut sind alle
sieben Szenen in sechs Kapiteln. Die Seite ist nirgends verlinkt, trägt
`noindex` und hat keinen Google-Tag – sie ist zum Anschauen da, nicht für
Anzeigen. `index.html` bleibt unverändert, bis die Story eingebaut wird; dann
kommen Ablauf, Preise, FAQ und Kontakt im selben Stil dazu.

| Szene | Kapitel (`id`) | Text | Bild |
| --- | --- | --- | --- |
| 1 | `ordnung` | „Chaos, Zettel, Excel?" | Ein Knäuel aus Lichtfäden, darin sechs Zettel: Haftnotizen, eine Excel-Tabelle mit `#BEZUG!`, ein Ausdruck mit Kaffeerand |
| 2 | `ordnung` | „Massgeschneiderte Software statt Excel-Chaos" | Ordnung wandert von rechts durchs Knäuel, die Fäden legen sich um die Kacheln eines Dashboards. Jeder Zettel landet als Kachel, der Bildschirm geht an, das Logo erscheint auf Milchglas |
| 3 | `ordnung` | „Exakt passend für deine Bedürfnisse" | Das Tablet dreht sich, eine Zahlung kommt herein, vier Hinweise zeigen auf die Stellen im Dashboard |
| 4 | `ordnung` | „Was sich für dich ändert" | Vier Schalter springen auf „ON", jeder räumt etwas weg: Fehlerzellen, Zettel, eine 0 wird zu 100 %, zuletzt erscheint die Schweizer Flagge |
| 5 | `vergleich` | „Mehr ist nicht immer besser." | Links ein aufgeräumter Ablauf, rechts schiebt sich Standard-Software mit Tabellen und Zetteln herein. Eine echte Lupe fährt darüber (am Computer folgt sie der Maus) |
| 6 | `gripszug`, `dreamteam`, `fotos` | App 1–3 | Gripszug: die eigene Illustration, fünf Wagen leuchten nacheinander auf. DreamTeam: Flug durch ein Feld aus Spielerkarten, elf werden gewählt, stellen sich auf, die Rangliste rechnet live. Fotoverkauf: eine E-Mail mit 14 Anhängen löst sich auf, auf dem Telefon der Weg der Eltern bis zum Download |
| 7 | `gespraech` | „Lass uns über deine Idee reden." | Die Fäden vom Anfang legen sich auf das Signet, Schriftzug und Einladung steigen nach |

Die Dateien: `story.html` (Inhalt), `assets/story.css` (Gestaltung, gegliedert
nach Kapiteln), `assets/story.js` (Bewegung, eine Funktion pro Kapitel).

Entscheide, die man beim Weiterbauen kennen sollte:

- **Das Scrollen treibt die Story an, übernimmt aber nie.** Jedes Kapitel hat
  eine Zeitleiste von 0 bis 100 (`ordnung` bis 134, es trägt vier Szenen), die
  dem Scrollstand folgt, mit 0,9 s Nachlauf, damit ein Mausrad nicht ruckt.
  Rückwärts scrollen spielt rückwärts. Es gibt kein Einrasten und kein
  automatisches Weiterlaufen.
- **Jedes Kapitel ist eine eigene Sektion mit eigener Bühne**, die per CSS
  klebt (`position: sticky`), nicht über das Pinning von GSAP. Der Browser
  hält sie selbst fest, auch am iPhone, wenn die Adressleiste ein- und
  ausfährt.
- **Überblendung statt Schnitt:** Ab dem zweiten Kapitel rückt jede Sektion
  eine Bildschirmhöhe nach oben und liegt über dem Ende der vorigen. Ihr
  Hintergrund blendet in den ersten 6 % ein, das alte Bild gleitet darunter
  weg. Bis ein Kapitel oben angekommen ist, bleibt seine Bühne ganz
  unsichtbar (`is-da`), sonst schöbe sie sich durchsichtig über das vorige.
- **Nichts davon ist ein Bild** – ausser der Illustration von Gripszug, die
  aus der App selbst stammt. Zettel, Tablet, Dashboard, Spielerkarten und
  Telefon sind HTML und SVG, die Fäden ein Canvas. Das bleibt auf jedem
  Bildschirm scharf, der Text ist echt, und jedes Teil kann sich einzeln
  bewegen. Die KI-Bilder in `Bildvorlagen/` sind Stilvorgabe, nicht Inhalt.
- **Keine echten Personen:** DreamTeam zeigt erfundene Spieler, Klubs, Wappen
  und Manager – echte Spielerfotos und Klubwappen gehören anderen, und die
  Seite wirbt. Die Kinder im Fotoverkauf sind gezeichnet, Adresse und Code
  erfunden (`eltern@example.ch`), wie im Kurzfilm der App.
- **Das Dashboard hat eine feste Auflösung:** quer 1180 px, hoch 820 px,
  1em = 10 px. Die Schrift folgt über `cqw` der Breite des Bildschirms im
  Gerät. Das Dashboard wächst und schrumpft also als Ganzes wie ein echter
  Bildschirm und bricht nie um. Dasselbe gilt für die App im Telefon des
  Fotoverkaufs. Die Zahlen sind erfunden, passen aber zueinander (September =
  August × 1,12), Datum und Monate kommen aus der Uhr des Besuchers.
- **Der Anfangszustand steht im CSS, nicht im Skript.** GSAP setzt beim
  Neuberechnen (andere Fenstergrösse) seine Werte zurück, und ein gestaffeltes
  `fromTo` bringt seinen Anfang danach erst wieder, wenn es an der Reihe ist.
  Stünde der Anfang nur im Skript, tauchten Texte und Kacheln späterer Szenen
  kurz auf.
- **Die Fäden sind auf grossen Bildschirmen gedeckelt.** Die Zeichenfläche
  bekommt höchstens 2,2 Millionen Bildpunkte, das Leuchten wird auf einer
  Fläche in Viertelgrösse gemalt und vom Browser weich hochgerechnet. An einem
  4K-Bildschirm sind das rund 2,4 statt 8,3 Megapixel pro Bild, und das breite
  Leuchten, das vorher am meisten kostete, fast nichts mehr. Die Zettel haben
  eigene Ebenen, damit sie beim Schweben nicht neu gemalt werden. Braucht ein
  Bild trotzdem im Mittel über 24 ms, zeichnen die Fäden in zwei Stufen mit
  weniger Bildpunkten.
- **Die Hinweislinien** in Szene 3 enden alle am linken Rand ihres Bausteins,
  von oben nach unten in der Reihenfolge der Hinweise. So bleiben sie kurz und
  kreuzen sich nie. Hoch gibt es keine Linien, nur vier Chips.
- **Die Lupe** zeigt eine Kopie der Szene, 1,8-fach vergrössert. Das Skript
  legt sie beim Start an; wer im Vergleich etwas ändert, ändert beides.
- **Weniger Bewegung** (`prefers-reduced-motion`): stehende Bilder, die
  ineinander überblenden. Nichts fliegt, nichts dreht sich, die Fäden bleiben
  still, jedes Kapitel zeigt gleich sein Endbild.
- **Ohne Skript oder ohne GSAP** steht eine ruhige Seite da: alle Texte, das
  eingeschaltete Tablet, die Schalter auf „ON", der Vergleich als ein Bild,
  die drei Apps mit ihren Punkten und die Einladung.

Die Bibliothek ist **GSAP 3.15** (`gsap`, `ScrollTrigger`, `CustomEase`) in
`assets/vendor/`, die Handschrift der Zettel **Caveat** in `assets/fonts/`
(Einzelheiten in `assets/README.md`). Beides kommt von alae.app selbst. Darum
braucht es keine Änderung an der Sicherheitsrichtlinie in `netlify.toml`, und
es bleibt beim Grundsatz „keine externen Skripte". Die übrige Seite kommt
weiter ohne Bibliothek aus. Komprimiert lädt die Story rund 105 KB Code und
17 KB Schrift, dazu das Gripszug-Bild (93 KB), sobald das Kapitel näher
kommt.

Stellschrauben:

- **Tempo:** `--len` an jedem Kapitel ist sein Scrollweg in vh (`ordnung`
  620, `vergleich` 300, `gripszug` 300, `dreamteam` 480, `fotos` 420,
  `gespraech` 260). Mehr heisst langsamer, die Abfolge bleibt dieselbe.
- **Abfolge:** Der Zeitplan steht als Tabelle über jeder `buildMotion` im
  Skript. Wer in `ordnung` Zahlen ändert, prüft auch `TILE_DELAY`, denn die
  Zettel landen erst, wenn ihr Rahmen steht.
- **Texte:** direkt im HTML. Spieler, Klubs und Manager von DreamTeam stehen
  im Skript (`CLUBS`, `PLAYERS`, `MANAGER`), weil es die Karten baut.

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

Eine Einwilligungs-Checkbox gibt es nicht. Über dem Absende-Knopf steht
stattdessen ein Hinweis mit Link auf Ziffer 4 der Datenschutzerklärung (Anker
`#kontaktformular`); als Rechtsgrundlage nennt sie dort die Anbahnung eines
Vertrags und das berechtigte Interesse. Kommt eine Checkbox zurück, muss
Ziffer 4 mit. Die Funktion liest nur die bekannten Felder – zusätzliche, etwa
ein `einverstanden` aus einer älteren Fassung der Seite, ignoriert sie, statt
die Anfrage abzulehnen.

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

- **Conversion „Anfrage"** – gemeldet im Submit-Handler des Kontaktformulars,
  erst nach erfolgreichem Versand und nicht bei ausgefüllter Spam-Falle. Das
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
- Einziger fremder Dienst ist der Google-Tag für Google Ads auf der
  Startseite (Cookies, Anfragen an Google, siehe „Google Ads"). Sonst keine
  Cookies, keine externen Anfragen. Die eigene Besucherstatistik
  läuft auf dem Server und speichert keine IP-Adressen (siehe unten)
