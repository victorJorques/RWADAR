export const meta = {
  name: 'entrega-catalogo',
  description: 'RWAdar: monta la entrega del catálogo con el motor (decisiones.json → datos, SQL, PGlite y «después de aplicar»), la revisan tres expertos independientes (SQL e integridad; contenido y tarjetas; cumplimiento) empezando por el diff frente a la entrega anterior, se corrige en decisiones.json y cierra una comprobación determinista del SQL (o un auditor si la corrección cambió el SQL)',
  whenToUse: 'Dentro del ciclo «haz la investigación» (skill investigacion-catalogo), cuando DECISIONES-COORDINADOR.md está cerrado. Rápido: fase montar; después fase revisar con UNA lente por lanzamiento, los tres lanzamientos en el mismo mensaje (así revisan a la vez: cada flujo solo corre 2 agentes); después fase cerrar con las tres revisiones. No aplica nada en Supabase ni publica.',
  phases: [
    { title: 'Montar', detail: 'el montador escribe decisiones.json y ejecuta el motor: preparar (dos veces), comprobar en PGlite, diff para los revisores y ensayo «después de aplicar» en una copia' },
    { title: 'Revisar', detail: 'tres revisores independientes (SQL e integridad; contenido, tarjetas y fuentes; cumplimiento), empezando por DIFF-ENTREGA.md' },
    { title: 'Corregir', detail: 'aplica las correcciones obligatorias en decisiones.json y repite el motor y las pruebas' },
    { title: 'Comprobar', detail: 'motor.mjs auditar: rehace la entrega, mismo inventario de sentencias, diff normalizado del SQL frente al revisado, PGlite y escáner de secretos' },
    { title: 'Auditar', detail: 'solo si la corrección cambió el SQL: auditor independiente de que cada diferencia es una corrección pedida' },
  ],
}

// args = {
//   etiqueta: 'AAAA-MM-DD[.N]', fecha: 'AAAA-MM-DD', ciclo: 'rwadar-app/data/verificaciones/<etiqueta>-v2',
//   desde: '<etiqueta publicada>', previa: { revisionId, hash }, ultimoDia: 'AAAA-MM-DD', scratch: '<carpeta temporal>',
//   extra: 'indicaciones del coordinador para este día',
//   fase: 'todo' (por omisión) | 'montar' | 'revisar' | 'cerrar',
//   lentes: ['sql', 'contenido', 'cumplimiento'] (fase revisar; por omisión las tres),
//   montaje: <lo que devolvió la fase montar> (fases revisar y cerrar),
//   revisiones: [<lo que devolvió cada revisor>] (fase cerrar: las tres),
//   motor: true (por omisión). false solo para un día con altas o retiradas, que el motor no monta: entonces el montador
//          copia y adapta a mano los guiones de args.modelo (la última entrega completa sin motor), como hasta el 12/11.
// }
const A = args || {}
const FASE = A.fase || 'todo'
const FASES = ['todo', 'montar', 'revisar', 'cerrar']
if (!FASES.includes(FASE)) throw new Error(`args.fase debe ser una de ${FASES.join(', ')}`)
for (const k of ['etiqueta', 'fecha', 'ciclo', 'desde', 'previa', 'ultimoDia', 'scratch'])
  if (!A[k]) throw new Error(`args.${k} es obligatorio`)
const CON_MOTOR = A.motor !== false
if (!CON_MOTOR && !A.modelo) throw new Error('args.modelo es obligatorio sin motor (la última entrega completa con guiones a mano)')
const { etiqueta: ETQ, fecha: FECHA, ciclo: CICLO, desde: DESDE, previa: PREVIA, ultimoDia: ULTIMO, scratch: SCRATCH } = A
const IMPORT = `rwadar-app/data/importaciones/catalogo-${ETQ}-v2`
const M = 'node .claude/skills/investigacion-catalogo/entrega/motor.mjs'
const REVISADO = `${SCRATCH}/sql-revisado-${ETQ}` // copia del SQL tal como lo vieron los revisores
const LENTES = ['sql', 'contenido', 'cumplimiento']
// Marca de cada revisión (no es el sello de publicación): la pone la fase «revisar» y la comprueba «cerrar». Entre
// fases, el coordinador copia las revisiones a mano; si al copiarlas se pierde o cambia algo (una corrección
// obligatoria, un veredicto), «cerrar» para. Es una suma FNV-1a del JSON con las claves ordenadas: detecta errores al
// copiar, no es una firma.
const canon = v => Array.isArray(v) ? `[${v.map(canon).join(',')}]`
  : v && typeof v === 'object' ? `{${Object.keys(v).filter(k => k !== 'marca' && v[k] !== undefined).sort().map(k => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`
  : JSON.stringify(v)
