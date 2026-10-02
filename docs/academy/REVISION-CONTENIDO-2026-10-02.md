# RWAdar Academy · revisión del contenido entregado

*2 de octubre de 2026 · Claude.* Revisión de la entrega de Eric
(`ENTREGA_WEB`, versión 1.0) al montarla en la web y en la app. La entrega
original está en esta carpeta: [`README_ENTREGA.md`](README_ENTREGA.md) y
[`ESPECIFICACION_WEB.md`](ESPECIFICACION_WEB.md). Las lecciones, sin cambiar
una coma, en [`../../rwadar-academy/lecciones/`](../../rwadar-academy/lecciones/).

## Lo que está bien

- Las **nueve lecciones** se leen y pasan todas las comprobaciones
  automáticas: frontmatter completo, TL;DR de tres puntos, glosario, test de
  tres preguntas con respuesta y explicación, siguiente paso y aviso legal.
- Los **minutos corregidos** cuadran con el número de palabras (a 200 por
  minuto). El generador lo vigila para que no vuelva el error de la mitad.
- La fecha de **revisión legal** del frontmatter coincide con la de la
  cabecera y con la línea final de cada lección.
- La lección 9 está **redactada** (la especificación del 14/09 decía «por
  redactar»; el README del 02/10 ya la da por terminada).

## Lo que hemos decidido y cómo

| Tema | Decisión | Dónde se cambia |
|---|---|---|
| Qué se publica | Las lecciones **1 a 6** (fase 1 de Eric). La 7, 8 y 9 salen como «Próximamente», sin página propia ni entrada en el mapa del sitio. | `rwadar-academy/academy.json` |
| Destinos que no existen | **Evaluador de Viabilidad** y **checklist del expediente** se muestran como «Próximamente», nunca como enlace roto. | `academy.json` → `destinos` |
| Filtro por categoría (lección 2) y por supervisión (lección 4) | El botón lleva al radar y una nota explica que ese filtro todavía no existe. | `academy.json` → `destinos` |
| Comparador | Tiene ancla propia: `/#comparador`. En la app abre la web, porque la app no tiene comparador. | `rwadar-site/index.html` |
| Aviso legal | El texto común vive en **un solo archivo** (`aviso-legal.md`). Cada lección conserva solo lo suyo; la 4, 7 y 9 con estilo de aviso reforzado. | `rwadar-academy/aviso-legal.md` |
| Progreso | Sin cuentas: en el navegador (web) o en el dispositivo (app). La política de privacidad se ha actualizado para decirlo. | `rwadar-site/privacidad.html` |

## Correcciones hechas en las lecciones (2/10/2026, a petición de Víctor)

El texto original de Eric está en el historial de Git (commit `5cecbb8`).
Cambios aplicados en `rwadar-academy/lecciones/`:

1. **Los cuatro criterios ya coinciden con el Método publicado:** Entidad y
   permisos · Actividad y fecha · Acceso y condiciones · Riesgos y alertas.
   - Lección 7: el «Filtro 2» se ha reescrito con esos cuatro criterios, qué
     comprueba cada uno y qué no, a partir del texto del Método de la web.
     También su pregunta 2 del test.
   - Lecciones 2, 4 y 6: ya no hablan de «supervisión regulatoria» ni de
     «ausencia de crisis activas» como criterios; la 4 cita «entidad y
     permisos» y la 6 «riesgos y alertas».
   - «Fuera del radar» se describe como lo que es: plataformas **descartadas
     con motivo y fuente** (lecciones 1, 2, 4, 5, 6, 7 y 9).
2. **Lo que todavía no existe se anuncia como «próximamente»**, en futuro:
   - Evaluador de Viabilidad (lecciones 1 a 9).
   - Filtro por categoría de proveedor (lecciones 2, 4, 5 y 7) y por
     capacidad regulatoria (lección 4).
   - Checklist descargable del expediente (lección 8).
   - Lección 9: el comparador ya no promete comparar reporting, coste
     recurrente y plan de salida; dice que eso se pide por escrito.
3. **Acceso:** «enterprise» → «empresas», como en el radar (lecciones 6 y 7).
4. **Enlaces del frontmatter** corregidos (lecciones 1 y 8).

Una prueba automática impide que vuelvan los criterios antiguos o que se
mencione una función futura sin «próximamente».

**Fecha de revisión legal:** no se ha cambiado. Los cambios son de producto
(qué existe y qué no), no de contenido legal. Si Eric quiere, que lo
confirme y se actualiza la fecha.

## Lo que queda abierto

1. **Lección 7:** ya no choca con el Método. Sale como «Próximamente» solo
   por el calendario de Eric (fase 2). Publicarla es cambiar una línea.
2. **Imágenes por nivel** para compartir en redes (la especificación pide
   tres). De momento todas usan la imagen general de RWAdar.
3. **Variantes del aviso común**: unificadas en la versión más completa
   (`aviso-legal.md`). Si Eric prefiere otra redacción, se cambia ahí.

## Fuera de esta entrega (como pide la especificación)

Cuentas, certificados, comentarios, buscador interno de la Academy, otros
idiomas y descarga en PDF.
