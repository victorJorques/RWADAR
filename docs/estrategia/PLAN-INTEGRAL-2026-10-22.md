> Borrador del 22/10/2026 hecho con agentes (analistas y 9 avatares simulados) sobre el lote del 21/10. Los avatares no sustituyen a clientes reales y las ideas de ingresos necesitan abogado antes de usarse.

# RWAdar · plan integral (22/10/2026)

*Une los cuatro informes de esta carpeta (`5p.md`, `5s.md`, `clones.md`, `producto.md`) y las 9 pruebas de avatar. Es una propuesta de trabajo, no un dictamen jurídico ni fiscal. No se ha tocado el repositorio, Supabase ni nada publicado.*

**Leyenda.** Esfuerzo: **S** = menos de 1 día · **M** = de 2 a 5 días · **L** = más de 1 semana. Impacto: **muy alto / alto / medio**.
Columna **Quién**: **Código** = lo puede hacer un agente en una rama, sin permisos especiales · **Víctor** = necesita dinero, cuentas, publicar o una decisión legal.

Cifras que he vuelto a contar hoy en `rwadar-app/data/verificaciones/2026-10-21-v2/` (no copiadas de los informes):
49 ofertas · `estadoRevision`: 42 `no_verificable`, 6 `actual`, 1 `fuentes_en_conflicto` · Reental 22, Brickwise 12, Midas 5, Aktionariat 5, Alius 2, Spiko 1, Prosegur 1, Hausera 1 · 35 inmobiliario · `disponibleEs`, `eu` y `puntuacion` vacíos en las 49 · `pais` vacío en 22 · 1 oferta con rentabilidad, 0 con precio · `verificadaEl` = 21/10 y `vigenciaDias` = 1 en las 49 · `patrocinada` = false en las 49 · 0 enlaces a `claude.ai` en el lote (pero 303 en `rwadar-site/assets/rwadar-20260820.js`) · `sitemap.xml` con 11 URL · 54 imágenes en `rwadar-movil/assets/ofertas-editoriales/`.

---

## 1 · Diagnóstico en una página

**Lo que funciona.** La base es seria: aviso de seguridad visible, fuente al lado de cada dato, descartes publicados, sin cookies, cabeceras de seguridad, ningún error en consola, imágenes explicativas en tres pasos que **todos** los avatares dicen que les ayudan. Ya existen «Ordenar por», filtros de región, acceso e importe, comparador en forma de matriz (`#vMat`) y Perfil con guardados.

**Lo que impide ser «el Booking de la tokenización»**, de más grave a menos:

1. **La promesa no se cumple todavía.** Prometemos «comprobado con fuente», pero solo 6 de 49 fichas (12 %) están comprobadas. Además todas dicen `verificadaEl: 21/10`, aunque las de Brickwise son datos del 27/09: **la fecha que enseñamos sugiere más frescura de la real.** Es el punto más delicado.
2. **Lo publicado está caducado y desordenado.** La web en línea usa el catálogo del 13/10; el del 21/10 (lote `c3b71e81`) está listo pero sin aplicar. `main` es del 07/10 y va por detrás de lo publicado. En la web conviven dos catálogos: listas escritas a mano en el JS y el lote.
3. **Un fallo de confianza en el código.** 303 enlaces «fuente» a un artefacto privado `claude.ai/code/artifact/09900c9d…` dentro del JS (49 en el JS publicado hoy, aunque no se pintan).
4. **Las tarjetas no ayudan a decidir.** 47 de 49 solo enseñan la moneda. El mismo aviso de 4 líneas sale en todas y tapa los avisos que importan. Faltan mínimo, cifra publicada, estado en una palabra, salida y supervisor: **los 9 avatares piden lo mismo**.
5. **Escaparate desequilibrado.** Reental es el 45 % y Brickwise el 24 %. Solo 3 de las 26 plataformas del radar tienen ofertas, y 5 plataformas con ofertas no están en el radar. Los avatares ven las 22 de Reental como «relleno» y eso les hace desconfiar del escaparate entero.
6. **Google no nos puede encontrar.** Ninguna ficha tiene URL propia: el sitemap tiene 11 direcciones y ninguna es de una oferta o plataforma.
7. **No hay motivo para volver.** No hay avisos, ni RSS, ni boletín. El correo de alta cae en spam (dominio `pages.dev`, sin remitente propio). La app no está en Google Play.
8. **El código pesa y cuesta mantenerlo.** JS de 4.822 líneas y 645 KB con lotes viejos dentro, CSS de 2.202 líneas con 22 `!important`, 134 elementos `movil-*` que repiten secciones, 46 `innerHTML` sin una función común que escape el texto.