const marca = r => { const t = canon(r); let h = 0x811c9dc5; for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 0x01000193) >>> 0; return `${t.length}.${h.toString(16)}` }

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
const COMPROBACION = {
  type: 'object',
  properties: {
    orden: { type: 'string', description: 'la orden exacta que ejecutaste' },
    salida: { type: 'integer', description: 'código de salida de la orden' },
    veredicto: { type: 'string', enum: ['conforme_sin_cambios_en_el_sql', 'sql_cambiado_falta_auditor', 'no_conforme'] },
    sqlCambia: { type: 'boolean' }, mismoInventario: { type: 'boolean' }, copiaEsLaRevisada: { type: 'boolean' },
    sha256Final: { type: 'string' }, pglite: { type: 'string', description: 'comprobar.resultado tal cual' },
    secretos: { type: 'string', description: 'secretos.salida tal cual' },
    diferencias: { type: 'array', items: { type: 'string' }, description: 'cada sentencia que cambia con sus palabras, tal cual' },
    hallazgos: { type: 'array', items: { type: 'string' } },
    obligatoriasSinSql: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' }, aplicada: { type: 'boolean' }, evidencia: { type: 'string', description: 'archivo y texto encontrado' },
    }, required: ['id', 'aplicada', 'evidencia'] } },
  },
  required: ['orden', 'salida', 'veredicto', 'sqlCambia', 'mismoInventario', 'copiaEsLaRevisada', 'sha256Final', 'pglite', 'secretos', 'diferencias', 'hallazgos', 'obligatoriasSinSql'],
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
Procedimiento: docs/tareas/CICLO-DIARIO-CATALOGO.md (§3, §5 y «Normas de las tarjetas»). ${CON_MOTOR
  ? `La entrega la hace el motor (.claude/skills/investigacion-catalogo/entrega/, manual en FORMATO.md): lo propio de hoy está en ${CICLO}/decisiones.json y las guardas en el motor; los guiones de la carpeta del ciclo son de tres líneas y lo llaman. Orden: ${M} <preparar|comprobar|revisar|auditar|despues> ${ETQ}. Ejemplo real completo: rwadar-app/data/verificaciones/2026-11-12-v2/decisiones.json.`
  : `Modelo de una entrega completa: ${A.modelo}/ (preparar-entrega.mjs, comprobar-entrega.mjs, despues-de-aplicar.mjs, ensayo-rest-simulado.cjs, INFORME-ENTREGA.md, REVISION-ENTREGA.md).`} La publicada y su base: rwadar-app/data/verificaciones/${DESDE}-v2/.
Prohibido: tocar Supabase o cualquier servicio remoto, publicar, lanzar flujos de GitHub, git commit/push, editar los expedientes o los informes de los revisores. Las pruebas pesadas (npm test, ensayo) solo en una copia aparte dentro de ${SCRATCH}. Nombres de personas físicas: ninguno en lo que va a Git.${A.extra ? `\nIndicaciones del coordinador: ${A.extra}` : ''}`

const ENSAYO = `Ensayo completo «después de aplicar» en una copia aparte (git clone --local de este repositorio a ${SCRATCH}/ensayo-${ETQ}, con tus archivos de ${CICLO}/ y ${IMPORT}/ copiados encima): node ${CICLO}/comprobar-entrega.mjs --exportar=<dir>, sincronizar.js con el REST simulado (ensayo-rest-simulado.cjs), node ${CICLO}/despues-de-aplicar.mjs, volcar-seed.js con el REST simulado, node rwadar-editorial-source/ofertas/transparencia.mjs, node rwadar-fichas.js y npm test (raíz). Guarda el resultado en ${CICLO}/ensayo-despues.json y ${CICLO}/pruebas-locales.json.`

const promptMontarMotor = `${CONTEXTO}

