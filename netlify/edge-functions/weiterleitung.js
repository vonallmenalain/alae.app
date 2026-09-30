/**
 * Kurze Links: alae.app/k/<code>
 * ==============================
 *
 * Die Links in Werbemails, auf Instagram oder einem Flyer tragen einen Code
 * aus sieben Zeichen. Festgehalten wird ein Klick in der Verwaltung
 * (Repo administration, netlify/functions/link.ts): Diese Funktion leitet
 * dorthin weiter, und die Verwaltung schickt den Besucher zurück auf
 * alae.app/?ref=<code>, ins gewählte Kapitel. So sieht die Verwaltung die
 * Anfrage des Browsers selbst, ohne Umweg über alae.app.
 *
 * Ein Code, der keiner sein kann, führt an den Anfang von alae.app. Ob es
 * einen Code gibt, weiss nur die Verwaltung; auch sie führt bei einem
 * unbekannten an den Anfang. Ein Link führt nie ins Leere.
 */
const VERWALTUNG = 'https://administration.alae.app';
const CODE = /^[2-9abcdefghjkmnpqrstuvwxyz]{7}$/;

export default (request) => {
  const code = new URL(request.url).pathname.replace(/^\/k\//, '').replace(/\/+$/, '').toLowerCase();
  return new Response(null, {
    status: 302,
    headers: {
      Location: CODE.test(code) ? `${VERWALTUNG}/k/${code}` : '/',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
};

export const config = {
  path: '/k/*',
};