**Qué hacemos primero:** hacer verdad lo que la web dice (fecha, estado y fuente) antes de atraer gente. Después, dar URL propia a cada ficha y una razón para volver. Los ingresos van al final y solo con abogado.

---

## 2 · Marketing mix (5P + 2) en resumen

Detalle en `5p.md`.

| P | Decisión | Acción clave | Archivo / pantalla | Esf. | Imp. | Quién |
|---|---|---|---|---|---|---|
| **Producto** | Registro que responde: ¿existe y está abierto?, ¿quién lo vigila?, ¿qué puede salir mal?, con fuente y fecha | Sello de comprobación, tarjeta con 4 datos, página por ficha, comparador | `#emiLista`, `#modal`, `FichaOferta`, `DetalleOferta`, nuevo `rwadar-fichas.js` | M | muy alto | Código |
| **Precio** | El que consulta nunca paga; nadie compra el orden ni la nota | Patrocinio etiquetado 390–490 €/30 días · Pro Emisor 99–249 €/mes · informe 290 € · API 150–500 €/mes. Comisión por inversión **bloqueada**. AdMob como mucho complemento, con categorías financieras bloqueadas | `para-empresas.html`, `transparencia-comercial.html` | S | alto (más tarde) | **Víctor** (abogado, titular fiscal) |
| **Plaza** | La web es el canal principal y la app Android el segundo | Dominio propio + correo verificado, Google Play, web instalable en iPhone, insignia para plataformas, CSV abierto | Cloudflare, `manifest.webmanifest`, nuevo `rwadar-site/insignia/` | S–M | alto | Víctor (dominio, Play) + Código (insignia, PWA) |
| **Promoción** | «Mira antes de invertir. Con la fuente al lado.» Sin publicidad pagada en 90 días | «El Radar del lunes» (boletín), LinkedIn 3 veces por semana (Víctor y Eric), aviso a las 12 plataformas con oferta, nota de prensa | `novedades.xml`, `/cambios`, plantillas en `docs/plantillas/` | S/semana | alto | Víctor (voz pública) + Código (RSS, borradores) |
| **Personas** | Víctor dirige, Eric hace Academy y revisa el tono, un editor de verificación 3 h a la semana, agentes con revisión humana | Pruebas con 5 personas reales al mes | — | S | alto | Víctor |
| **Proceso** | Ciclo del lunes: catálogo → contraste → revisión manual → publicar → boletín | Lista de control en `docs/RUNBOOK.md`, formulario «¿ves un error?» en cada ficha | `RUNBOOK.md`, ficha | S | alto | Código + Víctor (aprobar) |
| **Evidencia física** | La confianza se enseña | Contador honesto en portada, «Cómo verificamos», «Quiénes somos», historial por ficha | portada, `metodologia.html` nuevo | S | alto | Código (Víctor revisa el texto) |

Metas a 90 días (orientativas; **hoy no hay medición**, ver Huecos): 5.000 visitas al mes, 500 suscriptores, 500 instalaciones, ≥ 60 % de fichas comprobadas, 10 enlaces externos y 1 cliente piloto.
Año 1, ingresos como hipótesis: unos 22.000 € en el escenario medio y unos 7.000 € en el bajo. **Es una hipótesis, no una previsión.**

---

## 3 · Auditoría 5S en resumen

Detalle en `5s.md`.

| S | Qué | Acción | Esf. | Imp. | Quién |
|---|---|---|---|---|---|
| **Clasificar** | Lo que sobra | Borrar 6 ramas ya unidas y revisar 4 antiguas; borrar `rwadar-version-codex/` (44 archivos); archivar `rwadar-limpieza/` y `rwadar-ios112-20260930/`; marcar como descartados los lotes del 19 y 20/10 | S | medio | Código (rama) + **Víctor** (borrar ramas remotas) |
| **Ordenar** | Un sitio para cada cosa | 9 scripts de la raíz a `herramientas/`; en `rwadar-app/`, pruebas a `pruebas/` y scripts de un día a `archivo/`; partir el JS en sus 14 bloques y el CSS por componentes con `@layer`; un solo marcado para móvil y escritorio; tipografías fuera del CSS (50 kB) | L | alto | Código |
| **Limpiar** | Suciedad que ya está | Quitar los 303 enlaces `claude.ai`; listas `P`/`FUERA`/`EMI` generadas desde `radar-canonico-26.json`; lo apagado (opiniones, avisos por correo) fuera del paquete público | S–M | muy alto | Código |
| **Estandarizar** | Normas | 10 normas en `AGENTS.md`: un sitio para cada dato y cada regla, colores solo como variables, tope de líneas por archivo, ramas de 14 días como máximo, `docs/` solo con lo vigente. `PARA-CODEX.md` reducido a las 5 últimas entradas; un solo «léeme primero» (`AGENTS.md` → `INTERNO.md`) | S | alto | Código |
| **Disciplina** | Que lo compruebe la máquina | `probar-orden.mjs` dentro de `npm test`: las 3 primeras semanas solo avisa y desde la semana 4 falla | S–M | alto | Código |

