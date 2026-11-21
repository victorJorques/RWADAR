export const meta = {
  name: 'auditoria-completa-catalogo',
  description: 'RWAdar: auditoría exhaustiva, oferta por oferta y dato por dato, contra la fuente primaria de hoy, de lo que se va a publicar (más radar, noticias y web)',
  whenToUse: 'Dentro del ciclo «haz la investigación» (skill investigacion-catalogo), en cuanto DECISIONES-COORDINADOR.md tiene §2: lánzalo varias veces a la vez, con 2 grupos cada vez (cada flujo solo corre 2 agentes). Grupos de referencia del 20/11: spiko, acciones-oro-tesoro, brickwise-a, brickwise-b, suiza-hausera, radar-plataformas, noticias y sitio-web.',
  phases: [{ title: 'Auditar', detail: 'un auditor por grupo; abre hoy la fuente de cada dato visible e intenta tumbarlo' }],
}
// args = { fecha, ciclo, base, grupos: [{ id, tarea }] }: ver el ciclo del 20/11 en la skill.
const { fecha: FECHA, ciclo: CICLO, base: BASE, grupos: GRUPOS } = args
const HALLAZGOS = {
  type: 'object',
  properties: {
    ambito: { type: 'string' },
    datosComprobados: { type: 'integer', description: 'cuántos datos visibles abriste y comprobaste hoy en su fuente' },
    hallazgos: { type: 'array', items: { type: 'object', properties: {
      slug: { type: 'string' },
      campo: { type: 'string', description: 'qué dato visible (resumen, mínimo, acceso, salida, rentabilidad, métrica X, aviso X, referencia/documento X, texto de la web…)' },
      quedaria: { type: 'string', description: 'lo que se publicaría (texto exacto)' },
      fuenteDiceHoy: { type: 'string', description: 'literal corto de la fuente hoy' },
      url: { type: 'string' }, horaUtc: { type: 'string' },
      gravedad: { type: 'string', enum: ['obligatoria', 'recomendada'] },
      correccionExacta: { type: 'string', description: 'texto o cifra exacta que debería publicarse' },
    }, required: ['slug', 'campo', 'quedaria', 'fuenteDiceHoy', 'url', 'horaUtc', 'gravedad', 'correccionExacta'] } },
    sinPoderComprobar: { type: 'array', items: { type: 'string' } },
    resumen: { type: 'string' },
  },
  required: ['ambito', 'datosComprobados', 'hallazgos', 'sinPoderComprobar', 'resumen'],
}
const comun = `Ciclo del catálogo de RWAdar del ${FECHA}. Repositorio en /home/user/RWADAR (trabaja desde la raíz). Eres AUDITOR INDEPENDIENTE: no investigaste ni montaste nada de esto. Víctor ha pedido «revisa todas las ofertas e información bien»: tu trabajo es intentar TUMBAR cada dato visible, no confirmar por encima.

Lo que se va a publicar = lo publicado (${BASE}/escaparate-publicacion.json y ${BASE}/documentacion-ofertas.json) + los cambios de ${CICLO}/DECISIONES-COORDINADOR.md §2 y §4 (con sus textos exactos en ${CICLO}/expedientes/<slug>.json y las correcciones de ${CICLO}/revision-independiente/). Normas de las tarjetas: sección «Normas de las tarjetas» de docs/tareas/CICLO-DIARIO-CATALOGO.md. Cómo se ve la tarjeta: resumenOferta de rwadar-site/assets/ficha-editorial-20261022.js.

Reglas de acceso a fuentes: .claude/skills/investigacion-catalogo/acceso/ACCESO-FUENTES.md. Petición normal, TLS; prohibido eludir bloqueos (CAPTCHA, anti-bots, agente falso, VPN, cuentas, API internas con token). Si una fuente bloquea, usa la ruta legítima de ese archivo o anótalo en sinPoderComprobar. Hora: date -u.

Hazlo así: haz la lista de TODOS los datos visibles de cada ficha de tu ámbito (título, proveedor, resumen, mínimo, acceso desde España, salida/liquidez, rentabilidad o precio si lo lleva, cada métrica, cada aviso, cada referencia/documento con su URL y fecha, colección y botón) y abre HOY la fuente primaria de cada uno (los PDF: descarga y compara el SHA-256 con el de documentacion-ofertas o vigia.json; si es otro, léelo). Comprueba cifras recalculando, fechas DD/MM, que los enlaces respondan, que no haya promesas ni «por participación» en el mínimo, que reventa/próximas no lleven rentabilidad, que el acceso desde España se apoye en una fuente que lo diga y que los avisos de riesgo importantes estén. ${CICLO}/vigia.json tiene las cifras leídas por el vigía (su hora, en generadoUtc).

Solo es hallazgo lo que demuestres con URL, literal y hora de hoy. Gravedad «obligatoria»: dato falso, desfasado, sin respaldo, enlace roto, riesgo omitido o incumplimiento de las normas; «recomendada»: mejora de claridad. Sé concreto en correccionExacta. No edites ningún archivo del repositorio salvo tu informe ${CICLO}/auditoria/<tu-ambito>.md (español llano, sin nombres de personas físicas). Copias de fuentes, solo en /tmp/auditoria-${FECHA}/ (fuera del repositorio). Sin git. Tu respuesta final es el objeto estructurado.`
phase('Auditar')
const res = await parallel(GRUPOS.map(g => () => agent(`${comun}\n\nTu ámbito: «${g.id}». ${g.tarea}`, { label: `auditar:${g.id}`, phase: 'Auditar', schema: HALLAZGOS })))
return res