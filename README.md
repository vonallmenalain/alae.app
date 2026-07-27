# alae.app – Landingpage

Einseitige Website für alae.app: individuelle Web-Apps, genau nach den
Bedürfnissen der Kundschaft.

Alles steckt in **`index.html`** – kein Build-Schritt, keine Abhängigkeiten,
keine externen Schriften oder Skripte. Datei auf einen Webserver kopieren, fertig.

## Aufbau der Seite

| Abschnitt | Zweck |
| --- | --- |
| Hero | Nutzenversprechen, ein Handlungsaufruf, vier Vertrauenspunkte |
| Über mich | Wie es angefangen hat, Porträt und vier Fixpunkte |
| Referenzprojekte | Sechs echte Apps, aufklappbar mit Ausgangslage, Problem, Lösung, Funktionen, Datenschutz, Ergebnis |
| Ablauf | Vier Schritte vom Erstgespräch bis zur Betreuung |
| Preise | Richtwert für kleine Projekte, Etappenmodell, Wahl nach der Entwicklung |
| FAQ | Preis, Dauer, Quellcode, Datenschutz, Ausfallrisiko, Übernahme |
| Kontakt | Formular unter der Frage „Was ist deine Idee?" |

Die früheren Abschnitte Ausgangslage, Der Ansatz und Leistungen sind in
„Über mich" aufgegangen. Damit ist auch die Aufzählung der fünf
Dienstleistungen entfallen, unter anderem das Coaching zu KI-Werkzeugen.

## Vor der Veröffentlichung anpassen

Alle Stellen sind in `index.html` mit `TODO` markiert:

- [ ] **E-Mail-Adresse** – `kontakt@alae.app` (im Kontaktbereich, im Footer, in der
      Konstante `EMPFAENGER` im Skript und in den strukturierten Daten)
- [ ] **Telefonnummer** – Platzhalter `+41000000000` ersetzen oder den Block löschen
- [x] **Screenshots aller sechs Projekte und Porträt** – eingebunden; bei den drei
      geschützten Apps sind Gesichter, Namen und Geschäftszahlen unkenntlich gemacht
      (Details in `assets/README.md`)
- [ ] **Projekttexte prüfen** – bei allen sechs Apps stammen Ausgangslage und Problem
      von dir, Lösung, Funktionsliste und Ergebnis sind daraus abgeleitet und
      gegenzulesen
- [ ] **Freigaben einholen** – von der Fotografin für Nennung und Screenshot, ebenso
      von der Einzelfirma für den Screenshot der Buchhaltung
- [ ] **Impressum und Datenschutzerklärung** – eigene Seiten anlegen und die
      Footer-Links darauf zeigen lassen (in der Schweiz erwartet, für Werbung nötig)
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

## Deployment

Statische Datei, funktioniert auf jedem Hosting:

- **Cloudflare Pages** – Repository verbinden, kein Build-Befehl, Ausgabeverzeichnis `/`
- **GitHub Pages** – in den Repository-Einstellungen aktivieren; für die eigene
  Domain eine Datei `CNAME` mit dem Inhalt `alae.app` ergänzen
- **Eigener Server / QNAP** – `index.html` ins Web-Verzeichnis kopieren

## Technische Eigenschaften

- Hell- und Dunkelmodus: folgt automatisch der Systemeinstellung
- Responsiv ab 320 px, keine horizontale Scrollleiste
- Tastaturbedienbar, „Direkt zum Inhalt“-Link, sichtbarer Fokus, `prefers-reduced-motion`
- Semantisches HTML mit strukturierten Daten (`ProfessionalService`) für Suchmaschinen
- Keine Cookies, kein Tracking, keine externen Anfragen – damit auch kein
  Cookie-Banner nötig
