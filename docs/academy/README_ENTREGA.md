# RWAdar Academy · Paquete de entrega para la web

**De:** Eric (operaciones) · **Para:** el socio responsable de la web
**Fecha:** 02/10/2026 · **Versión:** 1.0

---

## Qué hay en esta carpeta

| Archivo | Qué es |
|---|---|
| `lecciones/` | Las nueve lecciones en Markdown, una por archivo, con frontmatter YAML completo. **Es la fuente de verdad.** |
| `lecciones.json` | Los metadatos de las nueve en JSON, listos para importar a cualquier CMS sin parsear Markdown. |
| `ESPECIFICACION_WEB.md` | La especificación completa: modelo de datos campo a campo, páginas, componentes, quiz, bloque legal, SEO y criterios de aceptación. |
| `README_ENTREGA.md` | Este archivo. |
| **`LEEME.html`** | Este mismo documento, pero en HTML. **Se abre con doble clic en cualquier navegador, en Windows, Mac o Linux.** |
| **`ESPECIFICACION.html`** | La especificación, en HTML. |
| **`LECCIONES.html`** | Las nueve lecciones completas, maquetadas para leer y revisar sin ninguna herramienta. |

> **Sobre los formatos.** Los `.md` y el `.json` son **texto plano**: se abren con el Bloc de notas, VS Code o cualquier editor, en cualquier sistema operativo. Los `.md` son la fuente que se importa; los `.html` están solo para leer cómodamente.

Nombres de archivo: `NN-slug.md`, donde `NN` es el módulo (01–09) y `slug` el que debe usar la URL.

---

## Las nueve lecciones

| # | Slug | Nivel | Categoría | Min. | Palabras | CTA |
|---|---|---|---|---|---|---|
| 1 | `que-significa-tokenizar-un-activo` | Principiante | Fundamentos | 10 | 2.010 | `evaluador-viabilidad` |
| 2 | `quien-es-quien-actores-tokenizacion` | Principiante | Fundamentos | 14 | 2.866 | `radar-categorias` |
| 3 | `es-tu-activo-tokenizable` | Principiante | Diagnóstico | 15 | 2.941 | `evaluador-viabilidad` |
| 4 | `marco-legal-cuando-tu-token-es-un-valor` | Intermedio | Marco regulatorio | 16 | 3.110 | `radar-capacidad-regulatoria` |
| 5 | `cuanto-cuesta-tokenizar` | Intermedio | Economía del proyecto | 15 | 2.922 | `radar-comparador` |
| 6 | `liquidez-como-evaluarla` | Intermedio | Gestión de riesgos | 13 | 2.644 | `radar-nivel-acceso` |
| 7 | `como-leer-el-radar` | Avanzado | Selección de proveedor | 13 | 2.695 | `radar-comparador` |
| 8 | `expediente-de-tokenizacion` | Avanzado | Preparación | 15 | 2.914 | `evaluador-viabilidad` |
| 9 | `despues-de-emitir-ciclo-de-vida` | Avanzado | Post-emisión | 17 | 3.443 | `radar-comparador` |

**25.545 palabras.** Las nueve llevan frontmatter, quiz con explicación por respuesta, descargo legal y fecha de revisión legal. Las lecciones **4, 7 y 9** llevan además aviso reforzado.

> **Los minutos de esta tabla son los corregidos.** Los que figuraban en el contenido original estaban calculados mal, a la mitad de lo real. El JSON conserva los dos valores (`tiempo_lectura_declarado_original` y `tiempo_lectura_corregido`): **publica el corregido**.

---

## Estructura de cada archivo

```
---
slug · titulo · nivel · modulo · categoria · tiempo_lectura
fecha_publicacion · ultima_revision_legal · jurisdiccion_referencia
quiz · cta · aviso_reforzado · leccion_anterior · leccion_siguiente
---

## Título visible
Cabecera de metadatos

### En 30 segundos (TL;DR)     ← tres puntos. Renderizar destacado y separado del cuerpo.
### [secciones del cuerpo]      ← h3, tablas, citas en bloque de dos tipos
## Glosario                     ← 3 términos por lección
## Comprueba lo que has aprendido  ← quiz, 3 preguntas, respuesta desplegable con explicación
## Da el siguiente paso         ← bloque de CTA
## Aviso importante             ← descargo legal
```

