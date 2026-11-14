'use strict';
/* Reloj fijo para construir la web como se construyó en otro momento.

   node -r ./.claude/skills/noticias-automaticas/lib/reloj.cjs rwadar-publicar.js --local --sin-sincronizar
   con RWADAR_NOTICIAS_RELOJ=2026-11-13T21:11:22Z en el entorno.

   La construcción de la web depende del reloj (el pie «pendiente de renovar»
   cuando el catálogo caduca, las cifras que se ven 7 días…). Para saber si lo
   que hay en `main` es lo que ya sirve producción, el cerrojo de las noticias
   automáticas construye `main` con el reloj de la última publicación en
   producción: así una diferencia solo puede venir del código o del contenido,
   no del día. Sin la variable, no cambia nada. */
const instante = process.env.RWADAR_NOTICIAS_RELOJ;
if (instante) {
  const destino = Date.parse(instante);
  if (!Number.isFinite(destino) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(instante)) {
    throw new Error(`RWADAR_NOTICIAS_RELOJ no es un instante UTC válido: ${instante}`);
  }
  const Real = Date;
  const delta = destino - Real.now();
  class Reloj extends Real {
    constructor(...a) { if (a.length) super(...a); else super(Real.now() + delta); }
    static now() { return Real.now() + delta; }
  }
  globalThis.Date = Reloj;
}
