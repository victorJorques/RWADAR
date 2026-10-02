/* ---------------------------------------------------------------------
   Progreso de RWAdar Academy
   ---------------------------------------------------------------------
   Lecciones marcadas como leídas y aciertos del último test de cada una.
   Vive solo en este dispositivo (lib/datos.js lo guarda y lo borra con
   el resto de datos locales); nunca se envía a RWAdar ni a terceros.

   Todo lo que se lee del almacenamiento se valida: un valor manipulado o
   de una versión futura no puede romper la pantalla ni colar slugs raros.
   --------------------------------------------------------------------- */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const progresoVacio = () => ({ leidas: [], tests: {} });

export function normalizarProgreso(valor, slugsValidos = null) {
  const valido = (slug) => typeof slug === 'string' && SLUG.test(slug) &&
    (!slugsValidos || slugsValidos.includes(slug));
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return progresoVacio();
  const leidas = Array.isArray(valor.leidas) ? [...new Set(valor.leidas.filter(valido))] : [];
  const tests = {};
  if (valor.tests && typeof valor.tests === 'object' && !Array.isArray(valor.tests)) {
    for (const [slug, test] of Object.entries(valor.tests)) {
      if (!valido(slug) || !test || typeof test !== 'object') continue;
      const { aciertos, total } = test;
      if (Number.isInteger(aciertos) && Number.isInteger(total) && total > 0 && total <= 20 &&
          aciertos >= 0 && aciertos <= total) {
        tests[slug] = { aciertos, total };
      }
    }
  }
  return { leidas, tests };
}

export function alternarLeida(progreso, slug) {
  const actual = normalizarProgreso(progreso);
  if (!SLUG.test(String(slug))) return actual;
  return {
    ...actual,
    leidas: actual.leidas.includes(slug)
      ? actual.leidas.filter((s) => s !== slug)
      : [...actual.leidas, slug],
  };
}

export function registrarTest(progreso, slug, aciertos, total) {
  const actual = normalizarProgreso(progreso);
  if (!SLUG.test(String(slug))) return actual;
  return normalizarProgreso({ ...actual, tests: { ...actual.tests, [slug]: { aciertos, total } } });
}
