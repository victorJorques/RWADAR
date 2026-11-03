# Grupo principales-spiko-robinhood-prosegur · 3 de noviembre de 2026

Consultas hechas hoy entre las 10:05 y las 10:45 UTC. Solo leí páginas, PDF,
API y registros públicos: no abrí cuentas, no hice KYC ni conecté wallets.
Cada copia tiene su hora y su SHA-256 en `inventario-consultas.json`. Las
respuestas de API, el CSV de ESMA y los folletos (llevan direcciones de cadena)
están en `fuentes/crudo/`, que no entra en Git. Las copias que sí entran no
llevan parámetros de enlaces firmados (token, access, signature, key,
X-Amz), direcciones de cadena ni UUID (lo comprobé).

## Resumen en una tabla

| Slug | Decisión | Qué cambia hoy |
|---|---|---|
| spiko-letras-del-tesoro-euro | actualizar | La cifra pasa de 2,35 % a **2,34 %** (31 días, calculada por Spiko el 02/11/2026) |
| spiko-letras-del-tesoro-dolar | actualizar | La cifra pasa de 4,13 % a **3,95 %** en dólares (31 días, 02/11/2026) |
| robinhood-classic-stock-tokens | mantener | Nada. Solo propongo afinar el texto de «Salida» (24/5) |
| prosegur-digital-gold | mantener | Nada. Contrato, registro y mínimo iguales |
| spiko-smart-cash-euro (candidata) | **admitir_propuesta, con límites** | Hoy se leen el KID, el registro AMF y la cifra: **2,84 %** |

## Ofertas publicadas

### Spiko Letras del Tesoro Euro · actualizar

- **Cifra.** La API de Spiko da `monthlyYield 0.0234` (2,34 %), calculada el
  02/11/2026 a las 17:06 UTC con el valor liquidativo de ese día. La web en
  español dice lo mismo («2,34 %, últimos 31 días») y data.spiko.io también.
  Lo recalculé con la serie de valores liquidativos: 1,059941 (01/10) →
  1,062097 (02/11) da 2,345 %. La métrica de la tarjeta debe decir
  «· 02/11/2026» en lugar de «· 30/10/2026».
- **Sin cambios en los documentos.** KID en español del 01/09/2026, folleto
  del 01/09/2026, condiciones v2.2 y tabla de países del 23/10/2026: tienen el
  mismo SHA-256 que el 01/11.
- **Dato nuevo de registro.** Spiko Finance está inscrita en la propia CNMV
  como empresa de inversión europea en libre prestación, **n.º 5325**, desde el
  14/01/2026, para recibir y transmitir órdenes sobre fondos.
- **A limpiar.** En `documentacion-ofertas.json` siguen referencias viejas
  («2,17 %» del 30/09 y «2,36 %» del 22/10). Propongo quitarlas o marcarlas
  como históricas.
- Avisos publicados: siguen vigentes (gate del 10 %, capital no garantizado).

### Spiko Letras del Tesoro Dólar · actualizar

- **Cifra.** **3,95 %** neto anualizado en dólares (`monthlyYield 0.0395`,
  02/11/2026, 17:06 UTC). Coincide con mi cálculo con la serie de valores
  liquidativos: 1,097946 (02/10) → 1,101564 (02/11), 31 días, 3,950 %. Baja
  0,18 puntos respecto al 4,13 % publicado.
- Documentos iguales que el 01/11. Siguen tres conflictos que no van a la
  tarjeta:
  1. el KID dice «último valor liquidativo conocido» y el folleto, «valor
     desconocido»;
  2. la API pone un mínimo de 1.000 € para la clase en euros y el folleto,
     1 €;
  3. la web dice «sin límite de importe» y el folleto prevé el gate del 10 %.

### Robinhood Classic Stock Tokens · mantener

- El KID (1 de julio de 2026), la descripción de servicios y la tabla de
  comisiones tienen hoy el mismo SHA-256 que el 01/11.
- La página en español sigue con «Empieza con tan solo 1 euro», un 0,1 % de
  cambio por operación, más de 2.000 subyacentes y negociación desde el lunes
  a las 2:00 hasta el sábado a las 2:00.
- Banco de Lituania y CNMV n.º 5299 sin cambios. El programa de actividades
  de la CNMV incluye derivados. Robinhood figura además en la lista de
  proveedores de criptoactivos de la CNMV desde el 16/06/2025.
- Propongo cambiar la métrica «Salida» a «Vendes a Robinhood en la app, 24/5;
  puede suspender el cierre».

### Prosegur Digital Gold · mantener

