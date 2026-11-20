# Investigación del catálogo · 20 de noviembre de 2026

Orden de la dirección (16:51 UTC): «Actualiza las fichas y la información de
RWAdar, ofertas, noticias, todo antes de las 12 de la noche». Después: «el valor
de mercado con el gráfico también, todo actualizado al momento de ahora»,
«revisa todas las ofertas e información bien», «todo lo falso fuera… que no
vuelvan a haber textos ni datos falsos» y «la investigación de nuevas ofertas,
en profundidad».

## Resultado

- **Catálogo 2026-11-20** (revisión `eca89db7`): las mismas 22 ofertas (8
  principales, 13 de reventa, 1 en camino) y 25 plataformas (5 descartadas).
  Válido hasta el 27/11/2026.
- **Cambios de cifras:** Spiko Letras Euro 2,40 → 2,45 %, Dólar 3,98 → 4,00 %
  (VL del 20/11), Smart Cash 2,84 %; mTBILL 3,45 → 3,46 % y 1,0789 USD;
  Brickwise: Pottendorfer 80 → 81 €, Cohotel 102 → 110 €, libros de órdenes de
  las 11 al 20/11.
- **Información corregida por la auditoría completa:** avisos de pérdida total
  en Aktionariat, Boss Info y Switzerlend; Robinhood «producto complejo»;
  conflicto de comisiones de mTBILL; Kraken «más de 1.000 acciones»; Hausera con
  la preventa abierta y la suscripción del 25/11/2026 al 30/06/2027; Brickwise
  sin rentabilidades viejas en reventa, citas del KID literales y el número
  fiscal austriaco de Randhartingergasse y Hinterstoder; Spiko Smart Cash sin la
  ficha GECO que la AMF dejó de publicar; Prosegur «según su contrato»; mTBILL
  sin el enlace roto (404); radar de Pax Gold, Midas y Reental.
- **Radar (tabla base, migración 38):** 23 plataformas con textos falsos o sin
  fuente corregidos (Swarm y BaFin, INX y Nasdaq, Lofty y la SEC, Franklin
  Templeton para minoristas, Spiko «solo empresas», Superstate, Backed, Pax
  Gold, Blocksquare, Maple, Securitize, Courtyard, Ondo, Centrifuge, Fireblocks,
  Figure, tZERO, Tokeny, Midas, Reental, ADDX; descartes de Domoblock y Toucan).
- **Mercado en directo (migración 37):** parado desde el 16/11 03:33 UTC porque
  el alta de tokens agotaba la secuencia `smallint`; arreglado, aplicado y
  sembrado; `/api/tokenizacion/directo` vuelve a dar 200.
- **Noticias:** edición del 20/11 (5 importantes; editor y verificador
  independientes, «conforme»).
- **Web:** /cambios y RSS al día; privacidad sin la página de empresas que ya
  no existe.
- **Ofertas nuevas:** búsqueda en profundidad por 4 ángulos (registros CNMV y
  ESMA, acciones y fondos, inmuebles, bonos y materias primas) y las 7
  candidatas vigiladas: 14 expedientes, ninguna cumple hoy todo lo esencial
  (Alius Albal no está abierta; CrowdedHero sin documento público; Franklin
  Templeton sin canal minorista ni KID; LISE sin pasaporte a España; Midas mWIN
  y Ondo Stocks sin acceso minorista documentado). Revisión de cada una:
  esencial, enlaces, tarjeta y calidad.

## Cómo se hizo

1. Vigía (16:52 UTC): 30 cifras que cambian, 47 iguales, 50 documentos y 29
   búsquedas de la CNMV iguales. Radar 69/69.
2. Investigación por 4 grupos con revisor independiente cada uno.
3. Auditoría completa (8 auditores): cada dato visible de las 22 ofertas, las
   30 fichas del radar, las noticias y la web (`auditoria/`). Enlaces de las 22
   fichas: 133, con un único roto de verdad (mTBILL, 404).
4. Entrega con el motor; una sola revisión con tres lentes (SQL, contenido,
   cumplimiento); corrección; `motor auditar` conforme; auditor final
   conforme (`AUDITORIA-FINAL.md`).
5. Migraciones 37 y 38 con su revisión independiente, CI, ensayo en
   producción y aplicación con copia cifrada antes.

## Lo que queda (próximo ciclo)

- Motor: quitar direcciones de la lista «fuentes» (la 404 de mTBILL y GECO de
  Smart Cash) y un cambio de tarjeta de solo fecha (A3).
- Radar de Midas: citar las Condiciones Finales como fuente.
- Hausera: el 25/11 empieza la suscripción de Alicante 3.
- Spiko Smart Cash: por qué la AMF dejó de publicar la ficha GECO.
- Rótulos del mercado con fecha cuando el dato no es de hoy (web y app).
- Las tareas de noticias automáticas del 15 al 18/11 no llegaron a correr
  (la sesión estaba ocupada); hoy se rehicieron las noticias en el ciclo.

Detalle: `rwadar-app/data/verificaciones/2026-11-20-v2/` (DECISIONES,
expedientes, revisiones, auditoría, entrega) y `TEXTOS-RADAR.md`.