**Regla de oro:** desde que se una la rama de integración, `main` es siempre lo publicado.

---

## 4 · Patrones a copiar (y los que no)

Detalle en `clones.md`.

| Patrón | De dónde | Cómo queda en RWAdar | Pantalla | Esf. | Imp. |
|---|---|---|---|---|---|
| La nota de la tarjeta | Booking | **Sello de comprobación con fecha**: «Comprobada en fuente el 21/10» (verde), «No se pudo comprobar: la web bloquea la lectura» (ámbar), «Las fuentes no coinciden» (rojo). Sin estrellas ni notas | `#emiLista`, `FichaOferta` | S | muy alto |
| Filtros con contador | Booking, Idealista | «Inmobiliario (35)», «Disponible en España (n)» | `#pills`, `#fReg`, `#fAcc`, `#fTic`, `#emiTipoFiltros` | S | alto |
| Cómo se ordena | Booking (reglamento europeo P2B) | Enlace «¿Cómo ordenamos?» junto a `#emiOrden`: «el orden no depende de pagos» | `#emiOrden` | S | alto |
| Cifra con apellido | Idealista | «Cifra publicada por la plataforma · bruta · estimada · 21/10». Cambiar el nombre «Cifra de rentabilidad» | tarjeta y ficha | S | alto |
| Antes de ir a la fuente | Revolut, Trade Republic (avisos claros) | Bloque fijo con 4 riesgos: pérdida, liquidez, custodia, supervisión. «¿Quién puede acceder?» arriba. Una línea de riesgo encima del botón de salida | `#modal`, `DetalleOferta` | M | muy alto |
| Ficha en 4 apartados | Morningstar | Página por plataforma: Quién, Cómo, Salida, Coste. Sin nota | `/plataformas/<slug>` | M | muy alto |
| URL propia por ficha | Booking, Airbnb | `/ofertas/<slug>` estática, compartible y en el sitemap | nuevo `rwadar-fichas.js` | L | muy alto |
| Agrupar repetidos | Booking (cadenas), Airbnb | «Reental · mercado entre inversores · 21 inmuebles» en una tarjeta que se despliega | `#emiLista`, `Ofertas.js` | S–M | alto |
| Búsqueda guardada y «avísame si cambia» | Idealista | Primero RSS y `/cambios` sin datos personales; después correo semanal | `novedades.xml`, Perfil › Avisos | S → L | alto |
| Un solo buscador | Booking | Unir `#emiBuscar` y `#q` | portada, Buscar | M | alto |
| Glosario enlazado | Morningstar | Cada término de la ficha enlaza a su lección de Academy (`Explicador.js`) | ficha | M | alto |

**No se copia nunca:** «solo quedan…», cuántas personas están mirando, cuentas atrás, precios tachados, estrellas o reseñas, «invierte desde X €», confeti, la palabra «oportunidad», el orden por rentabilidad por defecto y el botón «Invertir». Ojo: los datos ya traen una cuenta atrás («2 días restantes» en `iod-occasio`, «10 días» en `casa-de-outeiro`). Hay que enseñarla como fecha neutra, «Cierre según el emisor: 23/10», y no como contador.

---

## 5 · Lo que dicen los avatares

Nueve perfiles simulados (no son usuarios reales, ver Huecos). En orden: 1) ahorradora prudente, 2) busca renta de alquiler, 3) inversor de fondos indexados, 4) ya invierte en Reental y Brickwise, 5) estudiante con 200 € al mes, 6) madre que ahorra para sus hijos, 7) persona mayor sin jerga, 8) ingeniero que mira la regulación, 9) asesor financiero.

### 5.1 Qué ofertas atraen (veces en el top 5 de los 9 avatares)

