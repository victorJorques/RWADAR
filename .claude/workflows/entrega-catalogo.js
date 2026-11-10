export const meta = {
  name: 'entrega-catalogo',
  description: 'RWAdar: monta la entrega del catálogo (datos, SQL, ensayo en PGlite y «después de aplicar»), la revisan tres expertos independientes (SQL e integridad; contenido y tarjetas; cumplimiento), se corrige y un auditor comprueba que la corrección no coló nada más',
  whenToUse: 'Dentro del ciclo «haz la investigación» (skill investigacion-catalogo), cuando DECISIONES-COORDINADOR.md está cerrado. No aplica nada en Supabase ni publica.',
  phases: [
    { title: 'Montar', detail: 'montador de datos y SQL: preparar, comprobar en PGlite, después de aplicar y ensayo en una copia' },
    { title: 'Revisar', detail: 'tres revisores independientes: SQL e integridad; contenido, tarjetas y fuentes; cumplimiento normativo' },
    { title: 'Corregir', detail: 'aplica las correcciones obligatorias y repite las pruebas' },
    { title: 'Verificar', detail: 'diff normalizado del SQL, mismas sentencias, solo lo pedido; pruebas otra vez' },
  ],
}

// args = {
//   etiqueta: 'AAAA-MM-DD[.N]', fecha: 'AAAA-MM-DD', ciclo: 'rwadar-app/data/verificaciones/<etiqueta>-v2',
//   desde: '<etiqueta publicada>', previa: { revisionId, hash }, ultimoDia: 'AAAA-MM-DD',
//   modelo: 'rwadar-app/data/verificaciones/<entrega anterior completa>-v2', scratch: '<carpeta temporal>',
//   extra: 'indicaciones del coordinador para este día',
// }
const A = args || {}
for (const k of ['etiqueta', 'fecha', 'ciclo', 'desde', 'previa', 'ultimoDia', 'modelo', 'scratch'])
  if (!A[k]) throw new Error(`args.${k} es obligatorio`)
const { etiqueta: ETQ, fecha: FECHA, ciclo: CICLO, desde: DESDE, previa: PREVIA, ultimoDia: ULTIMO, modelo: MODELO, scratch: SCRATCH } = A
const IMPORT = `rwadar-app/data/importaciones/catalogo-${ETQ}-v2`

const RESUMEN = {
  type: 'object',
  properties: {
    revisionId: { type: 'string' }, huella: { type: 'string' },
    sha256AplicarYAprobar: { type: 'string' }, sentencias: { type: 'integer' },
    ofertas: { type: 'integer' }, plataformas: { type: 'integer' }, colecciones: { type: 'string' },
    pruebas: { type: 'array', items: { type: 'string' }, description: 'cada prueba ejecutada con su resultado real' },
    pendientes: { type: 'array', items: { type: 'string' } },
    noAplicado: { type: 'array', items: { type: 'string' }, description: 'lo de DECISIONES que no se pudo aplicar tal cual, y por qué' },
  },
  required: ['revisionId', 'huella', 'sha256AplicarYAprobar', 'sentencias', 'ofertas', 'plataformas', 'colecciones', 'pruebas', 'pendientes', 'noAplicado'],
}
const REVISION = {
  type: 'object',
  properties: {
    lente: { type: 'string' },
    veredicto: { type: 'string', enum: ['aprobado', 'aprobado_con_cambios', 'rechazado'] },
    obligatorias: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' }, problema: { type: 'string' }, correccion: { type: 'string', description: 'texto o cambio exacto' }, cambiaSql: { type: 'boolean' },
    }, required: ['id', 'problema', 'correccion', 'cambiaSql'] } },
    recomendadas: { type: 'array', items: { type: 'string' } },
    informe: { type: 'string', description: 'ruta del informe escrito' },
  },
  required: ['lente', 'veredicto', 'obligatorias', 'recomendadas', 'informe'],
}
const VERIF = {
  type: 'object',
  properties: {
    veredicto: { type: 'string', enum: ['conforme', 'no_conforme'] },
    sha256Final: { type: 'string' }, revisionIdFinal: { type: 'string' },
    hallazgos: { type: 'array', items: { type: 'string' } },
  },
  required: ['veredicto', 'sha256Final', 'revisionIdFinal', 'hallazgos'],
}

