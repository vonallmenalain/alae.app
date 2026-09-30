/**
 * Die Startseite für eine Zielgruppe
 * ==================================
 *
 * Kapitel 1 und 2 erzählen von einer Firma: ihre Zettel werden zu Kacheln
 * im Dashboard, ihre alte Website wird zur neuen, und eine Anfrage darüber
 * landet als neuer Eintrag in der App. Ohne Link ist das eine Schreinerei
 * (Zielgruppe "kmu"). Ein Link aus der Verwaltung kann dieselbe Geschichte
 * für einen Verein oder eine Schule erzählen lassen.
 *
 * Jeder Schlüssel ist eine Stelle in index.html, markiert mit
 * <!--zg:schluessel-->Text<!--/zg-->; wn-wunsch ist der getippte Wunsch im
 * Formular (data-zg-tippe). Was hier fehlt, bleibt, wie es in index.html
 * steht. Die Zahlen im Dashboard bleiben dieselben, darum passen die Texte
 * zu ihnen: 4 offene Einträge, CHF 48'230 im Monat, 5 Termine heute.
 *
 * Die Texte sind HTML und kommen nur von hier, nie aus einer Anfrage. Wer
 * einen Text ändert, prüft die Seite am Handy: Kacheln und Tabelle haben
 * eine feste Breite, und die Titel sollen nicht mehr Zeilen brauchen als
 * heute. Die Schlüssel der Zielgruppen stehen auch in der Verwaltung
 * (Repo administration, gemeinsam/marketing.ts, ZIELGRUPPEN).
 *
 * Firmen, Vereine, Schulen und Namen sind erfunden.
 */

