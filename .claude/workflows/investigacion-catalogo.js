export const meta = {
  name: 'investigacion-catalogo',
  description: 'RWAdar: investiga con fuentes primarias un grupo de ofertas (o de candidatas) y lo hace revisar por un agente independiente',
  whenToUse: 'Dentro del ciclo «haz la investigación» (skill investigacion-catalogo), después de pasar el vigía (vigia.mjs → <ciclo>/vigia.json). Lánzalo varias veces a la vez, con 1 o 2 grupos cada vez: cada flujo solo corre 2 agentes simultáneos.',
  phases: [
    { title: 'Investigar', detail: 'un agente por grupo: parte del vigía si lo hay; confirma lo que cambia y abre a mano lo que el vigía no leyó' },
    { title: 'Revisar', detail: 'revisor independiente por grupo: reabre las fuentes de cada cambio crítico, alta y retirada' },
  ],
}

// args = {
//   fecha: 'AAAA-MM-DD',
//   ciclo: 'rwadar-app/data/verificaciones/AAAA-MM-DD-v2',      // carpeta del ciclo (con ENCARGO-INVESTIGADORES.md)
//   base: 'rwadar-app/data/verificaciones/<entrega publicada>-v2', // escaparate y documentación publicados
//   grupos: [{ id: 'spiko', slugs: ['…'], extra: 'indicaciones propias del grupo' }, …],
//   vigia: (opcional) ruta del vigia.json; por defecto `${ciclo}/vigia.json`; false = trabajar sin vigía
// }
if (!args || !/^\d{4}-\d{2}-\d{2}$/.test(args.fecha || '') || !args.ciclo || !args.base || !Array.isArray(args.grupos) || !args.grupos.length) {
  throw new Error('args: { fecha, ciclo, base, grupos: [{ id, slugs, extra }], vigia? }')
}
const { fecha: FECHA, ciclo: CICLO, base: BASE } = args
const BRIEF = `${CICLO}/ENCARGO-INVESTIGADORES.md`
const SCRATCH = args.scratch || '/tmp'
// Vigía determinista (.claude/skills/investigacion-catalogo/vigia.mjs): lee sin agentes las fuentes que más cambian
// y las compara con lo publicado. El flujo no puede mirar el disco: es el investigador quien comprueba si existe.
const VIGIA = args.vigia === false ? null : (typeof args.vigia === 'string' && args.vigia ? args.vigia : `${CICLO}/vigia.json`)

const bloqueVigia = () => VIGIA ? `
Punto de partida rápido: el vigía. Antes de abrir ninguna fuente, comprueba si existe ${VIGIA} (test -f). Si NO existe, si su «generadoUtc» no es del ${FECHA} o si su «base» no es ${BASE}, no lo uses y trabaja como siempre. Si vale, lee de él solo «fichas.<slug>» de tus fichas y parte de ahí:
1. Estado «cambia»: confirma tú hoy la cifra en su fuente primaria (la de «fuente» u otra primaria) antes de proponerla. El vigía detecta, no es la fuente. Si tu lectura no coincide con la suya, manda la tuya y dilo en el resumen.
2. Estado «no cambia»: re-fecha esa cifra, ese documento o esa búsqueda de la CNMV SIN volver a leerlos: en el expediente pon como consulta la «horaUtc» del vigía y su «sha256», y marca esa evidencia con "segunVigia": true. Vale solo para ese dato exacto; no lo extiendas a otros datos de la misma página o documento.
3. Estado «no se pudo leer», y todo lo que el vigía no cubre («noCubre»: textos de la web, avisos sin cifra, acceso desde España, salida, registros y fichas sin «cifras»): ábrelo tú a mano como siempre, por las rutas de ACCESO-FUENTES. Nunca re-feches con el vigía algo que no leyó hoy.
4. Documentos: «no cambia» es el mismo SHA-256 que lo publicado y no hace falta releer el PDF; «cambia» es versión nueva o documento sin huella: léelo entero.
` : ''

