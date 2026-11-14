// Datos personales en lo que va a Git (V-11 y el barrido): tratamientos,
// cargos seguidos de un nombre, nombramientos y ceses del BOE, correos y
// teléfonos. Es una red de seguridad determinista: los nombres sin nada de
// esto los comprueba el verificador. Ante la duda, se para: mejor una mañana
// sin noticias que un nombre en Git.
//
// El barrido usa además «Nombre Apellido:» al principio de un titular (así
// titula el BCE sus discursos). Esa regla no va en V-11: «Robinhood Stock
// Tokens: …» también tiene esa forma, y en un titular propio es correcto.

const MAYUS = '[A-ZÁÉÍÓÚÑÜ]';
const PALABRA = `${MAYUS}[a-záéíóúñüçàèìòùâêîôûäëïö'-]+`;

export const REGLAS_PERSONAS = Object.freeze([
  { id: 'tratamiento', re: new RegExp(`(?:^|[^\\p{L}])(?:Sr|Sra|Srta|Dña|Dª|Mr|Mrs|Ms|Dr|Dra)\\.?\\s+${MAYUS}`, 'u') },
  { id: 'tratamiento', re: new RegExp(`(?:^|[^\\p{L}])D\\.\\s+${MAYUS}`, 'u') },
  { id: 'tratamiento', re: new RegExp(`(?:^|[^\\p{L}])(?:don|doña|Don|Doña)\\s+${MAYUS}`, 'u') },
  { id: 'cargo-con-nombre', re: new RegExp(`(?:^|[^\\p{L}])(?:President|Presidenta|Presidente|Vice-President|Vicepresident[ae]|Commissioner|Comisari[oa]|Governor|Gobernador(?:a)?|Minister|Ministr[oa]|Chair(?:man|woman|person)?|Executive Director|Secretary-General)\\s+${PALABRA}\\s+${PALABRA}`, 'u') },
  { id: 'nombramiento-o-cese', re: /(?:^|[^\p{L}])(?:se nombra|nombramiento|nombrad[oa]s?|dispone el cese|se dispone el cese|cese de don|cese de doña)(?![\p{L}])/iu },
  { id: 'correo', re: /[\w.+-]+@[\w-]+\.[a-z]{2,}/iu },
  { id: 'telefono', re: /(?<![\w.,/])(?:\+\d{1,3}[\s-]?)?[6789]\d{2}[\s-]?\d{3}[\s-]?\d{3}(?![\w.,/])/u },
]);

const NOMBRE_Y_DOS_PUNTOS = new RegExp(`^\\s*${PALABRA}(?:\\s+(?:(?:de|del|van|von|da|di|le|la)\\s+)?${PALABRA}){1,3}:\\s`, 'u');
/* Lo que tiene forma de «Nombre Apellido:» y no lo es. */
const NO_SON_NOMBRES = /^\s*(?:ESMA|EBA|ECB|BCE|EU|UE|CNMV|BOE|Council|Consejo|Commission|Comisión|Press|Nota|News|Noticias|Weekly|Update|Questions|Statement|Speech|Interview|Opinion|Report|Informe|Comunicado|Joint|Final|Draft|Consultation|Consulta|Spain|España|Europe|Europa|European|Europeo|Europea)\b/u;

/* Devuelve la primera regla que salta (o null). */
export function buscarPersonas(texto, { titular = false } = {}) {
  const t = String(texto || '');
  for (const regla of REGLAS_PERSONAS) {
    const m = regla.re.exec(t);
    if (m) return { regla: regla.id, trozo: m[0].trim().slice(0, 40) };
  }
  if (titular && NOMBRE_Y_DOS_PUNTOS.test(t) && !NO_SON_NOMBRES.test(t)) {
    return { regla: 'nombre-y-dos-puntos', trozo: t.slice(0, t.indexOf(':') + 1) };
  }
  return null;
}

/* Recorre todos los textos de un valor JSON (o un texto suelto). */
export function buscarPersonasEn(valor) {
  const hallazgos = [];
  const visitar = (v, donde) => {
    if (typeof v === 'string') { const h = buscarPersonas(v); if (h) hallazgos.push({ donde: donde || '(texto)', ...h }); }
    else if (Array.isArray(v)) v.forEach((x, i) => visitar(x, `${donde}[${i}]`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) visitar(x, donde ? `${donde}.${k}` : k);
  };
  visitar(valor, '');
  return hallazgos;
}
