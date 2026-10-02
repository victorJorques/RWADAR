# RWAdar Academy · Especificación para implementación web

**Para:** el socio responsable de la web
**De:** Eric (operaciones)
**Versión:** 1.0 · 14/09/2026
**Qué es esto:** todo lo que hace falta para montar la Academy sin volver a preguntarme nada. Contenido, estructura de datos, páginas, comportamiento y criterios de aceptación.

> Esta especificación es **agnóstica de tecnología**. Funciona con un CMS headless (Strapi, Sanity, Directus), con WordPress, o con ficheros Markdown en el repositorio. Donde hay una decisión técnica abierta, se marca como tal.

---

## 1. Qué es la Academy y qué tiene que conseguir

Nueve lecciones en tres niveles. **Cada nivel responde a una sola pregunta del usuario y termina en una sola acción.** El alumno no avanza porque sepa más, sino porque puede decidir algo que antes no podía.

| Nivel | Pregunta que resuelve | Acción de salida |
|---|---|---|
| 1 · Principiante — «Entender» | *¿Qué es esto y me afecta?* | Completar el Evaluador de Viabilidad (anónimo) |
| 2 · Intermedio — «Decidir» | *¿Me conviene y qué me va a costar?* | Preparar el expediente y filtrar el radar |
| 3 · Avanzado — «Ejecutar» | *¿Con quién y cómo lo ejecuto?* | Contactar proveedores verificados |

**Función de negocio:** la Academy es el motor de entrada al radar y al Evaluador. Cada lección termina empujando a un destino concreto de producto. Si esos destinos no existen, la Academy no sirve para nada.

---

## 2. Inventario de contenido (listo para cargar)

Ocho lecciones están escritas en Markdown con frontmatter completo. La novena está especificada pero no redactada.

| # | Slug | Nivel | Categoría | Min. **corregidos** | Palabras | CTA | Estado |
|---|---|---|---|---|---|---|---|
| 1 | `que-significa-tokenizar-un-activo` | Principiante | Fundamentos | 10 | 2.064 | `evaluador-viabilidad` | Listo |
| 2 | `quien-es-quien-actores-tokenizacion` | Principiante | Fundamentos | 15 | 2.911 | `radar-categorias` | Listo |
| 3 | `es-tu-activo-tokenizable` | Principiante | Diagnóstico | 15 | 2.986 | `evaluador-viabilidad` | Listo |
| 4 | `marco-legal-cuando-tu-token-es-un-valor` | Intermedio | Marco regulatorio | 16 | 3.164 | `radar-capacidad-regulatoria` | Listo · aviso reforzado |
| 5 | `cuanto-cuesta-tokenizar` | Intermedio | Economía del proyecto | 15 | 2.971 | `radar-comparador` | Listo |
| 6 | `liquidez-como-evaluarla` | Intermedio | Gestión de riesgos | 13 | 2.697 | `radar-nivel-acceso` | Listo |
| 7 | `como-leer-el-radar` | Avanzado | Selección de proveedor | 14 | 2.745 | `radar-comparador` | Listo |
| 8 | `expediente-de-tokenizacion` | Avanzado | Preparación | 15 | 2.963 | `evaluador-viabilidad` | Listo |
| 9 | `despues-de-emitir-ciclo-de-vida` | Avanzado | Post-emisión | ~15 | — | `radar-comparador` | **Por redactar** |

### Corrección de los tiempos de lectura
Los minutos que figuran hoy en el frontmatter (6–9) se calcularon mal: son **la mitad de los reales**. A 200 palabras/minuto, la Lección 2 son 15 minutos, no 7.

**Decisión tomada: se declara el tiempo real.** Los números de la tabla de arriba son los definitivos y sustituyen a los del frontmatter actual.

No preocupa que sean lecciones de 15 minutos: cada una abre con el bloque **«En 30 segundos (TL;DR)»**, que da valor completo a quien no quiera leerla entera. La web debe explotar eso — ver §5.3.

---

## 3. Modelo de datos

### 3.1 Entidad `Leccion`

| Campo | Tipo | Obl. | Notas |
|---|---|---|---|
| `slug` | string único | sí | URL-safe, sin acentos. Ya definido en el frontmatter. |
| `titulo` | string | sí | Puede contener comillas angulares «». |
| `titulo_corto` | string | no | Para menús y migas. Si falta, se trunca `titulo`. |
| `nivel` | enum | sí | `principiante` · `intermedio` · `avanzado` |
| `modulo` | entero 1–9 | sí | Orden global. Único. |
| `categoria` | string | sí | Etiqueta visible. Valores en uso: Fundamentos, Diagnóstico, Marco regulatorio, Economía del proyecto, Gestión de riesgos, Selección de proveedor, Preparación, Post-emisión. |
| `tiempo_lectura` | entero (min) | sí | El corregido de §2. |
| `resumen` | texto (≤300 car.) | sí | Para tarjetas, listados y meta description. **Se extrae del TL;DR.** |
| `cuerpo` | Markdown | sí | Ver §3.4 para lo que debe soportar el renderizador. |
| `tldr` | array de 3 strings | sí | Se extrae del bloque «En 30 segundos». Se renderiza aparte, no dentro del cuerpo. |
| `quiz` | booleano | sí | Hoy `true` en las ocho. |
| `preguntas` | array de `Pregunta` | si `quiz` | Ver §3.2. |
| `cta` | enum | sí | Ver catálogo en §4. |
| `fecha_publicacion` | fecha | sí | |
| `ultima_revision_legal` | fecha | sí | **Se muestra en el pie.** Ver §6. |
| `jurisdiccion_referencia` | string | sí | Hoy: «España / Unión Europea». |
| `aviso_reforzado` | booleano | sí | `true` en las lecciones 4 y 9. Activa el segundo bloque legal. |
| `estado` | enum | sí | `borrador` · `en_revision` · `publicado` · `retirado` |
| `lectura_previa` | ref. a `Leccion` | no | Para el bloque «antes de esta, lee…». |