| Oferta | Veces | Por qué atrae | Qué la frena (y qué dato falta) |
|---|---|---|---|
| `spiko-letras-del-tesoro-euro` | **8/9** | La única con 3 cifras (2,40 % a 30 días, mínimo 1 €, en EUR) y un producto conocido (letras del Tesoro) | Supervisor no visible (es un OPCVM autorizado por la AMF con ISIN, **pero el dato no llega a la tarjeta**), comisiones y gastos, plazo de reembolso, si es bruto o neto, si se puede desde España, si hace falta monedero |
| `prosegur-digital-gold` | **7/9** | Marca española conocida, oro físico, custodia en España, desde 1 g | Precio por gramo de hoy, comisiones y diferencia entre compra y venta, si se puede pedir el oro físico, qué pasa si el proveedor cierra, quién lo supervisa. Prosegur **no está en el radar** |
| `iod-occasio` | **6/9** | Empresa de Madrid, bono para adelantar facturas, seguro «hasta el 90 %» | Sin interés, plazo ni mínimo; «hasta el 90 %» poco claro; la prisa espanta a 4 y engancha a 3. **Probablemente ya cerró** (el 21/10 le quedaban 2 días) |
| `casa-de-outeiro` | **5/9** | Es la foto más bonita, está en España y se puede visitar | Capital de una empresa pequeña, sin mínimo claro, sin valoración y sin salida; cierra el 31/10 |
| `vivienda-sonnleithnergasse-2-viena` | 3/9 | Piso normal alquilado en la UE y en EUR | Emisión agotada, solo reventa; dato del 27/09 |
| `terreno-con-arrendamiento-billa` | 3/9 | Inquilino sólido (cadena de supermercados) | Años de contrato, renta, mínimo; dato del 27/09 |
| `randhartingergasse-9-viena` | 3/9 | Es la única con dos precios (100,24 € de emisión y 75 € en reventa) | ¿Por qué un 25 % menos? Falta ocupación y renta |
| `reental-secundario-granada-3` | 3/9 | España, ciudad conocida | **¿Por qué en USD si el piso está en Granada?** Sin precio; texto del rendimiento confuso |
| `mtbill` | 2/9 | Letras del Tesoro de EE. UU.; tiene folleto de la FMA notificado a la CNMV | El folleto no sale en la tarjeta; sin rendimiento; USD; «Midas bloquea las consultas» suena opaco |
| `hausera`, `dania-beach-1`, `miami-1`, `klagenfurt`, `aktionariat` | 1/9 cada una | Casos concretos (preventa con fecha, activo sustituido, nombre conocido, inquilino estable, interés técnico) | Dania Beach: la imagen dice Austin. Miami 1: sin vendedores |

**Lo que casi todos ignoran:** las 4 de Midas que no son mTBILL (9/9: nombres en clave, sin cifra, «no se pudo comprobar»), las 21 de Reental en el mercado entre inversores (8/9: «todas iguales, parece relleno») y las 5 de Aktionariat (8/9: CHF, precios incoherentes).
**Conclusión:** el escaparate de hoy lo sostienen 4 fichas fuera del ladrillo, y 3 de ellas (Prosegur, Alius ×2) son de plataformas que el radar no ha evaluado.

### 5.2 Qué datos piden en la tarjeta (cuántos avatares de 9)

| Dato | Lo piden | ¿Lo tenemos? | Acción |
|---|---|---|---|
| Estado en una palabra (Abierta · Solo reventa · Agotada · Cerrada · En seguimiento) | 9 | Escondido en el texto de los avisos | Campo nuevo `estadoOferta` |
| Mínimo de entrada en euros | 9 | Solo Spiko y Prosegur | Campo `minimo` con fuente, o «sin dato» visible |
| Cifra publicada con apellido y fecha | 9 | 1 de 49 | `rentabilidad.literal` ya existe: generalizar y poner «sin dato» si falta |
| Cómo y cuándo salgo (reembolso, vencimiento, reventa) | 9 | Solo en el texto | Campo `salida` |
| Comisiones | 8 | No | Campo `costes` (o «la fuente no las publica») |
| Supervisor o registro de la plataforma | 7 | **Sí**, en `plataformas[].licenciaRegistro`, pero no llega a la tarjeta | Pintarlo (no hace falta dato nuevo) |
| ¿Puedo desde España? | 7 | `disponibleEs` vacío en las 49 | Rellenar con 3 valores y su fuente |
| Fecha real del dato, bien visible | 6 | La que se enseña no es la real (Brickwise) | Separar «revisada el» de «comprobada en la fuente el» |
| El aviso general una sola vez | 5 | Sale en las 49 | Banner único arriba |
| Agrupar las de Reental | 6 | No | Tarjeta de grupo |
| Explicar por qué USD o CHF | 3 | No | Línea «La plataforma cotiza en USD» |
| Riesgo del 1 al 7, como en los fondos | 2 | No | **No hacerlo nosotros** (sería una valoración propia); enseñar el indicador solo si viene del KID del emisor |

### 5.3 Orden y filtros

Que el orden dependa del perfil del usuario se acerca a una recomendación personalizada (MiFID). Por eso **no hay modos «para jubilados» o «para estudiantes»**: hay filtros con nombres descriptivos que cada uno elige.

**Orden por defecto (para todos, explicado en «¿Cómo ordenamos?»):** 1) comprobada en la fuente, 2) con fecha de comprobación más reciente, 3) con más datos completos. Las `no_verificable` y las que no tienen vendedores van al final, agrupadas por plataforma. **Nunca por rentabilidad.**

