# Revisión independiente del lote editorial parcial · 23/10/2026

Revisor: Codex, ayudante de revisión independiente. Alcance: lectura del generador, los dos SQL locales, el comprobador y su evidencia PGlite ya guardada, y las cuatro referencias propuestas. No se han repetido las pruebas PGlite, ejecutado SQL remoto, regenerado el lote ni publicado la web.

**Veredicto: revisión local favorable para este lote documental parcial concreto.** Añade cuatro referencias a tres fichas y conserva las 26 plataformas, 49 ofertas y fechas comerciales del lote anterior. Esto no constituye una aprobación integral de la investigación de las 49 ofertas, una autorización para aplicar SQL ni una comprobación del estado actual de producción. La aplicación remota requiere permiso expreso de Víctor para este ciclo y comprobar primero la revisión publicada real.

## Identidad exacta revisada

Revisión nueva: `c406fa37-a1d3-281c-117a-95819762cfcf`. Hash de contenido del lote: `c406fa37a1d3281c117a95819762cfcf793f0fdb1210ac39b6114355ead88af3`. Revisión anterior prevista: `349df4ef-97a2-db57-841f-a2f5114a6837`.

| Archivo | SHA-256 comprobado en esta revisión |
| --- | --- |
| `rwadar-app/data/importaciones/catalogo-2026-10-23-v2/aplicar-y-aprobar.sql` | `07cca22348b83cf942c13839bd5f0e1a04c586b71d249edb4cc7ec2f08c261b1` |
| `rwadar-app/data/importaciones/catalogo-2026-10-23-v2/catalogo.sql` | `d8617406b11926a11bf75b2dbebe29216952b65aa38d6b14d2fecaf2851236a9` |
| `rwadar-app/data/verificaciones/2026-10-23-v2/preparar-lote-parcial.mjs` | `d85f5b67beb46ba91ecff45da4aef36c07ccf0f2f29f02cb075f29ef90053932` |
| `rwadar-app/data/verificaciones/2026-10-23-v2/comprobar-lote-parcial.mjs` | `83f4c891ac3b8aa3be533f6b7c82dccc2ac0ce7ec77cd9301c1180607b7d86af` |
| `rwadar-app/data/verificaciones/2026-10-23-v2/pruebas-locales.json` | `8ff4b96105205ed2066ed6b621860a43f1be9e8a4bbc8513889e1f766bf548b6` |

Los hashes coinciden con el inventario de mutaciones guardado. Cualquier cambio posterior de SQL, generador o fuentes deja fuera de alcance esta identidad revisada.

## SQL, conservación y fechas

| Control | Resultado de la lectura independiente |
| --- | --- |
| Alcance de las escrituras directas | Solo siete tablas de `rwadar_catalogo`: `revisiones`, `fuentes`, `plataformas`, `plataforma_fuentes`, `alertas`, `alerta_fuentes` y `ofertas`. No contiene DDL, borrados, cambios de Auth, cuentas o comunidad. |
| Efectos de publicación existentes | Aprobar `revisiones` activa los triggers existentes que actualizan `rwadar_catalogo.publicacion_v2` y `public.catalogo_publicacion`. Son efectos reales del aplicador, también declarados en el inventario; «siete tablas» describe el DML directo, no todo efecto indirecto. No se redefinen estos triggers. |
| Transacción y precondiciones | `SERIALIZABLE`; bloqueo de los dos controles de publicación; solo admite la revisión anterior prevista o esta misma revisión nueva. Rechaza catálogo retirado/control ausente, fecha futura y revisión destino retirada o con otro hash. |
| Conservación | Inserciones por revisión con `ON CONFLICT DO NOTHING`, sin borrar ni actualizar las filas del lote anterior. La aprobación se hace al final y exige 26 plataformas, 49 ofertas y reparto 24/21/4; si falla, la transacción se deshace. |
| Repetición | La segunda aplicación no vuelve a aprobar una revisión ya aprobada. La evidencia guardada compara las siete tablas completas antes/después y conserva íntegramente el lote anterior. |
| Cambio editorial | Cero altas. Cuatro referencias nuevas: Casa de Outeiro, dos de Prosegur y una de IOD. Solo estas tres documentaciones reciben la fecha de entrega documental del 23/10. |
| Fechas honestas | El radar, escaparate y manifiesto se copian literalmente del 22/10. No se renuevan rentabilidades, mínimos comerciales, consultas del radar ni vigencias generales. Las referencias mantienen separadas la fecha del documento y la consulta del 23/10. |
| Caducidad y copia completa | La evidencia conserva el final de vigencia original: 29/10 inclusive; desde el 30/10 se admite la copia completa con aviso de caducidad. No se amplía la revisión general por incorporar documentos. |
| Contratos e imágenes | El ensayo guardado verifica los contratos públicos compartidos web/app, las 26/49 filas y 49 imágenes existentes por SHA y bytes. Este lote no genera ni sustituye imágenes. |

