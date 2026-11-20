# Genera la parte "funciones" de es-referencia.json
import json
B='/tmp/claude-0/-home-user-RWADAR/2f4f48c6-5daf-5e88-a4f7-bdceb91de476/scratchpad/excel/research/'
hf=json.load(open(B+'raw/hf_esES.json'))
L={x['en']:x for x in json.load(open(B+'work/lista.json'))}
V={
 'T':'Todas las versiones en uso (Excel 2016, 2019, 2021, 2024, Microsoft 365, Excel para la web y Mac)',
 '10':'Excel 2010 y posteriores (2016, 2019, 2021, 2024, Microsoft 365, web, Mac)',
 '13':'Excel 2013 y posteriores (2016, 2019, 2021, 2024, Microsoft 365, web, Mac)',
 '13W':'Excel 2013 y posteriores, solo Windows de escritorio (no en Excel para la web ni en Mac)',
 '16':'Excel 2016 y posteriores (2019, 2021, 2024, Microsoft 365; Windows y Mac)',
 '19':'Excel 2019, 2021, 2024, Microsoft 365, Excel para la web y Mac (NO en Excel 2016 de compra única)',
 '21':'Excel 2021, 2024, Microsoft 365, Excel para la web y Mac (NO en 2019 ni anteriores)',
 '24':'Excel 2024, Microsoft 365, Excel para la web y Mac (NO en Excel 2021 ni anteriores)',
 '365':'Solo Microsoft 365 (Windows, Mac y Excel para la web); NO en Excel 2024/2021 de compra única',
 'RET':'RETIRADA el 14/09/2026 (fue versión preliminar en Microsoft 365 con Copilot); hoy devuelve #¿NOMBRE? al recalcular',
}
VER={
 'V1':'VERIFICADO: coincide la página de la función en support.microsoft.com/es-es y la tabla ES-EN de excel-translator.de (datos extraídos de Excel)',
 'V2':'VERIFICADO por excel-translator.de (+HyperFormula esES); OJO: la página de Microsoft es-ES tiene el nombre mal (traducción automática)',
 'V3':'VERIFICADO en Microsoft es-ES (título/sintaxis de la página y/o lista oficial «Funciones de Excel (por orden alfabético)») + uso en webs en español; excel-translator no cubre funciones posteriores a 2019',
 'V4':'VERIFICADO en Microsoft es-ES (página de la función): se escribe igual que en inglés',
 'P':'PROBABLE, SIN VERIFICAR en un Excel real: la página es-ES usa el nombre inglés y la lista alfabética es-ES da una traducción que parece automática (ver nota)',
 'S':'SIN VERIFICAR: fuentes de Microsoft contradictorias (ver nota)',
}
# EN|ES|sintaxis|ver|verif|nota
D=r"""
SUM|SUMA|SUMA(número1; [número2]; ...)|T|V1|
SUMIF|SUMAR.SI|SUMAR.SI(rango; criterio; [rango_suma])|T|V1|Criterios con operador van entre comillas: ">100", "<>"&A1.
SUMIFS|SUMAR.SI.CONJUNTO|SUMAR.SI.CONJUNTO(rango_suma; rango_criterios1; criterios1; [rango_criterios2; criterios2]; ...)|T|V1|Ojo: el rango_suma va PRIMERO (al revés que SUMAR.SI).
SUMPRODUCT|SUMAPRODUCTO|SUMAPRODUCTO(matriz1; [matriz2]; [matriz3]; ...)|T|V1|
PRODUCT|PRODUCTO|PRODUCTO(número1; [número2]; ...)|T|V1|
ROUND|REDONDEAR|REDONDEAR(número; núm_decimales)|T|V2|La página es-ES se titula «Función ROUND».
ROUNDUP|REDONDEAR.MAS|REDONDEAR.MAS(número; núm_decimales)|T|V2|Sin tilde: MAS. Página es-ES titulada «ROUNDUP».
ROUNDDOWN|REDONDEAR.MENOS|REDONDEAR.MENOS(número; núm_decimales)|T|V1|
MROUND|REDOND.MULT|REDOND.MULT(número; múltiplo)|T|V1|Abreviado: REDOND (sin -EAR).
CEILING.MATH|MULTIPLO.SUPERIOR.MAT|MULTIPLO.SUPERIOR.MAT(número; [cifra_significativa]; [moda])|13|V2|Sin tilde en MULTIPLO. Lista alfabética es-ES dice «DE TECHO. MATEMÁTICAS» (error). HyperFormula la llama CEILING.MATH.
FLOOR.MATH|MULTIPLO.INFERIOR.MAT|MULTIPLO.INFERIOR.MAT(número; [cifra_significativa]; [moda])|13|V1|HyperFormula la llama FLOOR.MATH.
CEILING|MULTIPLO.SUPERIOR|MULTIPLO.SUPERIOR(número; cifra_significativa)|T|V1|Función de compatibilidad.
FLOOR|MULTIPLO.INFERIOR|MULTIPLO.INFERIOR(número; cifra_significativa)|T|V1|Función de compatibilidad.
INT|ENTERO|ENTERO(número)|T|V2|Redondea hacia abajo: ENTERO(-2,5) = -3. Título es-ES «ENTERO.» con punto erróneo.
TRUNC|TRUNCAR|TRUNCAR(número; [núm_decimales])|T|V1|TRUNCAR(-2,5) = -2.
MOD|RESIDUO|RESIDUO(número; núm_divisor)|T|V1|No es «MOD».
QUOTIENT|COCIENTE|COCIENTE(numerador; denominador)|T|V1|
ABS|ABS|ABS(número)|T|V1|
SIGN|SIGNO|SIGNO(número)|T|V1|
POWER|POTENCIA|POTENCIA(número; potencia)|T|V1|Equivale a número^potencia.
SQRT|RAIZ|RAIZ(número)|T|V1|Sin tilde: RAIZ.
EXP|EXP|EXP(número)|T|V1|
LN|LN|LN(número)|T|V1|
LOG|LOG|LOG(número; [base])|T|V1|
LOG10|LOG10|LOG10(número)|T|V1|
PI|PI|PI()|T|V1|
RAND|ALEATORIO|ALEATORIO()|T|V2|La página es-ES se titula «RAND» y su sintaxis pone «ALEAT()»: ambos mal.
RANDBETWEEN|ALEATORIO.ENTRE|ALEATORIO.ENTRE(inferior; superior)|T|V1|
RANDARRAY|MATRIZALEAT|MATRIZALEAT([filas]; [columnas]; [mín]; [máx]; [entero])|21|V3|La lista por categoría es-ES dice «RANDARRA» (errata).
SEQUENCE|SECUENCIA|SECUENCIA(filas; [columnas]; [inicio]; [paso])|21|V3|
SUBTOTAL|SUBTOTALES|SUBTOTALES(núm_función; ref1; [ref2]; ...)|T|V1|En plural. 9=SUMA, 109=SUMA ignorando filas ocultas a mano; ignora siempre las filtradas.
AGGREGATE|AGREGAR|AGREGAR(núm_función; opciones; ref1; [ref2]; ...)  o bien  AGREGAR(núm_función; opciones; matriz; [k])|10|V1|La lista alfabética es-ES dice «AGREGADO» (error).
FACT|FACT|FACT(número)|T|V1|
COMBIN|COMBINAT|COMBINAT(número; tamaño)|T|V1|
GCD|M.C.D|M.C.D(número1; [número2]; ...)|T|V1|
LCM|M.C.M|M.C.M(número1; [número2]; ...)|T|V1|
EVEN|REDONDEA.PAR|REDONDEA.PAR(número)|T|V1|REDONDEA (no REDONDEAR).
ODD|REDONDEA.IMPAR|REDONDEA.IMPAR(número)|T|V1|
ROMAN|NUMERO.ROMANO|NUMERO.ROMANO(número; [forma])|T|V1|Sin tilde.
ARABIC|NUMERO.ARABE|NUMERO.ARABE(texto)|13|V1|HyperFormula la llama ARABIC.
SUMSQ|SUMA.CUADRADOS|SUMA.CUADRADOS(número1; [número2]; ...)|T|V1|
MMULT|MMULT|MMULT(matriz1; matriz2)|T|V1|
MDETERM|MDETERM|MDETERM(matriz)|T|V1|
MINVERSE|MINVERSA|MINVERSA(matriz)|T|V1|
RADIANS|RADIANES|RADIANES(ángulo)|T|V1|
DEGREES|GRADOS|GRADOS(ángulo)|T|V1|
SIN|SENO|SENO(número)|T|V1|
COS|COS|COS(número)|T|V1|
TAN|TAN|TAN(número)|T|V1|
BASE|BASE|BASE(número; base; [longitud_mín])|13|V1|
DECIMAL|CONV.DECIMAL|CONV.DECIMAL(texto; base)|13|V1|TRAMPA: «DECIMAL» en español es otra función (FIXED). DECIMAL inglés = CONV.DECIMAL.
PERCENTOF|PERCENTOF|PERCENTOF(subconjunto_datos; todos_los_datos)|365|S|La página es-ES se titula PERCENTOF y AGRUPARPOR la cita como PERCENTOF; no se encontró traducción. Nombres de argumentos orientativos (en Microsoft: data_subset, data_all). Equivale a SUMA(subconjunto)/SUMA(todo).
AVERAGE|PROMEDIO|PROMEDIO(número1; [número2]; ...)|T|V1|
AVERAGEA|PROMEDIOA|PROMEDIOA(valor1; [valor2]; ...)|T|V1|La lista alfabética es-ES dice «AVERAGEA» (sin traducir).
AVERAGEIF|PROMEDIO.SI|PROMEDIO.SI(rango; criterios; [rango_promedio])|T|V1|
AVERAGEIFS|PROMEDIO.SI.CONJUNTO|PROMEDIO.SI.CONJUNTO(rango_promedio; rango_criterios1; criterios1; [rango_criterios2; criterios2]; ...)|T|V1|NO existe en HyperFormula 3.5.0.
COUNT|CONTAR|CONTAR(valor1; [valor2]; ...)|T|V2|Cuenta solo números. Página es-ES titulada «COUNT».
COUNTA|CONTARA|CONTARA(valor1; [valor2]; ...)|T|V2|Cuenta celdas no vacías. Página es-ES titulada «COUNTA».
COUNTBLANK|CONTAR.BLANCO|CONTAR.BLANCO(rango)|T|V1|
COUNTIF|CONTAR.SI|CONTAR.SI(rango; criterios)|T|V1|
COUNTIFS|CONTAR.SI.CONJUNTO|CONTAR.SI.CONJUNTO(rango_criterios1; criterios1; [rango_criterios2; criterios2]; ...)|T|V1|
MAX|MAX|MAX(número1; [número2]; ...)|T|V1|
MAXA|MAXA|MAXA(valor1; [valor2]; ...)|T|V1|
MIN|MIN|MIN(número1; [número2]; ...)|T|V1|
MINA|MINA|MINA(valor1; [valor2]; ...)|T|V1|
MAXIFS|MAX.SI.CONJUNTO|MAX.SI.CONJUNTO(rango_máximo; rango_criterios1; criterios1; [rango_criterios2; criterios2]; ...)|19|V1|
MINIFS|MIN.SI.CONJUNTO|MIN.SI.CONJUNTO(rango_mínimo; rango_criterios1; criterios1; [rango_criterios2; criterios2]; ...)|19|V1|
MEDIAN|MEDIANA|MEDIANA(número1; [número2]; ...)|T|V1|
MODE.SNGL|MODA.UNO|MODA.UNO(número1; [número2]; ...)|10|V1|
MODE.MULT|MODA.VARIOS|MODA.VARIOS(número1; [número2]; ...)|10|V1|
LARGE|K.ESIMO.MAYOR|K.ESIMO.MAYOR(matriz; k)|T|V1|Sin tilde: ESIMO.
SMALL|K.ESIMO.MENOR|K.ESIMO.MENOR(matriz; k)|T|V1|
RANK.EQ|JERARQUIA.EQV|JERARQUIA.EQV(número; referencia; [orden])|10|V1|«EQV», no «EQ». Sin tilde: JERARQUIA.
RANK.AVG|JERARQUIA.MEDIA|JERARQUIA.MEDIA(número; referencia; [orden])|10|V1|
PERCENTILE.INC|PERCENTIL.INC|PERCENTIL.INC(matriz; k)|10|V1|
PERCENTILE.EXC|PERCENTIL.EXC|PERCENTIL.EXC(matriz; k)|10|V1|
QUARTILE.INC|CUARTIL.INC|CUARTIL.INC(matriz; cuartil)|10|V1|
QUARTILE.EXC|CUARTIL.EXC|CUARTIL.EXC(matriz; cuartil)|10|V1|
PERCENTRANK.INC|RANGO.PERCENTIL.INC|RANGO.PERCENTIL.INC(matriz; x; [cifra_significativa])|10|V1|
STDEV.S|DESVEST.M|DESVEST.M(número1; [número2]; ...)|10|V1|S (sample) se traduce M (muestra).
STDEV.P|DESVEST.P|DESVEST.P(número1; [número2]; ...)|10|V2|Página es-ES titulada «DESVESTP» (es la antigua).
VAR.S|VAR.S|VAR.S(número1; [número2]; ...)|10|V1|RAREZA: aquí NO se traduce S→M (DESVEST.M pero VAR.S).
VAR.P|VAR.P|VAR.P(número1; [número2]; ...)|10|V2|Página es-ES titulada «VARP».
CORREL|COEF.DE.CORREL|COEF.DE.CORREL(matriz1; matriz2)|T|V1|
PEARSON|PEARSON|PEARSON(matriz1; matriz2)|T|V1|
SLOPE|PENDIENTE|PENDIENTE(conocido_y; conocido_x)|T|V1|
INTERCEPT|INTERSECCION.EJE|INTERSECCION.EJE(conocido_y; conocido_x)|T|V1|Sin tilde.
RSQ|COEFICIENTE.R2|COEFICIENTE.R2(conocido_y; conocido_x)|T|V1|
FORECAST.LINEAR|PRONOSTICO.LINEAL|PRONOSTICO.LINEAL(x; conocido_y; conocido_x)|16|V1|Sin tilde: PRONOSTICO.
FORECAST.ETS|PRONOSTICO.ETS|PRONOSTICO.ETS(fecha_objetivo; valores; escala_de_tiempo; [estacionalidad]; [finalización_de_datos]; [agregación])|16|V1|No disponible en Excel para la web.
TREND|TENDENCIA|TENDENCIA(conocido_y; [conocido_x]; [nueva_matriz_x]; [constante])|T|V1|
GROWTH|CRECIMIENTO|CRECIMIENTO(conocido_y; [conocido_x]; [nueva_matriz_x]; [constante])|T|V1|
LINEST|ESTIMACION.LINEAL|ESTIMACION.LINEAL(conocido_y; [conocido_x]; [constante]; [estadística])|T|V1|
FREQUENCY|FRECUENCIA|FRECUENCIA(datos; grupos)|T|V1|
GEOMEAN|MEDIA.GEOM|MEDIA.GEOM(número1; [número2]; ...)|T|V1|
HARMEAN|MEDIA.ARMO|MEDIA.ARMO(número1; [número2]; ...)|T|V1|
TRIMMEAN|MEDIA.ACOTADA|MEDIA.ACOTADA(matriz; porcentaje)|T|V1|
AVEDEV|DESVPROM|DESVPROM(número1; [número2]; ...)|T|V1|
NORM.DIST|DISTR.NORM.N|DISTR.NORM.N(x; media; desv_estándar; acumulado)|10|V2|Página es-ES titulada «DISTR.NORM» (la antigua).
NORM.INV|INV.NORM|INV.NORM(probabilidad; media; desv_estándar)|10|V2|Página es-ES titulada «DISTR.NORM.INV» (la antigua).
NORM.S.DIST|DISTR.NORM.ESTAND.N|DISTR.NORM.ESTAND.N(z; acumulado)|10|V2|
STANDARDIZE|NORMALIZACION|NORMALIZACION(x; media; desv_estándar)|T|V1|
CONFIDENCE.NORM|INTERVALO.CONFIANZA.NORM|INTERVALO.CONFIANZA.NORM(alfa; desv_estándar; tamaño)|10|V1|
CONFIDENCE.T|INTERVALO.CONFIANZA.T|INTERVALO.CONFIANZA.T(alfa; desv_estándar; tamaño)|10|V1|
T.TEST|PRUEBA.T.N|PRUEBA.T.N(matriz1; matriz2; colas; tipo)|10|V2|Página es-ES titulada «PRUEBA.T» (la antigua).
COVARIANCE.S|COVARIANZA.M|COVARIANZA.M(matriz1; matriz2)|10|V1|
COVARIANCE.P|COVARIANCE.P|COVARIANCE.P(matriz1; matriz2)|10|S|RAREZA: excel-translator y HyperFormula dan COVARIANCE.P (sin traducir) y la sintaxis es-ES también; el título es-ES dice COVARIANZA.P. Comprobar en Excel real.
RANK|JERARQUIA|JERARQUIA(número; referencia; [orden])|T|V1|Compatibilidad: usar JERARQUIA.EQV.
MODE|MODA|MODA(número1; [número2]; ...)|T|V1|Compatibilidad: usar MODA.UNO.
STDEV|DESVEST|DESVEST(número1; [número2]; ...)|T|V1|Compatibilidad: usar DESVEST.M.
STDEVP|DESVESTP|DESVESTP(número1; [número2]; ...)|T|V1|Compatibilidad: usar DESVEST.P.
VAR|VAR|VAR(número1; [número2]; ...)|T|V1|Compatibilidad: usar VAR.S.
VARP|VARP|VARP(número1; [número2]; ...)|T|V1|Compatibilidad: usar VAR.P.
PERCENTILE|PERCENTIL|PERCENTIL(matriz; k)|T|V1|Compatibilidad.
QUARTILE|CUARTIL|CUARTIL(matriz; cuartil)|T|V1|Compatibilidad.
FORECAST|PRONOSTICO|PRONOSTICO(x; conocido_y; conocido_x)|T|V1|Compatibilidad: usar PRONOSTICO.LINEAL.
CONCATENATE|CONCATENAR|CONCATENAR(texto1; [texto2]; ...)|T|V2|Compatibilidad (usar CONCAT o &). Página es-ES titulada «CONCATENATE».
IF|SI|SI(prueba_lógica; [valor_si_verdadero]; [valor_si_falso])|T|V1|
IFS|SI.CONJUNTO|SI.CONJUNTO(prueba_lógica1; valor_si_verdadero1; [prueba_lógica2; valor_si_verdadero2]; ...)|19|V1|Para «en otro caso», última prueba VERDADERO.
AND|Y|Y(valor_lógico1; [valor_lógico2]; ...)|T|V2|Página es-ES titulada «AND».
OR|O|O(valor_lógico1; [valor_lógico2]; ...)|T|V1|La lista alfabética es-ES dice «OR».
NOT|NO|NO(valor_lógico)|T|V1|
XOR|XO|XO(valor_lógico1; [valor_lógico2]; ...)|13|V1|HyperFormula la llama XOR.
IFERROR|SI.ERROR|SI.ERROR(valor; valor_si_error)|T|V1|Con punto. La sintaxis es-ES escribe «SIERROR» (errata).
IFNA|SI.ND|SI.ND(valor; valor_si_nd)|13|V1|HyperFormula la llama IFNA.
SWITCH|CAMBIAR|CAMBIAR(expresión; valor1; resultado1; [valor2; resultado2]; ...; [predeterminado])|19|V1|En HyperFormula esES el nombre está VACÍO (solo funciona escribiendo SWITCH).
TRUE|VERDADERO|VERDADERO()  (normalmente se escribe la constante VERDADERO sin paréntesis)|T|V2|Página es-ES titulada «VERDAD» (error).
FALSE|FALSO|FALSO()  (normalmente la constante FALSO sin paréntesis)|T|V1|
LET|LET|LET(nombre1; valor_nombre1; cálculo_o_nombre2; [nombre2; valor_nombre2; cálculo_o_nombre3]; ...)|21|V4|No existe en HyperFormula 3.5.0.
LAMBDA|LAMBDA|LAMBDA([parámetro1; parámetro2; ...]; cálculo)|24|V4|Hasta 253 parámetros. Se suele guardar con nombre en el Administrador de nombres.
MAP|MAP|MAP(matriz1; [matriz2; ...]; lambda)|24|P|La lista alfabética es-ES dice «MAPEAR» (parece traducción automática); la página y la sintaxis es-ES dicen MAP.
REDUCE|REDUCE|REDUCE([valor_inicial]; matriz; lambda(acumulador; valor; cálculo))|24|P|
SCAN|SCAN|SCAN([valor_inicial]; matriz; lambda(acumulador; valor; cálculo))|24|P|La lista alfabética es-ES dice «ESCANER» (parece traducción automática).
BYROW|BYROW|BYROW(matriz; lambda(fila))|24|P|
BYCOL|BYCOL|BYCOL(matriz; lambda(columna))|24|P|
MAKEARRAY|MAKEARRAY|MAKEARRAY(filas; columnas; lambda(fila; columna))|24|P|La lista alfabética es-ES dice «ARCHIVOMAKEARRAY» (error evidente).
ISOMITTED|ISOMITTED|ISOMITTED(argumento)|24|P|
CONCAT|CONCAT|CONCAT(texto1; [texto2]; ...)|19|V1|NO existe en HyperFormula 3.5.0 (usar & o CONCATENAR en la hoja de práctica).
TEXTJOIN|UNIRCADENAS|UNIRCADENAS(delimitador; ignorar_vacías; texto1; [texto2]; ...)|19|V1|
LEFT|IZQUIERDA|IZQUIERDA(texto; [núm_de_caracteres])|T|V1|
RIGHT|DERECHA|DERECHA(texto; [núm_de_caracteres])|T|V1|
MID|EXTRAE|EXTRAE(texto; posición_inicial; núm_de_caracteres)|T|V2|Página es-ES titulada «MID».
LEN|LARGO|LARGO(texto)|T|V2|Página es-ES titulada «LEN».
FIND|ENCONTRAR|ENCONTRAR(texto_buscado; dentro_del_texto; [núm_inicial])|T|V2|Distingue mayúsculas. La página es-ES está retirada.
SEARCH|HALLAR|HALLAR(texto_buscado; dentro_del_texto; [núm_inicial])|T|V2|No distingue mayúsculas y admite comodines. Página es-ES titulada «SEARCH».
REPLACE|REEMPLAZAR|REEMPLAZAR(texto_original; núm_inicial; núm_de_caracteres; texto_nuevo)|T|V1|Por posición.
SUBSTITUTE|SUSTITUIR|SUSTITUIR(texto; texto_original; texto_nuevo; [núm_de_instancia])|T|V1|Por contenido.
TRIM|ESPACIOS|ESPACIOS(texto)|T|V1|No es «RECORTAR».
CLEAN|LIMPIAR|LIMPIAR(texto)|T|V1|
UPPER|MAYUSC|MAYUSC(texto)|T|V1|Sin tilde ni «ULAS».
LOWER|MINUSC|MINUSC(texto)|T|V2|Página es-ES titulada «LOWER».
PROPER|NOMPROPIO|NOMPROPIO(texto)|T|V1|
TEXT|TEXTO|TEXTO(valor; formato)|T|V1|Códigos de formato en español: "dd/mm/aaaa" (aaaa, no yyyy), "#.##0,00".
VALUE|VALOR|VALOR(texto)|T|V1|
NUMBERVALUE|VALOR.NUMERO|VALOR.NUMERO(texto; [separador_decimal]; [separador_grupo])|13|V1|Clave para importar números con punto decimal: VALOR.NUMERO("1234.5";".";",").
FIXED|DECIMAL|DECIMAL(número; [decimales]; [no_separar_millares])|T|V1|TRAMPA: DECIMAL en español = FIXED en inglés (redondea y devuelve TEXTO). La lista alfabética es-ES dice «CORREGIDO» (error).
DOLLAR|MONEDA|MONEDA(número; [núm_de_decimales])|T|V1|Devuelve texto con el símbolo de moneda regional (€).
REPT|REPETIR|REPETIR(texto; núm_de_veces)|T|V1|
EXACT|IGUAL|IGUAL(texto1; texto2)|T|V2|Página es-ES titulada «EXACT».
CHAR|CARACTER|CARACTER(número)|T|V1|Sin tilde (la lista alfabética es-ES pone CARÁCTER, mal).
CODE|CODIGO|CODIGO(texto)|T|V1|Sin tilde (la lista alfabética es-ES pone CÓDIGO, mal).
UNICHAR|UNICAR|UNICAR(número)|13|V1|HyperFormula la llama UNICHAR.
UNICODE|UNICODE|UNICODE(texto)|13|V1|
T|T|T(valor)|T|V1|
TEXTBEFORE|TEXTOANTES|TEXTOANTES(texto; delimitador; [núm_de_instancia]; [modo_de_coincidencia]; [coincidir_con_final]; [si_no_se_encuentra])|24|V3|La página es-ES se titula «TEXTBEFORE», pero la lista oficial es-ES y su gemela TEXTODESPUES confirman TEXTOANTES. Argumentos orientativos.
TEXTAFTER|TEXTODESPUES|TEXTODESPUES(texto; delimitador; [núm_de_ocurrencia]; [modo_de_coincidencia]; [coincidencia_al_final]; [si_no_se_encuentra])|24|V3|Sin tilde: DESPUES.
TEXTSPLIT|DIVIDIRTEXTO|DIVIDIRTEXTO(texto; delimitador_columna; [delimitador_fila]; [ignorar_vacías]; [modo_de_coincidencia]; [rellenar_con])|24|V3|Página es-ES titulada «TEXTSPLIT», sintaxis y lista: DIVIDIRTEXTO. Argumentos orientativos.
ARRAYTOTEXT|MATRIZATEXTO|MATRIZATEXTO(matriz; [formato])|21|V3|
VALUETOTEXT|VALORATEXTO|VALORATEXTO(valor; [formato])|21|V3|
REGEXTEST|REGEXPRUEBA|REGEXPRUEBA(texto; patrón; [distinguir_mayúsculas])|365|V3|Lista alfabética es-ES: «PRUEBA DE REGEX» (error). Título es-ES y blogs: REGEXPRUEBA. Motor PCRE2.
REGEXEXTRACT|REGEXEXTRACCION|REGEXEXTRACCION(texto; patrón; [modo_devolución]; [distinguir_mayúsculas])|365|V3|Sin tilde. La propia página es-ES escribe también «REGEXEXTRAE» en la sintaxis: contradicción; título y blogs: REGEXEXTRACCION.
REGEXREPLACE|REGEXREEMPLAZAR|REGEXREEMPLAZAR(texto; patrón; reemplazo; [ocurrencia]; [distinguir_mayúsculas])|365|V3|
TRANSLATE|TRADUCIR|TRADUCIR(texto; [idioma_origen]; [idioma_destino])|365|V3|Servicio en línea (Microsoft Translator); también Excel Mobile. Códigos de idioma tipo "es", "en".
DETECTLANGUAGE|DETECTARIDIOMA|DETECTARIDIOMA(texto)|365|V3|Servicio en línea.
TODAY|HOY|HOY()|T|V1|Volátil.
NOW|AHORA|AHORA()|T|V1|Volátil.
DATE|FECHA|FECHA(año; mes; día)|T|V1|
TIME|NSHORA|NSHORA(hora; minuto; segundo)|T|V2|TRAMPA: no es «HORA» (HORA = HOUR). Página es-ES titulada «HORA.DET» (error).
YEAR|AÑO|AÑO(núm_de_serie)|T|V1|Con Ñ.
MONTH|MES|MES(núm_de_serie)|T|V1|
DAY|DIA|DIA(núm_de_serie)|T|V1|Sin tilde.
HOUR|HORA|HORA(núm_de_serie)|T|V1|
MINUTE|MINUTO|MINUTO(núm_de_serie)|T|V1|
SECOND|SEGUNDO|SEGUNDO(núm_de_serie)|T|V1|
WEEKDAY|DIASEM|DIASEM(núm_de_serie; [tipo])|T|V1|En España usar tipo 2 (lunes=1).
WEEKNUM|NUM.DE.SEMANA|NUM.DE.SEMANA(núm_de_serie; [tipo_de_devolución])|T|V1|Para semana ISO usar ISO.NUM.DE.SEMANA o tipo 21.
ISOWEEKNUM|ISO.NUM.DE.SEMANA|ISO.NUM.DE.SEMANA(fecha)|13|V1|Semana ISO 8601 (la usada en España). HyperFormula la llama ISOWEEKNUM.
EDATE|FECHA.MES|FECHA.MES(fecha_inicial; meses)|T|V1|
EOMONTH|FIN.MES|FIN.MES(fecha_inicial; meses)|T|V1|
WORKDAY|DIA.LAB|DIA.LAB(fecha_inicial; días; [vacaciones])|T|V1|
WORKDAY.INTL|DIA.LAB.INTL|DIA.LAB.INTL(fecha_inicial; días; [fin_de_semana]; [vacaciones])|10|V1|
NETWORKDAYS|DIAS.LAB|DIAS.LAB(fecha_inicial; fecha_final; [vacaciones])|T|V1|
NETWORKDAYS.INTL|DIAS.LAB.INTL|DIAS.LAB.INTL(fecha_inicial; fecha_final; [fin_de_semana]; [vacaciones])|10|V2|Página es-ES titulada «DIASLABINTL»; lista alfabética «DÍAS DE RED. INTL»: ambos mal.
DATEDIF|SIFECHA|SIFECHA(fecha_inicial; fecha_final; unidad)|T|V1|Función oculta: no sale en el autocompletado ni en Insertar función. Unidades en INGLÉS: "Y","M","D","MD","YM","YD" (no "A"). HyperFormula la llama DATEDIF y solo acepta unidades en mayúsculas.
DAYS|DIAS|DIAS(fecha_final; fecha_inicial)|13|V1|Orden: final primero. HyperFormula la llama «DÍAS» (con tilde).
DAYS360|DIAS360|DIAS360(fecha_inicial; fecha_final; [método])|T|V1|
YEARFRAC|FRAC.AÑO|FRAC.AÑO(fecha_inicial; fecha_final; [base])|T|V1|
DATEVALUE|FECHANUMERO|FECHANUMERO(texto_de_fecha)|T|V2|Página es-ES titulada «VALFECHA» (error).
TIMEVALUE|HORANUMERO|HORANUMERO(texto_de_hora)|T|V1|
VLOOKUP|BUSCARV|BUSCARV(valor_buscado; matriz_buscar_en; indicador_columnas; [ordenado])|T|V2|La página es-ES se titula «Función CONSULTAV»: nombre que tuvo solo en la beta de Excel 2010 y se revirtió. Usar FALSO en [ordenado] para coincidencia exacta.
HLOOKUP|BUSCARH|BUSCARH(valor_buscado; matriz_buscar_en; indicador_filas; [ordenado])|T|V1|
LOOKUP|BUSCAR|BUSCAR(valor_buscado; vector_de_comparación; [vector_resultado])|T|V1|NO existe en HyperFormula 3.5.0.
XLOOKUP|BUSCARX|BUSCARX(valor_buscado; matriz_buscada; matriz_devuelta; [si_no_se_encuentra]; [modo_de_coincidencia]; [modo_de_búsqueda])|21|V3|Las listas alfabética y por categoría es-ES dicen «XLOOKUP» (sin traducir); la página de la función: BUSCARX.
MATCH|COINCIDIR|COINCIDIR(valor_buscado; matriz_buscada; [tipo_de_coincidencia])|T|V1|0 = exacta.
XMATCH|COINCIDIRX|COINCIDIRX(valor_buscado; matriz_buscada; [modo_de_coincidencia]; [modo_de_búsqueda])|21|V3|
INDEX|INDICE|INDICE(matriz; núm_fila; [núm_columna])|T|V1|Sin tilde (la lista alfabética pone ÍNDICE, mal).
OFFSET|DESREF|DESREF(ref; filas; columnas; [alto]; [ancho])|T|V1|Volátil.
INDIRECT|INDIRECTO|INDIRECTO(ref; [a1])|T|V1|Volátil. NO existe en HyperFormula 3.5.0.
ADDRESS|DIRECCION|DIRECCION(fila; columna; [abs]; [a1]; [hoja])|T|V1|Sin tilde (la lista alfabética pone DIRECCIÓN, mal).
ROW|FILA|FILA([ref])|T|V2|Página es-ES titulada «ROW».
ROWS|FILAS|FILAS(matriz)|T|V1|
COLUMN|COLUMNA|COLUMNA([ref])|T|V1|
COLUMNS|COLUMNAS|COLUMNAS(matriz)|T|V2|Página es-ES titulada «COLUMNS».
CHOOSE|ELEGIR|ELEGIR(núm_índice; valor1; [valor2]; ...)|T|V1|La lista alfabética es-ES dice «ELIJA» (error).
TRANSPOSE|TRANSPONER|TRANSPONER(matriz)|T|V1|
FILTER|FILTRAR|FILTRAR(matriz; incluir; [si_vacío])|21|V3|Sin [si_vacío] y sin resultados → #¡CALC!. HyperFormula la llama FILTER.
SORT|ORDENAR|ORDENAR(matriz; [índice_ordenación]; [criterio_ordenación]; [por_columna])|21|V3|criterio 1 = ascendente, -1 = descendente. Argumentos orientativos (la página es-ES los deja en inglés).
SORTBY|ORDENARPOR|ORDENARPOR(matriz; por_matriz1; [criterio_ordenación1]; [por_matriz2; criterio_ordenación2]; ...)|21|V3|Junto, sin espacio (la lista alfabética pone «ORDENAR POR», mal). Argumentos orientativos.
UNIQUE|UNICOS|UNICOS(matriz; [por_columna]; [exactamente_una_vez])|21|V3|Sin tilde. Las listas es-ES dicen «UNIQUE» (sin traducir). Argumentos orientativos.
VSTACK|APILARV|APILARV(matriz1; [matriz2]; ...)|24|V3|
HSTACK|APILARH|APILARH(matriz1; [matriz2]; ...)|24|V3|
TOROW|ENFILA|ENFILA(matriz; [ignorar]; [examinar_por_columna])|24|V3|Página es-ES titulada «TOROW»; lista oficial es-ES: ENFILA (coherente con ENCOL).
TOCOL|ENCOL|ENCOL(matriz; [ignorar]; [examinar_por_columna])|24|V3|
WRAPROWS|AJUSTARFILAS|AJUSTARFILAS(vector; recuento_ajuste; [rellenar_con])|24|V3|Página es-ES titulada «WRAPROWS»; lista oficial: AJUSTARFILAS.
WRAPCOLS|AJUSTARCOLS|AJUSTARCOLS(vector; recuento_ajuste; [rellenar_con])|24|V3|
TAKE|TOMAR|TOMAR(matriz; filas; [columnas])|24|V3|
DROP|EXCLUIR|EXCLUIR(matriz; filas; [columnas])|24|V3|Página es-ES titulada «DROP», sintaxis y lista: EXCLUIR.
CHOOSEROWS|ELEGIRFILAS|ELEGIRFILAS(matriz; núm_fila1; [núm_fila2]; ...)|24|V3|Página es-ES titulada «CHOOSEROWS»; lista oficial: ELEGIRFILAS.
CHOOSECOLS|ELEGIRCOLS|ELEGIRCOLS(matriz; núm_col1; [núm_col2]; ...)|24|V3|
EXPAND|EXPANDIR|EXPANDIR(matriz; filas; [columnas]; [rellenar_con])|24|V3|
GROUPBY|AGRUPARPOR|AGRUPARPOR(campos_fila; valores; función; [encabezados_campo]; [profundidad_total]; [criterio_ordenación]; [matriz_filtro]; [relación_campo])|365|V3|La función se pasa sin paréntesis: =AGRUPARPOR(A2:A100; C2:C100; SUMA).
PIVOTBY|PIVOTARPOR|PIVOTARPOR(campos_fila; campos_columna; valores; función; [encabezados_campo]; [profundidad_total_filas]; [criterio_ordenación_filas]; [profundidad_total_columnas]; [criterio_ordenación_columnas]; [matriz_filtro]; [relativo_a])|365|V3|La página de Microsoft dice «se aplica a 2021/2024», pero no figura en las novedades de Excel 2024: tratar como solo Microsoft 365. Argumentos orientativos.
TRIMRANGE|RECORTARRANGO|RECORTARRANGO(rango; [recortar_filas]; [recortar_columnas])|365|S|Página es-ES: título «RECORTAR.RANGO» y sintaxis «RECORTARRANGO»; listas es-ES: «TRIMRANGE». Comprobar en Excel real. Alternativa: referencias de recorte A1:.A100 / A:.A.
HYPERLINK|HIPERVINCULO|HIPERVINCULO(ubicación_del_vínculo; [nombre_descriptivo])|T|V1|Sin tilde (la sintaxis es-ES pone HIPERVÍNCULO, mal).
FORMULATEXT|FORMULATEXTO|FORMULATEXTO(referencia)|13|V2|Página es-ES titulada «FORMULATEXT».
GETPIVOTDATA|IMPORTARDATOSDINAMICOS|IMPORTARDATOSDINAMICOS(campo_de_datos; tabla_dinámica; [campo1; elemento1]; ...)|T|V1|Excel la genera sola al hacer clic en una tabla dinámica desde una fórmula.
IMAGE|IMAGEN|IMAGEN(origen; [texto_alternativo]; [dimensiones]; [alto]; [ancho])|24|V3|origen debe ser URL https.
AREAS|AREAS|AREAS(ref)|T|V1|
PMT|PAGO|PAGO(tasa; nper; va; [vf]; [tipo])|T|V1|Tasa mensual = anual/12; signo: el préstamo recibido es positivo, el pago sale negativo.
IPMT|PAGOINT|PAGOINT(tasa; período; nper; va; [vf]; [tipo])|T|V1|
PPMT|PAGOPRIN|PAGOPRIN(tasa; período; nper; va; [vf]; [tipo])|T|V1|
FV|VF|VF(tasa; nper; pago; [va]; [tipo])|T|V1|
PV|VA|VA(tasa; nper; pago; [vf]; [tipo])|T|V1|
NPV|VNA|VNA(tasa; valor1; [valor2]; ...)|T|V1|El primer flujo se descuenta un periodo: la inversión inicial (t=0) se suma fuera.
XNPV|VNA.NO.PER|VNA.NO.PER(tasa; valores; fechas)|T|V1|
IRR|TIR|TIR(valores; [estimar])|T|V1|
XIRR|TIR.NO.PER|TIR.NO.PER(valores; fechas; [estimar])|T|V1|La sintaxis de la página es-ES omite «fechas» (errata).
MIRR|TIRM|TIRM(valores; tasa_financiación; tasa_reinversión)|T|V1|
RATE|TASA|TASA(nper; pago; va; [vf]; [tipo]; [estimar])|T|V1|
NPER|NPER|NPER(tasa; pago; va; [vf]; [tipo])|T|V1|
EFFECT|INT.EFECTIVO|INT.EFECTIVO(int_nominal; núm_per_año)|T|V1|Convierte TIN en TAE (sin comisiones).
NOMINAL|TASA.NOMINAL|TASA.NOMINAL(tasa_efectiva; núm_per_año)|T|V1|
SLN|SLN|SLN(costo; valor_residual; vida)|T|V1|Amortización lineal. Argumento «costo» (no «coste»).
DB|DB|DB(costo; valor_residual; vida; período; [mes])|T|V1|La lista alfabética es-ES dice «NOSQL» (error grave de traducción automática).
DDB|DDB|DDB(costo; valor_residual; vida; período; [factor])|T|V1|
SYD|SYD|SYD(costo; valor_residual; vida; período)|T|V1|
VDB|DVS|DVS(costo; valor_residual; vida; período_inicial; período_final; [factor]; [sin_cambios])|T|V1|
CUMIPMT|PAGO.INT.ENTRE|PAGO.INT.ENTRE(tasa; nper; va; período_inicial; período_final; tipo)|T|V1|
CUMPRINC|PAGO.PRINC.ENTRE|PAGO.PRINC.ENTRE(tasa; nper; va; período_inicial; período_final; tipo)|T|V1|
RRI|RRI|RRI(nper; va; vf)|13|V1|Tasa de crecimiento equivalente.
PDURATION|P.DURACION|P.DURACION(tasa; va; vf)|13|V1|HyperFormula la llama PDURATION.
FVSCHEDULE|VF.PLAN|VF.PLAN(capital; plan_tasas)|T|V1|
ISBLANK|ESBLANCO|ESBLANCO(valor)|T|V1|Sin punto (a diferencia de ES.PAR).
ISERROR|ESERROR|ESERROR(valor)|T|V1|
ISERR|ESERR|ESERR(valor)|T|V1|Todos los errores menos #N/D.
ISNA|ESNOD|ESNOD(valor)|T|V1|
ISNUMBER|ESNUMERO|ESNUMERO(valor)|T|V1|Sin tilde.
ISTEXT|ESTEXTO|ESTEXTO(valor)|T|V1|
ISNONTEXT|ESNOTEXTO|ESNOTEXTO(valor)|T|V1|
ISLOGICAL|ESLOGICO|ESLOGICO(valor)|T|V1|Sin tilde.
ISREF|ESREF|ESREF(valor)|T|V1|
ISFORMULA|ESFORMULA|ESFORMULA(referencia)|13|V1|HyperFormula la llama ISFORMULA.
ISEVEN|ES.PAR|ES.PAR(número)|T|V1|CON punto (ES.PAR, ES.IMPAR) aunque ESNUMERO va sin punto.
ISODD|ES.IMPAR|ES.IMPAR(número)|T|V1|
N|N|N(valor)|T|V1|
NA|NOD|NOD()|T|V1|Devuelve #N/D.
TYPE|TIPO|TIPO(valor)|T|V1|
ERROR.TYPE|TIPO.DE.ERROR|TIPO.DE.ERROR(valor_de_error)|T|V1|
CELL|CELDA|CELDA(tipo_de_info; [referencia])|T|V1|Los tipos de info van en inglés o español según versión ("nombrearchivo"/"filename"): comprobar.
INFO|INFO|INFO(tipo)|T|V1|
SHEET|HOJA|HOJA([valor])|13|V1|
SHEETS|HOJAS|HOJAS([referencia])|13|V1|
DSUM|BDSUMA|BDSUMA(base_de_datos; nombre_de_campo; criterios)|T|V1|
DAVERAGE|BDPROMEDIO|BDPROMEDIO(base_de_datos; nombre_de_campo; criterios)|T|V1|
DCOUNT|BDCONTAR|BDCONTAR(base_de_datos; nombre_de_campo; criterios)|T|V1|
DCOUNTA|BDCONTARA|BDCONTARA(base_de_datos; nombre_de_campo; criterios)|T|V1|
DMAX|BDMAX|BDMAX(base_de_datos; nombre_de_campo; criterios)|T|V1|
DMIN|BDMIN|BDMIN(base_de_datos; nombre_de_campo; criterios)|T|V1|
DGET|BDEXTRAER|BDEXTRAER(base_de_datos; nombre_de_campo; criterios)|T|V1|
DPRODUCT|BDPRODUCTO|BDPRODUCTO(base_de_datos; nombre_de_campo; criterios)|T|V1|
DSTDEV|BDDESVEST|BDDESVEST(base_de_datos; nombre_de_campo; criterios)|T|V1|
DVAR|BDVAR|BDVAR(base_de_datos; nombre_de_campo; criterios)|T|V1|
COPILOT|COPILOT|COPILOT(instrucción; [contexto1]; [instrucción2]; [contexto2]; ...)|RET|V4|RETIRADA el 14/09/2026 según la página de Microsoft (es-ES y en-US). Los valores calculados quedan en caché; al recalcular da #¿NOMBRE?. Usar el panel de Copilot. NO enseñarla como función disponible.
STOCKHISTORY|HISTORIALCOTIZACIONES|HISTORIALCOTIZACIONES(cotización; fecha_inicial; [fecha_final]; [intervalo]; [encabezados]; [propiedad0]; ...)|365|V1|Requiere conexión; puede dar #¡CONECTAR! u #OCUPADO.
PY|PY|PY(código_python; tipo_devolución)|365|V4|No se escribe a mano: se teclea =PY y se abre el editor de Python (Ctrl+Alt+Mayús+P). Se ejecuta en la nube de Microsoft.
ENCODEURL|URLCODIF|URLCODIF(texto)|13W|V2|Página es-ES titulada «ENCODEURL»; sintaxis y excel-translator: URLCODIF.
WEBSERVICE|SERVICIOWEB|SERVICIOWEB(url)|13W|V1|
FILTERXML|XMLFILTRO|XMLFILTRO(xml; xpath)|13W|V2|Página es-ES titulada «FILTERXML»; sintaxis y excel-translator: XMLFILTRO.
CUBEVALUE|VALORCUBO|VALORCUBO(conexión; [expresión_miembro1]; [expresión_miembro2]; ...)|T|V1|Para modelos de datos / Power Pivot.
CUBEMEMBER|MIEMBROCUBO|MIEMBROCUBO(conexión; expresión_miembro; [título])|T|V1|
CONVERT|CONVERTIR|CONVERTIR(número; de_unidad; a_unidad)|T|V1|Las unidades van en código inglés: "km", "mi", "C", "F".
"""
CAT={'Matemáticas y trigonometría':'Matemáticas y trigonometría','Estadísticas':'Estadística','Compatibilidad':'Compatibilidad (sustituidas por versiones nuevas)','Lógicas':'Lógica','Texto':'Texto','Fecha y hora':'Fecha y hora','Búsqueda y referencia':'Búsqueda y referencia','Financieras':'Financieras','Información':'Información','Base de datos':'Base de datos','Web y otras':'Web, cubo, ingeniería y otras'}
out=[]
seen=set()
for line in D.strip().split('\n'):
    p=line.split('|')
    if len(p)<6: raise SystemExit('bad line: '+line)
    en,es,syn,ver,verif,nota=p[0],p[1],p[2],p[3],p[4],'|'.join(p[5:])
    if en in seen: raise SystemExit('dup '+en)
    seen.add(en)
    meta=L.get(en)
    cat=CAT[meta['cat']] if meta else 'Otras'
    if en in ('LET','LAMBDA','MAP','REDUCE','SCAN','BYROW','BYCOL','MAKEARRAY','ISOMITTED','IF','IFS','AND','OR','NOT','XOR','IFERROR','IFNA','SWITCH','TRUE','FALSE'): cat='Lógica'
    slug=meta['slug'] if meta else None
    fuente=('https://support.microsoft.com/es-es/excel/functions/'+slug) if slug and slug not in ('countif-function','find-function') else ('https://support.microsoft.com/es-es/excel/get-started/use-the-countif-function-in-microsoft-excel' if en=='COUNTIF' else 'https://es.excel-translator.de/funciones/')
    fuentes=[fuente]
    if verif in ('V1','V2'): fuentes.append('https://es.excel-translator.de/funciones/')
    if verif=='V3': fuentes.append('https://support.microsoft.com/es-es/office/funciones-de-excel-orden-alfab%C3%A9tico-b3944572-255d-4efb-bb96-c6d90033e188')
    # HyperFormula
    if en in hf:
        h=hf[en]
        if h=='' : hfs='NO en esES (el nombre traducido está vacío; solo responde a «SWITCH»)'
        elif h==es: hfs='sí'
        else: hfs=f'sí, pero con otro nombre: «{h}» (parchear el idioma esES para que acepte «{es}»)'
        if en in ('TRUE','FALSE'): hfs='sí como '+es+'() con paréntesis; la constante '+es+' sin paréntesis da #¿NOMBRE? salvo que se defina como expresión con nombre'
        if en=='DATEDIF': hfs+='; además solo acepta unidades en mayúsculas ("D","M","Y")'
        if en=='TEXT': hfs='sí, pero NO entiende códigos de formato españoles ("#.##0,00", "aaaa"): resultados erróneos'
    else:
        hfs='NO soportada en HyperFormula 3.5.0 (da #¿NOMBRE?)'
    out.append({'en':en,'es':es,'categoria':cat,'sintaxis_es':syn.strip(),'disponible':V[ver],'verificacion':VER[verif],'fuente':fuentes[0],'fuentes':fuentes,'hyperformula_esES':hfs,'nota':nota.strip()})
json.dump(out,open(B+'work/funciones.json','w'),ensure_ascii=False,indent=1)
print(len(out))
import collections
print(collections.Counter(x['categoria'] for x in out))
print(collections.Counter(x['verificacion'][:12] for x in out))