**Accesos rápidos (chips) que cubren a los 9 perfiles sin nombrarlos:**

| Chip | Qué filtra | A quién le sirve |
|---|---|---|
| «En euros» | `moneda = EUR` | 1, 2, 3, 6, 7 |
| «Disponible en España» | `disponibleEs = sí` | todos (hoy daría 0: hay que rellenar el dato antes de enseñarlo) |
| «Tesoro, fondos y oro» | categorías Tesoro y fondos + Materias primas | 1, 3, 5, 6, 7, 9 |
| «Inmuebles con alquiler» | Inmobiliario + `salida` ≠ venta del inmueble | 2, 4, 6 |
| «Abiertas hoy» | `estadoOferta = abierta` | 3, 4, 9 |
| «Con cifras publicadas» | tiene `minimo` o `rentabilidad` | 3, 5, 9 |
| «Plataforma supervisada en la UE» | `licenciaRegistro.estado = confirmada_regulador` + región UE | 8, 9 |
| «Mínimo hasta 100 €» | `minimo ≤ 100` | 5 |

**Vista para profesionales** (asesor e ingeniero): columnas en la matriz `#vMat` con regulador, número de registro o ISIN, figura legal y fecha. Exportar a CSV.

---

## 6 · Plan por fases

### 6.1 Esta semana (22–28/10)

**Código (en una rama, sin publicar):**

| # | Tarea | Archivo / pantalla | Esf. | Imp. |
|---|---|---|---|---|
| C1 | Quitar los 303 enlaces `claude.ai/code/artifact` y sacar del paquete los lotes viejos de donde vienen. Prueba que falle si vuelven | `rwadar-site/assets/rwadar-20260820.js`, `probar-web.mjs`, `rwadar-publicacion-segura.js` | S | muy alto |
| C2 | Servidor local con el lote vigente (`--lote=2026-10-21-v2`) y cabecera que diga qué lote se ve | `rwadar-servir.js` | S | alto |
| C3 | Separar fechas: `revisadaEl` (cuándo pasó el lote) y `comprobadaEnFuenteEl` (cuándo se leyó de verdad; Brickwise 27/09). Sello verde, ámbar o rojo con el motivo | generador del lote, tarjeta `#emiLista`, `FichaOferta` | S | muy alto |
| C4 | Aviso general una sola vez arriba de la lista; en la tarjeta, solo los avisos propios | tarjeta web, `Ofertas.js` | S | muy alto |
| C5 | Supervisor de la plataforma en la tarjeta desde `licenciaRegistro` («Registrada en AMF», «Sin registro declarado», «Plataforma no evaluada por RWAdar») | tarjeta web y app | S | alto |
| C6 | Cuentas atrás convertidas en fecha neutra («Cierre según el emisor: dd/mm»). Ocultar las fichas cuya fecha de cierre ya pasó | generador del lote, tarjeta | S | alto |
| C7 | Arreglos de imagen: Dania Beach (imagen de Austin), Spiko y mTBILL (mismas columnas), mF-ONE sin lugar; `width` y `height` y fondo mientras carga | `rwadar-movil/assets/ofertas-editoriales/`, CSS | S | medio |
| C8 | `probar-orden.mjs` en modo aviso: sin `claude.ai`, `patrocinada` falso, `puntuacion` vacía, palabras prohibidas («oportunidad», «invierte desde», «quedan», «garantizado») | nuevo `rwadar-app/pruebas/probar-orden.mjs`, `package.json` | S | alto |

**Víctor:**

| # | Tarea | Esf. | Imp. |
|---|---|---|---|
| V1 | Aprobar y aplicar el lote `c3b71e81` a Supabase (ya hay un **lote nuevo** que tiene en cuenta C3 y C6, ver Huecos) | S | muy alto |
| V2 | Autorizar la unión de `claude/integracion-2026-10-19` a `main` y el borrado de las ramas ya unidas | S | alto |
| V3 | Comprar el dominio y crear el remitente de correo (SPF, DKIM, DMARC) | S | alto |
| V4 | Decidir quién hace la revisión manual de los lunes (3 h) | S | alto |

### 6.2 Treinta días (hasta el 21/11)

**Código:**

