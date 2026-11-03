# Grupo aktionariat-midas · resumen · 03/11/2026

Consulta hecha el 03/11/2026 entre las 10:05 y las 10:25 UTC. Solo páginas,
documentos y API públicas, y lecturas en cadena de solo lectura (`eth_call`).
No he iniciado sesión, no he hecho KYC, no he rellenado formularios ni he
conectado wallets. Todo lo leído está en `fuentes/`. Las respuestas de API y de
cadena están en `fuentes/crudo/`, que no entra en Git. La hora, el tamaño y el
sha256 de cada consulta están en `inventario-consultas.json`.

## Lo nuevo que he podido comprobar hoy

- **Registro de FINMA.** Hoy sí he buscado a cada emisor en el registro oficial
  de entidades autorizadas de FINMA. Antes he comprobado que el buscador
  funciona: «Maerki Baumann» y «Sygnum» salen. Ni Aktionariat, ni Boss Info, ni
  Switzerlend, ni ART Leasing, ni Midas tienen licencia FINMA. Era un bloqueo
  pendiente desde el 01/11.
- **PolyReg.** Es el organismo suizo de autorregulación contra el blanqueo.
  **Switzerlend AG está afiliada**; los demás, no. Ojo: eso es supervisión de
  blanqueo, no supervisión financiera.
- **Qué significa cada ajuste del contrato de venta.** Lo he leído hoy en el
  código verificado (Sourcify, Brokerbot versión 8). El ajuste 0x1 quiere decir
  que el emisor vende y el 0x2, que el emisor recompra. Así queda confirmado lo
  que el revisor del 02/11 daba por supuesto.

## Ofertas publicadas

| slug | decisión | qué cambia hoy |
|---|---|---|
| aktionariat | **actualizar** | **Nada de fondo.** Sigue a la venta a **7,25 CHF** (dato del 03/11). Última compra al emisor: 31/10/2026. Mínimo de 500 CHF por transferencia. Aviso legal Suiza + EEE con un tope de 100.000 €. El emisor sigue sin recompra. Libro del 03/11: mejor compra a 6,00 por 5 acciones y mejor venta a 6,20 por 356, igual que el 02/11. Cambian dos cosas: las fechas pasan al 03/11 y la métrica «Supervisor» ya puede decir que no figura en FINMA. Documentos con sha256 idéntico al del 01/11. |
| boss-info | **actualizar** | Precio del emisor 8,50 y libro sin cambios. **Nuevo:** en su página de preguntas frecuentes, el emisor publica la lista de **países excluidos** (EE. UU., China y otros) y **España no está**. Pero no dice que la oferta se dirija al EEE, así que el acceso sigue «no confirmado» y cambia el texto del aviso. **Nuevo:** la última compra al emisor fue el **29/06/2026**. Sigue en secundario. |
| switzerlend | **actualizar** | Precio de 68,01 y última compra el 07/10/2026, sin cambios. **Conflicto nuevo:** la página de inversores dice «puedes revender al Brokerbot si tiene liquidez». En el contrato, la recompra está **desactivada** y solo hay **0,03 ZCHF** para pagar. Además, el contrato solo tiene hoy 57 acciones para entregar al momento. Se añaden el mínimo (1 acción, 68,01 CHF) y la afiliación a PolyReg. Acceso desde España: ningún documento lo dice. |
| mtbill | **mantener** | **Todo igual que el 02/11.** Condiciones Finales y KID en español con el mismo sha256. ESMA, sin documentos nuevos ni suplementos. Valor por token: **1,0769 USD** del 02/11 (ronda 486; a las 10:20 UTC del 03/11 aún no había ronda del día). Contratos sin pausa. El conflicto de reembolso sigue: 25 % diario y retención del 5 % en las Condiciones Finales; 15 % y 50 % en el KID. Patrimonio negativo de 5,78 M€ a cierre de 2025: sigue siendo la última cifra pública. El estado de revisión sigue en `fuentes_en_conflicto`. |
| mf-one | **actualizar** | La suscripción está **activa el 03/11** en Ethereum, solo para direcciones en lista blanca. El aviso de la pausa del 01/11 se cambia por el de hoy. Valor por token: 1,1341 USD (02/11). Sigue sin servir al particular común: si Víctor quiere quitar algo, esta es la primera. |

Avisos con fecha: en cada expediente, el bloque `avisosConFecha` dice si el
aviso sigue vigente o cambia, con el literal y la hora de la consulta de hoy.

## Candidata

**art-leasing-invest → no_admitir** (con un borrador completo de tarjeta en el
expediente, por si Víctor prefiere admitirla en «secundario»).

Lo que hoy sí está respaldado:

- La empresa está inscrita en Zefix.
- La venta está activa en el contrato, y la última compra fue el 20/10/2026.
- El aviso legal del propio emisor admite a residentes en Suiza y el EEE, con
  un tope de 100.000 €.
- El mínimo es de 5.000 CHF por transferencia, según el widget de compra.
- La **recompra del emisor está activada**, a 3,6512 por acción. Es la única de
  las cuatro empresas de Aktionariat que la tiene.

Por qué no la propongo:

- **Lo que lee el inversor no cuadra con lo que compra.** El Registration
  Agreement (V2.2, del 07/10/2022) y el Common SHA (V0.3) citan unos contratos
  de token que ya no son los que vende el emisor. Ningún documento público
  explica el cambio.
- **La web está desfasada.** Habla de una app y de XCHF, y de un cupo de
  «408.170 de 4.486.610 acciones», que es el número de acciones anterior a 2022.
- Solo ha habido **2 compras en 12 meses**.
- La recompra tiene **818 ZCHF de fondos**, unas 224 acciones, y nunca se ha
  usado.
- El **arrastre se activa con el 51 %**: con ese porcentaje a favor, todos los
  accionistas pueden verse obligados a vender.

Bloqueos del 01/11: dos quedan resueltos (actividad y acuerdos leídos). Siguen
la web desfasada y el mínimo alto.

## Bloqueos y límites

- **Rentabilidad de mTBILL: sigue en `null`.** midas.app da 403 (Cloudflare).
  Encontré en el código de la web la API interna que calcula el APY, pero la
  política de la sesión **denegó** la consulta y no la he rodeado.
- La página de documentos del emisor de Midas da 403, así que no he podido
  abrir sus cuentas. La cifra de patrimonio sale del resumen de las Condiciones
  Finales.
- El tope EEE de 100.000 € de Aktionariat y ART Leasing: no se publica cuánto
  queda.
- Ni Boss Info ni Switzerlend publican en qué exención de folleto se apoyan
  para vender fuera de Suiza.
- La lista de advertencias de FINMA tiene a «Midas.Investments» (2022). Es otra
  entidad, con otra web; no tiene que ver con Midas Software GmbH.
- Siguiendo el aviso del coordinador, `docs-llms-full.txt` (lleva enlaces de
  GitBook con `token=`) y las respuestas JSON de API están en `fuentes/crudo/`.
- No he tocado `docs/tareas/PARA-CODEX.md`: el encargo solo me deja escribir en
  mi carpeta y en mis expedientes.
