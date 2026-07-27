/**
 * Nimmt die Anfragen aus dem Kontaktformular entgegen und schickt sie per
 * Resend als E-Mail weiter.
 *
 * Erwartete Umgebungsvariablen (in Netlify unter
 * Project configuration → Environment variables setzen):
 *
 *   RESEND_API_KEY       Pflicht. API-Schlüssel aus dem Resend-Dashboard.
 *   KONTAKT_EMPFAENGER   Optional. Zieladresse, Standard siehe unten.
 *   KONTAKT_ABSENDER     Optional. Absender, muss eine in Resend verifizierte
 *                        Domain verwenden.
 *
 * Der API-Schlüssel darf niemals in index.html stehen – er wäre für jeden
 * Besucher lesbar. Deshalb läuft der Versand über diese Funktion.
 */

const STANDARD_EMPFAENGER = 'vonallmenalain@gmail.com';
const STANDARD_ABSENDER = 'alae.app Kontaktformular <formular@alae.app>';

export default async (request) => {
  if (request.method !== 'POST') {
    return antwort({ fehler: 'Nur POST erlaubt.' }, 405);
  }

  let daten;
  try {
    daten = await request.json();
  } catch {
    return antwort({ fehler: 'Anfrage konnte nicht gelesen werden.' }, 400);
  }

  const name = text(daten.name);
  const email = text(daten.email);
  const nachricht = text(daten.nachricht);
  const organisation = text(daten.organisation);
  const telefon = text(daten.telefon);

  // Spam-Falle: Das Feld ist im Formular versteckt. Menschen füllen es nie aus,
  // automatische Ausfüllprogramme schon. Wir tun so, als sei alles in Ordnung,
  // damit der Absender nicht merkt, dass er erkannt wurde.
  if (text(daten.website)) return antwort({ ok: true }, 200);

  if (!name || !email || !nachricht) {
    return antwort({ fehler: 'Bitte Name, E-Mail und Nachricht ausfüllen.' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return antwort({ fehler: 'Diese E-Mail-Adresse sieht nicht gültig aus.' }, 400);
  }
  if (nachricht.length > 5000) {
    return antwort({ fehler: 'Die Nachricht ist zu lang.' }, 400);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY ist nicht gesetzt.');
    return antwort({ fehler: 'Der Versand ist noch nicht eingerichtet.' }, 503);
  }

  const zeilen = [
    ['Name', name],
    ['Firma / Organisation', organisation || '–'],
    ['E-Mail', email],
    ['Telefon', telefon || '–'],
  ];

  const html = `
    <table style="border-collapse:collapse;font-family:system-ui,sans-serif;font-size:15px">
      ${zeilen.map(([k, v]) => `
        <tr>
          <td style="padding:4px 16px 4px 0;color:#5C6470;vertical-align:top">${escape(k)}</td>
          <td style="padding:4px 0"><strong>${escape(v)}</strong></td>
        </tr>`).join('')}
    </table>
    <p style="font-family:system-ui,sans-serif;font-size:15px;margin-top:20px">
      <strong>Kurzbeschrieb Idee</strong><br>
      ${escape(nachricht).replace(/\n/g, '<br>')}
    </p>
    <p style="font-family:system-ui,sans-serif;font-size:13px;color:#5C6470;margin-top:24px">
      Gesendet über das Kontaktformular auf alae.app.
      Eine Antwort auf diese E-Mail geht direkt an ${escape(email)}.
    </p>`;

  const nurText = [
    ...zeilen.map(([k, v]) => `${k}: ${v}`),
    '',
    'Kurzbeschrieb Idee:',
    nachricht,
    '',
    '— gesendet über das Kontaktformular auf alae.app',
  ].join('\n');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.KONTAKT_ABSENDER || STANDARD_ABSENDER,
        to: [process.env.KONTAKT_EMPFAENGER || STANDARD_EMPFAENGER],
        // Damit "Antworten" im Mailprogramm direkt zur anfragenden Person geht
        reply_to: [email],
        subject: `Anfrage über alae.app${organisation ? ` – ${organisation}` : ` – ${name}`}`,
        html,
        text: nurText,
      }),
    });

    if (!res.ok) {
      console.error('Resend antwortete mit', res.status, await res.text());
      return antwort({ fehler: 'Der Versand hat nicht geklappt.' }, 502);
    }
  } catch (err) {
    console.error('Resend nicht erreichbar:', err);
    return antwort({ fehler: 'Der Versand hat nicht geklappt.' }, 502);
  }

  return antwort({ ok: true }, 200);
};

function text(wert) {
  return typeof wert === 'string' ? wert.trim() : '';
}

function escape(wert) {
  return String(wert)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function antwort(koerper, status) {
  return new Response(JSON.stringify(koerper), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