const CONTEXTO = `Entrega del catálogo de RWAdar «${ETQ}» (ciclo del ${FECHA}). Repositorio: /home/user/RWADAR (trabaja desde la raíz). Carpeta del ciclo: ${CICLO}. SQL: ${IMPORT}/. Parte EXACTAMENTE de la entrega publicada «${DESDE}» (revisión ${PREVIA.revisionId}, huella ${PREVIA.hash}); lo publicado se leyó como visitante en ${CICLO}/lectura-publica/. Las fichas valen 7 días: el último día vigente es el ${ULTIMO}, y la guarda del SQL no deja aplicarlo después.
Fuente de verdad de lo que cambia: ${CICLO}/DECISIONES-COORDINADOR.md (lista cerrada; nada fuera de ella). Textos, fuentes, fechas y literales: ${CICLO}/expedientes/ y ${CICLO}/revision-independiente/ (con las correcciones obligatorias de cada revisor). Radar: ${CICLO}/radar-contraste-${FECHA}.json y ${CICLO}/cambios-radar.json.
Procedimiento: docs/tareas/CICLO-DIARIO-CATALOGO.md (§3, §5 y «Normas de las tarjetas»). Modelo de una entrega completa: ${MODELO}/ (preparar-entrega.mjs, comprobar-entrega.mjs, despues-de-aplicar.mjs, ensayo-rest-simulado.cjs, INFORME-ENTREGA.md, REVISION-ENTREGA.md); la publicada y su base: rwadar-app/data/verificaciones/${DESDE}-v2/.
Prohibido: tocar Supabase o cualquier servicio remoto, publicar, lanzar flujos de GitHub, git commit/push, editar los expedientes o los informes de los revisores. Las pruebas pesadas (npm test, ensayo) solo en una copia aparte dentro de ${SCRATCH}. Nombres de personas físicas: ninguno en lo que va a Git.${A.extra ? `\nIndicaciones del coordinador: ${A.extra}` : ''}`

const promptMontar = `${CONTEXTO}

Eres el MONTADOR de datos y SQL: ingeniero de datos sénior, experto en PostgreSQL, PGlite y en el importador del catálogo de RWAdar (rwadar-app/catalogo-publico.js). Trabajas con el rigor de quien publica datos financieros: cada cambio con su assert, nada implícito. Escribe en ${CICLO}/:
1. preparar-entrega.mjs: sin red, reproducible byte a byte (ninguna salida depende de la hora). Comprueba que la «${DESDE}» local da exactamente la revisión y la huella publicadas, que el catálogo sincronizado de la web (rwadar-site/assets/catalogo-publico-20261022.js) es esa revisión y que la lectura pública de hoy coincide con la base local. Aplica SOLO lo de DECISIONES (cada texto «antes» se exige tal cual con assert: si no está, falla). Genera escaparate-publicacion.json, documentacion-ofertas.json, radar-canonico-26.json, manifiesto-catalogo.json y ${IMPORT}/{catalogo.sql,aplicar-y-aprobar.sql,revision.json}, con la guarda (publicada exacta, huella, no retirado, fecha tope ${ULTIMO}).
2. comprobar-entrega.mjs (PGlite, sin red, sobre la misma cadena que producción, como el del modelo): inventario de todas las sentencias y tablas (solo rwadar_catalogo y la aprobación); antes de aplicar, PGlite enseña lo leído hoy como visitante; después, la revisión nueva con sus cantidades, colecciones, fechas y vigencia; idempotencia; public.plataformas, public.fuentes y el historial intactos; cada cifra y texto cambiado; lo que verá el inversor en cada tarjeta (resumenOferta de rwadar-site/assets/ficha-editorial-20261022.js: mínimo, España y salida); lo que leen la web y la app; y los casos de fallo (otra publicada, otra huella, catálogo retirado, después del ${ULTIMO}) sin dejar nada. Con --exportar=DIR guarda lo que leería un visitante después de aplicar.
3. despues-de-aplicar.mjs: pone al día rwadar-editorial-source/ofertas/transparencia.json (fecha nueva solo donde el expediente de hoy volvió a consultar esa misma fuente; mínimos cortos nuevos que salen del texto largo del catálogo) y se niega a tocar nada si el catálogo sincronizado no es la revisión nueva. Repetible.
4. Copia ensayo-rest-simulado.cjs del modelo y haz el ensayo completo «después de aplicar» en una copia aparte (git clone --local de este repositorio a ${SCRATCH}/ensayo-${ETQ}, con tus archivos copiados encima): comprobar-entrega.mjs --exportar, sincronizar.js con el REST simulado, despues-de-aplicar.mjs, volcar-seed.js con el REST simulado, node rwadar-editorial-source/ofertas/transparencia.mjs, node rwadar-fichas.js y npm test (raíz). Guarda el resultado en ensayo-despues.json y pruebas-locales.json.
5. Ejecuta preparar-entrega.mjs dos veces y comprueba que todas sus salidas son idénticas (SHA-256).
6. INFORME-ENTREGA.md en español llano: partida, revisión/huella/SHA-256, qué cambia (antes → ahora) por oferta, el SQL (inventario), las pruebas con su salida real, lo que no se aplicó tal cual y por qué, y los pasos para aplicarla.
Tu respuesta final es el objeto estructurado, con la salida real de cada prueba.`

