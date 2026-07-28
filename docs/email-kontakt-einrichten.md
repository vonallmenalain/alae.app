# kontakt@alae.app einrichten

Ziel: E-Mails an `kontakt@alae.app` landen im privaten Gmail-Postfach
`vonallmenalain@gmail.com`, und aus diesem Postfach lässt sich **als**
`kontakt@alae.app` antworten.

Empfang und Versand sind zwei getrennte Wege. Das ist kein Umweg, sondern der
übliche Aufbau, wenn man kein eigenes Postfach betreiben will:

| | Dienst | Kosten |
| --- | --- | --- |
| Empfangen (Weiterleitung an Gmail) | Cloudflare Email Routing | kostenlos |
| Versenden (Antworten aus Gmail) | Resend, über SMTP | im bestehenden Konto enthalten |

Wichtig ist die **Reihenfolge**: zuerst der Empfang. Gmail schickt beim
Einrichten des Versands einen Bestätigungscode an `kontakt@alae.app` – der kann
nur ankommen, wenn die Weiterleitung schon läuft.

---

## Schritt 0 – Vorprüfung (5 Minuten)

1. **Wo liegt die DNS-Zone von `alae.app`?** Im Cloudflare-Dashboard
   nachsehen, ob die Domain unter *Websites* aufgeführt ist und den Status
   **Active** hat.
   - **Active** → weiter mit Schritt 1.
   - Domain fehlt oder Status *Pending Nameserver Update* → zuerst Schritt 0a.
2. **Resend-Konto öffnen** und unter *Domains* prüfen, ob `alae.app` den Status
   **Verified** hat. Das Kontaktformular versendet bereits über
   `formular@alae.app`; wenn das funktioniert, ist die Domain verifiziert.

### Schritt 0a – nur falls die Domain noch nicht bei Cloudflare liegt

Email Routing setzt voraus, dass Cloudflare die DNS-Zone verwaltet.

1. Cloudflare-Konto anlegen, *Add a site* → `alae.app` → **Free**-Plan.
2. Cloudflare liest die bestehenden Einträge ein. **Diese Liste sorgfältig mit
   dem bisherigen DNS-Anbieter vergleichen**, vor allem:
   - die Einträge, die auf Netlify zeigen (Website),
   - die Einträge von Resend: `send` (MX und TXT) sowie
     `resend._domainkey` (TXT).
   Fehlendes hier von Hand nachtragen – **vor** dem Umstellen der Nameserver.
3. Beim Registrar die beiden Cloudflare-Nameserver eintragen. Aktivierung
   dauert meist Minuten, im schlechten Fall bis 24 Stunden.
4. Die Einträge für die Website auf **DNS only** (graue Wolke) lassen. Netlify
   liefert bereits über ein CDN aus; zwei CDN übereinander bringen nichts und
   führen zu Zertifikatsproblemen.

> Alternative, falls die Domain bewusst nicht zu Cloudflare soll: ein reiner
> Weiterleitungsdienst wie ImprovMX oder Forward Email. Der braucht nur MX- und
> TXT-Einträge beim bestehenden Anbieter. Der Rest dieser Anleitung bleibt
> gleich, nur Schritt 1 sieht anders aus.

---

## Schritt 1 – Empfang: Cloudflare Email Routing

1. Cloudflare-Dashboard → Domain `alae.app` → linke Spalte **Email** →
   **Email Routing** → *Get started*.
2. **Zieladresse anlegen:** `vonallmenalain@gmail.com` eintragen. Cloudflare
   schickt dorthin eine Bestätigungsmail – den Link darin anklicken. Ohne
   diesen Klick bleibt die Adresse *Unverified* und es wird nichts
   weitergeleitet.
3. **Adresse anlegen:** *Custom addresses* → *Create address*
   - Custom address: `kontakt`
   - Action: **Send to an existing destination address**
   - Destination: `vonallmenalain@gmail.com`
4. **DNS-Einträge setzen:** Cloudflare bietet *Add records automatically* an.
   Diesen Knopf nehmen. Gesetzt werden:
   - drei MX-Einträge auf `…mx.cloudflare.net` mit unterschiedlichen
     Prioritäten (die genauen Namen zeigt die Oberfläche),
   - ein TXT-Eintrag: `v=spf1 include:_spf.mx.cloudflare.net ~all`
5. **Test:** von einer fremden Adresse (nicht aus dem Gmail-Konto selbst) eine
   Mail an `kontakt@alae.app` schicken. Sie muss in Gmail ankommen, mit
   `kontakt@alae.app` in der Zeile *An*.

**Kein Catch-all einschalten.** Sonst landet jede erfundene Adresse
(`abc@alae.app`) im Postfach – das ist ein Spam-Magnet. Weitere Adressen wie
`rechnung@alae.app` lieber einzeln anlegen.