Eres el MONTADOR de datos y SQL: ingeniero de datos sénior, experto en PostgreSQL, PGlite y en el importador del catálogo de RWAdar (rwadar-app/catalogo-publico.js). Ya no copias ni adaptas guiones: escribes las decisiones del día en un archivo de datos y el motor hace el resto con sus guardas.
1. ${CICLO}/decisiones.json, según FORMATO.md («Cómo escribe el montador decisiones.json»): copia el de la última entrega con motor (el de ${DESDE} si lo tiene; si no, el del 12/11), cambia la cabecera (etiqueta, fecha, desde, previa {revisionId, hash, ultimoDia} del revision.json de la publicada, ultimoDia, cadena con el lote de ayer, lecturaPublica de lectura-publica/hora-lectura.txt, radar, candidatas) y vacía ofertas, noAplicado, contraste y transparencia. Después, un cambio con su prueba (fuente, literal y hora de hoy) por cada punto de DECISIONES §2: re-fechas con «claim» del expediente; cifras con «copia» y «calculos». Lo que el expediente propone y no entra, en «difiere» con su motivo; lo que no se aplica tal cual, en «noAplicado» con «sigue».
2. ${M} guiones ${ETQ} (los tres guiones finos y ensayo-rest-simulado.cjs en la carpeta del ciclo).
3. ${M} preparar ${ETQ} --repetir, hasta que pase. Si el motor para con «NO: …», arréglalo en decisiones.json (nunca a mano en las salidas ni en el motor) y repite. Si DECISIONES pide un alta o una retirada (el motor no las monta), para y dilo en noAplicado: el coordinador relanzará con motor:false.
4. ${M} comprobar ${ETQ} --exportar=${SCRATCH}/exportado-${ETQ} (PGlite: inventario, guarda, idempotencia, cada cambio visible, tarjetas, sincronizador real, fichas y los casos de fallo).
5. ${M} revisar ${ETQ}: escribe ${CICLO}/DIFF-ENTREGA.md, el punto de partida de los revisores.
6. Copia los tres archivos de ${IMPORT}/ (aplicar-y-aprobar.sql, catalogo.sql, revision.json) a ${REVISADO}/: es lo que verán los revisores y con lo que se comparará la corrección.
7. ${ENSAYO} El ensayo no necesita tu atención (unos 5 min, casi todo npm test): lánzalo en segundo plano en cuanto pase el paso 3 y sigue con los pasos 4–6 y 8 mientras corre; espera a su resultado antes de responder.
8. INFORME-ENTREGA.md en español llano: partida, revisión/huella/SHA-256, qué cambia (antes → ahora) por oferta (puedes partir de DIFF-ENTREGA.md), el SQL (inventario), las pruebas con su salida real, lo que no se aplicó tal cual y por qué, y los pasos para aplicarla.
Tu respuesta final es el objeto estructurado, con la salida real de cada prueba.`

const promptMontarManual = `${CONTEXTO}

Eres el MONTADOR de datos y SQL: ingeniero de datos sénior, experto en PostgreSQL, PGlite y en el importador del catálogo de RWAdar (rwadar-app/catalogo-publico.js). Hoy hay un alta o una retirada, que el motor no monta: trabajas con guiones propios, con el rigor de quien publica datos financieros (cada cambio con su assert, nada implícito). Escribe en ${CICLO}/:
1. preparar-entrega.mjs: sin red, reproducible byte a byte (ninguna salida depende de la hora). Comprueba que la «${DESDE}» local da exactamente la revisión y la huella publicadas, que el catálogo sincronizado de la web (rwadar-site/assets/catalogo-publico-20261022.js) es esa revisión y que la lectura pública de hoy coincide con la base local. Aplica SOLO lo de DECISIONES (cada texto «antes» se exige tal cual con assert: si no está, falla). Genera escaparate-publicacion.json, documentacion-ofertas.json, radar-canonico-26.json, manifiesto-catalogo.json y ${IMPORT}/{catalogo.sql,aplicar-y-aprobar.sql,revision.json}, con la guarda (publicada exacta, huella, no retirado, fecha tope ${ULTIMO}).
2. comprobar-entrega.mjs (PGlite, sin red, sobre la misma cadena que producción, como el del modelo): inventario de todas las sentencias y tablas (solo rwadar_catalogo y la aprobación); antes de aplicar, PGlite enseña lo leído hoy como visitante; después, la revisión nueva con sus cantidades, colecciones, fechas y vigencia; idempotencia; public.plataformas, public.fuentes y el historial intactos; cada cifra y texto cambiado; lo que verá el inversor en cada tarjeta (resumenOferta de rwadar-site/assets/ficha-editorial-20261022.js: mínimo, España y salida); lo que leen la web y la app; y los casos de fallo (otra publicada, otra huella, catálogo retirado, después del ${ULTIMO}) sin dejar nada. Con --exportar=DIR guarda lo que leería un visitante después de aplicar.
3. despues-de-aplicar.mjs: pone al día rwadar-editorial-source/ofertas/transparencia.json (fecha nueva solo donde el expediente de hoy volvió a consultar esa misma fuente; mínimos cortos nuevos que salen del texto largo del catálogo) y se niega a tocar nada si el catálogo sincronizado no es la revisión nueva. Repetible.
4. Copia ensayo-rest-simulado.cjs del modelo. ${ENSAYO}
5. Ejecuta preparar-entrega.mjs dos veces y comprueba que todas sus salidas son idénticas (SHA-256). Copia los tres archivos de ${IMPORT}/ a ${REVISADO}/.
6. INFORME-ENTREGA.md en español llano: partida, revisión/huella/SHA-256, qué cambia (antes → ahora) por oferta, el SQL (inventario), las pruebas con su salida real, lo que no se aplicó tal cual y por qué, y los pasos para aplicarla.
Tu respuesta final es el objeto estructurado, con la salida real de cada prueba.`

const PUNTO_DE_PARTIDA = CON_MOTOR
  ? `Empieza por ${CICLO}/DIFF-ENTREGA.md (lo que cambia frente a la entrega «${DESDE}»: cambios por ficha, tarjetas y las sentencias del SQL que cambian algo más que la revisión, la huella y la fecha). Te dice por dónde mirar; no sustituye tus pruebas: compruébalo tú.`
  : `Compara tú con la entrega «${DESDE}» para ver qué cambia.`

const promptRevisarSql = m => `${CONTEXTO}