const promptRevisarSql = m => `${CONTEXTO}

Eres el REVISOR INDEPENDIENTE de SQL e integridad: DBA sénior de PostgreSQL y Supabase, especialista en auditar cambios de datos en producción (transacciones, aislamiento, guardas, idempotencia, permisos). No montaste esta entrega. El montador dice: ${JSON.stringify(m)}.
Intenta tumbarla:
- Inventaría TODAS las sentencias de ${IMPORT}/aplicar-y-aprobar.sql y catalogo.sql y las tablas que tocan (no busques palabras: cuéntalas y clasifícalas). Solo datos editoriales de la revisión nueva en rwadar_catalogo y su aprobación; nada de usuarios, Auth, RLS, ACL, funciones, esquema, capacidades, servicios ni credenciales.
- La guarda: publicada exacta (${PREVIA.revisionId}), huella, no retirado, fecha tope ${ULTIMO}, transacción serializable, que falle sin dejar nada.
- Ejecuta tú comprobar-entrega.mjs y preparar-entrega.mjs (dos veces; mismos SHA-256). Compara escaparate-publicacion.json y documentacion-ofertas.json con los de rwadar-app/data/verificaciones/${DESDE}-v2/ campo a campo: cada diferencia debe estar en DECISIONES; lista cualquier otra.
- despues-de-aplicar.mjs y transparencia.json: que no ponga fechas de hoy a comprobaciones que no se repitieron hoy.
- Datos personales y posibles falsos positivos del escáner de secretos en lo que va a Git (direcciones, IDs, JSON crudos).
Escribe ${CICLO}/REVISION-ENTREGA-sql.md (español llano: qué ejecutaste y qué salió, inventario, hallazgos y correcciones obligatorias con el cambio exacto). No edites nada más. Tu respuesta final es el objeto estructurado.`