### 3.2 Entidad `Pregunta` (quiz)

| Campo | Tipo | Notas |
|---|---|---|
| `enunciado` | string | |
| `opciones` | array de 3–4 strings | |
| `indice_correcto` | entero | Base 0. |
| `explicacion` | string | **Obligatoria.** Se muestra siempre tras responder, acierte o falle. El quiz enseña, no puntúa. |

**El quiz no tiene nota ni se guarda en servidor en la v1.** Es autoevaluación. Corrección en cliente.

### 3.3 Entidad `Nivel`

`slug`, `nombre`, `orden`, `pregunta_que_resuelve`, `perfil_de_entrada`, `accion_de_salida`, `cta_nivel`.
Los textos exactos de los tres niveles están en la tabla de §1 y en el plan de arquitectura.

### 3.4 Qué debe soportar el renderizador de Markdown
El contenido existente usa: encabezados h2/h3, **negrita**, *cursiva*, listas ordenadas y sin ordenar, **tablas**, citas en bloque (`>`) — usadas para dos cosas distintas: *idea central* y *bloque de advertencia* —, y separadores `---`.

**Requisito:** las citas en bloque deben poder distinguirse visualmente por su primera línea en negrita (`> **La idea central**`, `> **Atención — lo que ningún proveedor debería prometerte**`). Si el CMS lo permite, mejor convertirlas en dos componentes explícitos: `callout-idea` y `callout-aviso`.

---

## 4. Catálogo de CTAs

Cada lección termina empujando a un destino. **Estos ocho destinos tienen que existir el día del lanzamiento o la Academy queda coja.**

| Clave `cta` | Destino | Qué tiene que existir |
|---|---|---|
| `evaluador-viabilidad` | Evaluador de Viabilidad | Formulario de diagnóstico con **capa anónima** (sin datos personales) y **capa identificada** (con consentimiento). |
| `radar-categorias` | Radar filtrado por categoría | Filtro: marketplace / emisor / infraestructura. |
| `radar-capacidad-regulatoria` | Radar filtrado por supervisión | Filtro por capacidad regulatoria del proveedor. |
| `radar-comparador` | Comparador de proveedores | Vista de comparación lado a lado. |
| `radar-nivel-acceso` | Radar filtrado por nivel de acceso | Filtro relacionado con liquidez / mercado secundario. |
| `fuera-del-radar` | Sección «Fuera del radar» | Listado de excluidos **con motivo y fuente** por entrada. |

**Regla de implementación:** el CTA se renderiza desde un componente único parametrizado por esta clave. Si un destino no está disponible, el componente muestra una variante «próximamente» **en lugar de un enlace roto** — nunca un 404.

---

## 5. Páginas y componentes

### 5.1 Índice de la Academy · `/academy`
- Cabecera con la promesa: tres niveles, una pregunta cada uno.
- Tres bloques de nivel, cada uno con su pregunta, su perfil de entrada y sus lecciones en tarjetas.
- Tarjeta de lección: número, título, categoría, minutos, resumen en una línea. Estado visual distinto si no está publicada.
- Indicador de progreso del usuario (ver §7).

### 5.2 Página de nivel · `/academy/[nivel]`
Opcional en v1. Si no se hace, las anclas del índice bastan.

### 5.3 Página de lección · `/academy/[slug]`
**Orden de los componentes, de arriba abajo:**

1. **Migas:** Academy › Nivel › Lección N
2. **Título** (h1)
3. **Barra de metadatos:** nivel · minutos · categoría · «Última revisión legal: [fecha]» · jurisdicción
4. **Bloque TL;DR «En 30 segundos»** — destacado, con los tres puntos. *Este bloque es la pieza clave de la página: es lo que hace aceptable una lección de 15 minutos.*
5. **Cuerpo** (Markdown renderizado, con los dos tipos de callout)
6. **Quiz** (si `quiz`)
7. **CTA** según `cta`
8. **Navegación** anterior / siguiente dentro del nivel
9. **Bloque legal** — global + reforzado si aplica (§6)
10. **Pie de revisión:** «Contenido revisado el [fecha]. Jurisdicción de referencia: [jurisdicción].»