| # | Tarea | Archivo / pantalla | Esf. | Imp. |
|---|---|---|---|---|
| C9 | Campos nuevos en el esquema del lote: `estadoOferta`, `minimo`, `salida`, `costes`, `disponibleEs` con 3 valores y su fuente. Una etiqueta clara «sin dato» cuando falte | esquema del lote, generador, `documentacion-ofertas.json` | M | muy alto |
| C10 | Tarjeta con 4 datos fijos (estado, mínimo, cifra con apellido, salida) + sello + supervisor | `#emiLista`, `FichaOferta`, `Ofertas.js` | M | muy alto |
| C11 | Agrupar Reental (mercado entre inversores) y Brickwise en tarjetas de grupo. Las `no_verificable` al final. Enlace «¿Cómo ordenamos?». «Cifra publicada por la plataforma» en vez de «Cifra de rentabilidad» | `#emiOrden`, `#emiLista` | S–M | alto |
| C12 | Filtros con contador y chips del §5.3 (el de España, solo cuando haya datos) | `#pills`, `#fReg`, `#fAcc`, `#fTic`, `#emiTipoFiltros` | M | alto |
| C13 | Bloque fijo «Antes de ir a la fuente» y «¿Quién puede acceder?» en la ficha | `#modal`, `DetalleOferta` | M | muy alto |
| C14 | `rwadar-fichas.js`: 49 páginas `/ofertas/<slug>` y 26 `/plataformas/<slug>` (+ descartes) en 4 apartados, `metodologia.html`, sitemap con `lastmod`, JSON-LD `WebPage` + `BreadcrumbList` + `Organization`, **sin `Offer`, `price` ni `AggregateRating`**. «Ver ficha» cambia la URL a la ruta real | nuevo `rwadar-fichas.js`, `sitemap.xml`, `_redirects` | L | muy alto |
| C15 | `novedades.xml` (RSS) y `/cambios` generados desde `cambios-*.json` | `rwadar-site/` | S | alto |
| C16 | Listas `P`, `FUERA` y `EMI` generadas desde `radar-canonico-26.json`; los datos de respaldo a `rwadar-site/datos/lote-<id>.json`; minificar | `rwadar-20260820.js`, `rwadar-publicar.js` | M | alto |
| C17 | Arreglos móviles: la barra inferior no tapa, un solo destino al pulsar, un `h1` por vista, foco y `Escape` en la capa | `rwadar-20260820.css`, `index.html` | S | medio |
| C18 | Una sola función `pintar()` que escape el texto para los 46 `innerHTML` | `rwadar-20260820.js` | S–M | alto (seguridad) |
| C19 | Recortar `PARA-CODEX.md`, archivar los documentos superados, 10 normas en `AGENTS.md` | `docs/`, `AGENTS.md` | S | alto |
| C20 | Insignia «Ficha en RWAdar · comprobada el dd/mm» (HTML y SVG que enlazan a la ficha) | nuevo `rwadar-site/insignia/` | S | alto |

**Víctor y editorial:**

| # | Tarea | Esf. | Imp. |
|---|---|---|---|
| V5 | Revisión manual de Reental y Brickwise con navegador y captura. Rellenar `minimo`, `salida`, `disponibleEs` y `pais`. Meta: ≥ 40 % comprobadas en 2 semanas y ≥ 60 % en 30 días | M | muy alto |
| V6 | Decidir qué hacer con las 5 plataformas con ofertas que no están en el radar: evaluarlas (Brickwise, Prosegur, Alius, Aktionariat, Hausera) o retirar sus ofertas | M | muy alto |
| V7 | Crear el boletín (proveedor con doble confirmación) y revisar `privacidad.html` | S | alto |
| V8 | Primera ronda de LinkedIn y aviso a las 12 plataformas con oferta (con la insignia) | S | alto |
| V9 | Cuenta de Google Play y versión 1.3.2 por EAS con las imágenes nuevas | M | alto |
| V10 | Elegir una analítica sin cookies (por ejemplo Cloudflare Web Analytics) para tener una cifra de partida | S | alto |

### 6.3 Noventa días (hasta el 20/01/2027)

**Código:**

| # | Tarea | Archivo / pantalla | Esf. | Imp. |
|---|---|---|---|---|
| C21 | Comparador de 2–3 ofertas o plataformas con URL que se pueda compartir (`/comparar?p=…`), en la web y en la app | `#vMat`, `Radar.js`, `Ofertas.js` | M | alto |
| C22 | Un solo buscador de ofertas y plataformas | `#emiBuscar`, `#q` | M | alto |
| C23 | Términos de la ficha enlazados a Academy | ficha, `Explicador.js` | M | alto |
| C24 | Partir el CSS (con `@layer` y un `:root`) y el JS en sus 14 bloques, comprobando con capturas antes y después. Un solo marcado para móvil y escritorio | `rwadar-site/assets/`, `index.html` | L | alto |
| C25 | Guardados con «ha cambiado» local, comparando con el lote. Perfil › Avisos con el RSS | Perfil, `guardadosBadge` | S | medio |
| C26 | App: App Links a `/ofertas/*` y botón Compartir | `app.json`, `DetalleOferta` | M | medio |
| C27 | Mapa en SVG por país (cuando `pais` esté completo) | Buscar | M | medio |
| C28 | `probar-orden.mjs` pasa a hacer fallar las pruebas (semana 4) | `npm test` | S | alto |

