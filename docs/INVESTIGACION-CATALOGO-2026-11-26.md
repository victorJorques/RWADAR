# Catálogo · 26 de noviembre de 2026

Orden de la dirección (26/11): «No gastes agentes extra gasta solo tu capacidad, coteja la información de códex
que es de hoy con lo que hiciste y lanza la actualización de toda la app y la web». Sobre las fotos de las ofertas:
«Haz lo que mejor quede y mejor sea, para Rwadar».

## Resultado

- **Entrega 2026-11-26** (revisión `47b53d7d`): las 22 fichas re-verificadas hoy, vigentes hasta el **03/12/2026**.
  300 cambios, cada uno con su prueba de hoy; la mayoría solo de fecha («consulta 26/11/2026»).
- **Entrega 2026-11-26.2** (revisión `4601a164`): sale **«Hausera · próximas ofertas»**. Alicante 3 figura como
  financiada (5.196.000 €) y las 15 operaciones de su lista están financiadas: no hay nada «en camino».
- Quedan **21 ofertas** (8 principales, 13 de reventa, 0 en camino) y 25 plataformas (5 descartadas).

## Cifras que cambian

- Spiko Letras del Tesoro Euro **2,45 → 2,44 %** (VL del 26/11, 1,063785 €); Dólar **4,00 → 3,90 %** en USD (VL del
  25/11); Smart Cash **2,84 %** (igual, VL del 26/11).
- mTBILL **1,0791 USD** y **3,42 %** anual en USD (ronda 500 del 24/11 frente a la 477 del 20/10).
- Brickwise (libro de órdenes de las 18:17 UTC): Gratwein **68,80 → 70 €**, Hinterstoder **75 → 77 €**; los demás
  mínimos, iguales. Cambian algunas órdenes (Sonnleithnergasse: la orden más pequeña pasa a 100 €).
- Switzerlend: ya **no hay órdenes de compra** entre accionistas (el 21/11 había una a 59 ZCHF).
- Aktionariat, Boss Info, Robinhood, Kraken y Prosegur: sin cambios en sus fuentes.

## Cotejo con Codex (25–26/11)

- #204 (noticias del 25/11) y #206 (gráfico) entran tal cual; la prueba de la serie de 400 días se ajusta a la regla
  de #206.
- Su lote `catalogo-2026-11-25-v2` (retirar Hausera y cifras de Spiko del 21/11, sin ampliar la vigencia) no se
  aplicó: lo sustituyen estas dos entregas, con las cifras de hoy y la vigencia ampliada (`LEEME.md` en su carpeta).

## Cómo se hizo (una sola sesión, sin agentes)

1. Lectura pública (18:16 UTC) y vigía (18:17 UTC): 20 cifras cambian, 57 no; 50 PDF con la misma huella.
2. Radar 69 de 69. A mano: REGAFI (API pública), Centrifuge (navegador) y la OCC (PDF). Blocksquare puso su
   documentación para socios tras inicio de sesión: se cita su web y se corrigen los dos textos que se apoyaban en ella.
3. Cada fuente de las 22 fichas, releída como visitante (173 lecturas, 18:18–18:43 UTC; lista en
   `fuentes/releidas-2026-11-26.txt`). Un dato solo se re-fecha si su fuente se leyó hoy.
4. `montar.py` escribe expedientes y `decisiones.json`; el motor prepara, ensaya en PGlite (19 pruebas, 6 casos de
   fallo) y audita (`conforme_sin_cambios_en_el_sql`, gitleaks sin hallazgos). La 26.2, con su guion y su ensayo
   (16 pruebas, 6 casos de fallo, también contra la lectura pública tras aplicar la 26).
5. Una sola revisión del diff (`DIFF-ENTREGA.md`); un arreglo (no enseñar una dirección técnica como fuente).
6. Vigía antes de aplicar (19:07 UTC): las 77 cifras, iguales.

## Lo que queda

- Candidatas nuevas: no se buscaron en este ciclo (sin agentes).
- Hausera: si anuncia otra operación, se valora como alta nueva.
- Spiko Smart Cash: la AMF sigue sin la ficha del fondo en GECO.
- La referencia «Historial publicado» de Hausera no se re-fechó: salió con la tarjeta.

Detalle: `rwadar-app/data/verificaciones/2026-11-26-v2/` y `2026-11-26.2-v2/`.
