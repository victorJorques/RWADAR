# Grupo spiko · investigación del 05/11/2026

Revisé las tres fichas de Spiko que están publicadas. Todas las horas son UTC
del 05/11/2026; las consultas fueron de 08:01 a 08:20. Solo usé páginas,
documentos, API y registros públicos. No inicié sesión, no hice KYC ni toqué
nada fuera de mi carpeta y de mis tres expedientes.

El intento anterior se cortó a las 07:59 y dejó copias de la API de Spiko.
Las volví a descargar todas: salen iguales, salvo la del rendimiento de
Spiko Euro, porque la API pone la hora de cada petición.

## En una frase

Las tres fichas siguen abiertas y sus documentos no han cambiado. Solo se
mueven las cifras: Euro sube de 2,34 % a 2,39 %, Dólar de 3,95 % a 3,99 % y
Spiko Euro se queda en 2,84 %. Las tres cifras van ahora con la fecha del
04/11. El pendiente de Spiko Euro en España sigue sin resolverse.

## Qué cambia en cada ficha

| Ficha | Antes (publicado) | Hoy | Propuesta |
|---|---|---|---|
| Spiko Letras del Tesoro Euro | 2,34 % a 31 días (dato del 02/11) | **2,39 %** a 31 días (dato del 04/11) | actualizar |
| Spiko Letras del Tesoro Dólar | 3,95 % a 31 días en dólares (02/11) | **3,99 %** a 31 días en dólares (04/11) | actualizar |
| Spiko Euro (Smart Cash) | 2,84 % (dato del 02/11) | **2,84 %**, misma cifra con dato del 04/11 | actualizar (solo cambia la fecha) |

**De dónde salen las cifras.** De la API pública de Spiko (08:01), y las
he comprobado con la serie diaria de valores liquidativos:

- Euro: de 1,060109 (04/10) a 1,062242 (04/11) en 31 días da 2,39 %. La
  web en español y data.spiko.io también dicen 2,39 %.
- Dólar: de 1,097946 (02/10) a 1,101837 (04/11) da 3,99 %. No hay valor
  del 03 ni del 04/10, así que el tramo es de 33 días. La web dice
  3,99 %.
- Spiko Euro: es lo que crece en un día, pasado a un año (03/11 → 04/11 =
  2,84 %). A 30 días saldría 2,83 %. El €STR del 04/11 es 2,442 % (BCE),
  así que la cifra queda unos 0,40 puntos por encima, como dice la web.

Spiko recalcula esta tarde (18:00 UTC para las dos de letras y 19:30 UTC
para Spiko Euro). La ficha lleva la fecha del dato.

**Otros datos que cambian y no van a la tarjeta:**

- Euro: valor 1,062242 €; 428,86 M€ y 2.825 titulares.
- Dólar: valor 1,101837 $; 173,64 M$ y 872 titulares.
- Spiko Euro: valor 1,016485 €; 10.871 titulares.

## Documentos: no ha cambiado ninguno

Comparé las huellas SHA-256 de hoy con las del 03/11. Son idénticas en:

- los KID en español de los tres fondos;
- el KID en inglés de Spiko Euro;
- el folleto en inglés;
- el folleto francés que publica la AMF en GECO;
- el certificado de la AMF;
- los términos de uso v2.2;
- las 14 páginas de docs.spiko.io, incluida la tabla de países, que sigue
  con fecha 23/10/2026.

He bajado por primera vez el folleto en francés que aloja Spiko. Su texto es
idéntico al de GECO; solo cambia el título interno. El folleto en español
sigue dando error 403.

## El pendiente clave: ¿se puede vender Spiko Euro en España?

Hoy nadie lo confirma ni lo niega. Esto es lo que comprobé:

- **CNMV.** Spiko SICAV sigue inscrita con el n.º 2380 (30/01/2026). Su
  comercializadora es Aldana Capital A.V. La ficha solo tiene dos vistas,
  «Datos generales» y «Entidades comercializadoras». Probé las vistas de
  la 0 a la 25 y las demás dan error. La CNMV no publica los fondos de la
  SICAV uno a uno.
- **Aldana Capital en la CNMV.** Es la agencia de valores n.º 280.
  Comercializa 18 fondos extranjeros, entre ellos «SPIKO SICAV», sin
  desglose.
- **Web de Aldana Capital.** No menciona Spiko. Dice que trabaja con
  «Inversores Institucionales/Profesionales».
- **AMF (GECO).** La ficha del fondo (c124199) sigue vacía y la API la da
  como no publicada, igual que un código inexistente. Si busco «SPIKO»,
  solo salen EU T-Bills y US T-Bills.
