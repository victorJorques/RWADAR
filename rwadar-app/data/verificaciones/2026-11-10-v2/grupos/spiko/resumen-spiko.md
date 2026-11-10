# Grupo spiko · investigación del 10/11/2026

He revisado las tres fichas publicadas de Spiko. Todas las horas son UTC
del 10/11/2026 y las consultas van de las 09:01 a las 09:19. Solo he usado
páginas, documentos, API y registros públicos. No he iniciado sesión, no he
hecho KYC y solo he escrito en mi carpeta y en mis tres expedientes.

## En una frase

Las tres fichas siguen abiertas y sus documentos no han cambiado. Suben las
dos de letras del Tesoro: la de euros pasa de 2,39 % a 2,44 % y la de dólares
de 3,99 % a 4,09 %. Spiko Euro se queda en 2,84 %, con fecha nueva. La
novedad es que **la AMF ya publica en su base GECO la ficha de Spiko Euro**.
Lo que sigue sin confirmar es que se pueda vender en España.

## Qué cambia en cada ficha

| Ficha | Publicado (dato del 04/11) | Hoy (dato del 09/11) | Propuesta |
|---|---|---|---|
| Spiko Letras del Tesoro Euro | 2,39 % a 31 días | **2,44 %** a 31 días | actualizar |
| Spiko Letras del Tesoro Dólar | 3,99 % a 31 días, en dólares | **4,09 %** a 31 días, en dólares | actualizar |
| Spiko Euro (Smart Cash) | 2,84 % | **2,84 %** (misma cifra) + cambia un aviso y la métrica «Supervisor» | actualizar |

## Cómo he recalculado las cifras

He bajado la serie diaria de valores liquidativos (VL) de la API pública de
Spiko a las 09:01. El último VL que hay hoy es el del **lunes 09/11/2026**.
El de hoy, 10/11, Spiko lo publica por la tarde: recalcula a las 18:00 UTC
las dos de letras y a las 19:30 UTC Spiko Euro.

- **Euro.** El VL pasa de 1,060378 € (fechado el 08/10) a 1,062624 € (09/11),
  en 32 días. Si lo paso a un año con interés compuesto, sale **2,443 %**.
  Desde el VL fechado el 11/10 (el del viernes 09/10, 29 días) también sale
  2,443 %. La API, la web en español y data.spiko.io dicen 2,44 %.
- **Dólar.** El VL pasa de 1,098694 $ (09/10) a 1,102439 $ (09/11), en 31
  días justos. Con interés compuesto sale **4,088 %**. La API, la web y
  data.spiko.io dicen 4,09 %. Está en dólares y no incluye lo que se mueva
  el euro frente al dólar.
- **Spiko Euro.** Esta cifra es lo que el fondo crece en un día, pasado a un
  año. El VL del viernes ya incluye el fin de semana, así que del 06/11
  (1,016796 €) al 09/11 (1,016874 €) hay un solo día de interés: sale
  **2,839 %**. A 7 días sale 2,835 % y a 28 días, 2,833 %. El €STR del 09/11
  es 2,442 % (BCE), así que queda 0,40 puntos por encima, como dice la web.

Mañana, 11/11, es festivo en Francia: no habrá VL ni reembolsos ese día.

## Documentos: ninguno ha cambiado (comparé SHA-256)

Tienen la misma huella que el 05/11:

- los KID en español de los tres fondos;
- el KID en inglés de Spiko Euro;
- el folleto en inglés;
- el folleto francés de la AMF (GECO) y el que aloja Spiko;
- el certificado de la AMF;
- los términos de uso v2.2.

El texto de las 14 páginas de docs.spiko.io es igual que el del 03/11. La
tabla de países sigue fechada el 23/10/2026 y marca España en Smart Cash, en
T-Bills Euro y en T-Bills Dollar. El folleto en español sigue dando error 403.

Hoy he bajado por primera vez el KID en inglés de los dos fondos de letras y
el KID en francés de Spiko Euro. No tengo una huella anterior con la que
compararlos.

## Registros (comprobados hoy)

- **CNMV.** Spiko SICAV sigue inscrita con el n.º 2380 (30/01/2026) y su
  comercializadora sigue siendo Aldana Capital A.V. (n.º 280). Spiko Finance
  sigue inscrita con el n.º 5325 en libre prestación, para recibir órdenes
  sobre fondos. No hay advertencias de la CNMV contra Spiko, Twenty First
  Capital, Amundi ni Aldana. El control con «Trading» sí devuelve
  advertencias, así que la búsqueda funciona.
- **REGAFI (supervisor bancario francés).** Spiko Finance tiene el CIB 19183
  y pasaporte para España desde el 08/01/2026. Hoy lo leí con curl en su API
  pública. El proxy cortó la conexión tres veces, pero entró al cuarto
  intento, así que esta vez sí queda copia.
- **AMF (GECO).** EU T-Bills y US T-Bills siguen vivos y con VL del 09/11.
  **Spiko Euro tiene ahora ficha pública.** El 05/11 salía vacía. Hoy dice:
  autorizado el 17/02/2026 con el n.º SCV20260075, «Vivant», «Tous
  souscripteurs», gestora Twenty First Capital y depositario CACEIS. Su
  ficha se actualizó en la base de la AMF el 09/11. Todavía no lista clases
  de acciones ni publica VL. Si busco «SPIKO» en GECO, ahora salen 4 fondos;
  antes salían 2.