export const ZIELGRUPPEN = {
  verein: {
    titel1: 'Listen, Zettel, Excel?',
    titel2: '<span class="hl">Eine Vereins-App</span> statt Excel-Chaos',
    titel3: 'Exakt passend für <span class="hl">euren Verein</span>',

    // Die Zettel, je mit der Kachel, zu der sie werden
    'zettel-offen': 'Helfer<br>Grümpeli<br><u>nachfragen!!</u>',
    kpi0: 'Helfer gesucht',
    'zettel-umsatz': 'Einnahmen<br>diesen Monat?',
    kpi1: 'Einnahmen',
    'zettel-termin': 'Halle Training<br>Do oder Fr??',
    kpi3: 'Trainings heute',
    kpi3s: 'Nächstes: 17:30 U13',
    'xls-datei': 'Vereinskasse_2026_v3.xlsx',
    'xls-spalte': 'Einnahmen',
    grafik: 'Einnahmen',
    'liste-titel': 'ANMELDUNGEN',
    liste1: 'Huber ... Lager',
    liste2: 'Linde ... Turnier',
    liste3: 'Keller .. Kurs',
    liste4: 'Schneider Reise',

    // Das Dashboard
    kuerzel: 'NF',
    person: 'Nadia Frei',
    rolle: 'Präsidentin',
    nav1: 'Helfer',
    nav2: 'Anmeldungen',
    nav3: 'Mitglieder',
    nav4: 'Trainings',
    auslastung: 'Halle, diese Woche',
    tabelle: 'Anmeldungen',
    spalte1: 'Mitglied',
    spalte2: 'Anlass',
    zeile1: 'Grümpeli',
    zeile2: 'Trainingslager',
    'stand-arbeit': 'Bestätigt',
    name3: 'Chiara Linde',
    zeile3: 'Turnier',
    'stand-offen': 'Warteliste',
    name4: 'Paul Keller',
    zeile4: 'Schnupperkurs',
    zeile5: 'Vereinsreise',
    'stand-fertig': 'Bezahlt',
    meldung: 'Neue Anmeldung über die Website',
    'meldung-text': 'Familie Graf · Grümpeli, 2 Kinder',

    // Kapitel 2: die Website des Vereins, erst von 2009, dann neu
    'wa-titel': 'Sportclub Talbach',
    'wa-slogan': 'Sport und Geselligkeit seit 1987',
    'wa-nav': '<u>Home</u> | <u>Über uns</u> | <u>Teams</u> | <u>Termine</u> | <u>Gästebuch</u> | <u>Kontakt</u>',
    'wa-lauf': '+++ NEU: Jetzt auch Volleyball für Kinder! +++ Halle geschlossen vom 21.07. bis 08.08. +++ NEU: Jetzt auch Volleyball für Kinder! +++',
    'wa-menu': '<li>Teams</li><li>Training</li><li>Anlässe</li><li>Vorstand</li>',
    'wa-aktuell': 'Grümpelturnier am 22.08.2009',
    'wa-text': 'Wir sind ein Sportverein im Emmental. Bei uns trainieren Kinder, Jugendliche und Erwachsene – vom Plausch bis zur Meisterschaft. Melden Sie sich beim Vorstand oder schreiben Sie uns eine E-Mail!',
    'wa-refs': 'Unsere Teams:',
    'wa-ref1': 'Juniorinnen U13',
    'wa-ref2': 'Herren 1',
    'wa-ref3': 'Plauschgruppe',
    'wn-name': 'Talbach',
    'wn-art': 'Sportclub',
    'wn-links': '<span>Teams</span><span>Termine</span><span>Über uns</span><span>Kontakt</span>',
    'wn-anfragen': 'Jetzt anmelden',
    'wn-kicker': 'Sportclub im Emmental',
    'wn-titel': 'Sport, der verbindet.',
    'wn-sub': 'Training, Turniere und Anlässe – für Kinder, Jugendliche und Erwachsene, in einem Verein, der zusammenhält.',
    'wn-cta2': 'Termine ansehen',
    'wn-chip': '<b>312</b> Mitglieder',
    'wn-frei': 'Schnuppern jeden Donnerstag',
    'wn-karte1': 'Training',
    'wn-karte1s': 'Für jedes Alter',
    'wn-karte2': 'Turniere',
    'wn-karte2s': 'Vom Plausch bis zur Liga',
    'wn-karte3': 'Anlässe',
    'wn-karte3s': 'Grümpeli, Lotto, Vereinsreise',
    'wn-frage': 'Wofür meldest du dich an?',
    'wn-wunsch': 'Grümpeli, 2 Kinder',
    'wn-senden': 'Anmeldung senden',
  },

  schule: {
    titel1: 'Listen, Briefe, Excel?',
    titel2: '<span class="hl">Eine Schul-App</span> statt Excel-Chaos',
    titel3: 'Exakt passend für <span class="hl">eure Schule</span>',

    'zettel-offen': 'Anmeldung<br>Skilager<br><u>nachfragen!!</u>',
    kpi0: 'Offene Anfragen',
    'zettel-umsatz': 'Beiträge<br>diesen Monat?',
    kpi1: 'Beiträge',
    'zettel-termin': 'Elterngespräch<br>Do oder Fr??',
    kpi3: 'Termine heute',
    kpi3s: 'Nächster: 10:30 Fam. Keller',
    'xls-datei': 'Beiträge_2026_final_v3.xlsx',
    'xls-spalte': 'Beiträge',
    grafik: 'Beiträge',
    'liste-titel': 'ANMELDUNGEN',
    liste1: 'Huber ... Skilager',
    liste2: 'Linde ... Aufgaben',
    liste3: 'Keller .. Reise',
    liste4: 'Schneider Musik',

    kuerzel: 'RS',
    person: 'Ruth Steiner',
    rolle: 'Schulleiterin',
    nav1: 'Anfragen',
    nav2: 'Anmeldungen',
    nav3: 'Eltern',
    nav4: 'Termine',
    auslastung: 'Mittagstisch, diese Woche',
    tabelle: 'Anmeldungen',
    spalte1: 'Familie',
    spalte2: 'Angebot',
    zeile1: 'Mittagstisch',
    zeile2: 'Skilager',
    'stand-arbeit': 'Bestätigt',
    name3: 'Chiara Linde',
    zeile3: 'Aufgabenhilfe',
    'stand-offen': 'Warteliste',
    name4: 'Paul Keller',
    zeile4: 'Schulreise',
    zeile5: 'Musikschule',
    'stand-fertig': 'Bezahlt',
    meldung: 'Neue Anmeldung über die Website',
    'meldung-text': 'Familie Graf · Mittagstisch, Mo und Do',

    'wa-titel': 'Schule Talbach',
    'wa-slogan': 'Gemeinsam lernen seit 1987',
    'wa-nav': '<u>Home</u> | <u>Über uns</u> | <u>Klassen</u> | <u>Termine</u> | <u>Gästebuch</u> | <u>Kontakt</u>',
    'wa-lauf': '+++ NEU: Mittagstisch ab August! +++ Sommerferien vom 06.07. bis 09.08. +++ NEU: Mittagstisch ab August! +++',
    'wa-menu': '<li>Klassen</li><li>Mittagstisch</li><li>Termine</li><li>Downloads</li>',
    'wa-aktuell': 'Sommerferien vom 06.07. bis 09.08.2009',
    'wa-text': 'Willkommen an der Schule Talbach im Emmental. Hier finden Sie alles zu Klassen, Terminen und Anmeldungen. Formulare bitte ausdrucken, ausfüllen und dem Kind mitgeben!',
    'wa-refs': 'Aus dem Schulalltag:',
    'wa-ref1': 'Projektwoche',
    'wa-ref2': 'Skilager',
    'wa-ref3': 'Schulfest',
    'wn-name': 'Talbach',
    'wn-art': 'Schule',
    'wn-links': '<span>Angebote</span><span>Termine</span><span>Über uns</span><span>Kontakt</span>',
    'wn-anfragen': 'Anmelden',
    'wn-kicker': 'Schule im Emmental',
    'wn-titel': 'Lernen mit Freude.',
    'wn-sub': 'Unterricht, Tagesschule und Anlässe – mit Lehrpersonen, die sich Zeit für jedes Kind nehmen.',
    'wn-cta2': 'Termine ansehen',
    'wn-chip': '<b>240</b> Kinder',
    'wn-frei': 'Mittagstisch ab August',
    'wn-karte1': 'Tagesschule',
    'wn-karte1s': 'Betreuung bis 18 Uhr',
    'wn-karte2': 'Mittagstisch',
    'wn-karte2s': 'Jeden Tag frisch gekocht',
    'wn-karte3': 'Anlässe',
    'wn-karte3s': 'Vom Skilager bis zur Schulreise',
    'wn-frage': 'Wofür möchten Sie anmelden?',
    'wn-wunsch': 'Mittagstisch, Mo und Do',
    'wn-senden': 'Anmeldung senden',
  },
};