**Víctor:**

| # | Tarea | Esf. | Imp. |
|---|---|---|---|
| V11 | 10 ofertas fuera del ladrillo, de plataformas ya evaluadas (Ondo, Franklin Templeton, Securitize, Superstate, Backed, OpenEden, Pax Gold…). Que ninguna plataforma pase del 30 % | M | muy alto |
| V12 | Abogado (de 600 a 1.500 €) y titular fiscal antes de cualquier cobro. Revisar el contrato de patrocinio frente a la Circular 1/2022 de la CNMV | M | alto |
| V13 | Boletín por correo y avisos push (con permiso), con el remitente ya verificado | M | alto |
| V14 | Primer informe trimestral gratuito y 5 conversaciones con plataformas (Pro Emisor, patrocinio), sin cerrar precio | M | alto |
| V15 | 5 pruebas con personas reales al mes, grabando dónde se atascan | S/mes | alto |

---

## 7 · Huecos (relectura crítica)

### 7.1 Afirmaciones sin comprobar o que no cuadran
- **Los avatares son simulados**: los generó un modelo, no son personas. Todos leyeron el mismo texto de tarjeta, así que coinciden más de lo que coincidirían personas reales. Hay que confirmarlo con las 5 pruebas reales (V15) antes de rediseñar a fondo.
- **Brickwise:** el lote tiene 12 ofertas (`plataformaNombre`); dos avatares hablan de 13.
- **«Comprobada el 21/10» puede ser engañoso hoy:** `verificadaEl` vale 21/10 en las 49, también en las 42 `no_verificable` y en las de Brickwise, que son del 27/09. Si se pinta tal cual, el sello verde de C3 diría algo falso. Por eso C3 va antes que aplicar el lote (V1).
- **`iod-occasio` probablemente cerró el 23/10.** Si el lote se aplica el 27/10, la publicamos cerrada como abierta. Lo mismo pasará con `casa-de-outeiro` después del 31/10 y con la preventa de Hausera el 26/10. Hace falta que el generador las descarte solo (C6). Habría que **regenerar el lote**, no aplicar `c3b71e81` tal cual.
- **Cifras sin línea base:** las metas de visitas, suscriptores e instalaciones y los ingresos del año 1 no tienen ninguna medición detrás. No hay analítica (V10).
- **Reglamento P2B:** los informes dicen que «lo exige». Es dudoso que RWAdar sea un «servicio de intermediación» en ese sentido. Explicar el orden es buena práctica de todos modos, pero no hay que citar el reglamento como obligación sin el abogado.
- **El peso de 1,1 MB** se midió en local, no en la web pública ni en una red móvil real.
- **El 2,40 % de Spiko** es «observado el 21/10». Si el lote no se renueva cada semana, se queda viejo enseguida. Es la cifra que más miran.

### 7.2 Riesgo legal que los informes tocan poco
- **Publicidad de criptoactivos (Circular 1/2022 de la CNMV).** Si hay patrocinio pagado de una plataforma de criptoactivos, RWAdar puede entrar en su ámbito. Las campañas masivas se comunican antes a la CNMV y necesitan un aviso de riesgo de formato fijo. Hay que verlo con el abogado antes de C20 y del patrocinio.
- **MiCA y la campaña de Prosegur Digital Gold y mTBILL:** son tokens que pueden ser criptoactivos o instrumentos financieros. Enseñar la cifra de un instrumento financiero junto a un enlace de salida se acerca a la «comunicación publicitaria». La línea de riesgo encima del botón (C13) ayuda, pero no sustituye al dictamen.
- **Recomendación personalizada:** los filtros por perfil, un futuro «test de perfil» o una escala de riesgo propia del 1 al 7 se pueden leer como asesoramiento (MiFID II, Ley 6/2023). Por eso el §5.3 los nombra por criterio y no por persona. **Que nadie añada un cuestionario de perfil.**
- **LSSI art. 10:** la web debe identificar a su titular (nombre, NIF, contacto) aunque sea gratuita. Esto va con la página «Quiénes somos» y el titular fiscal.
- **Términos de uso de las plataformas:** Midas y Brickwise bloquean la lectura automática. Leer sus webs con robots puede incumplir sus condiciones. La revisión manual es más segura, pero hay que comprobar si sus términos permiten reproducir sus datos y sus imágenes.
- **Marcas e imágenes:** las ilustraciones con IA de edificios reales y de marcas (BILLA, Prosegur) pueden confundir o rozar el derecho de marca. Además, «el Booking de la tokenización» usa una marca ajena: vale como idea interna, **no como eslogan público**.
- **Campos peligrosos en el esquema:** `puntuacion` y `patrocinada` existen. C8 debe impedir que se llenen sin decisión legal.
- **Datos personales:** el boletín, los avisos y los guardados en la nube necesitan una base legal, doble confirmación y `privacidad.html` al día (RGPD). Hoy Perfil dice «Cuentas en pausa», así que no está claro qué pasa con las altas que ya existen.