Las citas en bloque (`>`) se usan para **dos cosas distintas** y conviene distinguirlas visualmente: las que empiezan por `**La idea central**` y las que empiezan por `**Atención**` o `**Aviso**`.

El bloque legal debe salir de **una sola fuente** del CMS, no copiarse en cada lección: cuando cambie, cambia en las nueve a la vez.

---

## ⚠️ Lo que hay que resolver antes de publicar

He contrastado los CTA de las lecciones con lo que hay hoy en `rwadar.pages.dev`. **Cuatro de los cinco destinos no existen tal como los nombra el contenido.** Si se publica así, siete de las nueve lecciones terminan en un enlace que no lleva a ninguna parte.

| CTA en el contenido | Lecciones | Qué hay hoy en la web | Qué hace falta |
|---|---|---|---|
| `evaluador-viabilidad` | 1, 3, 8 | **No existe** ningún evaluador ni diagnóstico | Decidir: construirlo, o redirigir al **Checklist de Elegibilidad** (PDF ya terminado, 20 criterios, hace exactamente esa función) |
| `radar-categorias` | 2 | Filtros de región, acceso y entrada. **No hay filtro por categoría** (marketplace / emisor / infraestructura) | Añadir el filtro, o enlazar al radar sin filtrar |
| `radar-capacidad-regulatoria` | 4 | **No hay filtro por supervisión.** Las fichas sí muestran «Licencia / registro» | Añadir el filtro, o enlazar a la ficha tipo |
| `radar-comparador` | 5, 7, 9 | El comparador **existe** (hasta 3 plataformas) pero **no tiene ancla ni URL propia** | Darle un ancla enlazable, p. ej. `#comparador` |
| `radar-nivel-acceso` | 6 | **Existe**: filtro «Todo acceso» | ✅ Nada |
| `fuera-del-radar` | menciones en varias | **Existe**: `#fuera` | ✅ Nada |

**Propuesta de implementación que no bloquea el lanzamiento:** el CTA se pinta desde un **componente único** parametrizado por esa clave. Si un destino todavía no existe, el componente muestra una variante «próximamente» en lugar de un enlace roto. Así se puede publicar la Academy sin esperar a que esté todo el producto.

---

## ⚠️ Contradicción entre el contenido y el Método publicado

La **Lección 7** enseña al usuario a leer el radar y enumera los cuatro criterios de verificación así:

> supervisión regulatoria · operativa verificable · ausencia de crisis activas · trayectoria

La página de **Método** de la web publica otros cuatro:

> Entidad y permisos · Actividad y fecha · Acceso y condiciones · Riesgos y alertas

**No son los mismos.** Se parecen en los dos primeros, y el cuarto es directamente distinto. Un usuario que lea la lección y después mire el método verá dos versiones del criterio que supuestamente define el proyecto entero.

**Esto no lo puede resolver quien monta la web: es una decisión editorial.** Hay que fijar cuáles son los cuatro criterios reales y después alinear el otro lado. La Lección 7 no debería publicarse hasta que estén unificados.

---

## Orden de publicación propuesto

| Fase | Qué sale |
|---|---|
| **1 · Lanzamiento** | Niveles 1 y 2 — lecciones 1 a 6, con el minutaje corregido |
| **2 · 2–4 semanas después** | Lecciones 7 y 8, una vez unificados los criterios del método |
| **3** | Lección 9 |

Las seis de la fase 1 cubren *entender* y *decidir*, e incluyen marco legal, costes y liquidez, que son las que más retienen. Publicar las nueve de golpe deja el calendario editorial vacío desde el primer día.

---

## Lo que necesito de ti

1. **Confirmar los destinos de CTA** de la tabla de arriba: cuáles existirán al publicar y cuáles salen como «próximamente».
2. **Elegir dónde vive el contenido**: CMS headless, o estos Markdown directamente en el repositorio.
3. **Una estimación por fases**, no una fecha global.

Cualquier duda sobre el contenido, a mí. Cualquier duda sobre el modelo de datos, está resuelta en la especificación.
