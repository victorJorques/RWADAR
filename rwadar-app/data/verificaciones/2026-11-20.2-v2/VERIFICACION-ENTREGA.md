# Verificación de la entrega 2026-11-20.2 (comprobación determinista)

Generado por `motor.mjs auditar 2026-11-20.2`. Compara el SQL que vieron los revisores con el de después de corregir.

**Veredicto:** EL SQL CAMBIÓ. Hace falta el auditor (agente) para ver que cada diferencia de abajo es una corrección pedida.

- SQL revisado (antes de corregir): `7b13a3d28ad47a3dac14d77dbbb1211f9d718ac8bf07548f1a05b42a9e9c8391` (es el que dio el montador).
- SQL final: `622881c1f1c00e48f657ec8b1240fcd408f79dc7a89df558531a3048e47387cb`.
- Rehecho dos veces desde decisiones.json en una carpeta aparte: mismos SHA-256 las dos veces: sí; igual byte a byte a lo de la carpeta: sí.
- Mismo inventario de sentencias antes y después: sí (288 sentencias: 35 en alerta_fuentes, 25 en alertas, 69 en fuentes, 22 en ofertas, 107 en plataforma_fuentes, 25 en plataformas, 1 en revisiones).
- Sentencias que cambian (sin contar la revisión y la huella): 1.
  - rwadar_catalogo.ofertas 'spiko-smart-cash-euro' 'https://www.spiko.io/es/spiko-euro':
    - «no consta en ningún supervisor» → «ningún registro público confirma que este fondo esté dado de alta para venderse en España»
- Ensayo en PGlite: correcto, 18 comprobaciones y 6 casos de fallo.
- Escáner de secretos sobre lo que irá a Git: sin hallazgos.

## Hallazgos

Ninguno.

## Sin auditor, por orden del responsable del proyecto

Orden permanente del 14/11/2026: «que se revise el trabajo pero 1 vez, no mil»
(se construye, se revisa una vez, se arregla lo que salga y se entrega, sin
verificar los arreglos). Por eso no se lanza el auditor que propone este
veredicto. Lo que cubre esta comprobación determinista basta para la única
corrección del SQL:

- Cambia **una sola sentencia** (la oferta `spiko-smart-cash-euro`) y en ella
  **una sola frase**: «no consta en ningún supervisor» pasa a «ningún registro
  público confirma que este fondo esté dado de alta para venderse en España».
  Es el texto exacto que pidió la revisión de cumplimiento (C1), con su prueba
  en `REVISION-ENTREGA-cumplimiento.md`.
- La entrega se rehace igual dos veces, PGlite da «correcto» (18 pruebas y 6
  casos de fallo) y el escáner de secretos no encuentra nada.
- Las correcciones S1 y O1 (revisiones de SQL y de contenido) son del informe
  (`INFORME-ENTREGA.md`) y no cambian el SQL.