Eres el REVISOR INDEPENDIENTE de SQL e integridad: DBA sénior de PostgreSQL y Supabase, especialista en auditar cambios de datos en producción (transacciones, aislamiento, guardas, idempotencia, permisos). No montaste esta entrega. El montador dice: ${JSON.stringify(m)}.
${PUNTO_DE_PARTIDA}
Intenta tumbarla:
- Inventaría TODAS las sentencias de ${IMPORT}/aplicar-y-aprobar.sql y catalogo.sql y las tablas que tocan (no busques palabras: cuéntalas y clasifícalas tú, sin fiarte del inventario del motor). Solo datos editoriales de la revisión nueva en rwadar_catalogo y su aprobación; nada de usuarios, Auth, RLS, ACL, funciones, esquema, capacidades, servicios ni credenciales.
- La guarda: publicada exacta (${PREVIA.revisionId}), huella, no retirado, fecha tope ${ULTIMO}, transacción serializable, que falle sin dejar nada.
- ${CON_MOTOR ? `Rehaz tú la entrega en una carpeta aparte (${M} preparar ${ETQ} --repetir --salida=${SCRATCH}/rev-sql-${ETQ}) y comprueba que sale igual byte a byte a la de la carpeta; ejecuta tú ${M} comprobar ${ETQ}.` : 'Ejecuta tú comprobar-entrega.mjs y preparar-entrega.mjs (dos veces; mismos SHA-256).'} Compara escaparate-publicacion.json y documentacion-ofertas.json con los de rwadar-app/data/verificaciones/${DESDE}-v2/ campo a campo: cada diferencia debe estar en DECISIONES; lista cualquier otra.
- despues-de-aplicar y transparencia.json: que no ponga fechas de hoy a comprobaciones que no se repitieron hoy.
- Datos personales y posibles falsos positivos del escáner de secretos en lo que va a Git (direcciones, IDs, JSON crudos).
Escribe ${CICLO}/REVISION-ENTREGA-sql.md (español llano: qué ejecutaste y qué salió, inventario, hallazgos y correcciones obligatorias con el cambio exacto). No edites nada más. Tu respuesta final es el objeto estructurado.`

const promptRevisarContenido = m => `${CONTEXTO}