- **ESMA.** No aparece Spiko, pero esa base solo recoge 1.236 fondos
  franceses, así que no prueba nada.

Conclusión: el aviso publicado («no hemos podido confirmar en ningún
registro público…») **sigue siendo cierto**. No se propone quitarlo ni
retirar la ficha: nadie lo niega. Solo lo cerraría un escrito de la CNMV, de
la AMF o de Aldana Capital.

## La web de Spiko Euro sigue contradiciendo al KID

Lo comprobé en la web en español a las 08:02 y en su HTML a las 08:05.
Sigue diciendo:

- «Interés a tipo fijo 2,84 % · Garantizado por contrapartes»;
- «rendimiento diario garantizado»;
- «Sociedad gestora Amundi Asset Management»;
- «BNP Paribas paga €STR + 0,40 %».

La página de particulares sigue diciendo «No existen límites de retirada».
El KID dice que no hay rentabilidad mínima garantizada y que la gestora es
Twenty First Capital. El folleto permite limitar los reembolsos a partir del
25 % del fondo.

Por eso **los siete avisos de la ficha siguen vigentes**. Hay un detalle
nuevo: el botón «Verificar la aprobación» lleva ahora al certificado de la
AMF que aloja Spiko. «Verificar la autorización» sigue llevando a la ficha
vacía de GECO.

## ¿Ha lanzado Spiko otro fondo para particulares en España?

No. La API tiene los mismos 5 fondos y las mismas clases que el 01/11 y el
03/11. El único que no está en el catálogo es «Cash & Carry». Spiko lo
describe como «fondo profesional», pide 100.000 € o 120.000 $ de mínimo y la
AMF lo registra como «Fonds dédié». No hay candidata.

## Conflictos que siguen abiertos (no afectan a la tarjeta)

- **Dólar · cuándo se ejecuta la orden.** El KID en español dice al
  «último valor liquidativo conocido». El folleto dice al siguiente valor,
  que todavía no se conoce, y la API de Spiko dice lo mismo
  («unknownNAVs»).
- **Dólar · mínimo de la clase en euros.** El folleto dice 1 € y la API dice
  1.000 €. La tarjeta usa la clase en dólares (1 $).
- **Spiko Euro · tamaño del fondo.** Hay tres cifras de Spiko: 1.669 M€
  (API), 1.920 M€ (data.spiko.io) y 2.203 M€ (web). No se publica ninguna.
- **Spiko Euro · objetivo frente al €STR.** Hay cuatro versiones: +0,50 %
  (KID y folleto), +0,25 % (docs), +0,50 % (data) y +0,40 % (web). No se
  publica como cifra.

## Correcciones para la documentación publicada

- **Euro.** Hay referencias antiguas: 1,0597 €, 1,0613 €, 467,94 M€ y
  444,52 M€. Hay que quitarlas o marcarlas como históricas, y poner la
  referencia de 31 días en 2,39 %.
- **Dólar.** La referencia de precio dice que los 0,98 € de GECO son «la
  clase EUR no cubierta», y no es así. Es la clase en dólares pasada a
  euros: hoy 0,97858 €, que son 1,10184 $. La clase EUR vale 1,01881 €.
- **Spiko Euro.** Hay que fechar el «Rendimiento neto publicado» el 04/11 y
  consultarlo el 05/11.
- **Plataforma «spiko».** No es de mis fichas, pero su texto aún dice «No
  hemos comprobado en la CNMV que el fondo se comercialice en España». Hoy
  está comprobado: SICAV n.º 2380 y Spiko Finance n.º 5325.

## Bloqueos

- Folleto en español: error 403.
- REGAFI (ACPR): el proxy corta la conexión con curl. Lo leí con WebFetch y
  no queda copia: Spiko Finance CIB 19183, pasaporte para España desde el
  08/01/2026, sin cambios.
- La comercialización de Spiko Euro en España no se puede comprobar en
  ninguna fuente pública (ver arriba).

## Archivos

- Expedientes:
  - `expedientes/spiko-letras-del-tesoro-euro.json`
  - `expedientes/spiko-letras-del-tesoro-dolar.json`
  - `expedientes/spiko-smart-cash-euro.json`
- Copias de lo leído: `grupos/spiko/fuentes/`. Las respuestas crudas de las
  API están en `fuentes/crudo/`, fuera de Git.
- Inventario: `grupos/spiko/inventario-consultas.json`, con 105 entradas,
  todas con su URL, hora, código HTTP, tamaño y SHA-256.