const avisoRevisorVigia = () => VIGIA ? `
El investigador pudo partir del vigía (${VIGIA}): lo marcado "segunVigia": true se re-fechó con la hora y el SHA-256 del vigía, sin releerlo. El vigía no es una comprobación independiente: sigues reabriendo tú cada cambio crítico (punto 1). Además, por muestreo (al menos 2 de lo re-fechado con el vigía en tu grupo, o todo si son ≤ 3), abre hoy la fuente y comprueba que la cifra o el SHA-256 coinciden con los de vigia.json. Es rechazado cualquier dato con "segunVigia" que en vigia.json esté como «cambia» o «no se pudo leer», o que no esté en él.
` : ''

const RESULTADO_GRUPO = {
  type: 'object',
  properties: {
    grupo: { type: 'string' },
    expedientes: { type: 'array', items: { type: 'object', properties: {
      slug: { type: 'string' },
      tipo: { type: 'string', enum: ['publicada', 'candidata'] },
      decision: { type: 'string', enum: ['mantener', 'actualizar', 'retirar_propuesta', 'admitir_propuesta', 'no_admitir'] },
      cambiosCriticos: { type: 'array', items: { type: 'string' } },
      resumen: { type: 'string' },
    }, required: ['slug', 'tipo', 'decision', 'cambiosCriticos', 'resumen'] } },
    bloqueos: { type: 'array', items: { type: 'string' } },
    resumenMd: { type: 'string' },
  },
  required: ['grupo', 'expedientes', 'bloqueos'],
}

const VEREDICTO_GRUPO = {
  type: 'object',
  properties: {
    grupo: { type: 'string' },
    items: { type: 'array', items: { type: 'object', properties: {
      slug: { type: 'string' },
      asunto: { type: 'string' },
      veredicto: { type: 'string', enum: ['confirmado', 'confirmado_con_cambios', 'rechazado', 'no_verificable'] },
      hechos: { type: 'string', description: 'lo que comprobó el revisor abriendo la fuente: URL, literal, hora UTC' },
      correcciones: { type: 'array', items: { type: 'string' } },
    }, required: ['slug', 'asunto', 'veredicto', 'hechos', 'correcciones'] } },
    expedientesSinCambiosRevisados: { type: 'array', items: { type: 'string' } },
    veredictoGlobal: { type: 'string', enum: ['aprobado', 'aprobado_con_cambios', 'rechazado'] },
    informe: { type: 'string' },
  },
  required: ['grupo', 'items', 'veredictoGlobal'],
}

const promptInvestigar = g => `Eres el investigador del grupo «${g.id}» del ciclo de catálogo de RWAdar del ${FECHA} (repositorio en /home/user/RWADAR o la raíz del repositorio actual; trabaja desde la raíz).

Lee primero, en este orden: ${BRIEF} (encargo de hoy), rwadar-app/data/verificaciones/2026-11-01-v2/ENCARGO-INVESTIGADORES.md (reglas y formato del expediente) y rwadar-app/data/verificaciones/2026-11-03.3-v2/ENCARGO-INVESTIGADORES.md. Lee también la sección «Normas de las tarjetas» de docs/tareas/CICLO-DIARIO-CATALOGO.md. Lo publicado está en ${BASE}/escaparate-publicacion.json y documentacion-ofertas.json; el último expediente de cada oferta, en la carpeta de ciclo más reciente que lo tenga (rwadar-app/data/verificaciones/*-v2/expedientes/<slug>.json).

${g.slugs && g.slugs.length ? `Tus fichas publicadas (una por expediente, todas obligatorias): ${g.slugs.join(', ')}.` : 'No tienes fichas publicadas: tu trabajo es buscar candidatas nuevas.'}

Indicaciones de tu grupo: ${g.extra || 'las del encargo.'}
${bloqueVigia()}
Reglas operativas:
- Escribe SOLO en ${CICLO}/grupos/${g.id}/ y en ${CICLO}/expedientes/<slug>.json de tus slugs (o de tus candidatas). Nada de git, nada de iniciar sesión, KYC, wallets ni formularios. Nada de tocar Supabase ni publicar.
- Herramientas: curl (pasa por el proxy configurado; si corta la conexión, reintenta con pausas), Python con pdftotext/pypdf, Playwright (require('playwright') con NODE_PATH=$(npm root -g); chromium.launch() sin opciones) para páginas con JavaScript. WebSearch y WebFetch se cargan con ToolSearch («select:WebSearch,WebFetch»); úsalos para descubrir, o para leer una API pública cuando curl falle (anótalo), nunca como sustituto del documento primario.
- Cada expediente sigue el formato del 01/11 con prioridadEditorial, resumenTarjeta (minimo, accesoEspana, salida) y consulta.inicioUtc/finUtc con horas reales (date -u).
- Guarda cada expediente en cuanto lo termines. Copias de lo leído en grupos/${g.id}/fuentes/ (PDF solo si < 3 MB) e inventario-consultas.json con url, archivo, http, consultadoUtc, bytes y sha256. Respuestas crudas con direcciones/IDs en grupos/${g.id}/fuentes/crudo/. No copies nombres de personas físicas, DNI ni datos personales: recórtalos («[nombre recortado]»).
- En el mínimo de una tarjeta no escribas «por participación», «por token» ni «por acción» (el lector de la tarjeta lo descarta): usa «Desde X € la participación en reventa (DD/MM)».
- Escribe grupos/${g.id}/resumen-${g.id}.md en español llano.
- Una cifra que hoy no puedas leer en su fuente primaria queda en null. No inventes ni deduzcas. Si una fuente está bloqueada, regístralo.

Tu respuesta final es el objeto estructurado: por cada expediente, su decisión, la lista de cambios críticos respecto a lo publicado (antes → ahora) y un resumen de una o dos frases.`