Eres el REVISOR INDEPENDIENTE de contenido: analista sénior de producto financiero para el inversor particular en España, experto en las normas de las tarjetas de RWAdar y en explicar en castellano llano sin perder exactitud. No montaste esta entrega. El montador dice: ${JSON.stringify(m)}.
${PUNTO_DE_PARTIDA}
Intenta tumbarla, ficha por ficha:
- Cada cambio de DECISIONES está aplicado tal cual, con su fuente y su fecha de dato y de consulta; nada más cambia.
- Cada texto visible nuevo o cambiado (resumen, métricas, avisos, referencias de la tarjeta, mínimo, acceso desde España y salida) está en castellano llano, respaldado, sin promesas, con fechas DD/MM correctas y ≤ 120 caracteres donde toca. En reventa y próximas, ni rentabilidad ni precio principal; en el mínimo nunca «por participación/token/acción».
- Ejecuta resumenOferta (rwadar-site/assets/ficha-editorial-20261022.js) con cada oferta de escaparate-publicacion.json que cambie o entre y comprueba lo que enseñará la tarjeta en la web y en la app (mínimo y España en corto).
- Abre tú hoy, por muestreo, la fuente primaria de al menos 4 cifras cambiadas (rentabilidad de Spiko, un precio de reventa de Brickwise, el oráculo de mTBILL y el documento de Hausera, o las que hayan cambiado) y comprueba que la cifra y la fecha publicadas coinciden.
- Avisos con fecha: no se ha re-fechado ninguno que no se comprobara hoy.
Escribe ${CICLO}/REVISION-ENTREGA-contenido.md (español llano: hechos con URL, literal corto y hora UTC; correcciones obligatorias con el texto exacto). No edites nada más. Tu respuesta final es el objeto estructurado.`

const promptRevisarCumplimiento = m => `${CONTEXTO}

Eres el REVISOR INDEPENDIENTE de cumplimiento normativo: jurista experto en MiFID II, MiCA, el Reglamento de Folletos (UE) 2017/1129, el Reglamento de financiación participativa (UE) 2020/1503, el régimen piloto DLT y la Circular 2/2020 de la CNMV sobre publicidad de productos de inversión. RWAdar es un medio editorial gratuito, sin comisiones ni publicidad. No montaste esta entrega. El montador dice: ${JSON.stringify(m)}.
${PUNTO_DE_PARTIDA}
Intenta tumbarla desde tu especialidad, ficha por ficha de lo que cambia o entra:
- Ningún texto presenta como hecho lo que solo dice el emisor; ninguna promesa de rentabilidad, garantía o liquidez; las rentabilidades llevan base, fecha y que no garantizan nada; los riesgos importantes (pérdida del capital, liquidez, emisor no supervisado, sin folleto/KID, conflictos de fuentes) están en los avisos.
- El acceso desde España se apoya en una fuente primaria que de verdad lo diga (pasaporte o notificación a la CNMV, condiciones con lista de países, folleto con España como país de oferta pública); si no, lo dice como «sin confirmar».
- Las normas legales del sitio: el botón dice «Ver oferta en X» solo si se contrata hoy desde España Y está supervisada; si no, «Ir a la web del proveedor (sales de RWAdar)» (busca la regla en rwadar-site/ y en docs/legal/). Comprueba qué saldrá para cada ficha que cambie o entre.
- Advertencias de la CNMV sobre cada entidad nueva o con cambios de acceso: búscalas tú hoy.
- Datos personales: ninguno en lo que va a Git.
Escribe ${CICLO}/REVISION-ENTREGA-cumplimiento.md (español llano: hechos con URL, literal corto y hora UTC; correcciones obligatorias con el texto exacto). No edites nada más. Tu respuesta final es el objeto estructurado.`

const REVISORES = { sql: promptRevisarSql, contenido: promptRevisarContenido, cumplimiento: promptRevisarCumplimiento }

const promptCorregir = (m, revs) => `${CONTEXTO}

Eres el MONTADOR (otro turno). Tu entrega anterior: ${JSON.stringify(m)}. Los revisores independientes piden:
${JSON.stringify(revs)}
Aplica TODAS las correcciones obligatorias, y las recomendadas solo si no amplían el alcance de DECISIONES ni cambian cifras sin fuente (di cuáles aplicas y cuáles no, y por qué). No toques ${REVISADO}/: es el SQL que vieron los revisores. ${CON_MOTOR
  ? `Lo que cambie la entrega (textos, cifras, avisos) se cambia SOLO en ${CICLO}/decisiones.json y se rehace con el motor (${M} preparar ${ETQ} --repetir, ${M} comprobar ${ETQ}, ${M} revisar ${ETQ}); nunca a mano en el SQL ni en los JSON de salida (la comprobación siguiente rehace la entrega desde decisiones.json y lo detectaría). Lo que no es de la entrega (por ejemplo, recortar un nombre en una copia de una fuente) se corrige en su archivo.`
  : 'Después vuelve a ejecutar preparar-entrega.mjs (dos veces, mismas salidas) y comprobar-entrega.mjs.'} Repite el ensayo «después de aplicar» con npm test en la copia aparte. Añade a INFORME-ENTREGA.md la sección «Correcciones aplicadas» (cada una con su id) y al final de cada informe de revisión NO escribas nada. Tu respuesta final es el objeto estructurado con la revisión, la huella y el SHA-256 nuevos.`

const ordenAuditar = m => `${M} auditar ${ETQ} --antes=${REVISADO} --revisado=${m.sha256AplicarYAprobar} --secretos=${SCRATCH}/gitleaks/gitleaks --exigir-secretos --escribir`

const promptComprobar = (m, obligatorias) => `${CONTEXTO}

