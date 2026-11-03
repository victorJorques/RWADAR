# Revisión independiente · entrega 2026-11-03.2 (solo lectura)

Veredicto: aprobado_con_cambios (ninguno bloquea el aplicador; ver abajo).
SHA-256 aplicar-y-aprobar.sql: 2356fc5d3be13592f270aa764c09acad550894aeb3f85b0182cf0d8141650f77
Revisión 522272dd-7730-3654-05dd-2f7879cf793f; guarda sobre a4792f79-0f4d-361b-a14d-3eeb95bf7499.

## 1. Herramientas «.N»
- Workflow: regex anclado, el valor llega por env (sin interpolar en el script), solo admite dígitos y un punto; sin «/» ni «..». Seguro.
- esRevisionLocal / ordenRevisionLocal: fechas validadas con slice(0,10); «.1», «.0», «.x» rechazados; orden correcto (probado).
- generar.mjs: la clave de orden funciona (2026-11-03-v2 = 1, .2 = 2).
- actualizar-catalogo: ordena bien; una revisión del mismo día no cuenta como «anterior» (f<FECHA), intencionado.
- Menor: el workflow admite «.1»/«.01» pero el cargador no; inocuo (el fichero debe existir).
- Menor: rwadar-servir.js y rwadar-site (línea 2940) siguen exigiendo ^\d{4}-\d{2}-\d{2}-v2$; el servidor local no cargaría un lote «.2». No afecta a la entrega.

## 2. Presentación
Web y móvil: un mínimo «No documentado en euros» con unidadDocumentada se muestra tal cual; sin efecto en otros textos. Correcto.

## 3. Datos
- Reejecutado comprobar-entrega.mjs: pasa (exit 0); solo reescribe la marca de hora de pruebas-locales.json (restaurado).
- preparar-entrega.mjs: mismos bytes del aplicador y datos (git diff vacío salvo esa marca, que solo escribe comprobar).
- Contra 2026-11-03-v2: radar y manifiesto idénticos; escaparate idéntico salvo vigenciaDias 1→7 en las 23 ofertas (verificadaEl 02/11 → hasta 09/11); documentación: +3 referencias en cada una de 5 (15), nada más.
- Aplicador: solo begin/commit, 2 bloques do (guarda y aprobación) e inserts (26 plataformas, 23 ofertas, 1 revisión, fuentes, alertas); sin DDL, delete, drop, truncate. Conteos 26/23 y 6/14/3.
- Referencias vs expedientes: respaldadas (Spiko EUR 1 EUR/KID 11:30/KYC/US persons/gate 10 %; Spiko USD 1 USD/11:30; Robinhood 1 €, CNMV 5299, recompra; Prosegur 1 gramo, 1–7 días, §§6.4/6.7, EEE; Aktionariat 500 CHF, tope 100.000 €, no recompra). Sin promesas.
- Reparos:
  a) Spiko EUR «Desde 1 €»: la revisión independiente (REVISION-ALTAS §5) dejó sin comprobar el conflicto 1 EUR/1.000 EUR de otra clase (FR001400SBD3); el expediente EUR sí respalda 1 EUR para EUTBL (FR001400ODL1, folleto y API), pero el expediente USD conserva la nota de conflicto. El alcance dice «revisado de forma independiente», lo que para este mínimo es excesivo. Cambio: precisar «clase EUTBL (FR001400ODL1)» en el alcance, o quitar «revisado de forma independiente» en esa referencia.
  b) Robinhood «Salida… en días de mercado de EE. UU.»: el expediente dice 24/5; redactar «24 h, 5 días a la semana» o equivalente.
  c) Spiko USD: la nota del expediente (conflicto KID/folleto sobre la VL) no se traslada; correcto no prometer.

## 4. 7 días
Aceptable: todas las ofertas llevan fecha de comprobación (02/11) y las dos cifras variables (2,35 % / 4,13 %) son rendimiento a 31 días, fechado 30/10 y marcado variable/no garantizado. Condición: la fecha de cada cifra debe verse en la tarjeta/ficha y no renovar tras el 09/11 sin nueva comprobación.
