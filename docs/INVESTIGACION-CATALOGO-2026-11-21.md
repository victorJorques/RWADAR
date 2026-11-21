# Investigación del catálogo · 21 de noviembre de 2026

Orden de la dirección (17:34 UTC), al ver en la app la tarjeta de Próximas
«Hausera · Desde 100 € en Alicante 3 (20/11)»: «Y esta ya ha pasado por
ejemplo es antigua, y no sé si ya se puede seguir invirtiendo todos esos
errores los tienes que corregir que el lunes tenemos una reunión muy
importante». Después, sobre Brickwise: «Mantener con aviso»; y «Termina».

## Resultado

- **Catálogo 2026-11-21** (revisión `753b4cc9`): las mismas 22 ofertas (8
  principales, 13 de reventa, 1 en camino) y 25 plataformas (5 descartadas).
  Verificadas el 21/11/2026, válidas hasta el 28/11/2026.
- **Hausera (lo que vio la dirección):** Alicante 3 no ha pasado. La preventa
  (reserva) abrió el 18/11 y la suscripción va del 25/11/2026 al 30/06/2027;
  hoy un particular en España solo puede reservar. La tarjeta pasa de «Desde
  100 € en Alicante 3 (20/11)» a **«Desde 100 € · suscripción desde el
  25/11»**: la fecha del evento, no la de la consulta.
- **Brickwise (8 fichas que piden número fiscal austriaco):** se quedan, con
  un aviso claro: hace falta el número fiscal austriaco y, según Brickwise,
  pedirlo con el asesor que presenta no cuesta nada; las rentas tributan en
  Austria. Las otras 3 (KESt) llevan su aviso de la retención. Libros de
  órdenes del 21/11; Schwarzer Weg 18 pasa de 69,90 a **71,00 €** (orden
  nueva de las 21:36 UTC, vista por el vigía justo antes de aplicar).
- **Nada viejo:** las referencias de las fichas con consultas del 30/09,
  22/10, 01/11, 02/11, 03/11 o 05/11 se re-fechan al 21/11 (si se volvió a
  leer la misma fuente) o se quitan. Quedan 4 que el motor no puede quitar
  (duplicadas del 30/09: «Gestión publicada» de Spiko Euro y «Último cruce
  publicado» de Aktionariat).
- **Cifras:** Spiko Letras Euro 2,45 %, Dólar 4,00 %, Smart Cash 2,84 % (VL
  del 20/11); mTBILL 3,46 % (ronda del 20/11; no hay ronda el sábado);
  Robinhood, Kraken y Prosegur sin cambios. Aktionariat con el libro entre
  accionistas de hoy (6,20 ZCHF la venta más barata; 62 acciones a 5,00 ZCHF).
- **Correcciones de texto:** Robinhood (qué cifra del KID en español es la
  errata), Prosegur (custodiar, tramitar órdenes y transferir criptoactivos),
  mTBILL (las Condiciones Finales son del 17/07/2026), Kraken (sin la fecha
  vieja en «Salida»), Randhartingergasse («si sigue vacía, puede no haber
  repartos»).
- **Candidatas nuevas:** las 6 vigiladas (pagarés de Prosegur Cash,
  Securitize Stocks, Profitus/Axiology, Valorix, CANDO1, Crypto.com UE):
  ninguna tiene hoy todo lo esencial respaldado; no entra ninguna.
- **Radar:** 69 de 69 fuentes iguales; la ficha de Spiko en REGAFI, con la
  misma huella.

- **Publicado (21/11, 22:53–23:37 UTC):** PR #193 (entrega), «Aplicar
  catálogo» (run 44959062110), #194 (sincronización y sello), #195 (arreglo de
  la tarjeta, abajo), «Publicar web» revisión y producción (run 44962460055),
  OTA Android (run 44960376699) y «Avisar novedad» (aviso n.º 10, «Ofertas
  comprobadas de nuevo con fuentes de hoy»). En vivo: revisión `fe0cfaa8`,
  verificada el 21/11; Hausera «Desde 100 € · suscripción desde el 25/11»;
  Schwarzer Weg 18 «Desde 71,00 €»; mTBILL «Condiciones Finales del
  17/07/2026».
- **Arreglo de la web (#195):** a 390 px la tarjeta de Hausera se leía
  «suscripción sde el 25/11». Cada dato de la tarjeta va desplazado 16 px para
  esconder el «·» del primero, y esa franja se recorta: si el texto bajaba de
  línea, perdía las primeras letras. Ahora la segunda línea empieza 16 px más
  adentro (sangría francesa). Las tarjetas de una línea no cambian. Tiene
  prueba en `probar-web.mjs`.

## Cómo se hizo

1. Vigía (17:37 UTC) y lectura pública de lo publicado.
2. Investigación por 6 grupos, con un revisor independiente cada uno.
3. Auditoría completa (8 auditores): cada dato visible de las 22 ofertas, el
   radar, las noticias y la web, contra la fuente primaria de hoy.
4. Entrega con el motor; una sola revisión con tres lentes (SQL, contenido y
   cumplimiento): 11 correcciones obligatorias; `motor auditar` y auditor
   independiente, conforme.
5. Vigía antes de aplicar (22:38 UTC): Schwarzer Weg 18 con la orden nueva;
   corregido y auditado aparte (`VERIFICACION-ENTREGA.md` §9).

## Lo que queda (próximo ciclo)

- Hausera: el 25/11 abre la suscripción; el 02/12, si Alicante 3 llegó al
  50 %.
- Spiko Smart Cash: la AMF sigue sin publicar la ficha del fondo; pedir a
  Spiko la notificación a la CNMV o pasar el acceso a «Sin confirmar».
- Motor: el mínimo de reventa en lote («1 participación desde X €»), quitar
  referencias duplicadas, cambiar el nombre de etiquetas, fuentes nuevas del
  radar (Midas) y avisar de erratas fáciles en los textos nuevos.
- Boss Info y Switzerlend: aviso como el de Aktionariat y pasarlas a
  «principales».
- Brickwise: decir que en España las rentas también cuentan en la
  declaración; el tono del aviso del número fiscal.

Detalle: `rwadar-app/data/verificaciones/2026-11-21-v2/` (DECISIONES,
expedientes, revisiones, auditoría, entrega y verificación).