Eres el COMPROBADOR: no montaste ni corregiste ni revisaste esta entrega. Tu trabajo es mecánico y no admite interpretación.
1. Ejecuta EXACTAMENTE, desde la raíz del repositorio, esta orden (tarda menos de un minuto):
   ${ordenAuditar(m)}
   Rehace la entrega desde decisiones.json dos veces en una carpeta aparte, compara el inventario de sentencias y el diff normalizado del SQL frente al que vieron los revisores, pasa el ensayo en PGlite y el escáner de secretos, y escribe ${CICLO}/VERIFICACION-ENTREGA.md. Si ${SCRATCH}/gitleaks/gitleaks no existe, NO lo busques ni lo sustituyas: la orden sale «no_conforme» y así se devuelve.
   Copia en tu respuesta, tal cual y sin redondear ni resumir, lo que imprime: código de salida, veredicto, sqlCambia, mismoInventario, copiaEsLaRevisada, sha256.ahora, comprobar.resultado, secretos.salida, cada diferencia (sentencia y palabras) y cada hallazgo.
2. Estas correcciones obligatorias no cambian el SQL; comprueba en los archivos que cada una está aplicada tal cual (busca el texto exacto pedido y di en qué archivo está):
${JSON.stringify(obligatorias.filter(o => !o.cambiaSql).map(o => ({ id: o.id, correccion: o.correccion })))}
No edites nada. Tu respuesta final es el objeto estructurado.`

const promptAuditar = (antes, despues, revs, comp) => `${CONTEXTO}

Eres el AUDITOR final: auditor independiente de cambios en producción (no montaste, ni corregiste, ni revisaste). La corrección CAMBIÓ el SQL. Antes de las correcciones: ${JSON.stringify(antes)}. Después: ${JSON.stringify(despues)}. Correcciones pedidas: ${JSON.stringify(revs.map(r => ({ lente: r.lente, obligatorias: r.obligatorias })))}.
La comprobación determinista (${ordenAuditar(antes)}) ya dio: ${JSON.stringify(comp)}. Está en ${CICLO}/VERIFICACION-ENTREGA.md.
Comprueba:
1. Cada diferencia del SQL entre ${REVISADO}/aplicar-y-aprobar.sql y ${IMPORT}/aplicar-y-aprobar.sql es una corrección pedida, y cada corrección pedida que cambia el SQL está. Mira tú el diff normalizado (no te fíes solo del resumen): mismo inventario de sentencias y nada más. Cualquier otra diferencia, hallazgo.
2. Vuelve a ejecutar tú ${M} preparar ${ETQ} --repetir y ${M} comprobar ${ETQ}: todo en verde y el mismo SHA-256 que dice el montador.
3. Cada corrección obligatoria (también las que no cambian el SQL) está aplicada tal cual.
4. El escáner de secretos sobre lo que irá a Git: si la comprobación no lo pasó, pásalo tú (${SCRATCH}/gitleaks/gitleaks dir <copia> --config rwadar-app/gitleaks.toml --redact=100 --no-banner).
Añade al final de ${CICLO}/VERIFICACION-ENTREGA.md la sección «Auditor» en español llano (no borres lo de arriba). Tu respuesta final es el objeto estructurado (conforme solo si todo está bien).`

// Sin motor (altas o retiradas) no hay decisiones.json y «motor.mjs auditar» no sirve: verifica el auditor de siempre.
const promptVerificarSinMotor = (antes, despues, revs) => `${CONTEXTO}