- Las condiciones del 08/07/2026 tienen hoy un texto idéntico al del 02/11.
- La propia lista de proveedores de criptoactivos de la CNMV (PDF del
  20/10/2026) confirma a Prosegur Custodia de Activos Digitales desde el
  30/06/2026 para custodia, recepción y transmisión de órdenes y transferencia.
  El aviso de la tarjeta sigue vigente.
- Dato nuevo. La app muestra hoy un **precio de compra de 116,81 € por gramo**
  (10:27 UTC). No lo propongo para la tarjeta porque cambia durante el día.
- Siguen los choques entre la web y el contrato:
  - la web dice «menos de 24 horas» y «liquidez sin restricciones»;
  - el contrato dice de 1 a 7 días hábiles, y la recompra puede suspenderse o
    tener límites.

  Las FAQs en inglés añaden «sin riesgos de seguridad» y «cumple la regulación
  financiera». La web anuncia informes de auditoría descargables, pero no
  enlaza ninguno.

## Candidata: Spiko Euro (Smart Cash, FR0014015LD3) · admitir_propuesta con límites

Los tres huecos del 01/11 se resuelven hoy:

- **KID en español** (01/09/2026). Fondo UCITS, pero no monetario. Riesgo 1 de
  7, plazo recomendado de 3 meses, capital no garantizado y riesgo de
  contraparte por los swaps con bancos. Órdenes antes de las 15:00 (París).
- **Registro AMF.** El compartimento tiene el n.º **SCV20260075**. Figura en un
  certificado de la AMF del 23/02/2026 (copia alojada por Spiko) y en el
  folleto de la SICAV que publica la propia base GECO de la AMF (efecto
  01/09/2026). Ese folleto da para la clase en euros un mínimo de 1 € y «todos
  los suscriptores».
- **Cifra.** **2,84 %** neto actual (API y web, valor liquidativo del
  02/11/2026). La comprobé con la serie de valores liquidativos: 2,84 % a un
  día, 2,83 % a 7 días y 2,83 % en el último mes.

Además:

- **Salida:** reembolso diario, con abono al día hábil siguiente, y gate del
  25 %. Hay retirada instantánea de hasta 500.000 € al día.
- **Comisiones:** 0,25 % anual, sin comisiones de entrada ni de salida.
- **Acceso desde España:** España está marcada ✅ en la tabla de Spiko.
- **Titulares:** 10.729.

**Límites que debe ver Víctor antes de publicar:**

1. **GECO no tiene ficha pública del compartimento.** El enlace que da Spiko
   para «verificar la aprobación» abre una página vacía. Las búsquedas por
   nombre, ISIN y número de agrément dan 0 resultados. Comprobé que la
   búsqueda funciona con EU T-Bills, que sí sale.
2. **No se puede confirmar en la CNMV que este compartimento esté inscrito.**
   La vista pública no lista compartimentos, y la SICAV se inscribió el
   30/01/2026, antes de que existiera este compartimento. El acceso se apoya en
   la tabla de Spiko y en el KID en español.
3. **La web promete lo que el KID niega.** La web dice «Interés a tipo fijo
   2,84 % · Garantizado por contrapartes». El KID dice que no hay rentabilidad
   mínima garantizada. Puse un aviso que lo explica.
4. **El objetivo aparece de tres formas** (€STR + 0,50 % neto, + 0,50 % menos
   comisiones y + 0,25 %), y la web dice además que el banco paga
   €STR + 0,40 %. No lo publico como cifra.
5. **El patrimonio no cuadra** entre la API (1.654,79 M €) y data.spiko.io
   (1.901,76 M €). No lo publico.

Si Víctor prefiere no publicar sin la ficha de GECO, la decisión correcta
sería `no_admitir` por el límite 1. Todo lo demás está respaldado.

## Advertencias y bloqueos

- **Advertencias de la CNMV:** ninguna coincidencia para Spiko, Spiko Finance,
  Twenty First Capital, Amundi, Robinhood, Robinhood Europe, Prosegur ni
  Prosegur Custodia. Lo comprobé con una búsqueda de control («Trading») que
  sí devuelve entidades.
- **Folleto de Spiko en español:** sigue dando 403. Leí el francés de GECO y el
  inglés.
- **REGAFI:** el proxy corta curl. Lo leí con WebFetch y no hay copia local.
- **ECB Data Portal (€STR):** dio 504.
- **Pista no investigada:** la prensa habla de unos «Stock Tokens» de Robinhood
  respaldados 1:1 en Robinhood Chain, distintos de los Classic. No está
  verificado y queda fuera de mi encargo.
