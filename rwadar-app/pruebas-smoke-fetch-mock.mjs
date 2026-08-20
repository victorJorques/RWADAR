// Doble de fetch para probar los `finally` de los smokes sin ninguna red.
const escenario = process.env.RWADAR_SMOKE_MOCK_ESCENARIO || '';
let cuentaExiste = false;
let dispositivoExiste = false;

const respuesta = (estado, cuerpo = null) => ({
  ok: estado >= 200 && estado < 300,
  status: estado,
  async text() { return cuerpo === null ? '' : JSON.stringify(cuerpo); },
});

const radar = Array.from({ length: 21 }, (_, i) => ({
  slug: `plataforma-${i}`,
  nombre: `Plataforma ${i}`,
  categoria: 'crowdfunding',
  actor: 'Empresa',
  region: 'España',
  acceso: 'web',
  ticket: 'variable',
  cadenas: [],
  nota: null,
  aval: null,
  web: 'https://example.invalid',
  plataforma_id: '00000000-0000-4000-8000-000000000001',
}));

globalThis.fetch = async (entrada, opciones = {}) => {
  const url = new URL(String(entrada));
  const ruta = `${url.pathname}${url.search}`;
  const metodo = opciones.method || 'GET';

  if (url.pathname.endsWith('/rest/v1/radar_publico')) {
    return respuesta(200, radar);
  }
  if (url.pathname.endsWith('/rest/v1/plataformas')) {
    if (url.searchParams.get('estado') === 'eq.descartada') {
      return respuesta(200, [{ nombre: 'Descartada', fuentes: [{ url: 'https://example.invalid' }] }]);
    }
    return respuesta(200, [{
      id: '00000000-0000-4000-8000-000000000001', nombre: 'Plataforma 0',
    }]);
  }
  if (url.pathname.endsWith('/rest/v1/cambios_estado')) return respuesta(200, []);

  if (escenario === 'produccion_cleanup') {
    if (url.pathname.endsWith('/auth/v1/signup')) {
      cuentaExiste = true;
      return respuesta(200, {
        access_token: 'sesion-local-no-real',
        user: { id: '00000000-0000-4000-8000-000000000099' },
      });
    }
    if (url.pathname.endsWith('/rest/v1/perfiles') && cuentaExiste) {
      throw new Error('fallo local inyectado después del alta');
    }
    if (url.pathname.endsWith('/rest/v1/rpc/borrar_mi_cuenta')) {
      cuentaExiste = false;
      console.log('MOCK_CUENTA_BORRADA');
      return respuesta(204);
    }
    if (url.pathname.endsWith('/auth/v1/token')) {
      return cuentaExiste
        ? respuesta(200, { access_token: 'sesion-local-no-real', user: { id: 'x' } })
        : respuesta(400, { code: 'invalid_credentials', message: 'Invalid login credentials' });
    }
  }

  if (escenario === 'movil_cleanup') {
    if (url.pathname.endsWith('/rest/v1/dispositivos') && metodo === 'POST') {
      dispositivoExiste = true;
      console.log('MOCK_DISPOSITIVO_CREADO');
      return respuesta(201);
    }
    if (url.pathname.endsWith('/rest/v1/seguimiento') && metodo === 'POST') {
      throw new Error('fallo local inyectado después del alta móvil');
    }
    if (url.pathname.endsWith('/rest/v1/seguimiento') && metodo === 'DELETE') {
      return respuesta(204);
    }
    if (url.pathname.endsWith('/rest/v1/dispositivos') && metodo === 'DELETE') {
      dispositivoExiste = false;
      console.log('MOCK_DISPOSITIVO_BORRADO');
      return respuesta(204);
    }
    if (url.pathname.endsWith('/rest/v1/dispositivos') && metodo === 'GET') {
      return respuesta(200, dispositivoExiste ? [{ instalacion: 'residual' }] : []);
    }
    if (url.pathname.endsWith('/rest/v1/seguimiento') && metodo === 'GET') {
      return respuesta(200, []);
    }
  }

  return respuesta(500, { code: 'mock_unexpected_request', ruta, metodo });
};
