# Adminbereich einrichten

Die Besucherstatistik unter `/admin` läuft erst, wenn in Netlify zwei
Umgebungsvariablen gesetzt sind. Ohne `ADMIN_PASSWORT` bleibt der Bereich
gesperrt – das ist der Auslieferungszustand und auch der sichere.

Rechne mit rund zehn Minuten.

## 1. Passwort und Salz erzeugen

Beides sind lange Zufallszeichenketten. Sie müssen nichts bedeuten und
nirgends getippt werden – kopieren genügt.

**Windows (PowerShell).** Diese drei Zeilen zusammen einfügen und ausführen,
dann dasselbe noch einmal für den zweiten Wert:

```powershell
$bytes = [byte[]]::new(32)
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
($bytes | ForEach-Object { $_.ToString('x2') }) -join ''
```

`openssl` gibt es unter Windows normalerweise nicht; der Zufall kommt hier aus
demselben kryptografischen Generator des Betriebssystems.

Kürzer, wenn es schnell gehen soll – zwei GUIDs aneinandergehängt ergeben
ebenfalls 64 zufällige Zeichen:

```powershell
[guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
```

**macOS oder Linux (Terminal).**

```sh
# Passwort für den Adminbereich
openssl rand -base64 24

# Salz für die Tageskennung
openssl rand -hex 32
```

Beide Werte in den Passwortmanager legen. Das Salz wird nie wieder gebraucht,
aber: **Ändert es sich, stimmen die Kennungen der Vortage nicht mehr mit den
neuen überein.** Die Zahlen bleiben richtig, nur die Zuordnung „derselbe
Absender wie gestern" geht über den Wechsel hinweg verloren.

## 2. Variablen in Netlify setzen

Netlify → das Projekt → **Project configuration** → **Environment variables** →
**Add a variable**:

| Variable | Wert | Scopes |
| --- | --- | --- |
| `ADMIN_PASSWORT` | das Passwort aus Schritt 1 | Functions |
| `STATISTIK_SALZ` | das Salz aus Schritt 1 | Edge functions (oder alle) |

Als Deploy context genügt **Production**; wer die Statistik auch in
Deploy-Previews sehen will, setzt „All contexts".

Optional:

| Variable | Wirkung |
| --- | --- |
| `STATISTIK_AUFBEWAHRUNG_TAGE` | Wie lange Tageswerte bleiben. Standard 90 |
| `STATISTIK_AUS` | Auf `1` gesetzt: Es wird nichts mehr erfasst |

## 3. Neu veröffentlichen

Umgebungsvariablen greifen erst beim nächsten Deploy: Netlify → **Deploys** →
**Trigger deploy** → **Deploy site**.

## 4. Anmelden

`https://alae.app/admin` aufrufen, Passwort eingeben. Die Seite ist nirgends
verlinkt und für Suchmaschinen gesperrt; das Passwort bleibt nur im
Sitzungsspeicher des Browsers und ist beim Schliessen des Tabs wieder weg.

Die ersten Zahlen erscheinen mit dem ersten Aufruf nach dem Deploy. Ein Tag
braucht ein paar Stunden, bis er etwas aussagt.

## Was die Auswertung zeigt

- **Anfragen pro Tag** – blau die gewöhnlichen, rot die auffälligen.
  Auffällig heisst: ein Pfad aus dem üblichen Repertoire automatischer Scanner
  (`/wp-login.php`, `/.env`, `/.git/config` …) oder ein Fehlversuch auf eine
  Seite, die es nicht gibt.
- **Absender** – nach grobem Adressbereich und Land zusammengefasst. Genau hier
  fällt auf, wenn über Tage hinweg immer dasselbe Netz anklopft.
- **Häufigste Seiten, Herkunftsländer, verweisende Seiten, Browser** – der Teil,
  der für das Marketing zählt: Was wird gelesen, und woher kommen die Leute.

## Wenn jemand auffällt

Das Absuchen nach WordPress-Pfaden auf einer Seite ohne WordPress ist lästig,
aber harmlos: Es gibt nichts zu finden, jede dieser Anfragen endet mit 404.
Solange es dabei bleibt, ist nichts zu tun.

Wird es massiv, hilft Netlify selbst:

- **Netlify → Project configuration → Access & security → Blocked IP
  addresses**: einzelne Adressen oder Bereiche sperren. Dafür braucht es die
  volle Adresse – die steht bewusst nicht in dieser Statistik, wohl aber in den
  Netlify-Logs unter **Logs → Functions / Traffic**.
- **Rate limiting** in denselben Einstellungen begrenzt, wie viele Anfragen eine
  Adresse pro Minute stellen darf.

## Datenschutz

Gespeichert werden keine IP-Adressen: statt ihrer eine Tageskennung
(SHA-256 aus Salz, Adresse und Datum) und der grobe Adressbereich. Einzelne
Anfragen werden spätestens nach zwei Tagen zu Tagessummen verdichtet und dabei
gelöscht, die Tagessummen nach 90 Tagen.

Das steht so in Ziffer 3 der Datenschutzerklärung. **Wird an der Erfassung
etwas geändert, muss `datenschutz.html` mitgeändert werden.**
