# Grupo suiza · 12/11/2026

Revisión rápida de las tres fichas suizas que se venden en portales con
tecnología de Aktionariat: **Aktionariat**, **Boss Info** y **Switzerlend**.
Consultas de hoy entre las 00:33 y las 00:43 UTC (reloj del sistema). Se
compara con lo publicado (revisión `24b5f7de`, datos del 11/11) y con las
copias del 11/11 (grupo reventa).

## En una frase

**No cambia nada de fondo en ninguna de las tres.** El precio del emisor, los
mínimos, la recompra (cerrada en las tres), los libros de órdenes, el historial
de operaciones, los documentos y los registros están igual que ayer. Solo hay
que pasar las fechas del 11/11 al 12/11. Los textos publicados de acceso y de
salida se quedan como están (opción (a) del 11/11).

## Qué se volvió a abrir hoy

| Fuente | Resultado de hoy |
|---|---|
| API pública de los tres portales: configuración de compra, ajustes del mercado, libro de órdenes e historial completo de operaciones (00:34:27–00:34:39Z) | Historiales **idénticos byte a byte** (1.231, 319 y 94 operaciones): ninguna operación nueva. Libros con el mismo contenido (solo cambia la hora de actualización). Configuración: solo cambian los tipos de cambio. |
| Lectura en cadena (Ethereum, nodo público, solo lectura): contratos de venta del emisor (bloque 26.395.306) y del mercado entre accionistas (bloque 26.395.307) | Todas las lecturas iguales que ayer: precios 7,25 / 8,50197 / 68,0105; recompra apagada en los tres; comisión 190 puntos básicos (1,9 %) y mercado abierto. |
| Páginas del portal con navegador sin cabeza (portada, compra, mercado y pestaña de venta; 00:35:33–00:37:37Z) | Mismo texto visible que ayer en las 12 páginas. |
| Documentos: 5 PDF, aviso legal y condiciones de Aktionariat, condiciones del portal (las mismas en los tres), FAQ y página de tokens de Boss Info, página de inversores de LEND, código verificado en Sourcify | PDF, aviso legal, condiciones y código con **el mismo SHA-256**. Las páginas de Boss Info y LEND cambian de HTML, pero no de texto. |
| Registros: Zefix, FINMA (autorizados y lista de advertencias), PolyReg | Respuestas idénticas. FINMA: ninguna de las tres autorizada; lista de advertencias con 2.404 entradas, igual que ayer, sin ninguna de ellas. PolyReg: solo Switzerlend afiliada (blanqueo). |
| CNMV, advertencias, por el nombre con y sin «AG» | «No hay datos disponibles» en las seis búsquedas; mismo texto que ayer. |

Ninguna fuente bloqueada. Única incidencia: `www.lend.ch` responde hoy con una
redirección permanente (301) a `lend.ch`; se leyó siguiendo la redirección y el
texto es el mismo.

## Qué cambia en cada ficha

### Aktionariat (principales) · `actualizar`

- «Precio del emisor · 11/11/2026» pasa a **12/11/2026**: 7,25 CHF, fijo.
- «Supervisor»: misma frase con fecha **12/11/2026**.
- Aviso de vendedores por debajo del emisor: «6,20 ZCHF frente a 7,25 CHF el
  **12/11/2026**».
- Mínimo, acceso y salida publicados («500 CHF por transferencia bancaria»,
  «Disponible para residentes en Suiza y el Espacio Económico Europeo…»,
  «Venta solo a otros accionistas; el emisor no recompra»): sin fecha y sin
  cambios.

### Boss Info (reventa) · `actualizar`

- Mínimo: «100 CHF por transferencia al emisor; en cripto, desde 2 acciones
  (unos 17 ZCHF el **12/11**)».
- «Supervisor»: fecha **12/11/2026**.
- Aviso del precio del emisor por encima de la venta más barata: «8,40 ZCHF el
  **12/11/2026**».
- Referencia «Última operación»: lo publicado todavía dice **10/11/2026** (la
  entrega del 11/11 no la cambió). Propuesta: «Última operación · 12/11/2026:
  8,40 ZCHF (1 acción, 05/11/2026)».
- Sigue igual: nadie compra al emisor desde el 29/06/2026; compra 7,30 × 1.000
  y venta 8,40 × 103 entre accionistas.

### Switzerlend (reventa) · `actualizar`

- Mínimo: «1 acción (68,01 CHF el **12/11**)».
- «Supervisor»: fecha **12/11/2026**.
- Aviso de la recompra: «… el **12/11/2026** la recompra seguía desactivada y
  casi sin fondos (0,03 ZCHF)». Sigue el conflicto: la web de LEND dice que se
  puede revender al emisor, pero el contrato tiene la recompra apagada.
- Aviso de vendedores por debajo del emisor: «67,00 ZCHF el **12/11/2026**».

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
- Copias de texto en `fuentes/`; respuestas crudas, PDF y lecturas en cadena en
  `fuentes/crudo/` (fuera de Git).