Eres el VERIFICADOR final: auditor independiente de cambios en producción (no montaste ni corregiste). Antes de las correcciones: ${JSON.stringify(antes)}. Después: ${JSON.stringify(despues)}. Correcciones pedidas: ${JSON.stringify(revs.map(r => ({ lente: r.lente, obligatorias: r.obligatorias })))}.
Comprueba:
1. Diff normalizado entre ${REVISADO}/aplicar-y-aprobar.sql y ${IMPORT}/aplicar-y-aprobar.sql (normaliza identificadores de revisión, huellas y fechas de generación): mismo inventario de sentencias, y las únicas diferencias son las correcciones pedidas. Cualquier otra, hallazgo.
2. Ejecuta tú preparar-entrega.mjs (dos veces, mismos SHA-256 que dice el montador) y comprobar-entrega.mjs: todo en verde.
3. Cada corrección obligatoria está aplicada tal cual.
4. Pasa el escáner de secretos a lo que irá a Git de ${CICLO}/ y ${IMPORT}/: copia esos archivos (sin lo que ignora el .gitignore del ciclo) a una carpeta de ${SCRATCH} y ejecuta ${SCRATCH}/gitleaks/gitleaks dir <carpeta> --config rwadar-app/gitleaks.toml --redact=100 --no-banner. Lo que marque, hallazgo con su ruta.
Escribe ${CICLO}/VERIFICACION-ENTREGA.md en español llano. Tu respuesta final es el objeto estructurado (conforme solo si todo está bien).`

// ------------------------------------------------------------------ fases
async function montar() {
  phase('Montar')
  const m = await agent(CON_MOTOR ? promptMontarMotor : promptMontarManual, { label: 'montar', phase: 'Montar', schema: RESUMEN, effort: CON_MOTOR ? 'high' : 'xhigh' })
  if (!m) throw new Error('El montador no devolvió resultado')
  log(`Montada: revisión ${m.revisionId}, ${m.ofertas} ofertas (${m.colecciones}), ${m.sentencias} sentencias, SHA ${m.sha256AplicarYAprobar.slice(0, 12)}…`)
  return m
}

async function revisar(m, lentes) {
  phase('Revisar')
  if (lentes.length > 2) log('Este flujo solo corre 2 agentes a la vez: el tercer revisor espera. Para que revisen los tres a la vez, lanza la fase «revisar» una vez por lente, en el mismo mensaje.')
  // La lente la pone el flujo (la del revisor es texto libre), para que «cerrar» sepa cuál es cuál.
  const revs = (await parallel(lentes.map(l => () =>
    agent(REVISORES[l](m), { label: `revisar:${l}`, phase: 'Revisar', schema: REVISION, effort: 'max' })
      .then(r => r && (x => ({ ...x, marca: marca(x) }))({ ...r, lente: l }))))).filter(Boolean)
  for (const r of revs) log(`Revisión ${r.lente}: ${r.veredicto}, ${r.obligatorias.length} obligatorias`)
  return revs
}

async function cerrar(m1, revs) {
  if (revs.length < 3) throw new Error('Falta una de las tres revisiones independientes')
  if (revs.some(r => r.veredicto === 'rechazado')) return { estado: 'rechazada', montaje: m1, revisiones: revs }
  const obligatorias = revs.flatMap(r => r.obligatorias)
  if (!obligatorias.length && revs.every(r => !r.recomendadas.length)) return { estado: 'aprobada', montaje: m1, revisiones: revs }

  phase('Corregir')
  const m2 = await agent(promptCorregir(m1, revs), { label: 'corregir', phase: 'Corregir', schema: RESUMEN, effort: 'high' })
  if (!m2) throw new Error('El corrector no devolvió resultado')

  if (!CON_MOTOR) {
    phase('Auditar')
    const v = await agent(promptVerificarSinMotor(m1, m2, revs), { label: 'auditar', phase: 'Auditar', schema: VERIF, effort: 'max' })
    log(`Auditor (sin motor): ${v ? v.veredicto : 'sin resultado'}`)
    return { estado: v && v.veredicto === 'conforme' ? 'aprobada_con_correcciones' : 'pendiente_de_verificacion', montaje: m1, revisiones: revs, correccion: m2, verificacion: v }
  }

  phase('Comprobar')
  const comp = await agent(promptComprobar(m1, obligatorias), { label: 'comprobar', phase: 'Comprobar', schema: COMPROBACION, effort: 'medium' })
  if (!comp) throw new Error('La comprobación determinista no devolvió resultado')
  log(`Comprobación determinista: ${comp.veredicto} (salida ${comp.salida}), ${comp.diferencias.length} sentencias cambian`)
  const hallazgos = [...comp.hallazgos]
  if (comp.salida !== 0 || comp.veredicto === 'no_conforme') hallazgos.push(`la comprobación determinista no es conforme (salida ${comp.salida})`)
  if (!comp.copiaEsLaRevisada) hallazgos.push('la copia de antes de corregir no es el SQL que vieron los revisores')
  if (!comp.mismoInventario) hallazgos.push('cambia el inventario de sentencias')
  if (comp.sha256Final !== m2.sha256AplicarYAprobar) hallazgos.push(`el SHA-256 final (${comp.sha256Final}) no es el que dice el corrector (${m2.sha256AplicarYAprobar})`)
  if (comp.pglite !== 'correcto') hallazgos.push(`el ensayo en PGlite no dio «correcto» (${comp.pglite})`)
  if (comp.secretos !== 'sin hallazgos') hallazgos.push(`el escáner de secretos no dio «sin hallazgos» (${comp.secretos})`)
  // Ante cualquier señal de que el SQL cambió, sigue el auditor (aunque otro campo diga lo contrario).
  const sqlCambia = comp.sqlCambia || comp.veredicto !== 'conforme_sin_cambios_en_el_sql' || comp.diferencias.length > 0
  const pedidasSql = obligatorias.filter(o => o.cambiaSql).map(o => o.id)
  if (!sqlCambia && pedidasSql.length) hallazgos.push(`pedían cambiar el SQL (${pedidasSql.join(', ')}) y el SQL no cambió`)
  for (const o of comp.obligatoriasSinSql) if (!o.aplicada) hallazgos.push(`corrección ${o.id} sin aplicar: ${o.evidencia}`)
  const faltan = obligatorias.filter(o => !o.cambiaSql && !comp.obligatoriasSinSql.some(c => c.id === o.id)).map(o => o.id)
  if (faltan.length) hallazgos.push(`la comprobación no miró las correcciones ${faltan.join(', ')}`)
  if (hallazgos.length) return { estado: 'pendiente_de_verificacion', montaje: m1, revisiones: revs, correccion: m2, comprobacion: comp, hallazgos }

  if (!sqlCambia) {
    log('El SQL no cambió con la corrección: basta la comprobación determinista, sin auditor.')
    return { estado: 'aprobada_con_correcciones', montaje: m1, revisiones: revs, correccion: m2, comprobacion: comp }
  }

  phase('Auditar')
  const v = await agent(promptAuditar(m1, m2, revs, comp), { label: 'auditar', phase: 'Auditar', schema: VERIF, effort: 'max' })
  log(`Auditor: ${v ? v.veredicto : 'sin resultado'}`)
  return { estado: v && v.veredicto === 'conforme' ? 'aprobada_con_correcciones' : 'pendiente_de_verificacion', montaje: m1, revisiones: revs, correccion: m2, comprobacion: comp, verificacion: v }
}

// ------------------------------------------------------------------ orden
if (FASE === 'montar') return { estado: 'montada', montaje: await montar() }

if (FASE === 'revisar') {
  if (!A.montaje) throw new Error('args.montaje es obligatorio en la fase revisar (lo que devolvió la fase montar)')
  const lentes = A.lentes || LENTES
  for (const l of lentes) if (!LENTES.includes(l)) throw new Error(`lente desconocida «${l}» (${LENTES.join(', ')})`)
  return { estado: 'revisada', revisiones: await revisar(A.montaje, lentes) }
}

if (FASE === 'cerrar') {
  if (!A.montaje || !Array.isArray(A.revisiones)) throw new Error('args.montaje y args.revisiones son obligatorios en la fase cerrar')
  const vistas = A.revisiones.map(r => r && r.lente)
  for (const l of LENTES) if (!vistas.some(v => String(v || '').toLowerCase().includes(l))) throw new Error(`falta la revisión de ${l}`)
  for (const r of A.revisiones) if (!r || !r.marca || r.marca !== marca(r))
    throw new Error(`la revisión de ${r && r.lente} no es la que devolvió su revisor (sin marca o cambiada al copiarla): pásala tal cual, con su marca`)
  return cerrar(A.montaje, A.revisiones)
}

const m1 = await montar()
return cerrar(m1, await revisar(m1, LENTES))