**Requisitos de lectura:**
- Ancho de columna 65–75 caracteres.
- Índice lateral de secciones (h2) en escritorio, plegable en móvil.
- Tablas con scroll horizontal propio en móvil; la página **nunca** hace scroll lateral.
- Barra de progreso de lectura opcional; si se pone, discreta.

### 5.4 Componente de quiz
- Una pregunta visible a la vez, o todas con validación al final — **decisión del socio de la web**, ambas valen.
- Al responder: se marca correcta/incorrecta y **siempre se muestra la explicación**.
- Al terminar: resumen de aciertos + botón hacia el CTA de la lección.
- Sin cuentas, sin ranking, sin bloqueo de contenido.

---

## 6. Bloque legal (crítico)

**Un único componente global**, no texto copiado en cada lección. Dos variantes:

- **Base:** el descargo estándar que ya está al final de cada lección (RWAdar es directorio informativo y plataforma educativa; el contenido no es asesoramiento de inversión, jurídico, fiscal ni contable; no es oferta ni recomendación; no se prestan servicios de asesoramiento regulado; la normativa varía por jurisdicción; consultar profesional habilitado y fuentes oficiales).
- **Reforzada:** se añade a la base cuando `aviso_reforzado = true` (lecciones 4 y 9). Texto ya redactado en la Lección 4 — reutilizarlo literal.

**Requisito duro:** el texto legal vive en **un solo sitio** del CMS. Cuando cambie, cambia en las nueve lecciones a la vez. No se duplica.

**`ultima_revision_legal` es un campo editable por lección**, se muestra siempre, y existe un aviso interno (no visible al usuario) cuando han pasado más de 6 meses desde esa fecha.

---

## 7. Progreso del alumno

**v1 — sin cuentas.** Progreso en `localStorage` del navegador: lecciones marcadas como leídas y quizzes completados. Se pierde al cambiar de dispositivo, y no pasa nada: no se le promete persistencia al usuario.

**v2 — con cuentas.** Solo si el negocio lo pide (ver el documento de modelo de ingresos: el acceso identificado solo tiene sentido cuando haya algo que reservar a usuarios registrados).

**No hacer en v1:** certificados, gamificación, puntos, insignias. Ruido que no aporta a la decisión del usuario.

---

## 8. SEO y metadatos

- `title`: el `titulo` de la lección + « · RWAdar Academy»
- `description`: el campo `resumen`
- URL canónica por lección
- Datos estructurados `Article` con `datePublished` y `dateModified` (= `ultima_revision_legal`)
- Open Graph con imagen por nivel (tres imágenes, no nueve)
- `sitemap.xml` incluyendo solo lecciones en estado `publicado`
- Enlazado interno: cada lección enlaza a su `lectura_previa` y a la siguiente

---

## 9. Flujo editorial

`borrador` → `en_revision` → `publicado` → (`retirado`)

- El contenido se escribe en Markdown fuera del CMS y se importa. **El Markdown es la fuente de verdad**, no el editor del CMS.
- Ninguna lección pasa a `publicado` sin `ultima_revision_legal` puesta.
- Cambiar el cuerpo de una lección publicada obliga a revisar esa fecha.

---

## 10. Plan de publicación propuesto

| Fase | Qué sale | Cuándo |
|---|---|---|
| **Lanzamiento** | Niveles 1 y 2 — seis lecciones, con el minutaje corregido | Con la web pública |
| **Fase 2** | Nivel 3 — lecciones 7 y 8 | 2–4 semanas después |
| **Fase 3** | Lección 9 | Cuando esté redactada y revisada |

**Por qué 1 y 2 al lanzar:** cubren *entender* y *decidir*, e incluyen marco legal, costes y liquidez, que son las que enganchan a quien va en serio. Además dejan calendario editorial para las semanas siguientes en vez de vaciar el depósito el primer día.

---

## 11. Criterios de aceptación

La Academy está terminada cuando:

- [ ] Las seis lecciones de fase 1 se ven correctamente en móvil y escritorio, sin scroll horizontal y sin tablas rotas.
- [ ] Los minutos mostrados son los corregidos de §2.
- [ ] El bloque TL;DR aparece destacado y separado del cuerpo.
- [ ] Los dos tipos de callout se distinguen visualmente.
- [ ] El quiz corrige y **muestra siempre la explicación**.
- [ ] Cada lección termina en su CTA, y **ningún CTA lleva a un 404**.
- [ ] El bloque legal sale de una sola fuente y la variante reforzada aparece en la lección 4.
- [ ] «Contenido revisado el [fecha]» aparece en el pie de las seis.
- [ ] El sitemap solo incluye lecciones publicadas.
- [ ] Marcar una lección como leída sobrevive a recargar la página.

## 12. Fuera del alcance de la v1
Cuentas de usuario · certificados · comentarios · buscador interno de la Academy · versiones en otros idiomas · descarga de la lección en PDF.

---

## 13. Lo que necesito del socio de la web

1. Confirmar que **los seis destinos de CTA de §4 existirán** el día del lanzamiento, o cuáles no.
2. Elegir dónde vive el contenido: CMS headless, WordPress o Markdown en el repo.
3. Una estimación por fases, no una fecha global.
