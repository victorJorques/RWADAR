# Investigación del catálogo · 12 de noviembre de 2026

Víctor lo pidió el 12/11 a las 00:28 UTC: «Tendrás que actualizar la
información a hoy y acelerar porque no te ha dado tiempo a hacerlo en un día».

Carpeta: `rwadar-app/data/verificaciones/2026-11-12-v2/`.

## 1. En pocas palabras

- **Las 22 ofertas siguen**, revisadas hoy con sus fuentes oficiales.
  Cambian:
  - **mTBILL:** rentabilidad pasada **3,45 % anual en USD**. Sale del
    oráculo del emisor: 5 semanas, del 06/10 al 10/11. El KID dice que ya va
    neta de comisiones.
    - El revisor rechazó el 3,53 % inicial: la ventana de 4 semanas empezaba
      tras un festivo de EE. UU. y contaba un día de más.
    - La vista pública la tapa mientras siga el conflicto de fuentes sobre los
      límites de reembolso.
  - **Brickwise:** Cohotel 110 → **102 €**, GreenPoint 100 → **102 €** y
    Pottendorfer 73 → **80 €**. Las otras 8, re-fechadas.
    - Aviso nuevo en las 11: no consta que se pueda comprar solo una parte de
      una venta, y el comprador paga un 1,5 %.
  - **Spiko:** sin cambios. El 11/11 fue festivo en Francia y no hubo VL
    nueva. Smart Cash sigue en 2,84 %, ahora con la VL del 11/11.
  - **Suizas, Hausera, Robinhood, Kraken y Prosegur:** sin cambios de fondo;
    solo re-fechas.
- **Ninguna oferta nueva.** Crypto.com (UE) está autorizada para España, pero
  su KID solo está dentro de la app.
- **Radar:** 69/69, todas las fuentes leídas hoy. REGAFI, por su API pública
  a las 00:37 UTC.
- **Noticias:** 6 del 12/11. «Hoy»: la CNMV difunde avisos de supervisores de
  Austria, Países Bajos y Alemania sobre 11 firmas sin registro.

## 2. Cómo se hizo, y más rápido

- **Arranque en 5 minutos:** lectura como visitante, comprobador de rutas
  legítimas (76/76) y captura del radar en segundo plano.
- **Todo a la vez:** 4 grupos de ofertas (principales, Brickwise, suiza y
  vigilancia), cada uno con investigador y revisor independiente, más las
  noticias (editor y verificador).
  - La investigación con revisión acabó en unos 30 minutos (de 00:32 a
    01:00 UTC).
- **Entrega:** el montador (25 minutos) más tres revisores independientes
  (SQL, contenido y cumplimiento), corrector y auditor.
- **Publicación:** PR del catálogo, «Aplicar catálogo», sincronización, PR de
  la sincronización y las noticias, sello, web (preview → producción) y OTA.

## 3. Revisiones de la entrega

- **SQL:** `aprobado`.
- **Contenido:** `aprobado`.
- **Cumplimiento:** `aprobado_con_cambios`, sin tocar las cifras.
  - O1: nombres de consejeros recortados en una copia de las noticias.
  - R1: el alcance del mínimo de Hausera pasa a «El 12/11/2026 aún no se podía
    invertir», que es cierto durante toda la vigencia.
- **Auditor final:** `conforme`.
  - El SQL final (`d4d73024…`, revisión `a58dd22d`) solo cambia esa frase de
    Hausera respecto al revisado.
  - Pruebas repetidas.
  - gitleaks: 0.
- **De paso,** se recortaron los nombres de consejeros de Backed que quedaban
  en copias antiguas de `2026-11-03.3-v2` y `2026-11-05-v2` (19 archivos).

## 4. Publicación

- **Catálogo:**
  - PR #104, unida con squash.
  - «Aplicar catálogo» n.º 17: correcto.
  - Lectura como visitante a las 09:30 UTC: revisión `a58dd22d`, 25/22,
    `verificadaEl` 2026-11-12.
  - Cifras comprobadas: Cohotel y GreenPoint 102 €, Pottendorfer 80 €, aviso
    de Brickwise, Switzerlend «68,01 CHF el 12/11» y Spiko 2,41 %.
- **Sincronización:**
  - `sincronizar.js` (25/5/22);
  - `despues-de-aplicar.mjs` (43/44 al 12/11);
  - `volcar-seed.js`, `transparencia.mjs` y `rwadar-fichas.js`.
- **Después:** PR con la sincronización y las noticias, sello, web
  (preview → producción) y OTA. Se ve en `docs/tareas/PARA-CODEX.md`.

## 5. Para el ciclo siguiente

- **Spiko:** VL nuevas hoy a las 18:00 UTC (Letras) y 19:30 UTC (Smart Cash).
- **mTBILL:** la rentabilidad solo se verá cuando se resuelva el conflicto de
  los límites de reembolso (25 % frente a 15 %).
- **Brickwise:** «Participaciones en venta» de 4 fichas se quedan con su fecha
  anterior: DECISIONES no las recogía.
