/* RWAdar · página de mantenimiento.
   La sube el panel de control al pulsar «Apagar la web», junto a
   index.html. Este script responde a TODAS las rutas con esa página y
   el código 503 + Retry-After, que es como se le dice a Google «vuelvo
   pronto» sin que retire la web del índice. /android sigue llevando al
   APK. Si el script no llegara a ejecutarse, Cloudflare serviría el
   index.html tal cual: se seguiría viendo el mantenimiento. */
const CABECERAS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store',
  'Retry-After': '3600',
  'X-Robots-Tag': 'noarchive',
  'X-Rwadar-Mantenimiento': 'si',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/android') {
      return Response.redirect('https://github.com/victorJorques/RWAdar-downloads/releases/latest', 302);
    }
    const pagina = await env.ASSETS.fetch(new Request(new URL('/', url)));
    const html = request.method === 'HEAD' ? null : await pagina.text();
    return new Response(html, { status: 503, headers: CABECERAS });
  },
};