const promptRevisarContenido = m => `${CONTEXTO}

Eres el REVISOR INDEPENDIENTE de contenido: analista sénior de producto financiero para el inversor particular en España, experto en las normas de las tarjetas de RWAdar y en explicar en castellano llano sin perder exactitud. No montaste esta entrega. El montador dice: ${JSON.stringify(m)}.
Intenta tumbarla, ficha por ficha:
- Cada cambio de DECISIONES está aplicado tal cual, con su fuente y su fecha de dato y de consulta; nada más cambia.
- Cada texto visible nuevo o cambiado (resumen, métricas, avisos, referencias de la tarjeta, mínimo, acceso desde España y salida) está en castellano llano, respaldado, sin promesas, con fechas DD/MM correctas y ≤ 120 caracteres donde toca. En reventa y próximas, ni rentabilidad ni precio principal; en el mínimo nunca «por participación/token/acción».
- Ejecuta resumenOferta (rwadar-site/assets/ficha-editorial-20261022.js) con cada oferta nueva de escaparate-publicacion.json y comprueba lo que enseñará la tarjeta en la web y en la app (mínimo y España en corto).
- Abre tú hoy, por muestreo, la fuente primaria de al menos 4 cifras cambiadas (rentabilidad de Spiko, un precio de reventa de Brickwise, el oráculo de mTBILL y el documento de Hausera, o las que hayan cambiado) y comprueba que la cifra y la fecha publicadas coinciden.
- Avisos con fecha: no se ha re-fechado ninguno que no se comprobara hoy.
Escribe ${CICLO}/REVISION-ENTREGA-contenido.md (español llano: hechos con URL, literal corto y hora UTC; correcciones obligatorias con el texto exacto). No edites nada más. Tu respuesta final es el objeto estructurado.`

const promptRevisarCumplimiento = m => `${CONTEXTO}

Eres el REVISOR INDEPENDIENTE de cumplimiento normativo: jurista experto en MiFID II, MiCA, el Reglamento de Folletos (UE) 2017/1129, el Reglamento de financiación participativa (UE) 2020/1503, el régimen piloto DLT y la Circular 2/2020 de la CNMV sobre publicidad de productos de inversión. RWAdar es un medio editorial gratuito, sin comisiones ni publicidad. No montaste esta entrega. El montador dice: ${JSON.stringify(m)}.
Intenta tumbarla desde tu especialidad, ficha por ficha de lo que cambia o entra:
- Ningún texto presenta como hecho lo que solo dice el emisor; ninguna promesa de rentabilidad, garantía o liquidez; las rentabilidades llevan base, fecha y que no garantizan nada; los riesgos importantes (pérdida del capital, liquidez, emisor no supervisado, sin folleto/KID, conflictos de fuentes) están en los avisos.
- El acceso desde España se apoya en una fuente primaria que de verdad lo diga (pasaporte o notificación a la CNMV, condiciones con lista de países, folleto con España como país de oferta pública); si no, lo dice como «sin confirmar».
- Las normas legales del sitio: el botón dice «Ver oferta en X» solo si se contrata hoy desde España Y está supervisada; si no, «Ir a la web del proveedor (sales de RWAdar)» (busca la regla en rwadar-site/ y en docs/legal/). Comprueba qué saldrá para cada ficha que cambie o entre.
- Advertencias de la CNMV sobre cada entidad nueva o con cambios de acceso: búscalas tú hoy.
- Datos personales: ninguno en lo que va a Git.
Escribe ${CICLO}/REVISION-ENTREGA-cumplimiento.md (español llano: hechos con URL, literal corto y hora UTC; correcciones obligatorias con el texto exacto). No edites nada más. Tu respuesta final es el objeto estructurado.`

const promptCorregir = (m, revs) => `${CONTEXTO}

Eres el MONTADOR (otro turno). Tu entrega anterior: ${JSON.stringify(m)}. Los revisores independientes piden:
${JSON.stringify(revs)}
Aplica TODAS las correcciones obligatorias, y las recomendadas solo si no amplían el alcance de DECISIONES ni cambian cifras sin fuente (di cuáles aplicas y cuáles no, y por qué). Antes de tocar nada, guarda una copia del SQL actual en ${SCRATCH}/sql-antes-correcciones-${ETQ}/ (los tres archivos de ${IMPORT}/). Después vuelve a ejecutar preparar-entrega.mjs (dos veces, mismas salidas), comprobar-entrega.mjs y el ensayo «después de aplicar» con npm test en la copia aparte. Añade a INFORME-ENTREGA.md la sección «Correcciones aplicadas» (cada una con su id) y al final de cada informe de revisión NO escribas nada. Tu respuesta final es el objeto estructurado con la revisión, la huella y el SHA-256 nuevos.`