Se leyó `comprobar-lote-parcial.mjs`: reconstruye el SQL canónico para contrastar identidad, exige copia literal de los tres archivos y compara cada documentación con el original más sus referencias permitidas. La evidencia PGlite tiene fecha `2026-10-23T19:32:44.147Z` y resultado correcto. Incluye borrador invisible, dos aplicaciones iguales, conservación de las siete tablas anteriores, salida pública financiera y fechas idénticas, contratos, caducidad y rechazo con rollback de revisión anterior incorrecta y oferta ausente. Se reutiliza esa ejecución; esta revisión no certifica una ejecución nueva.

## Contraste de las cuatro referencias

| Ficha y afirmación | Evidencia y alcance admisible |
| --- | --- |
| Casa de Outeiro: mínimo de 2.000 EUR, 80 acciones de 25 EUR | FDF v4, §3/p. 4, documento fechado 24/06/2026 y consultado el 23/10. Coincide con la revisión independiente previa de IOD/Outeiro/Spiko. No convierte el precio de una acción en el mínimo, no acredita admisión individual desde España ni elimina las restricciones de transmisión. |
| Prosegur: compra LBMA +4 % y venta LBMA −6 % | Copia completa de los términos de 08/07/2026, §5.4 y su cuadro de comisiones. La referencia conserva que el cuadro puede cambiar y que pueden añadirse gastos bancarios, de pago o divisa. No afirma coste total cero por la custodia. |
| Prosegur: recompra exclusiva; normalmente 1–7 días hábiles aproximados | Términos, introducción del §6 y §§6.1–6.7. Es una vía contractual de recompra, con cotización, posibles suspensiones/límites y demoras bancarias. La referencia retiene el conflicto con la publicidad de menos de 24 horas; no promete venta a terceros ni liquidez inmediata. |
| IOD: campaña observada cerrada, 120.000/120.000 EUR | La captura `primaria/iod-navegador.txt` muestra «Cerrado», 1.200/1.200 tokens y recaudación completa. La referencia lleva `fechaDato: null` y consulta 23/10: no inventa una fecha de cierre, amortización o pago. La fecha límite de la FDF no se utiliza para reabrir la campaña. |

### Cierre documental de Prosegur

La fuente completa guardada es [prosegur-condiciones-browser.json](../primaria/prosegur-condiciones-browser.json): URL `https://app.prosegurdigitalgold.com/#/terms-service`, texto extraído de 71.548 caracteres y 407 líneas, archivo de 74.721 bytes. SHA-256 comprobado: `77d42a940e58e85b93516bd5dc285e6b6ff3c314033a4d0f62ae9c2389034a75`, también registrado en `primaria/huellas-capturas.json`.

La cabecera del propio documento indica actualización **08/07/2026**. El expediente registra el intervalo de consulta **23/10/2026, 18:57:56–19:09:16 UTC**. La revisión independiente leyó el cuadro completo del §5.4 y los apartados relevantes del §6 en esa copia, no únicamente una frase de la portada. La copia disponible es texto y enlaces del documento público renderizado; no demuestra un contrato individual firmado, aceptación de un usuario, reservas de oro auditadas ni admisión personal.

Los §§5.3/5.5 y 6.5 añaden los gastos de pago, banco y cambio; el §6.4 matiza el plazo aproximado y el §6.7 permite suspensiones y límites. Estas limitaciones sí están conservadas en las dos referencias nuevas. No se añade un mínimo en euros calculado a partir de un gramo ni una garantía de inversión o supervisión financiera.

## Límites que siguen abiertos

- `revisionAnteriorComprobadaEnRemoto` sigue siendo falso. La guarda falla de forma cerrada si el puntero real difiere, pero no sustituye la comprobación previa del estado remoto ni valida por sí sola la definición de los triggers instalados allí.
- Las evidencias locales corresponden al esquema de catálogo usado por el ensayo. La nueva protección de acceso obligatorio/Auth se revisa por otro encargo; no queda aprobada ni ensayada por este informe.
- No se acredita investigación profunda completa de 49 ofertas, nuevas admisiones ni cierre general de los riesgos de cada producto. Tampoco se admiten las referencias con conflictos de Spiko o mTBILL excluidas expresamente del lote.
- El estado de los JSON operativos permanece «borrador / no aplicado / no publicado». El presente informe registra la revisión independiente sin convertir esos indicadores en una aplicación realizada.
- No se ha inspeccionado la web pública ni ningún APK durante esta revisión. El permiso para SQL y el posterior proceso de publicación deben referirse a este lote y a sus hashes concretos.

Referencias locales: [revisión previa de tres casos](REVISION-IOD-OUTEIRO-SPIKO.md), [contraste de referencias](../../../../rwadar-app/data/verificaciones/2026-10-23-v2/contraste-2026-10-23.json), [evidencia PGlite](../../../../rwadar-app/data/verificaciones/2026-10-23-v2/pruebas-locales.json), [inventario de mutaciones](../../../../rwadar-app/data/verificaciones/2026-10-23-v2/inventario-mutaciones.json).