const promptRevisar = (g, r) => `Eres el revisor INDEPENDIENTE del grupo «${g.id}» del ciclo de catálogo de RWAdar del ${FECHA}. No preparaste estos expedientes. Tu trabajo es intentar refutarlos abriendo tú mismo las fuentes primarias.

Lee las reglas en ${BRIEF} y rwadar-app/data/verificaciones/2026-11-01-v2/ENCARGO-INVESTIGADORES.md, y las «Normas de las tarjetas» de docs/tareas/CICLO-DIARIO-CATALOGO.md. Lo publicado está en ${BASE}/escaparate-publicacion.json y documentacion-ofertas.json.

El investigador entregó esto (resumen): ${JSON.stringify(r)}
Los expedientes completos están en ${CICLO}/expedientes/<slug>.json y su resumen en ${CICLO}/grupos/${g.id}/.

Revisa, abriendo hoy tú mismo la fuente primaria de cada uno:
1. Cada cambio crítico (cifras, acceso desde España, licencia/registro, derecho/token, comisiones, custodia, salida, estado de apertura/cierre, avisos).
2. Cada admitir_propuesta: entidad y registro en el regulador, estado abierta hoy, acceso desde España como particular, mínimo, salida, riesgos, advertencias de la CNMV. Si falta algo esencial con fuente primaria, rechazado.
3. Cada retirar_propuesta: ¿la fuente sostiene la retirada? Intenta rebatirla.
4. Los tres textos de resumenTarjeta de cada ficha que cambie: castellano llano, ≤ 120 caracteres, respaldados y conformes a las normas.
5. Por muestreo (al menos 2 fichas, o todas si son ≤ 3), una ficha «sin cambios»: confírmala con la fuente de hoy.
6. Que no haya nombres de personas físicas ni datos personales en las copias del grupo.
${avisoRevisorVigia()}Ante la duda, rechazado o no_verificable; no apruebes por contar comprobaciones.

Escribe tu informe en ${CICLO}/revision-independiente/${g.id}.md (español llano: hechos comprobados con URL, literal corto y hora UTC; bloqueos; correcciones obligatorias). Copias en ${CICLO}/revision-independiente/fuentes/${g.id}/. No edites los expedientes ni ningún otro archivo; nada de git, sesiones, KYC, Supabase ni publicar.

Tu respuesta final es el objeto estructurado con un item por cada asunto revisado.`

const resultados = await pipeline(
  args.grupos,
  g => agent(promptInvestigar(g), { label: `investigar:${g.id}`, phase: 'Investigar', schema: RESULTADO_GRUPO }),
  (r, g) => {
    if (!r) { log(`El grupo ${g.id} no devolvió resultado: sin revisión`); return { grupo: g.id, investigacion: null, revision: null } }
    return agent(promptRevisar(g, r), { label: `revisar:${g.id}`, phase: 'Revisar', schema: VEREDICTO_GRUPO })
      .then(v => ({ grupo: g.id, investigacion: r, revision: v }))
  },
)
return { resultados }