### 7.3 Modalidades que nadie ha analizado
- **Medición:** no hay analítica, ni Search Console revisada, ni datos de palabras clave con volumen. El plan de SEO de 75 páginas no sabe qué busca la gente en español.
- **iPhone nativo:** solo se propone la web instalable. No se ha probado en Safari ni se ha comprobado cómo se instala.
- **Accesibilidad con lectores de pantalla reales** (TalkBack, VoiceOver). La Ley Europea de Accesibilidad aplica desde el 28/06/2025 a ciertos servicios; comprobar si nos afecta.
- **Seguridad de Supabase** (permisos por fila, claves en el cliente, copias de seguridad): ningún informe la revisa.
- **Plan de crisis:** qué hacemos si una plataforma de la lista quiebra o resulta un fraude (retirarla, avisar, guardar las pruebas). Es el mayor riesgo de reputación de un registro.
- **Atención y correcciones:** quién responde al formulario «¿ves un error?» en 72 h, y qué hacemos si una plataforma presiona o amenaza.
- **Latinoamérica:** escribimos en español, pero no se ha mirado si interesa el público ni la regulación de México, Argentina o Colombia.
- **Dependencia de pocas personas y de los agentes:** la revisión de los lunes depende de Víctor. Si falla dos semanas, el sello verde deja de ser verdad.
- **Fiscalidad para el usuario:** varios avatares preguntan cómo tributa. No podemos asesorar, pero falta una lección general en Academy.
- **Competencia directa en español:** ningún informe compara con otros directorios o comparadores de crowdfunding y tokenización en español.

---

## 8 · Las 15 tareas de código, por prioridad

| # | Tarea | Archivo / pantalla | Esf. | Imp. |
|---|---|---|---|---|
| 1 | Quitar los 303 enlaces `claude.ai` y bloquearlos en las pruebas | `rwadar-20260820.js`, `probar-web.mjs`, `rwadar-publicacion-segura.js` | S | muy alto |
| 2 | Separar «revisada el» de «comprobada en la fuente el», y sello verde, ámbar o rojo con el motivo | generador del lote, `#emiLista`, `FichaOferta` | S | muy alto |
| 3 | Fechas de cierre neutras y descarte automático de ofertas ya cerradas; regenerar el lote | generador del lote, tarjeta | S | alto |
| 4 | Servidor local con el lote vigente | `rwadar-servir.js` | S | alto |
| 5 | Aviso general una sola vez y supervisor de la plataforma en la tarjeta (`licenciaRegistro`) | tarjeta web, `Ofertas.js` | S | muy alto |
| 6 | `probar-orden.mjs` (en modo aviso): dominios, `patrocinada`, `puntuacion`, palabras prohibidas | `rwadar-app/pruebas/`, `npm test` | S | alto |
| 7 | Campos `estadoOferta`, `minimo`, `salida`, `costes` y `disponibleEs` con 3 valores, con «sin dato» visible | esquema y generador del lote | M | muy alto |
| 8 | Tarjeta con 4 datos fijos y la cifra con apellido | `#emiLista`, `FichaOferta`, `Ofertas.js` | M | muy alto |
| 9 | Agrupar Reental y Brickwise, `no_verificable` al final, «¿Cómo ordenamos?» | `#emiOrden`, `#emiLista` | S–M | alto |
| 10 | Bloque «Antes de ir a la fuente» y «¿Quién puede acceder?» | `#modal`, `DetalleOferta` | M | muy alto |
| 11 | Páginas estáticas por oferta y plataforma + `metodologia.html` + sitemap + JSON-LD sin `Offer` | nuevo `rwadar-fichas.js`, `sitemap.xml` | L | muy alto |
| 12 | Filtros con contador y chips descriptivos | `#pills`, `#fReg`, `#fAcc`, `#fTic`, `#emiTipoFiltros` | M | alto |
| 13 | RSS `novedades.xml` y página `/cambios` | `rwadar-site/` | S | alto |
| 14 | Listas del JS generadas desde el radar, datos fuera del JS, minificar, y función única que escape los `innerHTML` | `rwadar-20260820.js`, `rwadar-publicar.js` | M | alto |
| 15 | Arreglos móviles (barra inferior, un solo destino al pulsar, `h1`, foco) e imágenes inconsistentes | `rwadar-20260820.css`, `index.html`, `ofertas-editoriales/` | S | medio |

Después: comparador con URL, buscador único, glosario enlazado, partir el CSS y el JS, insignia, guardados con avisos y mapa.
