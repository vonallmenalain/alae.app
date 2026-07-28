# alae.app – Landingpage

Einseitige Website für alae.app: individuelle Web-Apps, genau nach den
Bedürfnissen der Kundschaft.

Alles steckt in **`index.html`** – kein Build-Schritt, keine Abhängigkeiten,
keine externen Schriften oder Skripte. Datei auf einen Webserver kopieren, fertig.

## Aufbau der Seite

| Abschnitt | Zweck |
| --- | --- |
| Hero | Nutzenversprechen, ein Handlungsaufruf, vier Vertrauenspunkte |
| Motivation | Wie es angefangen hat, Porträt und vier Fixpunkte |
| Referenzprojekte | Sechs echte Apps, einzeiliger Kurzbeschrieb, aufklappbar mit Ausgangslage, Problem, Lösung, Funktionen, Datenschutz, Ergebnis |
| Ablauf | Vier Schritte vom Erstgespräch bis zur Betreuung |
| Preise | Richtwert für kleine Projekte, Etappenmodell, Wahl nach der Entwicklung |
| FAQ | Unter „Fragen": Preis, Dauer, Quellcode, Datenschutz, Ausfallrisiko, Übernahme |
| Kontakt | Formular über die volle Breite, unter der Frage „Was ist deine Idee?" |

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
- [x] **Screenshots aller sechs Projekte und Porträt** – eingebunden; bei den drei
      geschützten Apps sind Gesichter, Namen und Geschäftszahlen unkenntlich gemacht
      (Details in `assets/README.md`)
- [ ] **Projekttexte prüfen** – bei allen sechs Apps stammen Ausgangslage und Problem
      von dir, Lösung, Funktionsliste und Ergebnis sind daraus abgeleitet und
      gegenzulesen
- [ ] **Freigaben einholen** – von der Fotografin für Nennung und Screenshot, ebenso
      von der Einzelfirma für den Screenshot der Buchhaltung
- [x] **Impressum und Datenschutzerklärung** – als `impressum.html` und
      `datenschutz.html` angelegt, im Footer verlinkt
- [ ] **Angaben in den Rechtsseiten ausfüllen** – Adresse, Telefonnummer und UID.
      Die Platzhalter stehen in eckigen Klammern, siehe Abschnitt „Rechtsseiten"
- [ ] **Rechtsseiten prüfen lassen** – die Texte sind ein Entwurf, keine
      Rechtsberatung
- [ ] **Vorschaubild für Social Media** – `og:image`, 1200 × 630 px
- [ ] **Richtwert CHF 200 prüfen** – steht im Abschnitt „Preise" und in der FAQ-Antwort
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

## E-Mail-Adresse kontakt@alae.app

Empfang und Versand sind zwei getrennte Dinge:

- **Empfangen** übernimmt Cloudflare Email Routing (kostenlos): Es leitet
  Nachrichten an `kontakt@alae.app` an das private Postfach weiter.
- **Versenden** übernimmt Resend – für das Kontaktformular über die Funktion
  oben, und für Antworten aus Gmail über Resends SMTP-Zugang.

## Rechtsseiten

`impressum.html` und `datenschutz.html` teilen sich das Stylesheet
`assets/legal.css` und das Skript `assets/legal.js` (Jahreszahl in der
Fusszeile, Signet-Animation der Marke). Die Startseite behält ihr CSS und ihr
Skript inline, damit sie ohne zweite Anfrage auskommt; für die zwei
Unterseiten wäre eine dreifache Kopie unwartbar.
**Wird das Farbschema in `index.html` geändert, müssen die Tokens am Anfang von
`legal.css` mitgeändert werden.**

Beide Seiten sind zusätzlich ohne Dateiendung erreichbar (`/impressum`,
`/datenschutz`) – dafür sorgen Weiterleitungen in `netlify.toml`.

### Noch auszufüllen

| Platzhalter | Wo | Bemerkung |
| --- | --- | --- |
| `[Strasse und Hausnummer]`, `[PLZ]`, `[Ort]` | Impressum und Datenschutz | in beiden Dateien identisch halten |
| `[Telefonnummer]` | Impressum | oder die ganze Zeile löschen |
| `[CHE-xxx.xxx.xxx]` | Impressum | nur bei Eintrag im Handelsregister; sonst den Block „Handelsregister und Mehrwertsteuer" löschen |

Die Platzhalter stehen bewusst sichtbar in eckigen Klammern: Eine erfundene
Adresse in einem Impressum wäre schlimmer als eine offensichtliche Lücke.

Die Datenschutzerklärung beschreibt den tatsächlichen Stand der Website: keine
Cookies, kein Browser-Speicher, keine externen Anfragen, als Dienstleister nur
Netlify, Resend, Cloudflare und Google. **Kommt ein weiterer Dienst dazu – etwa
Terminbuchung, Newsletter oder Statistik –, muss die Tabelle in Ziffer 6 ergänzt
und der Abschnitt „Keine Cookies, kein Tracking" überprüft werden.**

## Deployment

Statische Datei, funktioniert auf jedem Hosting:

- **Cloudflare Pages** – Repository verbinden, kein Build-Befehl, Ausgabeverzeichnis `/`
- **GitHub Pages** – in den Repository-Einstellungen aktivieren; für die eigene
  Domain eine Datei `CNAME` mit dem Inhalt `alae.app` ergänzen
- **Eigener Server / QNAP** – `index.html` ins Web-Verzeichnis kopieren

## Technische Eigenschaften

- Dunkelmodus, fest eingestellt über `data-theme="dark"` am `<html>` jeder der
  drei Seiten. Das helle Farbschema steht weiterhin im CSS: `data-theme="light"`
  stellt darauf um, ganz ohne das Attribut folgt die Seite wieder der
  Systemeinstellung. Bei einer Änderung auch die `theme-color`-Angabe im
  `<head>` mitziehen – sie färbt die Adressleiste auf dem Handy
- Responsiv ab 320 px, keine horizontale Scrollleiste
- Tastaturbedienbar, „Direkt zum Inhalt“-Link, sichtbarer Fokus, `prefers-reduced-motion`
- Semantisches HTML mit strukturierten Daten (`ProfessionalService`) für Suchmaschinen
- Keine Cookies, kein Tracking, keine externen Anfragen – damit auch kein
  Cookie-Banner nötig
