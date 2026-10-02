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

## Lo que tiene que resolver el equipo editorial (Eric / Víctor)

1. **Los cuatro criterios del método no coinciden.** La lección 7 enseña
   «supervisión regulatoria · operativa verificable · ausencia de crisis
   activas · trayectoria»; la web publica «Entidad y permisos · Actividad y
   fecha · Acceso y condiciones · Riesgos y alertas». Eric ya lo había visto.
   **Ojo: no es solo la lección 7.** También aparecen los «cuatro criterios»
   en lecciones ya publicables:
   - Lección 2, siguiente paso: «las plataformas que no superan nuestros
     cuatro criterios de verificación».
   - Lección 4, siguiente paso: «el radar verifica a cada plataforma frente a
     cuatro criterios, y el primero es precisamente la supervisión
     regulatoria».
   - Lección 6, «Qué viene ahora» y siguiente paso: «uno de nuestros cuatro
     criterios de verificación es la ausencia de crisis activas».
2. **Funciones del radar que el texto da por hechas y no existen:**
   - Filtrar por **categoría de proveedor** (marketplace, emisor,
     infraestructura): lecciones 2, 4, 5 y 7. El radar filtra por tipo de
     activo, región, acceso y entrada.
   - Filtrar por **supervisión o capacidad regulatoria**: lección 4.
   - El **Evaluador de Viabilidad** se describe con detalle (puntuación de
     madurez, mapa de brechas, capa anónima y consentimiento por proveedor):
     lecciones 1 a 9. No existe.
   - La **checklist descargable del expediente**: lección 8. No está en el
     repositorio (el README habla de un PDF «ya terminado»: si existe, que nos
     lo pasen).
   - En la lección 6, el filtro de acceso se describe como «minorista,
     acreditado, institucional, enterprise»; la web dice «Minorista,
     Acreditado, Institucional, Empresas».

   La web y la app ya muestran «Próximamente» o una nota en cada botón, pero
   el **texto** de las lecciones sigue describiendo esas funciones. Lo más
   limpio es ajustar las frases o construir las funciones.
3. **Dos enlaces mal en el frontmatter** (el generador los corrige usando el
   orden de módulos y avisa cada vez):
   - Lección 1: `leccion_siguiente` vacío (debería ser la lección 2).
   - Lección 8: `leccion_siguiente: despues-de-emitir` (el slug real es
     `despues-de-emitir-ciclo-de-vida`).
4. **Variantes del aviso común.** Las lecciones traían el descargo común con
   pequeñas diferencias (unas con «y verifica la información vigente en las
   fuentes oficiales», otras sin ella; la 7 con una frase más corta). Se ha
   unificado en la versión más completa. Si Eric prefiere otra redacción,
   basta con cambiar `aviso-legal.md`.
5. **Imágenes por nivel** para compartir en redes (la especificación pide
   tres). De momento todas usan la imagen general de RWAdar.

## Fuera de esta entrega (como pide la especificación)

Cuentas, certificados, comentarios, buscador interno de la Academy, otros
idiomas y descarga en PDF.
