# Grupo suiza · 13/11/2026

Puesta al día rápida de las tres fichas suizas que se venden en portales con
tecnología de Aktionariat: **Aktionariat**, **Boss Info** y **Switzerlend**.
Todas las fuentes se volvieron a abrir hoy entre las 08:31 y las 08:34 UTC
(reloj del sistema). Se compara con lo publicado (revisión `a58dd22d`, datos
del 12/11) y con las copias del 12/11 del mismo grupo.

## En una frase

**No cambia nada de fondo en ninguna de las tres.** El precio del emisor, los
mínimos, la recompra (cerrada en las tres), los libros de órdenes, el historial
de operaciones, los documentos y los registros están igual que ayer. No hay
advertencias nuevas de la CNMV ni de FINMA sobre estas sociedades. Solo hay que
pasar las fechas del 12/11 al 13/11. Los textos publicados de acceso y salida
se quedan como están.

## Qué se volvió a abrir hoy

| Fuente | Resultado de hoy |
|---|---|
| API pública de los tres portales: configuración de compra, ajustes del mercado, libro de órdenes e historial completo de operaciones (08:31:15–08:31:23Z) | Historiales **idénticos byte a byte** (1.231, 319 y 94 operaciones): ninguna operación nueva. Libros con el mismo contenido (solo cambia la hora de actualización). Configuración: solo cambian los tipos de cambio. Ajustes del mercado con el mismo SHA-256. |
| Lectura en cadena (Ethereum, nodo público, solo lectura), bloque 26.404.862 (08:31:11Z) | Todas las lecturas iguales que ayer: precios 7,25 / 8,50197 / 68,0105; recompra apagada en los tres; comisión 190 puntos básicos (1,9 %) y mercado abierto en los tres. |
| Páginas del portal con navegador sin cabeza (portada, compra, mercado y pestaña de venta; 08:32:51–08:34:28Z) | Mismo texto visible que ayer en las 12 páginas. |
| Documentos: 5 PDF, aviso legal y condiciones de Aktionariat, condiciones del portal (las mismas en los tres), FAQ y página de tokens de Boss Info, página de inversores de LEND, código verificado en Sourcify | PDF, aviso legal, condiciones y código con **el mismo SHA-256** que ayer. Las páginas de Boss Info y LEND cambian de HTML, pero no de texto. |
| Registros: Zefix, FINMA (autorizados), PolyReg | Respuestas idénticas a las de ayer (mismo SHA-256). Ninguna de las tres está autorizada por FINMA; solo Switzerlend está afiliada a PolyReg (blanqueo). |
| FINMA, lista de advertencias | Pasa de 2.404 a 2.407 entradas: 3 nuevas (famma-ag.com, trade.12-ventures.online y kairosbridge-ag.com) y 1 retocada. **Ninguna** es de Aktionariat, Boss Info, Switzerlend o LEND. |
| CNMV, advertencias, por el nombre con y sin «AG» | «No hay datos disponibles» en las seis búsquedas; mismo texto que ayer. |

Ninguna fuente bloqueada. `www.lend.ch` sigue respondiendo con una redirección
permanente (301) a `lend.ch`; se leyó siguiendo la redirección. Estas fuentes no
están en el comprobador de rutas de las 08:28 UTC porque ninguna bloquea.

## Precio de hoy en el libro de órdenes público (13/11, 08:31 UTC)

| Ficha | Precio del emisor | Venta más barata entre accionistas | Mejor compra entre accionistas |
|---|---|---|---|
| Aktionariat | 7,25 CHF | 6,20 ZCHF × 356 acciones | 6,10 ZCHF × 10 acciones |
| Boss Info | 8,50197 | 8,40 ZCHF × 103 acciones | 7,30 ZCHF × 1.000 acciones |
| Switzerlend | 68,0105 | 67,00 ZCHF × 15 acciones | 59,00 ZCHF × 4 acciones |

Comisión entre accionistas en los tres: 0 % quien compra y 1,9 % quien vende
(API, pestaña de venta y contrato).

## Qué cambia en cada ficha

### Aktionariat (principales) · `actualizar`

- «Precio del emisor · 12/11/2026» pasa a **13/11/2026**: 7,25 CHF, fijo.
- «Supervisor»: misma frase con fecha **13/11/2026**.
- Aviso de vendedores por debajo del emisor: «6,20 ZCHF frente a 7,25 CHF el
  **13/11/2026**».
- Mínimo, acceso y salida publicados: sin fecha y sin cambios.

### Boss Info (reventa) · `actualizar`

- Mínimo: «100 CHF por transferencia al emisor; en cripto, desde 2 acciones
  (unos 17 ZCHF el **13/11**)».
- «Supervisor»: fecha **13/11/2026**.
- Aviso del precio del emisor por encima de la venta más barata: «8,40 ZCHF el
  **13/11/2026**».
- Referencia «Última operación · **13/11/2026**: 8,40 ZCHF (1 acción,
  05/11/2026)».
- Sigue igual: nadie compra al emisor desde el 29/06/2026.

### Switzerlend (reventa) · `actualizar`

- Mínimo: «1 acción (68,01 CHF el **13/11**)».
- «Supervisor»: fecha **13/11/2026**.
- Aviso de la recompra: «… el **13/11/2026** la recompra seguía desactivada y
  casi sin fondos (0,03 ZCHF)». Sigue el conflicto: la web de LEND dice que se
  puede revender al emisor, pero el contrato tiene la recompra apagada.
- Aviso de vendedores por debajo del emisor: «67,00 ZCHF el **13/11/2026**».

## Bloqueos y límites (los mismos de ayer)

- No se probó el registro ni el KYC de los portales (fuera del encargo).
- No se publica cuánto queda del tope de 100.000 € para el EEE.
- Los contratos del mercado entre accionistas de DAKS y BOSS siguen sin código
  verificado en Sourcify (404 hoy); la comisión se confirma con la misma
  función del contrato verificado de LENDS.
- La API de Aktionariat sigue sin el campo de verificación de identidad.
- La configuración de Boss Info lleva un correo personal: solo está en
  `fuentes/crudo/`, no se copia.

## Archivos

- Expedientes: `../../expedientes/aktionariat.json`, `boss-info.json` y
  `switzerlend.json`.
- Inventario: `inventario-consultas.json` (97 entradas, con el SHA-256 de ayer
  al lado para comparar).
- Copias de texto y capturas en `fuentes/`; respuestas crudas, PDF y lecturas
  en cadena en `fuentes/crudo/` (fuera de Git).