const promptVerificar = (antes, despues, revs) => `${CONTEXTO}

Eres el VERIFICADOR final: auditor independiente de cambios en producción (no montaste ni corregiste). Antes de las correcciones: ${JSON.stringify(antes)}. Después: ${JSON.stringify(despues)}. Correcciones pedidas: ${JSON.stringify(revs.map(r => ({ lente: r.lente, obligatorias: r.obligatorias })))}.
Comprueba:
1. Diff normalizado entre ${SCRATCH}/sql-antes-correcciones-${ETQ}/aplicar-y-aprobar.sql y ${IMPORT}/aplicar-y-aprobar.sql (normaliza identificadores de revisión, huellas y fechas de generación): mismo inventario de sentencias, y las únicas diferencias son las correcciones pedidas. Cualquier otra, hallazgo.
2. Ejecuta tú preparar-entrega.mjs (dos veces, mismos SHA-256 que dice el montador) y comprobar-entrega.mjs: todo en verde.
3. Cada corrección obligatoria está aplicada tal cual.
4. Pasa el escáner de secretos a lo que irá a Git de ${CICLO}/ y ${IMPORT}/: copia esos archivos (sin lo que ignora el .gitignore del ciclo) a una carpeta de ${SCRATCH} y ejecuta ${SCRATCH}/gitleaks/gitleaks dir <carpeta> --config rwadar-app/gitleaks.toml --redact=100 --no-banner. Lo que marque, hallazgo con su ruta.
Escribe ${CICLO}/VERIFICACION-ENTREGA.md en español llano. Tu respuesta final es el objeto estructurado (conforme solo si todo está bien).`

phase('Montar')
const m1 = await agent(promptMontar, { label: 'montar', phase: 'Montar', schema: RESUMEN, effort: 'xhigh' })
if (!m1) throw new Error('El montador no devolvió resultado')
log(`Montada: revisión ${m1.revisionId}, ${m1.ofertas} ofertas (${m1.colecciones}), ${m1.sentencias} sentencias, SHA ${m1.sha256AplicarYAprobar.slice(0, 12)}…`)

phase('Revisar')
const revs = (await parallel([
  () => agent(promptRevisarSql(m1), { label: 'revisar:sql', phase: 'Revisar', schema: REVISION, effort: 'max' }),
  () => agent(promptRevisarContenido(m1), { label: 'revisar:contenido', phase: 'Revisar', schema: REVISION, effort: 'max' }),
  () => agent(promptRevisarCumplimiento(m1), { label: 'revisar:cumplimiento', phase: 'Revisar', schema: REVISION, effort: 'max' }),
])).filter(Boolean)
for (const r of revs) log(`Revisión ${r.lente}: ${r.veredicto}, ${r.obligatorias.length} obligatorias`)
if (revs.length < 3) throw new Error('Falta una de las tres revisiones independientes')
if (revs.some(r => r.veredicto === 'rechazado')) return { estado: 'rechazada', montaje: m1, revisiones: revs }

const obligatorias = revs.flatMap(r => r.obligatorias)
if (!obligatorias.length && revs.every(r => !r.recomendadas.length)) return { estado: 'aprobada', montaje: m1, revisiones: revs }

phase('Corregir')
const m2 = await agent(promptCorregir(m1, revs), { label: 'corregir', phase: 'Corregir', schema: RESUMEN, effort: 'xhigh' })
if (!m2) throw new Error('El corrector no devolvió resultado')

phase('Verificar')
const v = await agent(promptVerificar(m1, m2, revs), { label: 'verificar', phase: 'Verificar', schema: VERIF, effort: 'max' })
log(`Verificación: ${v ? v.veredicto : 'sin resultado'}`)
return { estado: v && v.veredicto === 'conforme' ? 'aprobada_con_correcciones' : 'pendiente_de_verificacion', montaje: m1, revisiones: revs, correccion: m2, verificacion: v }