## El pendiente: ¿confirma alguien que Spiko Euro se vende en España?

No. Pero tampoco lo niega nadie.

- **CNMV.** Solo muestra la SICAV, no sus fondos uno a uno. Lo he comprobado
  con otras dos SICAV francesas de la misma comercializadora (Lazard Funds y
  CM-AM SICAV): tampoco enseñan sus fondos. Es cómo funciona la CNMV, no algo
  propio de Spiko. Spiko SICAV no tiene «hechos relevantes» en la CNMV, y el
  listado completo de UCITS solo llega al nivel de la SICAV.
- **AMF.** Ahora publica el fondo, pero GECO no dice en qué países se ha
  notificado.
- **Aldana Capital.** Su web no menciona Spiko y dice que trabaja con
  inversores institucionales y profesionales.
- **ESMA.** No tiene Spiko, pero su base solo recoge 1.237 fondos franceses,
  así que no prueba nada.
- **Un detalle que pesa.** El fondo se autorizó el 17/02/2026, después de que
  la SICAV se inscribiera en la CNMV (30/01/2026). La propia Spiko escribe
  que una clase creada más tarde necesita su propia notificación en cada
  país.

**Conclusión:** el aviso «no hemos podido confirmar en ningún registro
público…» sigue siendo cierto y se mantiene. No propongo retirar la ficha,
porque nadie dice que no se pueda vender aquí.

## Avisos de Spiko Euro

- **Aviso 7 («allí este fondo todavía no tiene ficha publicada»): hoy es
  falso.** Propongo quitarlo y poner en la métrica «Supervisor»: «AMF
  (Francia): n.º SCV20260075, autorizado el 17/02/2026 (ficha en su base
  GECO, aún sin clases de acciones ni valor liquidativo) · …». Si se prefiere
  reescribirlo en vez de quitarlo, el texto está en el expediente.
- **Los avisos 2 a 6 siguen vigentes**, con las mismas frases de hoy:
  - la web sigue diciendo «Interés a tipo fijo 2,84 % · Garantizado por
    contrapartes» y «rendimiento diario garantizado»;
  - sigue diciendo «Sociedad gestora Amundi Asset Management»;
  - sigue diciendo que BNP Paribas paga «€STR + un 0,40 %»;
  - la página para particulares sigue diciendo «No existen límites de
    retirada».

## Otros hallazgos (no cambian las tarjetas)

- **Dólar.** La web en español dice, en una pregunta frecuente plegada, que
  atienden cualquier reembolso «sin preaviso y sin límite de importe». El
  folleto permite limitar los reembolsos a partir del 10 % del fondo. El
  aviso publicado ya lo cubre. Lo dejo anotado como conflicto.
- **Siguen abiertos dos conflictos del Dólar:** cuándo se ejecuta la orden
  (el KID dice «último VL conocido», y el folleto y la API, el VL siguiente)
  y el mínimo de la clase en euros (el folleto dice 1 € y la API dice
  1.000 €).
- **Tamaño de Spiko Euro.** Spiko da tres cifras distintas: 1.753,6 M€ (API),
  2.004,8 M€ (data.spiko.io) y 2.292 M€ (web). No se publica ninguna.
- **Pie de la web.** El capital social de Spiko Finance pasa de 2,5 M€ a
  10 M€.
- **Nuevas candidatas.** No propongo ninguna. La API tiene los mismos 5
  fondos y 14 clases que el 01/11. Cash & Carry es para profesionales
  (desde 100.000 €). Spiko Dollar y los demás Smart Cash tendrían el mismo
  problema con la CNMV que Spiko Euro, y UK T-Bills no se ofrece en España.

## Correcciones para la documentación publicada

- **Euro y Dólar.** Hay que actualizar la referencia «Rentabilidad publicada
  · 31 días»: 2,44 % y 4,09 % (dato del 09/11, consulta del 10/11). En Euro
  siguen las referencias antiguas (1,0597 €, 1,0613 €, 467,94 M€, 444,52 M€):
  hay que quitarlas o marcarlas como históricas.
- **Spiko Euro.** Hay que fechar el «Rendimiento neto publicado» el 09/11.
  La referencia «Aprobación del compartimento» puede citar ya la ficha de
  GECO (autorizado el 17/02/2026).

## Bloqueos

- Folleto en español: error 403.
- La comercialización de Spiko Euro en España no se puede comprobar en
  ninguna fuente pública (ver arriba).
- GECO aún no enseña las clases ni el VL de Spiko Euro.

## Archivos

- **Expedientes:**
  - `expedientes/spiko-letras-del-tesoro-euro.json`
  - `expedientes/spiko-letras-del-tesoro-dolar.json`
  - `expedientes/spiko-smart-cash-euro.json`
- **Copias de lo leído:** están en `grupos/spiko/fuentes/`: KID en PDF y en
  texto, páginas renderizadas, textos de la CNMV y de docs.spiko.io y €STR
  del BCE. En las páginas guardadas he recortado los nombres de personas de
  los testimonios.
- **Fuera de Git:** las respuestas de API, los HTML completos y los folletos
  en PDF están en `fuentes/crudo/`.
- **Inventario:** `grupos/spiko/inventario-consultas.json`, con 127 entradas.
  Cada una lleva URL, hora, código HTTP, tamaño y SHA-256.