---

## Schritt 2 – Versand vorbereiten: Resend

1. Resend-Dashboard → **Domains** → `alae.app` muss **Verified** sein.
   Steht dort etwas anderes, die angezeigten DNS-Einträge in Cloudflare
   nachtragen (`send` MX, `send` TXT/SPF, `resend._domainkey` TXT/DKIM).
2. **API-Schlüssel für SMTP anlegen:** *API Keys* → *Create API Key*
   - Name: `gmail-smtp`
   - Permission: **Sending access**
   - Domain: `alae.app`

   Der Schlüssel (`re_…`) wird **nur einmal** angezeigt – sofort in den
   Passwortmanager. Ein eigener Schlüssel neben dem des Kontaktformulars ist
   Absicht: So lässt sich einer der beiden zurückziehen, ohne den anderen zu
   treffen.

**Kein zweiter SPF-Eintrag auf der Hauptdomain.** Es darf genau einen
`v=spf1`-TXT-Eintrag auf `alae.app` geben, nämlich den von Email Routing.
Resend arbeitet über die Unterdomain `send.alae.app` und hat dort seinen
eigenen – die beiden stören sich nicht.

---

## Schritt 3 – Gmail: als `kontakt@alae.app` senden

In Gmail am Rechner (im Browser, nicht in der App):

1. Zahnrad rechts oben → **Alle Einstellungen aufrufen** → Tab **Konten und
   Import** → bei *Senden als:* auf **Weitere E-Mail-Adresse hinzufügen**.
2. Im Fenster:
   - Name: der Name, der beim Empfänger erscheinen soll
   - E-Mail-Adresse: `kontakt@alae.app`
   - **Als Alias behandeln:** Haken **drin lassen**. Nur dann schlägt Gmail
     beim Antworten automatisch die richtige Absenderadresse vor.
3. Nächster Schritt → SMTP-Daten:

   | Feld | Wert |
   | --- | --- |
   | SMTP-Server | `smtp.resend.com` |
   | Port | `465` |
   | Nutzername | `resend` (wörtlich, keine E-Mail-Adresse) |
   | Passwort | der API-Schlüssel `re_…` aus Schritt 2 |
   | Verbindung | **Gesicherte Verbindung über SSL** |

   Falls Port 465 blockiert ist: Port `587` mit **TLS** funktioniert ebenso.
4. **Konto hinzufügen** → Gmail schickt einen Bestätigungscode an
   `kontakt@alae.app`. Der kommt über die Weiterleitung aus Schritt 1 im selben
   Postfach an. Code eintragen oder den Link in der Mail anklicken.
5. Zurück unter *Konten und Import*, bei *Beim Antworten auf eine Nachricht:*
   die Option **Von der Adresse antworten, an die die Nachricht gesendet
   wurde** wählen.

Danach: Bei einer Mail an `kontakt@alae.app` steht beim Antworten automatisch
`kontakt@alae.app` als Absender. Beim Verfassen lässt sich die Adresse im Feld
*Von* jederzeit von Hand wechseln – auch in der Gmail-App auf dem Handy, sobald
sie einmal am Rechner eingerichtet ist.

Als Standardabsender muss `kontakt@alae.app` **nicht** gesetzt werden; sonst
gehen auch private Mails unter der Geschäftsadresse raus.

---

## Schritt 4 – Test-Checkliste

- [ ] Mail von aussen an `kontakt@alae.app` kommt in Gmail an
- [ ] Antwort darauf geht mit Absender `kontakt@alae.app` raus
- [ ] Beim Empfänger steht **kein** „via …“ oder „gesendet von“ hinter dem Namen
- [ ] Die Antwort landet beim Empfänger im Posteingang, nicht im Spam
- [ ] Das Kontaktformular auf der Website funktioniert weiterhin
- [ ] In Resend unter *Emails* ist die verschickte Antwort protokolliert

Für Zeile drei und vier ist der einfachste Test eine Antwort an eine Adresse
bei einem anderen Anbieter (etwa Bluewin, Outlook oder eine Firmenadresse) und
ein Blick in den Kopf der empfangenen Nachricht: `SPF: PASS` und
`DKIM: PASS` mit `d=alae.app` sind das Ziel.

---

## Schritt 5 – Kontaktformular scharfschalten

Das Formular auf der Website ruft die Netlify-Funktion `kontakt.mjs` auf, und
die versendet über Resend. Dafür braucht sie einen eigenen Schlüssel.

1. **Resend** → *API Keys* → *Create API Key*: Name `netlify-kontaktformular`,
   Permission **Sending access**, Domain `alae.app`. Bewusst ein zweiter
   Schlüssel neben `gmail-smtp` – so lässt sich einer sperren, ohne den anderen
   zu treffen.
