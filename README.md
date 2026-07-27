# alae.app – Landingpage

Einseitige Website für alae.app: individuelle Web-Apps, Kundenportale,
Automatisierungen, Coaching und Betreuung bestehender Projekte.

Alles steckt in **`index.html`** – kein Build-Schritt, keine Abhängigkeiten,
keine externen Schriften oder Skripte. Datei auf einen Webserver kopieren, fertig.

## Aufbau der Seite

| Abschnitt | Zweck |
| --- | --- |
| Hero | Nutzenversprechen + zwei Handlungsaufrufe |
| Ausgangslage | Vier typische Situationen als Zitate, statt Technologie zuerst |
| Der Ansatz | Warum das heute schneller und günstiger geht, plus „bei jedem Projekt inbegriffen“ |
| Leistungen | Fünf Angebote, inkl. Coaching als eigenständige zweite Dienstleistung |
| Referenzprojekte | Sechs echte Apps, aufklappbar mit Ausgangslage, Problem, Lösung, Funktionen, Datenschutz, Ergebnis |
| Ablauf | Sechs Schritte vom Erstgespräch bis zur Betreuung |
| Über mich | Persönliche Vorstellung mit Porträt und sechs Vertrauenspunkte |
| Preise | Richtwert für kleine Projekte, Etappenmodell, Wahl zwischen Übernahme und Betreuung |
| Häufige Fragen | Preis, Dauer, Quellcode, Datenschutz, Ausfallrisiko, Übernahme |
| Kontakt | Formular mit der qualifizierenden Einstiegsfrage |

Positionierung bewusst so gewählt: „Vibe Coding“ steht **nicht** im Hauptversprechen.
Im Hero geht es um moderne Entwicklungswerkzeuge, die individuelle Lösungen
schneller und kosteneffizienter machen – Coaching zu KI-Werkzeugen ist Leistung
Nummer 4.

## Vor der Veröffentlichung anpassen

Alle Stellen sind in `index.html` mit `TODO` markiert:

- [ ] **E-Mail-Adresse** – `kontakt@alae.app` (im Kontaktbereich, im Footer, in der
      Konstante `EMPFAENGER` im Skript und in den strukturierten Daten)
- [ ] **Telefonnummer** – Platzhalter `+41000000000` ersetzen oder den Block löschen
- [x] **Screenshots aller sechs Projekte und Porträt** – eingebunden; bei den drei
      geschützten Apps sind Gesichter, Namen und Geschäftszahlen unkenntlich gemacht
      (Details in `assets/README.md`)
- [ ] **Ortsangabe vereinheitlichen** – „Über mich" nennt neu Oberburg, Footer und
      strukturierte Daten nennen weiterhin Burgdorf. Je nach Geschäftsadresse angleichen
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
- [ ] **Einführungspreis-Block** im Kontaktbereich entfernen, wenn die ersten
      Referenzprojekte vergeben sind

## Kontaktformular

Ohne Server öffnet das Formular das E-Mail-Programm des Besuchers (`mailto`),
damit die Seite sofort funktioniert. Für echten Versand:

1. Dienst wählen (z. B. Formspree, Web3Forms oder einen eigenen Endpoint)
2. Am `<form>` `action="https://…"` und `method="post"` setzen
3. `data-mailto="off"` am `<form>` ergänzen – dann greift das Skript nicht ein

## Deployment

Statische Datei, funktioniert auf jedem Hosting:

- **Cloudflare Pages** – Repository verbinden, kein Build-Befehl, Ausgabeverzeichnis `/`
- **GitHub Pages** – in den Repository-Einstellungen aktivieren; für die eigene
  Domain eine Datei `CNAME` mit dem Inhalt `alae.app` ergänzen
- **Eigener Server / QNAP** – `index.html` ins Web-Verzeichnis kopieren

## Technische Eigenschaften

- Hell- und Dunkelmodus: folgt dem System, Umschalter im Header merkt die Wahl
- Responsiv ab 320 px, keine horizontale Scrollleiste
- Tastaturbedienbar, „Direkt zum Inhalt“-Link, sichtbarer Fokus, `prefers-reduced-motion`
- Semantisches HTML mit strukturierten Daten (`ProfessionalService`) für Suchmaschinen
- Keine Cookies, kein Tracking, keine externen Anfragen – damit auch kein
  Cookie-Banner nötig