2. **Netlify** → Site → *Project configuration* → **Environment variables** →
   *Add a variable*:

   | Feld | Wert |
   | --- | --- |
   | Key | `RESEND_API_KEY` |
   | Value | der Schlüssel `re_…` |
   | Scopes | muss **Functions** enthalten |
   | Deploy contexts | *All deploy contexts* |

3. **Neu deployen:** *Deploys* → *Trigger deploy* → *Deploy site*. Ein
   laufender Deploy übernimmt geänderte Variablen nicht von selbst.
4. Formular absenden. Bei Erfolg ersetzt sich das Formular durch „Danke, deine
   Anfrage ist angekommen.", und in Resend steht der Versand unter *Emails*.

Der Absender `formular@alae.app` braucht keine eigene Freigabe – er liegt auf
der in Resend verifizierten Domain.

---

## Schritt 6 – optional: Kontaktformular auf die neue Adresse

Das Formular schickt Anfragen heute direkt an `vonallmenalain@gmail.com`. Setzt
man in Netlify (*Project configuration → Environment variables*) stattdessen

```
KONTAKT_EMPFAENGER = kontakt@alae.app
```

dann steht auch bei Formularanfragen `kontakt@alae.app` in der Zeile *An*, und
Gmail wählt beim Antworten von selbst die richtige Absenderadresse. Eine
Codeänderung braucht es dafür nicht.

Der Preis dafür: eine Station mehr. Fällt Email Routing aus, geht die Anfrage
verloren, statt direkt zuzustellen. Wer das nicht will, lässt die Variable weg
und wechselt die Absenderadresse beim Antworten von Hand.

---

## Stolperfallen

- **Bestätigungscode kommt nicht an** → Schritt 1 ist nicht fertig. In
  Cloudflare unter *Email Routing → Overview* prüfen, ob die Zieladresse
  *Verified* ist und der Dienst *Enabled*.
- **Testmail scheinbar nicht angekommen** → zuerst im Spam-Ordner und unter
  *Alle Nachrichten* nachsehen, bevor die Einrichtung verdächtigt wird. Gmail
  sortiert weitergeleitete Post aus einer frisch eingerichteten Domain gern
  aus. Ob Cloudflare die Nachricht überhaupt erhalten hat, zeigt das
  *Activity log* unter *Email Routing → Overview*.
- **Formular meldet „Der Versand ist noch nicht eingerichtet."** → Die
  Umgebungsvariable `RESEND_API_KEY` fehlt der Netlify-Funktion. Entweder ist
  sie gar nicht gesetzt, oder ihr Scope umfasst **Functions** nicht, oder es
  wurde nach dem Setzen nicht neu deployt. Steht in der Klammer stattdessen
  „Fehler 404", ist die Funktion selbst nicht deployt.
- **Antwort kommt nicht raus, Gmail meldet einen SMTP-Fehler** → Nutzername ist
  wörtlich `resend`, nicht die E-Mail-Adresse. Und der API-Schlüssel muss
  Sendeberechtigung für `alae.app` haben.
- **Empfänger sieht „via resend.com“** → DKIM fehlt oder die Domain ist in
  Resend nicht mehr verifiziert. Eintrag `resend._domainkey.alae.app` prüfen.
- **Alte MX-Einträge** → Email Routing ersetzt sie. Lag die Domain vorher bei
  einem anderen Mailanbieter, hört dessen Zustellung in diesem Moment auf.
- **Weiterleitungsschleife** → die Gmail-Adresse darf nicht ihrerseits an
  `kontakt@alae.app` weiterleiten.
- **Grenzen des Resend-Kontos** → im kostenlosen Plan 100 Mails pro Tag. Jede
  Antwort aus Gmail zählt mit, ebenso jede Formularanfrage.

---

## Wann sich ein richtiges Postfach lohnt

Weiterleiten reicht, solange eine Person antwortet und das Archiv im
Gmail-Konto liegen darf. Sobald mehrere Leute dieselbe Adresse betreuen, ein
gemeinsamer Ordner nötig wird oder die Ablage aus rechtlichen Gründen in der
Schweiz liegen soll, führt kein Weg an einem eigenen Postfach vorbei –
Infomaniak oder Migadu für Schweizer Ablage, Google Workspace, wenn die
gewohnte Gmail-Oberfläche bleiben soll. Dann entfällt Schritt 3 dieser
Anleitung, und die MX-Einträge zeigen auf den neuen Anbieter statt auf
Cloudflare.

Kommt es dazu, muss die Tabelle in Ziffer 6 der Datenschutzerklärung angepasst
werden.
