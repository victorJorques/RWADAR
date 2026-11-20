# Proyectos prácticos reales · 8 proyectos de empresa, examen final y prueba de nivel

Línea de investigación: diseño de proyectos prácticos que hacen autónoma a la alumna.
Fecha: 14/11/2026. Configuración: Excel para Microsoft 365 en español (es-ES), separador `;`, decimal `,`, fechas DD/MM/AAAA, euros.

Leyenda: **[VERIFICADO: url]** = comprobado en fuente primaria (página oficial, PDF o norma). **[VERIFICADO local: archivo]** = fuente primaria descargada en `research/raw/` y leída. **[CORREGIDO: url]** = el dato original estaba mal y se ha cambiado por el de la fuente primaria. **[NO VERIFICABLE: …]** = no se ha podido comprobar en fuente primaria; no se enseña como dato. **[criterio propio]** = decisión de diseño del curso, no un dato del mundo real. **[DISEÑO]** = dato inventado a propósito para la empresa ficticia; no es un dato del mundo real.

Archivos de cálculo usados para comprobar las cifras de este documento (no son entregables, solo la prueba de que los números cuadran):
- `research/work/proyectos/p1_calc.py`: precios, totales, reparto óptimo y puntuaciones del Proyecto 1.
- `research/work/proyectos/p4_calc.py`: saldos y partidas de la conciliación del Proyecto 4.

Aviso de método: a mitad de la investigación se agotó el cupo de búsquedas web de la sesión. Lo que falta se ha completado leyendo directamente fuentes primarias conocidas (BOE, Microsoft Learn, support.microsoft.com, PDF de Certiport, Ayuntamiento de Madrid) y los documentos que otras líneas ya habían descargado en `research/raw/`. No se han podido buscar más pruebas de selección reales de ETT ni de empresas españolas además de las que recogió la línea de currículo (`curriculo.md` §3).

---

## 0. Lo esencial (15 puntos)

1. **Ocho proyectos, uno o más por departamento y de dificultad creciente.** Del N1-N2 al N5-N6: P1 Comparativa de ofertas de proveedores (Compras) · P2 Vacaciones, ausencias y plantilla (RRHH) · P3 Facturas, cobros y antigüedad de saldos (Administración) · P4 Conciliación bancaria (Finanzas) · P5 Informe mensual de ventas automatizado (Comercial) · P6 Stock, punto de pedido y ABC (Operaciones) · P7 Presupuesto frente a real y previsión de cierre (Control de gestión) · P8 Cuadro de mando de dirección (Dirección). Hay dos de reserva: comisiones por tramos y tesorería a 13 semanas (§6).
2. **Entre los ocho cubren todo el temario N0-N6** (mapa en §4). Lo único que no tiene proyecto propio son los gráficos de embudo y de proyección solar, la copia de módulos de macros entre libros y Python en Excel; se practican en lecciones o como ampliación.
3. **Todos simulan el trabajo real.** El encargo llega en un correo con ambigüedades puestas a propósito. Los datos vienen sucios, con problemas catalogados (Q01-Q22, §3.5). Hay que comprobar, entregar con un correo y, después, superar un **«cambio inesperado»** que pone a prueba si el libro se mantiene.
4. **Credibilidad.** Cada proyecto reproduce tareas que piden las pruebas y certificaciones reales. El **MO-220** (Excel for Accounting) pide conciliaciones bancarias, informes de antigüedad de saldos, deterioro de clientes y cuadros de amortización. El **MO-230** pide presupuesto frente a real, desviaciones frente a referencias, Hoja de previsión, presupuestos de caja y análisis de hipótesis. Las **pruebas prácticas de empresa y ETT** piden limpiar, cruzar, tabla dinámica, gráfico y formato condicional. La **oposición del Ayuntamiento de Madrid** pide referencias mixtas, SI anidado, formato condicional de fila completa, extraer el segundo apellido y SUMAR.SI.CONJUNTO, todo en 30 minutos. [VERIFICADO: PDF de Certiport y del Ayuntamiento, §1]
5. **Regla de oro de todos los proyectos: los totales de control.** Cada ficha da identidades que deben cumplirse (lo que entra = lo que sale + lo que queda) y cifras exactas cuando los datos se han diseñado a mano (P1 y P4). La alumna construye una hoja «Controles» con un **control maestro**, como recomienda el Financial Modelling Code del ICAEW (principios 17 y «master check») [VERIFICADO local: raw/empresa/fmc.pdf]. Motivo: en inspecciones a fondo, el 94 % de 85 hojas reales tenían errores [VERIFICADO local: Panko 2015, raw/empresa/panko2016.txt].
6. **P1 y P4 tienen datos fijos y cifras exactas ya calculadas.** P1: Elecvía es el proveedor único más barato (73.831,07 €), Arnedo gana en la puntuación ponderada (92,38), y el reparto óptimo (cables a Tormes, el resto a Elecvía) cuesta 73.135,79 €. P4: el saldo del banco ajustado y el de libros ajustado dan 54.854,69 € los dos.
7. **Los proyectos con miles de filas (P2, P3, P5-P8) no traen cifras fijas, sino reglas para el generador**: número exacto de problemas sembrados, objetivos de calibración e identidades de control. Siguiendo `GUIA-AUTORES.md` §7, los totales finales se calculan con pandas a partir de los datos limpios.
8. **El apoyo se retira de forma gradual (4C/ID).** P1-P2 llevan pasos y pistas; P3-P5, pasos sin pistas detalladas; P6-P7, solo hitos; P8, solo el encargo y el diccionario de indicadores que debe pactar ella. [criterio de `pedagogia.md` §1.10]
9. **La comunicación se evalúa igual que la exactitud.** Antes de empezar, la alumna escribe las preguntas que haría; la jefa responde con las «aclaraciones» de la ficha. Al terminar, escribe el correo de entrega: 3 conclusiones, supuestos y riesgos.
10. **Cumplimiento real.** Tres proyectos tratan datos personales. P2 maneja **datos de salud** de las bajas, que el RGPD prohíbe tratar salvo excepciones (art. 9.1) [VERIFICADO: RGPD en BOE, DOUE-L-2016-80807]: hay que borrar los diagnósticos y separar el archivo de RRHH del de los responsables. P3 tiene que mostrar los plazos de pago de más de 60 días, que la Ley 3/2004 prohíbe pactar [VERIFICADO: Ley 3/2004 art. 4.3]. P8 solo debe llevar datos agregados.
11. **Las versiones de Excel cuentan.** P5-P8 necesitan Power Query. P8 necesita Power Pivot, que solo existe en Windows; hay que dar un plan B para Mac, iPad y Excel para la web. Cada ficha indica la versión mínima y la alternativa compatible.
12. **Hoja en vivo frente a libro .xlsx.** El motor de la guía (HyperFormula con parches; `funciones-motor.txt`) calcula los pasos de fórmulas de casi todos los proyectos: normalización de precios, DIAS.LAB.INTL, tramos, stock de seguridad con INV.NORM.ESTAND y LET, PAGO y PAGOINT. Las tablas dinámicas, Power Query, los gráficos, el formato condicional, la validación y la protección se hacen en el .xlsx descargable.
13. **Examen final (120 min): una «prueba técnica de empresa» con otra empresa ficticia** (Tostadero Albada, distribuidor de café). Tiene tres partes: A, criterio (15 min, 12 preguntas); B, libro con datos sucios y 6 tareas con totales de control (75 min); C, correo de entrega (20 min). Es apta con ≥ 70 % en total, ≥ 60 % en la parte B y ningún bloqueante (§7).
14. **Prueba de nivel inicial: 22 preguntas** de N0 a N5, adaptativa por escalones (§8), con ejercicios que se corrigen solos y funciones que calcula el motor.
15. **Datos que hay que verificar antes de publicar** (alertas en §9): los festivos de 2026 y 2027 de cada comunidad y municipio (BOE y boletines autonómicos), los rótulos exactos del editor de Power Query en es-ES, el separador de argumentos de DAX en un Power Pivot en español, y que los nombres de las empresas ficticias no coincidan con empresas reales (BORME).

---

## 1. De dónde salen los proyectos: pruebas reales y cursos de empresa

### 1.1 Fuentes y lo que aporta cada una

| Fuente | Qué es | Qué aporta a los proyectos |
|---|---|---|
| **Ayuntamiento de Madrid, auxiliar administrativo, supuesto Excel (modelo C)** | Prueba práctica de oposición: reproducir dos hojas modelo en **30 minutos**. Avisan a los 5 minutos y a 1 minuto del final de que hay que grabar. | Hoja 1: formatos (fuente, combinar y centrar, bordes, ajustar texto, formato personalizado), encabezado y pie, **referencias mixtas o absolutas** para el total, **SI anidado** (regalo según mensualidades), búsqueda del regalo de un cliente, recuento de los que no tienen regalo, MIN, PROMEDIO, impuestos del 15 %, gráfico de 7 × 12 cm. Hoja 2: **formato condicional de texto y de fila entera** (si el deporte es Atletismo, toda la fila en negro), **extraer el segundo apellido** con funciones, **suma con dos condiciones** (Atletismo y más de 1.000 puntos). [VERIFICADO: https://www.madrid.es/UnidadWeb/Contenidos/Oposiciones/AuxAdtvo2020/ficheros/cexcel.pdf, texto extraído en raw/proyectos/madrid_cexcel.txt] → P1, P2 y parte B del examen final. |
| **MO-220 Excel for Accounting Associate** (Certiport/Microsoft, 2025) | Certificación por puesto: unas 150 h de formación, 50 min, solo en inglés. Los enunciados **no nombran la función**. | Ejemplos de libro: «trial balances, financial statements, payroll data, **bank reconciliations**, **amortization schedules**». Objetivos: quitar duplicados, validación, detectar datos fuera de lo esperado, dividir columnas, funciones de texto y fecha. Conciliación: «identify outstanding checks and deposits in transit», «Use Conditional Formatting to identify reconciling items», «Calculate adjusted cash balances». Clientes: «**accounts receivable or accounts payable aging reports**», «calculate **bad debt expense**». Además: ratios, auditoría de fórmulas, tablas dinámicas, cuadros de mando y accesibilidad. [VERIFICADO: https://arch-center.azureedge.net/Credentials/exam-mo-220-mos-excel-for-accounting-associate.pdf, texto en raw/proyectos/mo220.txt] → P3, P4 y P7. |
| **MO-230 Excel for Business Finance Associate** | Igual: 50 min, solo en inglés (página actualizada el 31/07/2026). | «**Calculate budget versus actual variance**», «**Identify variances that differ from provided benchmarks**», análisis horizontal y vertical, «Create a **Forecast Sheet**», «Project interest payments», «Apply What-If Analysis», «**Project cash budgets**», «Create loan amortization schedules», «Analyze loan scenarios», «Identify and correct errors in charts», proteger libros, hojas y celdas. [VERIFICADO: https://learn.microsoft.com/en-us/credentials/certifications/mos-excel-for-business-finance-associate/ y https://arch-center.azureedge.net/Credentials/exam-mo-230-mos-excel-for-business-finance-associate.pdf] → P7, P8 y la reserva R2 (tesorería). |
| **TestGorilla «Microsoft Excel (Advanced)»** | Test de selección de **10 min**, disponible en español | Temas: organización de datos, fórmulas avanzadas, informes y visualizaciones, funciones avanzadas. [VERIFICADO: https://www.testgorilla.com/test-library/role-specific-skills-tests/microsoft-excel-advanced-test/] → parte A del examen. |
| **Criteria «Microsoft Excel 365»** y SHL | Test corto de opción múltiple (Criteria) y prueba con simulaciones de Excel (SHL) | Ver `curriculo.md` §3.1 [VERIFICADO allí: Criteria] · SHL tiene un «Microsoft Excel Test» y dice que sus pruebas de Office «use simulations» [VERIFICADO: https://www.shl.com/products/assessments/skills-and-simulations/business-skills/]; SHL no publica cuánto dura la prueba [NO VERIFICABLE: no enseñarlo como dato] · IBM Kenexa Prove It! ya no existe: IBM lo retiró y lo pasó a su plataforma Assess [CORREGIDO: https://www.ibm.com/support/pages/prove-it-migration-assess-overview]. |
| **Pruebas prácticas propias de empresas y ETT** | Archivo con datos e instrucciones, de 30 a 60 min | Limpiar, BUSCARV o BUSCARX, SI, SUMAR.SI.CONJUNTO, tabla dinámica, gráfico, formato condicional, «dejar la tabla ordenada y entendible» [NO VERIFICABLE: no enseñarlo como dato; es una orientación sacada de guías de formadores, ver `curriculo.md` §3.1-3.2. Lo comprobado en fuente oficial es el supuesto de 30 min del Ayuntamiento de Madrid, en la primera fila de esta tabla] → examen final, parte B. |
| **Coursera «Excel Skills for Business» (Macquarie)** | 4 cursos, 107 h, con empresa ficticia y personajes fijos (PushPin, Uma, Alex) y un bloque sobre prevención de errores | Escenario de empresa estable y reto práctico por módulo [VERIFICADO en `pedagogia.md`: https://www.coursera.org/specializations/excel] → §2 (Electro Cierzo y sus personajes). |
| **ICAEW Financial Modelling Code** (2024), basado en los «Twenty principles for good spreadsheet practice» | Código de buenas prácticas | Principio 14: «Avoid using fixed values within formulas». Principio 17: «Build in checks, controls, and alerts», con tolerancia para el redondeo y formato condicional en los controles. **Master check** visible en todas las hojas. Fórmulas coherentes, sin duplicar entradas y con guía de uso. [VERIFICADO local: raw/empresa/fmc.pdf; referencia icaew.com/financialmodelling] → rúbrica (§3.3) y estructura del libro (§3.2). |
| **FAST Standard 02c** (julio de 2019) | Reglas de diseño de modelos | «Arrange sheets so that calculation order flows left to right» (1.02-01); hojas de control (2.06); separar entradas, cálculos y presentación [VERIFICADO local: raw/empresa/fast02c.pdf] → §3.2. |
| **Panko (2015)** | Investigación sobre errores en hojas de cálculo | Tasa media de error por celda del 3,9 % en 14 estudios de laboratorio con 967 participantes. Errores en el 94 % de 85 hojas inspeccionadas a fondo. [VERIFICADO local: raw/empresa/panko2016.txt; https://arxiv.org/pdf/1602.02601.pdf] → controles obligatorios. |
| **Microsoft, «Diez formas principales de limpiar los datos»** | Ayuda oficial es-ES | Quitar duplicados, Buscar y reemplazar, mayúsculas y minúsculas, espacios y caracteres no imprimibles, números guardados como texto, fechas como texto, combinar y dividir columnas, conciliar tablas. **Ojo: la página llama «RECORTAR» a la función de quitar espacios; en Excel en español es ESPACIOS** (traducción automática errónea) [VERIFICADO: https://support.microsoft.com/es-es/office/diez-formas-principales-de-limpiar-los-datos-2844b620-677c-47a7-ac3e-c2e157d1db19] → catálogo Q (§3.5). |
| **Microsoft, Power Query desde carpeta** | Ayuda oficial es-ES | Datos > Obtener datos > Del archivo > De la carpeta > Transformar datos > Combinar archivos, con archivo de ejemplo. Todos los archivos deben tener el mismo esquema (encabezados, tipos y número de columnas). La coincidencia se hace por nombre de columna y el orden no importa. Mejor una carpeta dedicada, porque entra todo lo que haya en ella y en sus subcarpetas. [VERIFICADO: https://support.microsoft.com/es-es/office/importar-datos-de-una-carpeta-con-varios-archivos-power-query-94b8023c-2e66-4f6b-8c78-6a00041c90e4] → P5. |
| **Microsoft, Hoja de previsión** | Ayuda oficial es-ES | Datos > Previsión > Hoja de previsión. Intervalos constantes. Admite hasta un 30 % de puntos que faltan. Algoritmo ETS AAA. Intervalo de confianza del 95 % por defecto. Con menos de dos ciclos, la estacionalidad no es fiable. [VERIFICADO: https://support.microsoft.com/es-es/office/crear-una-previsi%C3%B3n-en-excel-para-windows-22c500da-6da7-45e5-bfdc-60a7062329fd] → P6 y P8 (ampliación). |
| **Norma 43 (AEB/CECA), «Información normalizada de cuenta corriente»**, junio de 2012 | Formato de los extractos bancarios españoles | Registro de movimientos: fecha de operación y fecha valor en formato AAMMDD, concepto común de 2 posiciones (02 ingresos, 03 recibos, 04 transferencias y cheques, 05 préstamos, 06 remesas, 14 devoluciones e impagados, 15 nóminas y seguros sociales, 17 intereses y comisiones…), **clave Debe/Haber** (1 = Debe, 2 = Haber), importe de 14 posiciones (12 enteros y 2 decimales, sin coma). [VERIFICADO local: raw/empresa/n43.pdf, releído el 14/11/2026: registro principal de movimientos (código 22), fecha de operación en las posiciones 11-16 y fecha valor en las 17-22 «Formato: AAMMDD», concepto común en las 23-24, clave en la 28 («1.- Apuntes Debe, 2.- Apuntes Haber»), importe en las 29-42 «con dos decimales, sin reflejar la coma» y anexo 2 con los conceptos citados. En aebanca.es no se ha encontrado en abierto; copia pública de una entidad: https://www.cajamar.es/storage/documents/1733/cuaderno-43.pdf] → P4 (ampliación N43). |
| **Plan General de Contabilidad** (RD 1514/2007) | Cuadro de cuentas | 430 Clientes, 436 Clientes de dudoso cobro, 490 Deterioro de valor de créditos por operaciones comerciales, 555 Partidas pendientes de aplicación, 572 Bancos e instituciones de crédito c/c vista, euros, 600, 621-629, 640, 642, 662, 681, 694, 700, 706, 708. [VERIFICADO local: raw/empresa/pgc.html, BOE-A-2007-19884] → P3, P4 y P7. |
| **Ley 3/2004, de morosidad** | Plazos de pago entre empresas | Art. 4.1: 30 días naturales por defecto. Art. 4.3: ampliable por pacto, «sin que, en ningún caso, se pueda acordar un plazo superior a 60 días naturales». Art. 7: interés de demora (tipo del BCE + 8 puntos, publicado cada semestre). Art. 8: 40 € fijos por costes de cobro. [VERIFICADO: https://www.boe.es/eli/es/l/2004/12/29/3/con, última actualización publicada 01/10/2014] → P3. |
| **Estatuto de los Trabajadores** (texto consolidado, actualizado el 21/10/2026) | Vacaciones, fiestas, permisos y registro de jornada | Art. 38.1: vacaciones de al menos 30 días naturales. Art. 38.3: fechas conocidas dos meses antes; si coinciden con una incapacidad temporal, se disfrutan después, «siempre que no hayan transcurrido más de dieciocho meses a partir del final del año en que se hayan originado». Art. 37.2: fiestas, máximo 14 al año y dos locales. Art. 37.3: permisos de 15 días naturales por matrimonio, 2 días por fallecimiento (más 2 si hay desplazamiento), 5 días por enfermedad grave u hospitalización de un familiar y 1 día por traslado. Art. 34.9: registro diario de jornada, que se conserva 4 años. [VERIFICADO: https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430] → P2. |
| **RGPD** | Protección de datos | Art. 5.1.c: «minimización de datos». Art. 9.1: prohíbe tratar «datos relativos a la salud», salvo excepciones (9.2). [VERIFICADO local: raw/empresa/rgpd_boe.html, DOUE-L-2016-80807] → P2 y P8. |
| **AEAT, tipos de IVA 2026** | Tipos vigentes | General 21 %, reducido 10 % (alimentación), superreducido 4 % (pan, leche, quesos, huevos, frutas, verduras, aceite de oliva, libros, medicamentos…). [VERIFICADO local: raw/empresa/tiposiva2026.pdf] → P1, P3 y examen final (café 10 %, leche 4 %, maquinaria 21 %). |

### 1.2 Lo que tienen en común las pruebas reales (y por eso los proyectos son así)

1. **Hay límite de tiempo**: 30 min en Madrid, 50 min en MOS, 10 min en TestGorilla y de 30 a 60 min en las pruebas de empresa. Cada proyecto trae una duración estimada y el examen tiene cronómetro.
2. **Los enunciados no dicen qué función usar** (MOS: «function names are avoided and are replaced with descriptors»). En los proyectos, los pasos dicen qué hay que conseguir y la función aparece solo en la pista.
3. **Los datos llegan sucios o en formatos de exportación**: CSV del ERP, descargas del banco, hojas «bonitas» de otra persona. El trabajo de verdad empieza por limpiarlos.
4. **Se valora la claridad, no solo el número**: «dejar la tabla ordenada y entendible», accesibilidad y usabilidad (MO-220 y MO-230: «Evaluate and improve accessibility and usability»).
5. **Hay que encontrar y corregir errores** (MO-220: «Use Formula Auditing features to verify and correct calculations»; MO-230: «Identify and report formula errors», «Identify and correct errors in charts»). En P7 la alumna hereda el libro de otra persona con errores sembrados.

---

## 2. La empresa de la guía (escenario estable para los 8 proyectos)

**Electro Cierzo Suministros, S.L.** [DISEÑO]: distribuidora de material eléctrico, iluminación y pequeño material para instaladores y empresas. Facturación de unos **9,5 M€ al año**, **58 personas**, sede y almacén central en **Zaragoza** y delegaciones en **Pamplona** y **Lleida**. En noviembre de 2026 abre **Logroño**, que aparece como «cambio inesperado» en P5 y P7. Trabaja con un ERP del que exporta CSV, con un banco principal («Banco Norte») y otro para pólizas («Banco Sur»), y con Microsoft 365 en Windows. La directora general usa Mac e iPad.

- **CIF ficticio:** el generador calcula el dígito de control correcto de un CIF «B» y **pone otro distinto**. Así el CIF tiene formato real, pero no puede coincidir con el de ninguna empresa [criterio propio]. Antes de publicar, comprobar en el BORME que no existe una sociedad con ese nombre [NO VERIFICABLE: no se pudo usar el buscador del BORME de forma automática. Una búsqueda web del 14/11/2026 no encontró ninguna empresa llamada «Electro Cierzo» ni «Electro Cierzo Suministros». La comprobación en el BORME sigue pendiente antes de publicar].
- **Personas ficticias:** nombres y apellidos españoles variados. Los DNI llevan una letra de control válida (si no, los ejercicios de validación no funcionan), con números aleatorios que no están ligados a nadie real.
- **Hoy es lunes 16/11/2026** en la ficción, la semana siguiente a la fecha de la investigación. Están cerrados los meses de enero a octubre de 2026.

| Personaje | Puesto | Aparece en | Estilo de sus correos |
|---|---|---|---|
| **Carmen Soler** | Directora general | P8 (y como destinataria en P1 y P7) | Breve, pide «la película entera», odia los anexos |
| **Marta Ruiz** | Directora financiera | P3, P4, P7 | Precisa, con prisa, desconfía de lo heredado |
| **Javier Ortega** | Director comercial | P5 | Impaciente, piensa en «un botón» |
| **Lucía Fernández** | Responsable de RRHH | P2 | Agobiada, mezcla dos encargos en uno |
| **Andrés Molina** | Jefe de compras y almacén | P1, P6 | Práctico, da datos incompletos |
| **Paco Gil** | Administrativo jubilado en 2026 | Su libro heredado (P7) y «lo hacía a mano» (P3) | — |
| **Tú** | Administrativa y analista recién incorporada | Todos | — |

Los maestros son **coherentes entre proyectos**: los mismos clientes (P3, P5 y P8), productos (P5, P6 y P8), delegaciones, comerciales y el préstamo de 85.000 € (P4 y P7). Así P8 integra de verdad lo anterior.

---

## 3. Normas comunes a los 8 proyectos

### 3.1 El ciclo del proyecto (lo que se evalúa en todos)

| Fase | Qué hace la alumna | Lo que deja hecho | Tiempo orientativo |
|---|---|---|---|
| 1. Encargo | Lee el correo, detecta lo ambiguo y escribe sus preguntas (`preguntas_previas`). Recibe las aclaraciones. | Correo de preguntas; alcance pactado en el Léame | 5-10 % |
| 2. Perfilado de datos | Cuenta filas, columnas y tipos; busca claves únicas, vacíos, duplicados, valores raros y periodos que faltan | Hoja «Calidad de datos»: problema, nº de filas afectadas, decisión tomada | 10-15 % |
| 3. Diseño | Boceto de la salida (en papel o en una hoja) y elige la herramienta: fórmulas, Tabla, tabla dinámica o Power Query | Boceto y lista de hojas | 5-10 % |
| 4. Construcción | Construye por partes y guarda versiones (`_v01`, `_v02`) | Libro | 40-50 % |
| 5. Comprobación | Totales de control, casos límite, Rastrear y Evaluar fórmula, revisión con lista de comprobación | Hoja «Controles» con el control maestro en verde | 10-15 % |
| 6. Entrega | Página de resumen, PDF y correo con 3 conclusiones, supuestos y riesgos | PDF, libro final y correo | 5-10 % |
| 7. Mantenimiento | Resuelve el «cambio inesperado» y documenta | Léame con «Cómo actualizar» y registro de cambios | 10 % |

### 3.2 Estructura estándar del libro (se exige desde P2; en P1 se introduce)

Basada en el ICAEW FMC (separar entradas, evitar valores fijos, guía de uso, controles y master check) y en FAST (de izquierda a derecha) [VERIFICADO local: fmc.pdf y fast02c.pdf]:

1. **Léame**: objetivo, quién lo pidió, fecha de corte, fuentes, supuestos, cómo actualizar paso a paso, registro de cambios (fecha, qué, quién) y contacto.
2. **Parámetros**: todas las cifras que pueden cambiar (tipos, umbrales, fechas de corte, pesos), **con nombre definido** y celdas de entrada en un color fijo (relleno amarillo claro, por ejemplo) que se explica en el Léame.
3. **Datos_origen**: lo recibido, **intacto** (o la consulta de Power Query que lo lee).
4. **Datos**: la versión limpia en **Tabla** (Ctrl+T), con una fórmula por columna.
5. **Cálculos**: hojas intermedias si hacen falta.
6. **Informe** (o «Resumen»): la salida para quien la pide, en una página.
7. **Controles**: cada control con su descripción, valor esperado, valor obtenido, diferencia, tolerancia y estado VERDADERO/FALSO. El **control maestro** `=Y(rango_estados)` se muestra con formato condicional, y se repite en el encabezado del Informe («Controles: OK»).

Convenciones: nombres de hoja sin espacios raros; nombre de archivo `P3_Antiguedad_saldos_2026-10_v03.xlsx`; sin celdas combinadas dentro de los datos (sí se pueden usar en títulos del informe, o mejor «Centrar en la selección»); sin valores fijos dentro de las fórmulas (principio 14 del ICAEW), salvo constantes evidentes como 12 meses o 7 días.

### 3.3 Rúbrica general (5 criterios × 4 niveles)

Pesos: **Exactitud 30 %**, **Estructura 20 %**, **Automatización y mantenimiento 20 %**, **Presentación 15 %**, **Comunicación 15 %**. Cada criterio se puntúa de 1 a 4.

| Criterio | 1 · En desarrollo | 2 · Aceptable | 3 · Bien | 4 · Excelente |
|---|---|---|---|---|
| **Exactitud** | No hay controles o no cuadran; cifras clave erróneas | Las cifras clave son correctas, pero algún control falla y se explica a medias; errores menores en partidas secundarias (menos del 0,5 % del total) | Todos los controles de la ficha cuadran dentro de la tolerancia; los casos límite están tratados | Además, detecta y documenta los problemas sembrados (y alguno no previsto), con su impacto en € |
| **Estructura** | Datos, cálculos y resultados mezclados; celdas combinadas en los datos; fórmulas distintas en una misma columna | Hojas separadas, pero con valores fijos en las fórmulas o rangos que no crecen | Entradas, datos, cálculos, informe y controles separados; Tablas; parámetros con nombre; una fórmula por columna | Además, flujo de izquierda a derecha, nombres claros, colores con significado y un Léame con el que otra persona lo entiende en 5 minutos |
| **Automatización y mantenimiento** | El mes siguiente hay que rehacerlo a mano | Se actualiza con pasos manuales documentados (copiar y pegar siguiendo instrucciones) | Los datos nuevos entran solos (Tablas o Power Query y «Actualizar todo»); el «cambio inesperado» se resuelve en menos de 30 minutos | Además, los controles avisan solos si algo cambia (filas, totales, claves sin pareja), con registro de cambios y protección adecuada |
| **Presentación** | Ilegible, sin formatos de número, o gráfico inadecuado o engañoso | Legible, pero recargada o sin jerarquía; impresión mal configurada | Una página clara; formatos correctos (€, %, fechas); títulos; gráfico adecuado; se imprime o exporta bien | Además, lo importante va primero, es accesible (no depende solo del color y lleva texto alternativo) y tiene títulos dinámicos |
| **Comunicación** | No pregunta nada; entrega sin explicación | Pregunta parte de lo ambiguo; el correo da cifras sin interpretar | Pregunta lo esencial antes de empezar; correo breve con cifras clave, 3 conclusiones y supuestos | Además, propone decisiones o alternativas, avisa de riesgos y de los límites de los datos, y adapta el mensaje a quien lo lee |

**Apto para entregar** = ningún criterio en 1, Exactitud ≥ 3 y media ponderada ≥ 2,75.
**Bloqueantes** (el proyecto no es apto aunque la media salga bien):
- (a) el control principal no cuadra y no se explica;
- (b) quedan expuestos datos personales o sensibles que no hacía falta compartir;
- (c) se entregan valores pegados donde se pedía una plantilla que se actualiza;
- (d) las cifras del correo no coinciden con las del libro.

Cada ficha de §5 concreta estos niveles para su proyecto.

### 3.4 Apoyo decreciente, tiempos y «cambio inesperado»

- **P1-P2**: pasos numerados con una pista por paso y un ejemplo resuelto. **P3-P5**: pasos sin pista detallada (la ayuda se abre con el botón «Ayuda para este paso»). **P6-P7**: solo hitos y controles. **P8**: el encargo, la lista de fuentes y la obligación de pactar el diccionario de indicadores (KPI).
- **Cambio inesperado**: después de entregar, la «jefa» manda un segundo correo con un dato nuevo, un esquema cambiado o una condición distinta. Mide la mantenibilidad (criterio 3) y la comunicación (¿avisa de que cambia la conclusión?). Se basa en la prueba de salida del N6 de `curriculo.md`.
- **Duración**: las horas de cada ficha son para una alumna que acaba de terminar el nivel requerido. La primera vez que trabaja con un tipo de datos, conviene sumar un 30 %.

### 3.5 Catálogo de problemas de calidad (códigos que usan las fichas)

| Código | Problema | Cómo se siembra | Cómo se detecta y se arregla (es-ES) |
|---|---|---|---|
| Q01 | Duplicados exactos | La exportación se solapa (un día sale dos veces) | Contar filas frente a filas únicas; Datos > Herramientas de datos > **Quitar duplicados** solo tras ver qué columnas forman la clave; en Power Query, Quitar duplicados por clave |
| Q02 | Casi duplicados | La misma clave con otra grafía o espacios | ESPACIOS, MAYUSC y clave normalizada; CONTAR.SI.CONJUNTO sobre la clave limpia |
| Q03 | **Falsos duplicados** | Filas iguales que son legítimas: el mismo artículo en dos ubicaciones, o dos cobros del mismo importe el mismo día | No se quitan, se suman (Agrupar por o SUMAR.SI.CONJUNTO). En conciliaciones se numera cada repetición (clave + nº de ocurrencia) |
| Q04 | Espacios sobrantes y caracteres invisibles | Espacios al final; espacio duro CARACTER(160), que suele venir de páginas web (la entidad &nbsp;) | ESPACIOS no quita el CARACTER(160): `=ESPACIOS(SUSTITUIR(A2;CARACTER(160);" "))`; LIMPIAR para los caracteres de control (códigos 0 a 31); en Power Query, Recortar y Limpiar [VERIFICADO: https://support.microsoft.com/es-es/office/espacios-funci%C3%B3n-espacios-410388fa-c5df-49c6-b16c-9e5630b479f9 («Por sí sola, la función ESPACIOS no quita los espacios de no separación», valor 160); https://support.microsoft.com/es-es/office/limpiar-funci%C3%B3n-limpiar-26f3d7c5-475f-4a9c-90e5-4b8ba987ba41 (quita los valores 0 a 31); Power Query: https://learn.microsoft.com/es-es/powerquery-m/text-trim y https://learn.microsoft.com/es-es/powerquery-m/text-clean] |
| Q05 | Números guardados como texto | «1.234,56» o «1234.56» que se quedan a la izquierda | ESNUMERO o CONTAR frente a CONTARA; VALOR; **VALOR.NUMERO(texto;".";",")**; Texto en columnas; en Power Query, Cambiar tipo con configuración regional |
| Q06 | Símbolos dentro del número | «1.250 €», «12 %», «-» en lugar de 0 | SUSTITUIR y VALOR, o Buscar y reemplazar (Ctrl+L) solo en la columna |
| Q07 | Fechas como texto o en otro orden | «2026-03-04», «04/03/26», el mm/dd estadounidense, «1-oct-26» | ESNUMERO; FECHANUMERO; Texto en columnas (paso 3, formato de columna DMA o AMD); en Power Query, configuración regional. Prueba: un día mayor que 12 |
| Q08 | Categorías mal escritas | «Almacén», «almacen», «ALMACÉN », «Zgz» | UNICOS para verlas todas; tabla de equivalencias y BUSCARX; en Power Query, Combinar consultas con la tabla de equivalencias |
| Q09 | Vacíos con significados distintos | Vacío = 0, vacío = desconocido o vacío = «igual que arriba» | Preguntar qué significa; ESBLANCO; en Power Query, Rellenar > Hacia abajo |
| Q10 | Totales y subtotales mezclados con los datos | Filas «Total cliente…» y «TOTAL GENERAL» | Filtrar por texto; quitar antes de sumar (si no, se cuenta dos veces) |
| Q11 | Cabeceras desplazadas | Filas de título antes de la tabla, celdas combinadas | Quitar filas superiores; «Usar la primera fila como encabezado»; Combinar y centrar > Separar celdas |
| Q12 | Formato ancho | Meses en columnas | Power Query: **Anular dinamización de columnas** (ver `localizacion.md` §7) |
| Q13 | Códigos que pierden ceros o se convierten en fecha | «000731» → 731; «3-10» → 03-oct | Formato Texto antes de pegar; `=TEXTO(A2;"000000")`; Archivo > Opciones > Datos > Conversión automática de datos (ver `pedagogia.md` E27) |
| Q14 | Signo incoherente | Debe y Haber en dos columnas; devoluciones en positivo con tipo «DEV» | Columna Signo según el tipo; importe con signo = cantidad × signo |
| Q15 | Unidades o bases distintas | €/km frente a €/m; con IVA o sin IVA; mensual frente a anual | Tabla de factores; todo a la unidad base y sin IVA antes de comparar |
| Q16 | Claves sin pareja y maestros incompletos | Códigos que no están en el maestro (errata «C0O45», con O en vez de 0) | `SI.ND(BUSCARX(...);"HUÉRFANO")` o el argumento si_no_se_encuentra; en Power Query, Combinar consultas con «Anti izquierda» |
| Q17 | Valores incoherentes o fuera de rango | Hasta < Desde, año 2062, Total ≠ Base + IVA | Columnas de comprobación con tolerancia; formato condicional; validación de datos para que no se repita |
| Q18 | Cambios de esquema entre archivos | Columna nueva, renombrada o en otro orden | Power Query por nombre de columna; control del nº de columnas; Léame |
| Q19 | Codificación y configuración regional | ANSI frente a UTF-8 («Almer�a», «Logro�o»); separador `,` en lugar de `;` | Datos > De texto/CSV con Origen del archivo 65001: Unicode (UTF-8) y el delimitador correcto (ver `localizacion.md` §6) |
| Q20 | Datos que no deberían estar | Diagnósticos médicos, IBAN completos, notas personales | Borrarlos antes de trabajar (RGPD art. 5.1.c y 9.1); Inspeccionar documento |
| Q21 | Información clave en texto libre | Nº de factura dentro del concepto del banco | HALLAR y EXTRAE; TEXTODESPUES; Relleno rápido (Ctrl+Mayús+E); REGEXEXTRACCION (solo en 365); en Power Query, Dividir columna |
| Q22 | Periodos que faltan o se solapan | Un mes sin archivo, días repetidos entre dos extracciones | Recuento por periodo (tabla dinámica por mes y día); control de fechas mín. y máx. por archivo |

### 3.6 Reglas para quien genere los datos (script Python con semilla fija)

1. **Primero los datos limpios, después la suciedad.** Se generan los datos «verdaderos», se calculan con ellos los controles (pandas) y después se ensucian con las cantidades exactas de cada ficha. Cada problema sembrado se registra en un `log_suciedad.csv` (fila, columna, problema, valor original), que sirve para la solución comentada.
2. **Distribuciones realistas.** Las ventas de los artículos siguen una ley de Pareto (una lognormal sirve): un 20 % de los artículos se lleva alrededor del 80 % del valor. Hay estacionalidad (agosto, a la baja; marzo-junio y septiembre-noviembre, al alza). Los importes se redondean a céntimos.
3. **Maestros comunes** (§2) en un módulo compartido. Los mismos códigos sirven para todos los proyectos.
4. **Fechas**: laborables con el calendario de cada delegación (festivos verificados en el BOE y en el boletín autonómico **antes** de generar). En la ficción, nada posterior al 31/10/2026, salvo los archivos del «cambio inesperado».
5. **Sin datos reales** de personas ni empresas. Las cuentas bancarias van como IBAN ficticio con texto «ES00 …» y dígitos de control no válidos.
6. **Los controles van a `pN.json`** con su tolerancia (0,01 € en importes; 0 en recuentos). Las cifras que dan P1 y P4 en este documento son las de diseño: si el generador cambia algo, hay que recalcularlas.

---

## 4. Mapa de cobertura: habilidades del temario × proyectos

● = se practica a fondo · ○ = aparece o es ampliación. El temario completo está en `curriculo.md` §5 (N0-N6).

| Habilidad (nivel) | P1 | P2 | P3 | P4 | P5 | P6 | P7 | P8 | Examen |
|---|---|---|---|---|---|---|---|---|---|
| Escribir datos, fórmulas, referencias relativas y **absolutas** (N0-N1) | ● | ● | ○ | ○ | | ○ | ○ | | ● |
| SUMA, PROMEDIO, MIN, MAX, CONTAR, CONTARA, CONTAR.BLANCO, REDONDEAR (N1) | ● | ● | ○ | ● | ○ | ○ | ○ | | ● |
| SI sencillo; formatos de número, €, %, fecha (N1) | ● | ● | ● | ● | ○ | ○ | ● | ○ | ● |
| Ordenar, filtrar, inmovilizar paneles (N1) | ● | ● | ● | ● | ○ | ○ | ○ | | ● |
| Configurar página, ajustar a una página, imprimir títulos, PDF (N1) | ● | ● | ● | ○ | ● | ○ | ● | ● | ○ |
| Gráfico básico de columnas, barras o líneas (N1) | ● | ○ | ● | | ● | ○ | ○ | ● | ● |
| **Tablas** y referencias estructuradas (N2) | ○ | ● | ● | ● | ● | ● | ● | ● | ● |
| Nombres definidos y parámetros (N2) | ● | ● | ● | ○ | ○ | ● | ● | ○ | ○ |
| Formato condicional integrado y **minigráficos** (N2) | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| Pegado especial (N2) | ○ | ○ | ○ | ○ | | | ○ | | ○ |
| Funciones de texto: ESPACIOS, NOMPROPIO, IZQUIERDA, EXTRAE, HALLAR, SUSTITUIR, UNIRCADENAS, & (N2) | ○ | ● | ● | ● | ○ | ○ | ● | | ● |
| SI anidado, Y, O (N2) | ● | ● | ● | ○ | ○ | ● | ● | ○ | ● |
| SUMAR.SI, CONTAR.SI, PROMEDIO.SI (N2) | ○ | ● | ● | ● | ○ | ○ | ○ | ○ | ● |
| **BUSCARX** y BUSCARV exacta; #N/D (N2) | ● | ● | ● | ● | ○ | ● | ● | ○ | ● |
| Fechas: DIA, MES, AÑO, FECHA, DIAS, resta de fechas (N2) | | ● | ● | ● | ● | ● | ● | ● | ● |
| ORDENAR, UNICOS, SECUENCIA y desbordamiento (N2) | | ● | ○ | ○ | ○ | ● | ○ | ○ | ○ |
| Importar CSV con configuración regional (N2) | | ● | ● | ● | ● | ● | ● | ● | ● |
| Validación de datos con lista; protección sencilla (N2) | ○ | ● | ○ | ○ | | ○ | ○ | ● | ● |
| Inspeccionar documento; Comprobar accesibilidad; texto alternativo (N2) | | ● | ○ | | ○ | | ○ | ● | ○ |
| SUMAR.SI.CONJUNTO, CONTAR.SI.CONJUNTO, MAX.SI.CONJUNTO con criterios de fecha (N3) | | ● | ● | ● | ○ | ● | ● | ○ | ● |
| SI.CONJUNTO, CAMBIAR, SI.ERROR, **SI.ND** (N3) | ○ | ○ | ● | ● | ○ | ● | ● | ○ | ● |
| **Búsqueda aproximada por tramos** (BUSCARX −1, BUSCARV VERDADERO) (N3) | | | ● | | | ○ | | ○ | ● |
| INDICE + COINCIDIR (N3) | ● | | ○ | ● | | | ○ | | ○ |
| FILTRAR y ORDENARPOR (N3) | | ● | ● | ● | | ● | ○ | | ○ |
| **Tablas dinámicas**: campos de valor, % del total, agrupar fechas, campo calculado (N3) | | ● | ● | ○ | ● | ● | ● | ● | ● |
| Segmentación de datos y escala de tiempo; gráfico dinámico (N3) | | ○ | ● | | ● | | ○ | ● | ● |
| Gráfico **combinado** con eje secundario (N3) | | | ○ | | ● | | ○ | ● | |
| Limpieza: Quitar duplicados, Texto en columnas, **Relleno rápido**, VALOR.NUMERO (N3) | ● | ● | ● | ● | ● | ● | ● | | ● |
| Subtotales y esquema (N3) | | | ● | | | | ○ | | |
| Formato condicional **con fórmula** (fila entera, vencidos) (N3) | ● | ● | ● | ● | | ● | ● | ● | ● |
| Validación dependiente o con fórmula; evitar solapes (N3) | | ● | | | | | | ○ | |
| DIA.LAB, **DIAS.LAB.INTL**, DIASEM, FIN.MES, FECHA.MES, SIFECHA (N3) | | ● | ● | ● | ○ | ● | ○ | ● | ● |
| **Auditoría**: rastrear, Ventana Inspección, Evaluar fórmula, comprobación de errores (N3) | ○ | ○ | ○ | ● | ○ | ○ | ● | ○ | ○ |
| **Power Query**: carpeta, tipos con configuración regional (N4) | | ○ | ● | ● | ● | ● | ● | ● | ○ |
| Power Query: **anular dinamización**, combinar, anexar, agrupar (N4) | | ○ | ○ | ● | ● | ● | ● | ● | |
| LET; formatos personalizados (N4) | ○ | ○ | ● | | ○ | ● | ● | ○ | ○ |
| Proteger hoja, rangos y libro; permitir editar rangos (N4) | ○ | ● | ○ | ● | ○ | ● | ● | ● | ● |
| Opciones de cálculo; **vínculos entre libros** (N4) | | | | | | | ● | ○ | |
| **Consolidar** (N4) | | | | | | | ● | | |
| **Buscar objetivo**, **Administrador de escenarios**, **Tabla de datos** (N4) | ○ | | | | | ● | ● | ○ | ● |
| PAGO, PAGOINT, PAGOPRIN, PAGO.INT.ENTRE; cuadro de amortización (N4) | | | | ● | | | ● | | ○ |
| Gráficos avanzados: **cascada**, **Pareto**, histograma (N4) | | | | | ○ | ● | ● | ○ | |
| Macros grabadas (.xlsm), botón, VBA básico (N4-N5) | | | | ○ | ● | | | ○ | |
| Plantillas .xltx (N4) | | ○ | | ● | | | | | |
| **Modelo de datos, relaciones y medidas DAX**; inteligencia de tiempo (N5) | | | | | ○ | | ○ | ● | |
| AGRUPARPOR, PIVOTARPOR, APILARV, TOMAR (N5, solo 365) | | | ○ | ○ | ○ | ○ | ○ | ● | |
| LAMBDA con nombre (N5) | | | | | | | ● | ○ | |
| Cuadro de mando: indicadores, diseño, accesibilidad (N5) | | | | | ○ | | ○ | ● | |
| Hoja de previsión, PRONOSTICO.ETS (N5) | | | | | | ○ | | ○ | |
| Office Scripts o Power Automate (N5) | | | | | ○ | | | ○ | |
| IA (Copilot o chat) **con verificación** y sin datos personales (N5) | | ○ | | | ● | | ○ | ● | ● (parte A) |
| **Requisitos y preguntas previas** (N6) | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| **Perfilado de datos** (N6) | ○ | ● | ● | ● | ● | ● | ● | ● | ● |
| Controles y master check (N6) | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| Entrega, Léame, registro de cambios, mantenimiento (N6) | ● | ● | ● | ● | ● | ● | ● | ● | ○ |
| RGPD y confidencialidad (N6) | | ● | ○ | ○ | ● | | | ● | ● |
| Negociar el alcance; decir lo que no se puede hacer con los datos (N6) | ○ | ● | ● | ○ | ● | ● | ● | ● | ● |

**No cubierto por ningún proyecto (a propósito):** gráficos de embudo, proyección solar y cajas y bigotes (se practican en la lección de gráficos avanzados, con datos propios). Tampoco: copiar módulos de macros entre libros (MO-211, lección), Python en Excel (solo conocerlo, N5) y los tipos de datos vinculados.

---

## 5. Los 8 proyectos

Todas las fichas siguen el mismo orden: ficha técnica · correo · ambigüedades y aclaraciones · datos de entrada · pasos · entregables · controles numéricos · rúbrica específica · errores típicos · ampliaciones · cambio inesperado · qué va a la hoja en vivo. Encajan con el formato `proyectos/pN.json` de `GUIA-AUTORES.md` §7.

---

### P1 · Comparativa de ofertas de proveedores (Compras)

**Ficha.**
- Departamento: Compras y almacén.
- Nivel: **N1 → N2**. Es el primer proyecto: se puede hacer con apoyo al acabar el N1 y completo con el N2.
- Duración: **3-4 h** (5 h en N1 con pistas).
- Versión: cualquiera (BUSCARX es opcional; la alternativa es INDICE + COINCIDIR o BUSCARV).
- Habilidades: conversión de unidades, referencias absolutas a parámetros, SUMA, MIN, SI, CONTAR, CONTAR.BLANCO, SI.ERROR, INDICE + COINCIDIR, SUMAPRODUCTO, formato condicional con fórmula para el mínimo de cada fila, gráfico de barras, configurar página y PDF.
- Datos: **diseñados a mano y fijos** (cifras exactas abajo).

**Correo** (de Andrés Molina, jefe de compras · lunes 16/11/2026 · Asunto: «Ofertas cable y canaleta 2027»)
> Hola:
> Te paso las cuatro ofertas que nos han mandado para el pedido anual de cable, canaleta y pequeño material de 2027. Las he copiado en una hoja tal cual venían (PDF, correo y lo que me dictó por teléfono el comercial de Tormes).
> Necesito saber quién nos sale más barato y si merece la pena repartir el pedido entre dos. Cada uno lo pone a su manera, así que ojo.
> El jueves tengo reunión con Carmen y quiero llevar algo claro, de una página.
> Gracias,
> Andrés

**Ambigüedades sembradas → aclaraciones (lo que contesta Andrés)**

| Lo que la alumna debería preguntar | Respuesta |
|---|---|
| ¿«Más barato» es el precio unitario o el coste total del año? ¿Con o sin IVA? ¿Con portes y descuentos? | Coste total anual **sin IVA** (el IVA lo recuperamos), **con portes y descuentos**. El pronto pago no cuenta: pagamos siempre a 60 días. |
| ¿Qué cantidades uso? | Las de la hoja «Consumo 2027», que ha preparado el almacén. |
| ¿Cuenta solo el precio o también el plazo y la calidad? ¿Con qué peso? | Precio 60 %, plazo de entrega 25 %, calidad 15 % (nota de 1 a 5 de la hoja «Incidencias 2026»). |
| «Repartir»: ¿entre cuántos y con qué condiciones? | Como máximo **dos proveedores**, y **al menos 3.000 € al año** a cada uno. |
| La oferta de Yesa dice «válida hasta el 31/12/2026». | Yesa ha confirmado que en 2027 **sube un 3 %**. Las demás mantienen precio. |
| ¿Qué entrego y cuándo? | PDF de una página para la reunión y el Excel para mí, **el miércoles 18/11 antes de las 14:00**. |
| ¿Cuántos envíos al año hace Tormes? | 12 (uno al mes). |

**Datos de entrada** (`p1-ofertas.xlsx`)
- Hoja **«Consumo 2027»** (10 filas, limpias). Columnas: Código, Descripción, Unidad base, Cantidad anual.

| Código | Descripción | Unidad base | Cantidad 2027 |
|---|---|---|---|
| CAB-RZ1K-3G25 | Cable RZ1-K 0,6/1 kV 3G2,5 mm² | m | 18.000 |
| CAB-RZ1K-3G15 | Cable RZ1-K 0,6/1 kV 3G1,5 mm² | m | 12.000 |
| CAB-H07Z1-6 | Cable H07Z1-K 6 mm² | m | 9.000 |
| CAB-H07Z1-25 | Cable H07Z1-K 2,5 mm² | m | 30.000 |
| CAB-H07Z1-15 | Cable H07Z1-K 1,5 mm² | m | 24.000 |
| CAN-40X60 | Canaleta PVC 40×60 (tramo de 2 m) | tramo | 1.500 |
| CAN-60X100 | Canaleta PVC 60×100 (tramo de 2 m) | tramo | 800 |
| TUB-M20 | Tubo corrugado M20 (rollo de 100 m) | rollo | 600 |
| CAJ-100 | Caja de registro 100×100 | ud | 4.000 |
| BRI-200 | Bridas 200 mm (bolsa de 100) | bolsa | 2.500 |

- Hoja **«Ofertas»**: 40 filas en formato largo (Proveedor · Texto del artículo tal como lo escribe el proveedor, **sin código** · Precio ofertado · Unidad de la oferta · Observaciones) y, debajo, 4 filas de condiciones en texto libre. Precios tal como llegan:

| Código (no viene: lo pone ella) | Arnedo (€/ud. base, sin IVA) | Elecvía («PVP IVA incl.», texto con «€») | Tormes (texto con punto decimal) | Yesa (precios de 2026) |
|---|---|---|---|---|
| CAB-RZ1K-3G25 | 1,12 €/m | «128,26 €» por rollo de 100 m | «490.00» por bobina de 500 m | 1.090 €/km |
| CAB-RZ1K-3G15 | 0,78 €/m | «89,54 €» por rollo de 100 m | «345.00» por bobina de 500 m | 760 €/km |
| CAB-H07Z1-6 | 0,69 €/m | «79,86 €» por rollo de 100 m | «310.00» por bobina de 500 m | 700 €/km |
| CAB-H07Z1-25 | 0,31 €/m | «35,09 €» por rollo de 100 m | «135.00» por bobina de 500 m | 305 €/km |
| CAB-H07Z1-15 | 0,21 €/m | «23,60 €» por rollo de 100 m | «92.50» por bobina de 500 m | 205 €/km |
| CAN-40X60 | 3,95 €/tramo | «2,36 €» **por metro** | «3.90» por tramo | 3,85 €/tramo |
| CAN-60X100 | 7,60 €/tramo | «4,48 €» **por metro** | «7.55» por tramo | 7,40 €/tramo |
| TUB-M20 | 14,20 €/rollo | «16,70 €» por rollo | «consultar» | 13,90 €/rollo |
| CAJ-100 | 0,88 €/ud | «25,41 €» por **caja de 25** | «0.84» por ud | 0,86 €/ud |
| BRI-200 | 2,35 €/bolsa | «2,66 €» por bolsa | (vacío) | 2,30 €/bolsa |

  Condiciones (texto libre bajo la tabla):
  - Arnedo: «portes pagados».
  - Elecvía: «dto. 5 % si el pedido anual supera 15.000 € (base imponible) · portes 2 % del importe».
  - Tormes: «portes 90 € por envío».
  - Yesa: «portes pagados · precios válidos hasta el 31/12/2026».
- Hoja **«Incidencias 2026»**: Proveedor, Pedidos, Pedidos con incidencia, Nota de calidad (1-5), Plazo de entrega (días laborables): Arnedo 4 y 3 días · Elecvía 3 y 5 · Tormes 5 y 2 · Yesa 4 y 7.
- **Problemas sembrados:** Q15 unidades (rollo, bobina, €/km, metro de canaleta, caja de 25) y base con IVA (Elecvía) · Q05 texto con punto decimal (Tormes, 9 celdas) · Q06 «€» dentro del texto (Elecvía, 10 celdas) · Q09 vacío y «consultar» (Tormes, 2 artículos) · Q08 el mismo artículo con 4 nombres distintos y sin código · validez caducada (Yesa) · **empate exacto** en CAJ-100 (Elecvía y Tormes, 0,84 €) y **casi empate** en CAN-40X60 (Tormes 3,90; Elecvía 3,900826, que con 2 decimales se ve como 3,90).

**Pasos** (cada uno con su pista en la app)
1. **Preguntar** (respuesta abierta, 10 min). Pista: «¿Qué te haría falta para poder sumar? ¿Qué no sabes de cada oferta?».
2. **No tocar la hoja original.** Copiarla en «Normalizado». Pista: clic derecho en la pestaña > Mover o copiar > Crear una copia.
3. **Poner el código** a cada una de las 40 líneas (columna nueva) leyendo la descripción. Pista: son 40 filas; a mano está bien, pero luego compruébalo con CONTAR.SI: cada código debe salir 4 veces.
4. **Convertir los precios en números.** Quitar « €» y cambiar el punto por la coma **solo en esa columna** (seleccionar la columna > Ctrl+L). Pista: alineado a la izquierda = texto; comprueba con `=CONTAR(D2:D41)`, que debe dar 38.
5. **Hoja «Parámetros»** con nombre para cada valor: IVA 21 %, dto. Elecvía 5 %, umbral 15.000 €, portes Elecvía 2 %, portes Tormes 90 €, envíos/año 12, subida Yesa 3 %, pesos 60/25/15 %, mínimo por proveedor 3.000 €. Pista: Fórmulas > Asignar nombre, o escribir el nombre en el cuadro de nombres.
6. **Precio por unidad base, sin IVA.** Columna «Factor» (unidades base por unidad de oferta: rollo = 100, bobina = 500, km = 1.000, metro de canaleta = 0,5 tramos, caja = 25, resto = 1) y columna «Precio base»: `=Precio/Factor`, dividido entre `(1+IVA)` si lleva IVA y multiplicado por `(1+SubidaYesa)` en Yesa. Pista: escribe en lenguaje llano qué haces en cada caso antes de escribir la fórmula.
7. **Matriz Artículo × Proveedor** de precios base: 10 × 4, con SUMAR.SI.CONJUNTO por código y proveedor, o con BUSCARX sobre una clave Código&Proveedor. Pista: si sale 0 donde no hay oferta, distingue «no oferta» de «gratis» (usa `SI(CONTAR.SI.CONJUNTO(...)=0;"";...)`).
8. **Coste anual** = cantidad × precio base, con referencias mixtas (`=$D5*F5`) para copiar en las dos direcciones.
9. **Totales por proveedor**: base, descuento `=SI(Base>Umbral;-Base*Dto;0)`, portes, total. Marcar «Oferta incompleta» cuando `CONTAR.BLANCO` > 0.
10. **Más barato por artículo**: `=MIN(F5:I5)` y proveedor `=INDICE($F$4:$I$4;COINCIDIR(MIN(F5:I5);F5:I5;0))`. Formato condicional con la fórmula `=F5=MIN($F5:$I5)`. Pista: ¿qué pasa cuando hay empate? (CAJ-100).
11. **Escenario de reparto**: cables a Tormes y el resto a Elecvía. Comprobar que se mantiene el descuento de Elecvía (más de 15.000 €) y el mínimo de 3.000 € por proveedor.
12. **Puntuación ponderada** (solo proveedores con oferta completa): precio = coste mínimo/coste × 100; plazo = plazo mínimo/plazo × 100; calidad = nota/5 × 100; total = `SUMAPRODUCTO(Pesos;Puntos)`.
13. **Gráfico** de barras horizontales del coste anual por proveedor, ordenado y con etiquetas en €.
14. **Hoja «Informe»** de una página: tabla resumen, gráfico, recomendación en 3 líneas, supuestos. Disposición de página > orientación horizontal y ajustar a 1 página de ancho; encabezado «Compras · Ofertas 2027» y pie con la fecha. Exportar a PDF.
15. **Controles** y **correo de entrega**.

**Entregables:** `P1_Ofertas_2027_v01.xlsx` (Léame, Parámetros, Normalizado, Comparativa, Informe, Controles) · `P1_Ofertas_2027.pdf` (1 página) · correo a Andrés.

**Controles numéricos (exactos, calculados con `p1_calc.py`; tolerancia 0,05 € en totales si no se redondean los precios)**

| Control | Valor |
|---|---|
| Precios numéricos en la columna normalizada | **38** de 40 (Tormes no oferta TUB-M20 ni BRI-200) |
| Precio base Elecvía CAB-RZ1K-3G25 / Tormes / Yesa | 1,06 / 0,98 / 1,12270 €/m |
| Precio base Elecvía CAN-40X60 | 3,900826 €/tramo (se ve 3,90) |
| Coste base anual (sin descuentos ni portes) | Arnedo **79.990,00** · Elecvía **76.193,06** · Yesa **80.685,05** · Tormes 59.290,00 (solo 8 artículos: incompleta) |
| Elecvía: descuento / portes / total | −3.809,65 / +1.447,67 / **73.831,07** |
| Ranking de proveedor único | Elecvía 73.831,07 < Arnedo 79.990,00 < Yesa 80.685,05 |
| Reparto óptimo (máx. 2, ≥ 3.000 € cada uno; búsqueda exhaustiva) | Cables (5 artículos) a **Tormes** 44.040,00 + portes 1.080,00 = 45.120,00 · resto a **Elecvía** 28.912,07 − 1.445,60 + 549,33 = 28.015,79 · **total 73.135,79** |
| Ahorro del reparto frente a Elecvía único | **695,28 €** (0,94 %) |
| Puntuación ponderada (sobre 100) | **Arnedo 92,38** · Elecvía 84,00 · Yesa 77,62 (Tormes no puntúa: oferta incompleta) |
| Más barato por precio unitario | Tormes en los 5 cables y en CAN-40X60 (por 0,0008 €) · Elecvía en CAN-60X100, TUB-M20 y BRI-200 · **empate** Elecvía-Tormes en CAJ-100 |

Cifras que delatan cada error (sirven para `errores_tipicos` y para el mensaje de corrección):
- No quitar el IVA de Elecvía: base 92.193,60 y total 89.335,60. Elecvía pasaría a ser la más cara.
- Redondear los precios base a 2 decimales antes de multiplicar: Elecvía base 76.310,00 y total 73.944,39 (113,32 € de diferencia).
- Olvidar la subida de Yesa: 78.335,00.
- Olvidar el descuento de Elecvía: 77.716,92.
- Tomar el precio por metro de la canaleta como precio por tramo: la canaleta de Elecvía saldría por 5.887,60 en lugar de 11.775,21.

**La conclusión que se espera** (no hay una única respuesta, pero esta es la que se defiende mejor):
- Elecvía es la más barata como proveedor único.
- Repartir con Tormes ahorra solo un 0,9 % (695 €) a cambio de gestionar dos proveedores, pero Tormes tiene el mejor plazo (2 días) y la mejor calidad (5).
- Arnedo gana si se pondera el plazo y la calidad.
- Recomendación razonable: reparto Tormes + Elecvía, o Elecvía sola si se prefiere simplicidad. Decide Andrés, conociendo el ahorro y el riesgo.

**Rúbrica específica**

| Criterio | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| Exactitud | Compara precios en unidades distintas o con IVA mezclado | Normaliza las unidades, pero se le escapa el IVA, el descuento o la subida | Los 3 totales de proveedor único y la puntuación coinciden con los controles | Además, calcula el reparto óptimo y explica el empate y el casi empate |
| Estructura | Todo en una hoja y con números dentro de las fórmulas | Hoja de parámetros, pero algún valor fijo sigue en las fórmulas | Parámetros con nombre, original intacto, matriz con referencias mixtas | Además, Léame y una hoja de controles que se entiende sola |
| Automatización y mantenimiento | Cambiar un descuento obliga a rehacer fórmulas | Cambiarlo exige tocar varias celdas | Un cambio de condiciones se hace en «Parámetros» y todo se recalcula | Además, avisa solo si una oferta está incompleta o si un reparto incumple el mínimo |
| Presentación | Tabla sin formato de €; gráfico 3D o circular | Legible, pero en 2 páginas o sin ordenar | Una página: tabla, gráfico ordenado y recomendación | Además, mínimos resaltados de forma accesible (color y negrita o símbolo) y supuestos al pie |
| Comunicación | Entrega sin preguntar ni explicar | Pregunta solo por el IVA | Pregunta por el criterio, las cantidades, el reparto y la validez | El correo plantea la decisión (ahorro frente a simplicidad y plazo) y deja que decida Andrés |

**Errores típicos:**
- Comparar «128,26» con «1,12» (unidades distintas).
- Reemplazar el punto por la coma en **toda la hoja** (rompe códigos como «CAB-…» o fechas).
- Escribir 15000 o 1,21 dentro de la fórmula.
- Formato condicional sin el $ mixto (resalta el mínimo de toda la tabla, no el de cada fila).
- Recomendar Tormes sin ver que no oferta dos artículos.
- Promediar precios unitarios en lugar de calcular el coste anual.
- Combinar celdas en la matriz.
- Redondear antes de multiplicar.

**Ampliaciones** (para subir de nivel)
- **Buscar objetivo** (N4): ¿qué descuento tendría que ofrecer Arnedo para igualar a Elecvía? → **7,70 %**.
- **Umbral de envíos** de Tormes: el reparto compensa hasta **19 envíos al año**; con 20 ya no (19,73 es el punto de equilibrio). Se puede hacer como Tabla de datos de una variable (envíos de 6 a 24).
- Reparto con matriz de asignación y validación de datos (lista de proveedores por artículo).

**Cambio inesperado** (viernes): Elecvía mejora la oferta: «dto. **7 %** si el pedido supera **20.000 €**». Con un libro bien parametrizado basta con cambiar 2 celdas.
- Elecvía único pasa a **72.276,73 €**. El reparto queda en 72.545,99 € (el resto de Elecvía, 28.912,07 €, también supera 20.000 € y lleva el 7 %).
- **La recomendación cambia**: ahora conviene Elecvía sola. La búsqueda exhaustiva lo confirma.
- Se evalúa si la alumna avisa a Andrés de que la conclusión ha cambiado.

**Hoja en vivo / .xlsx.**
- **En vivo:** pasos 6-12 con hojas pequeñas (un artículo y cuatro proveedores): normalizar un precio, coste anual con referencias mixtas, descuento con SI, MIN e INDICE + COINCIDIR, SUMAPRODUCTO.
- **.xlsx:** limpieza de la hoja «Ofertas», formato condicional, gráfico, configuración de página y PDF.

---

### P2 · Vacaciones, ausencias y plantilla (RRHH)

**Ficha.**
- Departamento: Recursos Humanos.
- Nivel: **N2** (→ N3 por la validación con fórmula y los solapes).
- Duración: **5-7 h**.
- Versión: Microsoft 365 o 2021+ para SECUENCIA y FILTRAR, con alternativa clásica (columnas auxiliares). La protección y la validación funcionan también en Excel para la web. La validación está en Datos > Validación de datos. La protección está en Revisar > Administrar protección (con «Rangos desbloqueados» y contraseñas), y no en Revisar > Proteger hoja como en el escritorio. Algunas opciones solo se cambian en Excel para Windows, como las protecciones puestas antes desde los cuadros Formato de celdas o Formato condicional [VERIFICADO: https://support.microsoft.com/es-es/office/proteger-una-hoja-de-c%C3%A1lculo-3179efdb-1285-4d49-a9c3-f4ca36276de6 y https://support.microsoft.com/es-es/office/aplicar-la-validaci%C3%B3n-de-datos-a-celdas-29fecbcc-d1b9-42c1-9d76-eff3ce5f7249].
- Habilidades: limpieza de un maestro (texto, fechas, equivalencias), Tablas, DIAS.LAB.INTL con festivos por delegación, prorrateo con MULTIPLO.SUPERIOR, CONTAR.SI.CONJUNTO con fechas, cuadrante con formato condicional, validación con fórmula (sin solapes), protección, tabla dinámica de absentismo, recuento de plantilla y rotación, **RGPD** (datos de salud).

**Correo** (de Lucía Fernández, responsable de RRHH · 16/11/2026 · Asunto: «Vacaciones (socorro)»)
> Hola:
> Este año las vacaciones han sido un caos: cada responsable lleva su Excel y no hay manera de saber cuántos días le quedan a cada uno. Quiero un archivo único para lo que queda de 2026 que sirva también para 2027. Que me diga los días que le quedan a cada persona, que avise si en un departamento se van demasiados a la vez y que los responsables puedan apuntar las vacaciones de su gente sin estropearlo.
> Te paso la exportación del programa de nóminas, los Excel de los cuatro responsables y el listado de ausencias. Aprovecha y sácame también las bajas por departamento, que Carmen me pide el absentismo para el comité.
> Lo necesito antes del puente de diciembre.
> Lucía

**Ambigüedades → aclaraciones**

| Pregunta | Respuesta de Lucía |
|---|---|
| ¿Cuántos días de vacaciones hay y se cuentan como naturales o laborables? | Por convenio de la empresa, **22 días laborables** (lunes a viernes, sin festivos) por año completo. [DISEÑO; el mínimo legal son 30 días naturales, ET art. 38.1 VERIFICADO. Que 22 laborables «equivalen» a 30 naturales no es una regla del ET para la empresa privada; depende del convenio [NO VERIFICABLE: no enseñarlo como dato]. Los 22 días hábiles (sin contar los sábados) son la regla de los funcionarios, EBEP art. 50.1 [VERIFICADO: https://www.boe.es/buscar/act.php?id=BOE-A-2015-11719]] |
| ¿Qué pasa con quien entró o salió durante el año? | Se calcula **en proporción a los días naturales de alta** y se redondea **al medio día superior**. |
| ¿Se arrastran días de 2025? | No, salvo quien no pudo disfrutarlos por una baja: hay un caso (E0031, con 6 días reconocidos). Así lo prevé el ET 38.3: hasta 18 meses después de terminar el año [VERIFICADO]. |
| ¿Qué es «demasiados a la vez»? | Administración: como máximo 2 personas a la vez. Comercial de Zaragoza: 2. Almacén: el 25 % de su plantilla. Dirección: sin límite. |
| ¿Qué festivos uso? Cada delegación está en una comunidad distinta. | Los de la hoja «Festivos» de la gestoría (nacionales, autonómicos y 2 locales por delegación). «Creo que la de Lleida tiene algún fallo»: hay que comprobarlos en el BOE y en el boletín autonómico. |
| Un periodo que empieza en diciembre y acaba en enero, ¿de qué año descuenta? | Cada día descuenta del año al que pertenece. |
| ¿Qué es absentismo para el comité? ¿Por persona? ¿Quién lo ve? | Días laborables de **IT (enfermedad común y accidente)** entre los días laborables teóricos de la plantilla de ese mes. Los permisos retribuidos van aparte y **no** son absentismo en este informe. **Solo agregado por departamento y mes, sin nombres.** El archivo de bajas lo ve solo RRHH. |
| «Antes del puente»: ¿qué día? | El viernes **04/12/2026**. |
| ¿Cómo lo van a abrir los responsables? | Desde Teams o SharePoint: unos en el navegador y otros en escritorio. |

**Datos de entrada**

| Archivo | Filas | Columnas y tipos | Problemas sembrados (cantidad exacta) |
|---|---|---|---|
| `nomina_empleados.csv` (`;`, UTF-8) | **62** = 58 personas + 1 recontratación (misma persona y mismo NIF, 2 contratos) + 2 duplicadas exactas + 1 fila «Total empleados: 61» | CodEmpleado (texto «E0012»), NIF, ApellidosNombre («GARCÍA LÓPEZ, ana»), Departamento, Delegación, FechaAlta, FechaBaja (vacía si está activa), Jornada, Puesto | Q01 ×2 · Q10 ×1 · Q13: 9 códigos sin el prefijo («12») · Q04: dobles espacios en 14 nombres · Q08: Departamento en 6 grafías («Almacén», «almacen», «ALMACÉN », «Almacén y Logística», «Admón.», «Administración») y Delegación «Zgz» ×3 · Q07: FechaAlta en dd/mm/aaaa (40), ISO aaaa-mm-dd (15) y dd-mm-aa (5) · Q06: Jornada «100», «50%», «0,75» |
| `vacaciones_responsables.xlsx`, 4 hojas | unas 120 líneas en total | **Administración**: cuadrícula de calendario, con personas en filas, días en columnas y «V» en los días de vacaciones (formato ancho). **Comercial**: Nombre (sin código, «Ana G.»), Desde, Hasta, Días (calculados a mano). **Almacén**: igual que Comercial, con subtotales. **Dirección**: texto libre | Q12 (cuadrícula) · Q16: nombres sin código y abreviados · Comercial: 6 «Días» mal calculados a mano · Almacén: Q10 «Total Juan: 15» ×7 y celdas combinadas (Q11) · Q17: 1 Hasta < Desde y 1 año «2062» · Tipo en 4 grafías («Vac.», «vacaciones», «V», «AP» = asuntos propios, que no descuentan vacaciones) · Dirección: Q21 «del 3 al 21 de agosto» |
| `ausencias_2026.csv` | unas 140 | CodEmpleado, Tipo (IT_EC, IT_AT, PR_MAT, PR_FALL, PR_ENF, PR_TRAS, PNR), Desde, Hasta (vacía si sigue abierta), DíasNaturales, **Observaciones** | **Q20: 11 observaciones con información de salud** («lumbalgia», «ansiedad»…) que hay que borrar · 3 bajas abiertas (Hasta vacía → hasta la fecha de corte 31/10/2026) · 2 permisos con duración incoherente con el ET 37.3 (matrimonio de 20 días, traslado de 3) |
| `festivos_2026.xlsx` (de la gestoría) | unas 40 | Fecha, Descripción, Ámbito (Nacional, Aragón, Navarra, Cataluña, Local Zaragoza, Local Pamplona, Local Lleida) | **1 fecha errónea** (el generador elige cuál y lo deja en el log) y **1 festivo autonómico que falta**. La verdad sale del BOE y del boletín autonómico en el momento de generar los datos [VERIFICADO: fiestas nacionales y autonómicas de 2026, Resolución de 17/10/2025 (BOE-A-2025-21667, BOE de 28/10/2025): https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-21667; de 2027, Resolución de 8/10/2026 (BOE-A-2026-21254, BOE de 13/10/2026): https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-21254. Las 2 fiestas locales de Zaragoza, Pamplona y Lleida no vienen en el BOE: se sacan del boletín de cada comunidad] |

**Pasos**
1. **Preguntas y plan.** Incluye la decisión de cumplimiento: **dos archivos**.
   - `Vacaciones_2026-2027.xlsx`, compartido con los responsables: solo vacaciones y asuntos propios.
   - `Absentismo_2026_RRHH.xlsx`, solo para RRHH: IT y permisos, **sin observaciones**.
   La razón: los datos de salud son una categoría especial (RGPD art. 9.1) y deben reducirse a lo necesario (art. 5.1.c) [VERIFICADO].
2. **Maestro limpio** (Tabla `Empleados`).
   - Código: `="E"&TEXTO(VALOR(SUSTITUIR(A2;"E";""));"0000")`.
   - Apellidos y nombre: Texto en columnas con «,» (o TEXTOANTES y TEXTODESPUES), después ESPACIOS y NOMPROPIO.
   - Departamento: tabla `Equivalencias` + BUSCARX.
   - Fechas: Texto en columnas con formato DMA o AMD según el bloque, y control con ESNUMERO.
   - Jornada: número entre 0 y 1.
   - Quitar duplicados y la fila del total; mantener los 2 contratos de la recontratación.
   - **Control: 58 personas únicas por NIF.**
3. **Parámetros**: año, fecha de corte (31/10/2026), días de convenio (22), límites por departamento, tabla `Festivos` con columna Delegación («Todas» para los nacionales).
4. **Tabla `Periodos`** (una fila por periodo): CodEmpleado, Nombre y Departamento con BUSCARX, Tipo (validación con lista: Vacaciones o Asuntos propios), Desde, Hasta y días laborables:
   `=DIAS.LAB.INTL([@Desde];[@Hasta];1;festivos_de_su_delegación)`.
   - En Microsoft 365, el último argumento puede ser `FILTRAR(Festivos[Fecha];(Festivos[Delegación]=[@Delegación])+(Festivos[Delegación]="Todas"))` [VERIFICADO: https://support.microsoft.com/es-es/office/funci%C3%B3n-dias-lab-intl-a9b26239-4f20-46a1-9ab8-4e925bfd5e28. El argumento de festivos admite un rango «o una constante de matriz», no solo rangos, así que acepta la matriz que devuelve FILTRAR. Esa matriz no se desborda en la hoja: la usa DIAS.LAB.INTL por dentro. Si FILTRAR no encontrara ninguna fecha daría #CALC!, por eso tienen que existir las filas «Todas». Probarlo con un caso conocido antes de darlo por bueno. Alternativa segura: tres rangos con nombre, FestZGZ, FestPAM y FestLLE, elegidos con SI o CAMBIAR].
   - **Periodo que cruza el año**: `DIAS.LAB.INTL(MAX([@Desde];FECHA(Año;1;1));MIN([@Hasta];FECHA(Año;12;31));1;…)`.
   - Administración: transcribir los periodos de la cuadrícula (unas 24 filas) y **comprobar** que el nº de «V» de cada persona (`CONTAR.SI(fila;"V")`) coincide con la suma de sus días.
5. **Saldos** (Tabla `Saldos`).
   - Días de alta en el año: `=MIN(SI(ESBLANCO(Baja);FECHA(Año;12;31);Baja);FECHA(Año;12;31))-MAX(Alta;FECHA(Año;1;1))+1`.
   - Derecho: `=MULTIPLO.SUPERIOR(22*DíasAlta/365;0,5)`.
   - Saldo = derecho + arrastre − disfrutados (Hasta ≤ hoy) − planificados.
   - Formato condicional: saldo < 0 en rojo; saldo > 5 a 1 de diciembre en ámbar.
   - Cuidado: a tiempo parcial con jornada reducida **todos los días**, los días de vacaciones son los mismos; no se multiplica por la jornada (en el pago sí cuenta) [VERIFICADO: https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430#a12 (ET art. 12.4.d: las personas a tiempo parcial «tendrán los mismos derechos» que a tiempo completo, y solo se reconocen de forma proporcional «cuando corresponda en atención a su naturaleza»; art. 38.1: nunca menos de 30 días naturales). Si el convenio cuenta las vacaciones en días laborables y la persona trabaja menos días a la semana, confirmarlo con la gestoría].
6. **Cuadrante.**
   - Selector de mes (validación con los 14 meses, de noviembre de 2026 a diciembre de 2027).
   - Fila de fechas con `=SECUENCIA(1;DIA(FIN.MES(Mes;0));Mes)`.
   - Filas de personas ordenadas por departamento.
   - En cada celda: `=SI(CONTAR.SI.CONJUNTO(Periodos[Cod];$A6;Periodos[Desde];"<="&H$4;Periodos[Hasta];">="&H$4)>0;"V";"")`.
   - Formato condicional: fines de semana en gris (`DIASEM(H$4;2)>5`), festivos (`CONTAR.SI(Festivos[Fecha];H$4)>0`) y «V» en verde con la letra visible (accesible: no depende solo del color).
   - Fila de recuento por departamento y alerta si supera su límite.
   - Inmovilizar paneles e imprimir títulos.
7. **Validación en `Periodos`** (rangos normales, no referencias estructuradas: en el cuadro de la validación de datos no se puede escribir `Tabla[Columna]` directamente [NO VERIFICABLE: Microsoft no lo documenta, solo aparece en foros; no enseñarlo como dato, sino como costumbre: usar rangos normales o un nombre definido]): Desde ≤ Hasta, dentro de 2026-2027 y **sin solape** con otro periodo de la misma persona: `=CONTAR.SI.CONJUNTO($A:$A;$A2;$F:$F;"<="&$G2;$G:$G;">="&$F2)=1`.
8. **Protección.**
   - Desbloquear solo las columnas de entrada de `Periodos` (Formato de celdas > Proteger > quitar «Bloqueada»).
   - Revisar > Proteger hoja (permitir ordenar y usar Autofiltro).
   - Proteger libro (estructura).
   - **Ojo:** en una hoja protegida la Tabla no crece al escribir debajo. Por eso se deja la Tabla dimensionada con filas vacías (por ejemplo, 300) o se deja `Periodos` sin proteger pero con validación [NO VERIFICABLE: Microsoft no lo documenta; lo cuentan usuarios de Excel de escritorio en foros (Tech Community, MrExcel) y no hay fuente para Excel para la web. No enseñarlo como dato: que lo compruebe en su propio archivo antes de entregarlo].
9. **Absentismo** (en el archivo de RRHH).
   - Borrar «Observaciones».
   - Hasta efectiva: `=SI(ESBLANCO(Hasta);Corte;Hasta)`.
   - Días laborables de cada ausencia **en cada mes**: `=MAX(0;DIAS.LAB.INTL(MAX(Desde;InicioMes);MIN(HastaEf;FinMes);1;Fest))`, en columnas por mes.
   - Teórico del mes = activos a mitad de mes × días laborables del mes.
   - Tasa = IT / teórico.
   - Tabla dinámica Departamento × Mes y gráfico de líneas.
   - Permisos: control frente al ET 37.3 (marcar los 2 incoherentes para revisarlos, no corregirlos).
10. **Plantilla** a 31/10/2026.
    - Activos: `=CONTAR.SI.CONJUNTO(Emp[Alta];"<="&Corte;Emp[Baja];"")+CONTAR.SI.CONJUNTO(Emp[Alta];"<="&Corte;Emp[Baja];">"&Corte)` por departamento.
    - FTE con SUMAR.SI.CONJUNTO de la jornada.
    - Altas y bajas de 2026.
    - Rotación = bajas / plantilla media.
    - Antigüedad media con `SIFECHA(Alta;Corte;"Y")` o FRAC.AÑO.
11. **Controles** (abajo).
12. **Cierre.**
    - Archivo > Información > Inspeccionar documento.
    - Revisar > Comprobar accesibilidad.
    - Guardar en la carpeta de RRHH con permisos.
    - Léame para responsables (5 líneas: cómo apuntar, qué no tocar, a quién llamar).
    - Correo a Lucía.

**Entregables:** los 2 archivos · instrucciones para los responsables · tabla de absentismo (PDF agregado para Carmen) · correo.

**Controles numéricos** (el generador los garantiza; las cifras de € y días las calcula con pandas)
- Filas brutas del maestro: 62. Personas únicas: **58**. Activas a 31/10/2026: **55**. Suma de activas por departamento = 55.
- Observaciones con datos de salud borradas: **11**. Columnas de salud en el archivo compartido: **0**.
- **Doble cálculo**: Σ DíasLab de `Periodos` de cada persona = nº de «V» en su fila del cuadrante (en todos los meses). Total de la empresa: los dos métodos dan lo mismo.
- Cuadrícula de Administración: Σ «V» = Σ días transcritos.
- Periodos con Hasta < Desde: 0. Solapes: 0. Saldos negativos sin explicar: 0.
- Absentismo: Σ días de IT por departamento = Σ días de IT total; la tasa de la empresa se calcula con los totales (no es la media de las tasas de los departamentos).
- Ejemplos de verificación (exactos):
  - Alta el 01/03/2026: 306 días de alta → 22 × 306/365 = 18,44 → **18,5 días**.
  - Baja el 15/06/2026: 166 días → 10,005 → **10,5 días**. Al redondear hacia arriba al medio día, 10,005 pasa a 10,5.
  - Del 03/08/2026 al 21/08/2026: **15** días laborables (el 15/08 cae en sábado).
  - Del 21/12/2026 al 08/01/2027 con los festivos nacionales 25/12, 01/01 y 06/01: **12** laborables = **8** en 2026 + **4** en 2027.

**Rúbrica específica**

| Criterio | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| Exactitud | Saldos con días naturales o sin festivos | Laborables bien, pero el prorrateo o el cruce de año fallan | Los dos métodos de recuento coinciden; prorrateo y festivos por delegación correctos | Además, detecta el festivo erróneo y el que falta, los permisos incoherentes y los días mal calculados a mano |
| Estructura | Una hoja por responsable, como estaba | Un archivo único, pero sin Tablas ni parámetros | Maestro, Periodos, Saldos, Cuadrante, Parámetros y Controles | Además, equivalencias y festivos como tablas que se mantienen solas, y un Léame para responsables |
| Automatización y mantenimiento | Para 2027 hay que rehacerlo | Sirve para 2027 cambiando muchas celdas | Cambiando el año y los festivos sirve para 2027; el cuadrante se mueve con el selector de mes | Además, la validación impide solapes y fechas fuera del año, y la protección deja trabajar a los responsables |
| Presentación | Cuadrante ilegible o solo con colores | Legible, pero sin fines de semana ni festivos marcados | Cuadrante claro, se imprime con títulos y las alertas de departamento son visibles | Además, accesible (letra «V» y no solo color) y PDF de absentismo de una página |
| Comunicación | Mezcla bajas y vacaciones en el archivo de todos | Separa los archivos, pero sin explicarlo | Explica por qué hay dos archivos (RGPD) y qué definición de absentismo usa | Además, propone el procedimiento («los responsables solo apuntan; RRHH valida») y avisa de los festivos erróneos |

**Errores típicos:**
- Contar días naturales.
- DIAS.LAB sin festivos o con los de otra comunidad.
- Restar Hasta − Desde sin el +1.
- Multiplicar el derecho por la jornada.
- Quitar con «Quitar duplicados» la recontratación (son 2 contratos).
- Dejar los diagnósticos en el archivo compartido.
- Calcular la tasa de absentismo como media de las tasas.
- Validación con referencias estructuradas (no funciona).
- Proteger la hoja y que la Tabla no crezca.
- No cortar el periodo que cruza el año.

**Ampliaciones:**
- **Power Query** para pasar la cuadrícula de Administración a periodos (Anular dinamización + Agrupar por).
- Desplegable dependiente Departamento → Empleado, con `FILTRAR` en una celda auxiliar y una referencia desbordada `=$X$2#` como origen de la validación (solo 365) [NO VERIFICABLE en fuentes de Microsoft: lo explican guías de terceros (Excel University, Ablebits); no enseñarlo como dato, probarlo en su Excel].
- Control de jornada (ET 34.9 [VERIFICADO]): horas como fracción del día, horas extra mensuales.
- Validar la letra del DNI con `RESIDUO(número;23)` y EXTRAE de la cadena «TRWAGMYFPDXBNJZSQVHLCKE».

**Cambio inesperado:**
- Entra una persona en Lleida el 01/12/2026, con jornada del 50 %.
- La gestoría manda el calendario de 2027 con 2 festivos locales nuevos.
- Lucía pide que «asuntos propios» también se vean en el cuadrante, con otra letra.
- Solución con un libro bien hecho: una fila en `Empleados`, filas en `Festivos` y una regla de formato.

**Hoja en vivo / .xlsx.**
- **En vivo:** DIAS.LAB.INTL con festivos, prorrateo con MULTIPLO.SUPERIOR, el cruce de año con MAX y MIN, días de alta con SI y ESBLANCO, CONTAR.SI.CONJUNTO de un día dentro de un periodo, SIFECHA.
- **.xlsx:** limpieza, cuadrante con formato condicional, validación, protección, tabla dinámica de absentismo.

---

### P3 · Facturas, cobros y antigüedad de saldos (Administración)

**Ficha.**
- Departamento: Administración y finanzas.
- Nivel: **N3**.
- Duración: **6-8 h**.
- Versión: cualquiera para el núcleo; Power Query es recomendable (2016+ en Windows); PIVOTARPOR, solo en 365.
- Habilidades: importar CSV (UTF-8, configuración regional), limpieza, cruzar con el maestro, aplicar cobros (directos, agrupados, parciales, devoluciones y a cuenta), días vencidos, **tramos con búsqueda aproximada**, tabla dinámica con segmentaciones, top 10, formato condicional, riesgo frente a límite, **Ley 3/2004**, periodo medio de cobro (PMC), subtotales para el auditor.
- Base real: MO-220 «Create accounts receivable … aging reports», «calculate bad debt expense» [VERIFICADO].

**Correo** (de Marta Ruiz, directora financiera · viernes 13/11/2026 · Asunto: «Lo que nos deben»)
> Hola:
> El martes tengo comité y quiero llevar cuánto nos deben los clientes a cierre de octubre, desde cuándo y quiénes me preocupan. Te adjunto el listado de facturas que saca el ERP y el de cobros de contabilidad.
> Paco lo hacía a mano y tardaba dos días; a ver si lo dejas montado para que el mes que viene sea cosa de una hora.
> Y que se vea lo de los 60 días, que el auditor nos dio un toque.
> Marta

**Ambigüedades → aclaraciones**

| Pregunta | Respuesta de Marta |
|---|---|
| «Cierre de octubre»: ¿cuentan los cobros de noviembre que ya han llegado? | No. Foto a **31/10/2026**. |
| «Desde cuándo»: ¿desde la fecha de factura o desde el vencimiento? ¿Qué tramos? | Desde el **vencimiento**: No vencido · 1-30 · 31-60 · 61-90 · 91-180 · más de 180 días. Para el auditor, también los días desde la factura. |
| «Lo que nos deben»: ¿con IVA? ¿Y los abonos, los cobros sin identificar, los saldos a favor? | Con IVA. Los abonos restan a su cliente. Los cobros sin identificar van en una línea aparte, «Cobros pendientes de aplicar» (cuenta 555). Los saldos a favor, en una lista aparte. |
| «Me preocupan»: ¿con qué criterio? | El **top 10 por importe vencido a más de 60 días** y **todos los que superan su límite de riesgo**. |
| «Lo de los 60 días»: ¿qué quiere ver? | Los clientes con **condiciones pactadas de más de 60 días**, que la Ley 3/2004 no permite (art. 4.3) [VERIFICADO], y el **PMC**. |
| ¿Con qué cuadro? | Con el saldo de la **cuenta 430 a 31/10/2026** que da contabilidad (dato en «Parámetros»). |
| ¿Formato? | Una página en PDF para el comité y el Excel con el detalle para Administración. |

**Datos de entrada**

| Archivo | Filas | Columnas | Problemas sembrados |
|---|---|---|---|
| `facturas_emitidas.csv` (UTF-8 con tildes y «ñ»: si se abre con doble clic en un equipo mal configurado salen «Logro�o» y «Peñaflor» rotos) | **2.651** brutas = 2.636 facturas (unas 2.560 de 2026 y 76 de 2025 todavía pendientes) + 14 duplicadas + 1 «TOTAL GENERAL» | NumFactura (texto «F26-000123»; rectificativas «R26-000012», en negativo), FechaFactura, CodCliente, NombreCliente, BaseImponible, TipoIVA, CuotaIVA, **TotalFactura (exportada con punto decimal, «1234.56»)**, FormaPago (texto), FechaVencimiento | Q19 · Q01 ×14 (el 01/07 y el 02/07 exportados dos veces) · Q10 ×1 · Q04: CodCliente con espacios al final ×37 · Q16: 3 facturas con «C0O45» (O en vez de cero) · Q05: TotalFactura con punto (todas) · Q17: 5 facturas con Total ≠ Base + Cuota (4 por ±0,01 de redondeo, que se toleran, y **1 por 100,00 €**, que hay que comunicar) · Q09: FechaVencimiento vacía ×120 (se calcula con FormaPago) · Q07: 1 tanda de 90 fechas ISO · **Q03**: 6 facturas a un cliente de Portugal con **IVA 0 %** (operación intracomunitaria: no es un error) |
| `cobros_2026.csv` | unas **2.420** | FechaCobro, CodCliente (vacío ×35), Importe, NumFactura (vacío ×140), Concepto (texto del banco), Medio (Transferencia, Recibo, Confirming, Cheque), Remesa | Q21: **60 cobros agrupados** (2 a 4 facturas citadas en el Concepto, como «TRANSF. ELECTRICIDAD ARNAL SL FRAS F26-001245 F26-001301»): 55 cubren exactamente lo citado y 5 son parciales · Q14: **18 devoluciones de recibo** en negativo · 25 facturas con cobro parcial · **9 cobros a cuenta** sin factura (→ 555) |
| `clientes.xlsx` | 320 | CodCliente, Nombre, NIF, Provincia, Delegación, CodComercial, DiasPago, LimiteRiesgo, Estado | Q16: 2 clientes nuevos que no están · **7 clientes con DiasPago de 75 o 90** · 1 cliente bloqueado con facturas nuevas |

**Objetivos de calibración para el generador** [DISEÑO]:
- Pendiente total a 31/10/2026, con IVA: entre 1,85 y 1,95 M€.
- Reparto por tramos, aproximado: No vencido 60 % · 1-30 17 % · 31-60 9 % · 61-90 6 % · 91-180 5 % · más de 180 3 %.
- 4 clientes por encima de su límite.
- 1 cliente con saldo a favor (abono sin compensar).
- **Saldo 430 = Σ pendiente de las facturas − Σ cobros a cuenta sin aplicar** (identidad exacta).

**Pasos** (sin pista detallada; la ayuda se abre con el botón)
1. Preguntas. Carpeta del mes `Clientes/2026-10/` con los originales intactos.
2. **Importar** con Datos > Obtener y transformar datos > De texto/CSV (Origen 65001: Unicode (UTF-8), delimitador punto y coma) > Transformar datos.
   - TotalFactura con Cambiar tipo > Usar configuración regional > Inglés (Estados Unidos).
   - Quitar la última fila. Recortar CodCliente. Quitar duplicados por NumFactura (antes, comprobar que las 14 son idénticas en todas las columnas).
   - Sin Power Query (N3): Texto en columnas, `VALOR.NUMERO(F2;".";",")`, ESPACIOS, Quitar duplicados.
3. **Calidad de los datos**:
   - columna `Total − (Base + Cuota)` con tolerancia de 0,01;
   - cliente sin pareja: `=BUSCARX([@CodCliente];Clientes[CodCliente];Clientes[Nombre];"HUÉRFANO")`;
   - C0O45 → C0045, con el visto bueno de Marta y anotado en «Calidad de datos».
4. **Vencimiento** vacío = FechaFactura + días de la tabla `FormasPago` («Transferencia 60 días» → 60; «Contado» → 0).
5. **Aplicar cobros.**
   - (a) Directos: `=SUMAR.SI.CONJUNTO(Cobros[Importe];Cobros[NumFactura];[@NumFactura];Cobros[FechaCobro];"<="&Corte)`. Incluye las devoluciones, que restan.
   - (b) Agrupados: tabla `Aplicaciones` (IdCobro, NumFactura, Importe) con las referencias extraídas del concepto (Relleno rápido, HALLAR o EXTRAE; en 365, `REGEXEXTRACCION(Concepto;"F2[56]-\d{6}";1)` [VERIFICADO: https://support.microsoft.com/es-ES/Excel/functions/regexextract-function — el tercer argumento (return_mode) a 1 devuelve «todas las cadenas que coincidan con el patrón como una matriz»; 0, el valor predeterminado, devuelve solo la primera, y 2 los grupos de captura. Ojo: la propia ayuda en español escribe el nombre de tres formas (REGEXEXTRACCION, REGEXEXTRAE, REGEXEXTRACT); que escriba `=REGEX` y elija la función en la lista]). Regla: el cobro cubre lo citado y, si no llega, se aplica primero a la factura más antigua.
   - (c) A cuenta: a la línea 555.
6. **Pendiente** = Total − Cobrado. Estado: Cobrada, Parcial, Pendiente o Saldo a favor.
7. **Días y tramo.**
   - DíasVencidos = Corte − Vencimiento.
   - Tramo: `=SI([@DíasVencidos]<=0;"0 No vencido";BUSCARX([@DíasVencidos];Tramos[Desde];Tramos[Tramo];;-1))`, con `Tramos[Desde]` = 1, 31, 61, 91 y 181.
   - Alternativa compatible: `BUSCARV(...;Tramos;2;VERDADERO)`. Es **el único uso correcto de VERDADERO** y exige la tabla ordenada de menor a mayor.
   - Etiquetas con prefijo («1 · 1-30») para que se ordenen bien en la tabla dinámica.
8. **Informe de antigüedad.**
   - Tabla dinámica: Cliente en filas, Tramo en columnas, Σ Pendiente; % del total.
   - Segmentación por Delegación y por Comercial.
   - Filtro de valor top 10 sobre el vencido a más de 60 días.
   - Gráfico de columnas apiladas por tramo.
   - En 365, alternativa con `PIVOTARPOR(Datos[Cliente];Datos[Tramo];Datos[Pendiente];SUMA)`.
9. **Riesgo**: saldo por cliente frente a LimiteRiesgo. `FILTRAR` y `ORDENARPOR` para la lista de excesos.
10. **Ley 3/2004**: `FILTRAR(Clientes;Clientes[DiasPago]>60)` y facturas con (Vencimiento − FechaFactura) > 60.
    **PMC aproximado** = saldo pendiente a 31/10 / facturación con IVA de agosto a octubre × 92. Se explica que hay varias definiciones y cuál se ha usado.
11. **Para el auditor**: listado de pendientes ordenado por cliente con Datos > Esquema > Subtotal (suma de Pendiente por cliente), con el esquema contraído al nivel 2.
12. Controles, informe de una página y correo. Léame: «Cómo actualizar en noviembre» (sustituir los CSV, Actualizar todo con Ctrl+Alt+F5, cambiar la fecha de corte, revisar los cobros agrupados nuevos).

**Controles** (identidades; las cifras las da pandas)
1. Facturas limpias = 2.651 − 14 − 1 = **2.636**.
2. Σ Total = Σ Base + Σ Cuota, con una diferencia de 100,00 € ± 0,04 (las 5 anomalías). Si sale una diferencia de miles o millones, TotalFactura se ha importado mal (el punto se ha leído como separador de miles).
3. Σ pendiente por tramos (total de la tabla dinámica) = Σ pendiente del detalle.
4. Σ Total de facturas − Σ cobros aplicados a factura = Σ pendiente.
5. **Σ pendiente − Σ cobros a cuenta = saldo 430** de «Parámetros» (diferencia 0,00).
6. Clientes sin pareja tras corregir = 0. Clientes nuevos dados de alta en el maestro = 2.
7. Clientes con más de 60 días pactados = **7**. Por encima del límite = **4**.

**Rúbrica específica**

| Criterio | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| Exactitud | No cuadra con la 430 o suma los duplicados | Cuadra en total, pero los tramos o los cobros agrupados están mal | Los 7 controles cuadran; devoluciones y abonos bien tratados | Además, documenta la factura con 100 € de diferencia y el cliente bloqueado que sigue facturando |
| Estructura | Copias de datos pegados a mano | Detalle y resumen separados, pero con la fecha de corte escrita dentro de las fórmulas | Tablas de Tramos, FormasPago y Aplicaciones; parámetros | Además, hoja «Calidad de datos» y Léame mensual |
| Automatización y mantenimiento | El mes siguiente se repite todo | Hay que pegar los datos y ampliar rangos | Sustituir los CSV y Actualizar todo; los tramos se cambian en una tabla | Además, un control avisa de cobros agrupados nuevos o de clientes sin pareja |
| Presentación | Listado de 2.600 filas como informe | Tabla dinámica sin ordenar los tramos | Una página: total, tramos, top 10, excesos de riesgo y gráfico | Además, semáforo accesible y títulos con la fecha de corte dinámica |
| Comunicación | Solo cifras | Cifras con algún comentario | 3 mensajes («el 14 % está vencido a más de 60 días…»), Ley 3/2004 y supuestos | Además, propone acciones (reclamar, bloquear, renegociar plazos) y explica el PMC usado |

**Errores típicos:**
- Contar los días desde la factura en lugar de desde el vencimiento.
- BUSCARV aproximada con la tabla de tramos desordenada.
- Sumar los duplicados del 1 y 2 de julio.
- Que se pierdan las devoluciones de recibos, que reabren la factura.
- Tratar el IVA 0 % intracomunitario como un error.
- Quitar duplicados por cliente (borra facturas legítimas).
- Escribir 31/10/2026 dentro de las fórmulas.
- PMC calculado con la facturación sin IVA frente a un saldo con IVA.
- Calcular el % vencido como media de los porcentajes de cada cliente.

**Ampliaciones:**
- **Deterioro de clientes** (MO-220, «bad debt expense»): porcentaje por tramo, en la cuenta 694 contra la 490 [VERIFICADO local: PGC].
  - La regla fiscal del IS para que el deterioro sea deducible (más de 6 meses desde el vencimiento) es la del art. 13.1.a de la LIS [VERIFICADO: https://www.boe.es/buscar/act.php?id=BOE-A-2014-12328#a13 — «que haya transcurrido el plazo de 6 meses desde el vencimiento de la obligación» en el momento del devengo del impuesto; también valen el concurso del deudor, su procesamiento por alzamiento de bienes o la reclamación judicial. Ojo: el mismo artículo excluye las «estimaciones globales del riesgo de insolvencias» (un porcentaje por tramo como el de arriba); solo las empresas de reducida dimensión pueden deducir una dotación global de hasta el 1 por ciento de los deudores al cierre (art. 104 LIS)].
- **Carta de reclamación** con los intereses de demora de la Ley 3/2004 (art. 7: tipo del BCE + 8 puntos; el tipo de cada semestre lo publica el BOE: es un dato de entrada) y los 40 € del art. 8 [VERIFICADO].
- Power Query: «Dividir columna por delimitador» en filas para los cobros agrupados.

**Cambio inesperado** (cierre de noviembre):
- Llega una forma de pago nueva, «Pagaré 120 días» (¡ilegal: es más de 60!), y un cliente nuevo.
- Marta pide un tramo «más de 365».
- Con un libro bien hecho: una fila en `FormasPago`, una en `Tramos` y un aviso en el correo sobre el plazo ilegal.

**Hoja en vivo / .xlsx.**
- **En vivo:** VALOR.NUMERO, vencimiento con la tabla de días, SUMAR.SI.CONJUNTO con fecha de corte, tramos con BUSCARX −1 o BUSCARV VERDADERO, SI.CONJUNTO, PMC.
- **.xlsx:** importación, tabla dinámica, segmentaciones, subtotales, gráfico.

---

### P4 · Conciliación bancaria mensual (Finanzas)

**Ficha.**
- Departamento: Administración y finanzas (tesorería).
- Nivel: **N3** con fórmulas → **N4** con Power Query.
- Duración: **5-7 h**.
- Versión: cualquiera.
- Habilidades: limpiar la descarga del banco, unificar signos (Debe/Haber), **emparejar** por importe y fecha con nº de ocurrencia, remesas (de muchos a uno), partidas de meses anteriores, estado de conciliación, propuesta de asiento, plantilla mensual (.xltx), formato condicional de lo que queda sin pareja, PAGOINT para separar la cuota del préstamo.
- Base real: MO-220 «Prepare bank reconciliations»: «identify outstanding checks and deposits in transit», «Use Conditional Formatting to identify reconciling items», «Calculate adjusted cash balances» [VERIFICADO].
- **Las cifras de las partidas están diseñadas a mano** y comprobadas con `p4_calc.py`.

**Correo** (de Marta Ruiz · 16/11/2026 · Asunto: «Conciliación banco octubre»)
> Hola:
> El saldo del banco a 31 de octubre no me cuadra con el de contabilidad y en enero viene el auditor. ¿Me haces la conciliación de octubre? Y, ya puestos, déjala como plantilla para hacerla cada mes.
> Te paso el extracto que he descargado de la web del banco y el mayor de la cuenta.
> Marta

**Ambigüedades → aclaraciones**

| Pregunta | Respuesta |
|---|---|
| ¿Qué cuenta? El extracto trae dos hojas. | La del **Banco Norte, cuenta 572000001**. La segunda hoja (Banco Sur, pólizas) no entra. |
| ¿Septiembre quedó conciliado? | Sí. Quedaron **2 partidas pendientes** (hoja «Pendientes septiembre»). |
| ¿Qué margen de fechas acepto para dar por buena una pareja? | ±5 días naturales. |
| ¿Contabilizo yo los ajustes? | No: tú **propones el asiento** y contabilidad lo registra. |
| ¿Se tolera alguna diferencia? | No: debe quedar en **0,00 €**. |
| ¿Formato? | El modelo del auditor: saldo del banco → partidas → saldo ajustado; saldo de libros → partidas → saldo ajustado; los dos iguales. |

**Datos de entrada**
- `extracto_banco_norte_2026-10.xlsx` (descarga de banca online):
  - Hoja «Movimientos»: 6 filas de cabecera (titular, IBAN ficticio como texto, «Movimientos del 01/10/2026 al 31/10/2026», «Saldo inicial: 84.215,37») y la tabla: F. Operación, F. Valor, Concepto, Importe (con signo: los cargos en negativo), Saldo, Referencia. Unos **185 movimientos**.
  - Hoja «Movimientos (2)»: la otra cuenta (trampa).
  - Problemas: Q11, Q07 (10 fechas como texto), Q21, **Q03** (importes repetidos legítimos: 121,00 € ×4, 605,00 € ×3, 48,40 € ×5).
- `mayor_572000001_2026-10.xlsx` (contabilidad): Fecha, Asiento, Concepto, Debe, Haber, Saldo. Unos **200 apuntes** (Q14: Debe/Haber en dos columnas; en la 572, el Debe es entrada de dinero).
- `pendientes_septiembre.xlsx`: 2 partidas.
- Opcional (ampliación N4): el mismo extracto en **Norma 43** (`.txt` de ancho fijo).
- Saldos:
  - banco 30/09 = **84.215,37** · banco 31/10 = **61.482,19**;
  - libros 30/09 = **84.985,37** · libros 31/10 = **61.924,13**.
  - Movimiento neto de octubre: banco −22.733,18 · libros −23.061,24 (cifras que el generador debe respetar al crear los movimientos que sí casan).

**Partidas diseñadas** (todo lo demás casa uno a uno o en remesa)

| # | Partida | Dónde está | Importe | Tratamiento |
|---|---|---|---|---|
| S1 | Cheque nº 1187 a proveedor, contabilizado el 28/09 y cargado por el banco el 06/10 | Banco (oct.) y pendientes de septiembre | −2.350,00 | Casa con la partida de septiembre, **no con el mayor de octubre** |
| S2 | Transferencia de cliente contabilizada el 30/09 y abonada por el banco el 01/10 | Banco (oct.) y pendientes de septiembre | +3.120,00 | Ídem |
| A1 | Cheque nº 1203 emitido el 29/10, sin cobrar | Solo libros | −4.812,50 | Pago pendiente: resta al saldo del banco |
| A2 | Transferencia a proveedor del 30/10, que el banco ejecuta el 02/11 | Solo libros | −7.260,00 | Ídem |
| A3 | Cobro de cliente contabilizado el 31/10 que llega el 03/11 | Solo libros | +5.445,00 | Ingreso en tránsito: suma al saldo del banco |
| B1 | Comisión de mantenimiento del 31/10 | Solo banco | −45,00 | Ajuste en libros (626) |
| B2 | 5 comisiones de transferencia (12,40 · 12,40 · 15,10 · 9,80 · 14,20) | Solo banco | −63,90 | Ajuste (626) |
| B3 | **Cuota del préstamo** (85.000 € al 5 % TIN, 48 cuotas, la n.º 19), cargada el **lunes 26/10** con fecha valor del domingo 25/10 | Solo banco | −1.957,49 | Ajuste: intereses **229,56** (662) + capital **1.727,93** (deudas con entidades de crédito: 520 o 170 según el plazo) → `PAGOINT(5%/12;19;48;-85000)` y `PAGOPRIN(...)` |
| B4 | Devolución de recibo de un cliente (C0087) | Solo banco | −2.420,00 | Ajuste: vuelve a 430 (deuda del cliente) |
| B5 | Gastos de la devolución | Solo banco | −6,05 | Ajuste (626) |
| B6 | Transferencia recibida el 31/10 sin identificar | Solo banco | +1.089,00 | Ajuste a 555 «Partidas pendientes de aplicación» hasta identificarla |
| E1 | Cobro de cliente **contabilizado dos veces** (asientos 2026/3871 y 2026/3872) | Libros (duplicado) | +3.630,00 de más | Error contable: anular un asiento |
| E2 | Pago a proveedor contabilizado por **1.548,00** cuando el banco cargó **1.584,00** (transposición) | Libros | 36,00 de más en libros | Error contable: corregir el asiento |
| R1 | **Remesa** de 23 recibos: el banco abona una sola línea «REMESA R-2610» por **18.430,20**; libros tienen 23 cobros con la referencia R-2610 | Los dos | 18.430,20 | Casa de muchos a uno: `SUMAR.SI(Libros[Concepto];"*R-2610*";Libros[Importe])` |

**Estado de conciliación esperado** (exacto)

| Lado banco | € | Lado libros | € |
|---|---|---|---|
| Saldo según banco a 31/10 | 61.482,19 | Saldo según libros a 31/10 | 61.924,13 |
| + Ingresos en tránsito (A3) | +5.445,00 | − Cargos del banco sin contabilizar (B1+B2+B3+B4+B5) | −4.492,44 |
| − Pagos pendientes de cargo (A1+A2) | −12.072,50 | + Abonos del banco sin contabilizar (B6) | +1.089,00 |
| | | − Cobro duplicado (E1) | −3.630,00 |
| | | − Error de transposición (E2) | −36,00 |
| **Saldo bancario ajustado** | **54.854,69** | **Saldo contable ajustado** | **54.854,69** |

Diferencia: **0,00**. Partidas netas del banco sin contabilizar: −3.403,44.
Asiento propuesto:
- 626 Servicios bancarios: 114,95 (45,00 + 63,90 + 6,05)
- 662 Intereses de deudas: 229,56
- 520/170 Deudas con entidades de crédito: 1.727,93
- 430 Clientes: 2.420,00
- contra 572: 4.492,44
- y 572 contra 555: 1.089,00
- más la anulación del duplicado y la corrección de la transposición.

**Pasos**
1. Preguntas. Copia de los originales.
2. **Banco**: quitar las 6 filas de cabecera (en Power Query, Quitar filas superiores + Usar la primera fila como encabezado) y convertir las fechas. **Control**: saldo inicial + Σ importes = saldo final (84.215,37 − 22.733,18 = 61.482,19), y cada fila de «Saldo» = la anterior + su importe (detecta filas perdidas).
3. **Libros**: Importe = Debe − Haber (entradas en positivo). **Control**: 84.985,37 + Σ = 61.924,13.
4. **Tabla única de partidas** de los dos lados con columna Origen (Banco, Libros o Pendiente de septiembre), para que el resto del trabajo sea homogéneo.
5. **Clave de emparejamiento**:
   - `Importe&"|"&CONTAR.SI($E$2:E2;E2)` (importe + nº de ocurrencia) en cada lado, con el rango que crece al copiar hacia abajo;
   - después BUSCARX de la clave en el otro lado, con control de fecha (|diferencia| ≤ 5 días).
   - Alternativa (N4): Power Query, columna de índice por grupo de importe y **Combinar consultas**, con «Externa completa» para ver las dos caras y «Anti izquierda» para lo que no casa [VERIFICADO: https://support.microsoft.com/es-es/Excel/merge-queries-power-query («Combinar consultas», en la pestaña Inicio del Editor de Power Query; tipo «Externa completa») y https://learn.microsoft.com/es-es/power-query/merge-queries-left-anti («En la sección Tipo de combinación, seleccione Anti izquierda»)].
6. **Remesas y otros de muchos a uno**: agrupar libros por referencia de remesa (SUMAR.SI con comodín o Agrupar por) y emparejar el total.
7. **Partidas de septiembre**: emparejarlas antes que el resto (S1 y S2).
8. **Lo que queda sin pareja**: formato condicional y clasificación en A (libros), B (banco) o E (error), con columna «Tratamiento».
9. **Estado de conciliación** con fórmulas (SUMAR.SI.CONJUNTO por tipo de partida) y **control: diferencia = 0,00**.
10. **Propuesta de asiento** y hoja «Pendientes octubre», que serán los «pendientes» de noviembre.
11. **Plantilla**: Archivo > Guardar como > Plantilla de Excel (.xltx), con la hoja de pendientes que se arrastra y un Léame de 8 pasos. Proteger las fórmulas y dejar desbloqueadas solo las zonas de pegado.

**Controles**
- Banco: 84.215,37 + Σ = 61.482,19.
- Libros: 84.985,37 + Σ = 61.924,13.
- Emparejadas + pendientes = total de movimientos de cada lado.
- Saldos ajustados iguales: **54.854,69**.
- Filas sin pareja exacta tras emparejar: **banco 11** (B1, las 5 de B2, B3, B4, B5, B6 y el cargo de 1.584,00 de E2) · **libros 5** (A1, A2, A3, el segundo asiento de E1 y el apunte de 1.548,00 de E2). E2 se resuelve como «pareja con diferencia» de 36,00.
- PAGOINT del mes = 229,56; PAGO = 1.957,49.

**Rúbrica específica**

| Criterio | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| Exactitud | Diferencia distinta de 0 sin explicar | 0,00 forzado con una «partida de ajuste» sin justificar | 0,00 con todas las partidas identificadas y clasificadas | Además, detecta el duplicado y la transposición y separa intereses y capital de la cuota |
| Estructura | Puntear a mano con colores | Hojas separadas, pero casando a ojo | Tabla de partidas, clave con ocurrencia, estado con fórmulas | Además, hoja de pendientes que se arrastra y asiento propuesto con cuentas del PGC |
| Automatización y mantenimiento | Hay que rehacerla | Se reutiliza copiando hojas | Plantilla .xltx: se pegan banco y mayor y sale el estado | Además, Power Query lee la descarga tal cual y avisa si los saldos inicial y final no encadenan con el mes anterior |
| Presentación | Listados sin estado | Estado sin formato estándar | Estado del auditor en una página, legible | Además, partidas agrupadas y explicadas en una línea cada una |
| Comunicación | «Ya cuadra» | Lista de partidas sin explicar | Correo con el estado, las 3 causas principales y el asiento | Además, propone mejoras de proceso (cobros identificados con referencia, contabilizar las comisiones cada mes) |

**Errores típicos:**
- Usar la hoja de la otra cuenta.
- Emparejar solo por importe (los 121,00 € repetidos).
- No arrastrar las partidas de septiembre, que salen como «sin pareja».
- Signo invertido entre Debe/Haber y cargo/abono.
- Casar la remesa línea a línea.
- Cuadrar con una partida «varios».
- Escribir el saldo inicial a mano en una fórmula.
- Confundir la fecha valor con la fecha de operación (la cuota «del 25» se carga el 26).

**Ampliaciones:**
- **Norma 43** con Power Query: dividir por posiciones (fecha de operación en las posiciones 11-16 con formato AAMMDD, clave Debe/Haber en la 28, importe en las 29-42 con 2 decimales implícitos) [VERIFICADO local: Cuaderno 43]. Se usa también el concepto común (17 = intereses y comisiones, 14 = devoluciones) para clasificar solo.
- **Cuadro de amortización** completo del préstamo (48 cuotas) con PAGO, PAGOINT y PAGOPRIN, y control: Σ capital = 85.000,00.

**Cambio inesperado:** en noviembre el banco cobra la comisión trimestral (–180,00) y el cliente de B6 resulta ser C0112, que paga la factura F26-002214. Se comprueba que las partidas de octubre casan en noviembre y que la de 555 se reclasifica.

**Hoja en vivo / .xlsx.**
- **En vivo:** clave con CONTAR.SI que crece, BUSCARX con si_no_se_encuentra, diferencia de fechas, estado de conciliación con SUMAR.SI.CONJUNTO, PAGO, PAGOINT y PAGOPRIN.
- **.xlsx:** descarga real, formato condicional, plantilla, Power Query.

---

### P5 · Informe mensual de ventas automatizado (Comercial)

**Ficha.**
- Departamento: Comercial.
- Nivel: **N4**.
- Duración: **8-10 h**, más 1 h del cambio inesperado.
- Versión: Microsoft 365 o 2016+ en Windows (Power Query). En Mac, Power Query existe, pero con conectores limitados [VERIFICADO en `excel-moderno.md` §0.13]. Del conector de carpeta en Mac, Microsoft solo anunció (julio de 2024, canal Beta, versión 16.86) que se pueden **actualizar** consultas «Desde carpeta» ya creadas [NO VERIFICABLE: crear una consulta nueva desde carpeta en Mac; no enseñarlo como dato, este proyecto se hace en Windows].
- Habilidades: Power Query desde carpeta, tipos con configuración regional, archivos con esquema distinto, Combinar y Anexar consultas, Anular dinamización, tablas dinámicas con «Mostrar valores como», campo calculado, segmentaciones conectadas y escala de tiempo, gráfico combinado con eje secundario, minigráficos, Pareto de clientes, dos versiones de salida (confidencialidad), «Actualizar todo», macro grabada opcional.
- Base real: «Excel avanzado» de las ofertas de analista y prueba práctica con tabla dinámica, segmentación y gráfico (`curriculo.md` §3.2).

**Correo** (de Javier Ortega, director comercial · 16/11/2026 · Asunto: «El informe de ventas de cada mes»)
> Hola:
> Cada mes pierdo un día entero montando el informe para la reunión de comerciales: copiar, pegar, cuadrar… Te he dejado en la carpeta compartida los archivos que saca el ERP de enero a octubre y los maestros.
> Quiero ver cómo vamos por delegación, comercial, familia y cliente, comparado con el año pasado y con el objetivo, y que el mes que viene solo tenga que darle a un botón. Y que salga el margen, que algunos venden muy barato.
> La reunión es el 25.
> Javier

**Ambigüedades → aclaraciones**

| Pregunta | Respuesta de Javier |
|---|---|
| «Ventas»: ¿base sin IVA, neta de devoluciones? ¿Y los portes y el «DTO. PRONTO PAGO»? | Venta neta = ImporteNeto sin IVA; las devoluciones restan. Los portes van en la familia «Portes y servicios». El pronto pago va a «Ajustes»: no cuenta para los comerciales y sí para el total de la empresa. |
| ¿Contra el año pasado en qué nivel? ¿Mes o acumulado? | Mes y acumulado, **solo por delegación y familia**: es lo único que hay de 2025 (`ventas_2025_resumen.xlsx`). Por comercial, contra el objetivo. |
| ¿Dónde están los objetivos? | `objetivos_2026.xlsx`, por comercial y mes. |
| ¿Margen sobre qué coste? | Desde **julio**, el CosteUnitario de la línea. Antes, el CosteEstandar del maestro. |
| ¿Quién ve el informe? | **Dos salidas**: «Reunión» (sin margen por comercial) y «Dirección» (completa). |
| ¿«Un botón»? ¿Qué Excel tienen? | Basta «Actualizar todo». Microsoft 365 en Windows. |
| ¿Y los códigos que no están en el maestro? | Lista para que Compras los dé de alta; mientras, familia «Sin clasificar». |

**Datos de entrada** (carpeta `Ventas/ERP/` y `Ventas/Maestros/`)

| Archivo | Filas | Columnas | Problemas sembrados |
|---|---|---|---|
| `ventas_2026_01.csv` … `ventas_2026_10.csv` | unas 1.100-1.300 por mes, **unas 12.000** en total | Fecha; NumAlbaran; NumFactura; CodCliente; CodProducto (texto de 6 dígitos); Descripcion; Cantidad; PrecioUnitario; DtoLinea; ImporteNeto; Delegacion; CodComercial. **Desde julio, además CosteUnitario** | Q18: columna nueva desde julio · Q19: **marzo exportado con `,` como separador y `.` decimal** (otro PC) · Q11: **mayo con una línea de título** antes de los encabezados · Q13: **agosto con CodProducto sin ceros** (el archivo se abrió y guardó en Excel) · Q08: Delegación en 6 grafías («Zaragoza», «ZARAGOZA», «Zgz», «Pamplona/Iruña», «Lleida», «Lérida») · Q14: devoluciones con Cantidad negativa · Q16: **7 códigos de producto que no están en el maestro** (alrededor del 1,2 % de la venta) · líneas «PORTES» y «DTO. PRONTO PAGO» |
| `control_erp.xlsx` | 10 | Mes, NºLíneas, Σ ImporteNeto (el ERP lo da al cerrar cada mes) | Ninguno: es la **verdad** para cuadrar |
| `productos.xlsx` | unas 1.800 | CodProducto (texto), Descripción, Familia (Cable, Iluminación, Mecanismos, Protección, Canalización, Herramienta), Subfamilia, CosteEstandar, Proveedor | Faltan los 7 de Q16 |
| `comerciales.xlsx` | 12 | CodComercial, Nombre, Delegación, FechaAlta, FechaBaja | 1 comercial de baja en mayo |
| `objetivos_2026.xlsx` | 12 × 12 | Comercial en filas, meses en columnas | Q12 |
| `ventas_2025_resumen.xlsx` | 3 delegaciones × 6 familias | Delegación, Familia, Ene…Dic | Q12 · «Lérida» |

**Calibración** [DISEÑO]:
- Ventas netas de enero a octubre de 2026: alrededor de **7,9 M€**; mismo periodo de 2025: alrededor de 7,43 M€ (**+6,5 %**).
- Margen bruto: alrededor del **27,5 %** (2 comerciales por debajo del 22 %).
- Estacionalidad: agosto a la baja (unos −35 %).
- Lleida crece más que el resto; Pamplona, por debajo del objetivo.

**Pasos** (sin pistas detalladas)
1. Preguntas; versión de Excel; estructura de carpetas (ERP, Maestros, Informe) y regla de «una carpeta solo para los CSV» (Microsoft: entra todo lo que haya en la carpeta y en sus subcarpetas [VERIFICADO]).
2. **Datos > Obtener datos > Del archivo > De la carpeta > Transformar datos > Combinar archivos** [VERIFICADO].
   - Revisar el archivo de ejemplo y la consulta de función.
   - Comprobar que la columna nueva de julio queda vacía (null) en los meses anteriores: Power Query casa por nombre de columna [VERIFICADO].
3. **Los dos archivos rebeldes.** Marzo (separador `,`) y mayo (título) rompen la combinación. Dos caminos, los dos válidos si se documentan:
   - (a) pedir al ERP que los vuelva a exportar bien (lo profesional);
   - (b) consultas aparte con su delimitador y su configuración regional, añadidas con **Anexar consultas**.
   Lo que se evalúa es que se **detecten con el control** y no a ojo.
4. **Tipos con configuración regional**: Cambiar tipo > Usar configuración regional > Español (España), y Inglés (Estados Unidos) para marzo.
5. **Limpieza.**
   - Recortar y poner en mayúsculas la Delegación y combinarla con la tabla `MapaDelegaciones`.
   - CodProducto a 6 dígitos (columna personalizada `Text.PadStart(Text.From([CodProducto]), 6, "0")`; se da hecha: es la única línea de M que se pide escribir).
6. **Combinar consultas** con Productos y con Comerciales (externa izquierda).
   - Lista de huérfanos con «Anti izquierda».
   - Familia «Sin clasificar» con «Reemplazar valores» de null.
7. **Coste y margen**: `Coste = (si CosteUnitario es null, CosteEstandar; si no, CosteUnitario) × Cantidad` con una columna condicional. Margen = ImporteNeto − Coste.
8. **Anular dinamización** de objetivos y de 2025 → tablas largas (Mes como fecha del día 1).
   - Hecho de comparación: **Anexar** 2026 (resumido por Delegación, Familia y Mes) + 2025 (Año = 2025) + Objetivos (Tipo = «Objetivo»). Así una sola tabla dinámica compara años y objetivos.
9. **Tablas dinámicas**:
   - (a) Delegación × Mes con Año en columnas y «Mostrar valores como > % de diferencia de» (campo base Año, elemento 2025);
   - (b) Comercial × Mes real frente a objetivo, con % de cumplimiento;
   - (c) Familia con **campo calculado** Margen % = Margen / Ventas (es correcto porque opera sobre las sumas);
   - (d) top 20 clientes y **Pareto** (% acumulado).
10. **Segmentaciones** de Delegación y Familia conectadas a todas las tablas dinámicas (pestaña Segmentación > Conexiones de informe) y **escala de tiempo** por mes [VERIFICADO: https://support.microsoft.com/es-es/Excel/get-started/use-slicers-to-filter-data].
11. **Gráficos.**
    - **Combinado**: columnas de 2026 frente a 2025 y línea de % de variación en el **eje secundario**.
    - Barras de cumplimiento por comercial con una línea en el 100 %.
    - **Minigráficos** de 10 meses por comercial.
12. **Salidas.**
    - «Reunión»: sin margen por comercial.
    - «Dirección»: completa.
    - Título dinámico: `="Ventas acumuladas a "&TEXTO(MAX(Ventas[Fecha]);"mmmm \d\e aaaa")` [CORREGIDO: https://support.microsoft.com/es-es/office/revisar-las-directrices-para-personalizar-un-formato-de-n%C3%BAmero-c0a1d1fa-d3f4-4018-96b7-9c9354dd99f5 — la barra invertida protege un solo carácter, así que va delante de cada letra (`\d\e`), o el texto se pone entre comillas, que dentro de una fórmula se escriben dobles: `"mmmm ""de"" aaaa"`; alternativa: dos celdas].
13. **Controles**:
    - por mes, Σ ImporteNeto y nº de líneas frente a `control_erp` (diferencia 0,00 y 0);
    - Σ de cada tabla dinámica = Σ de la tabla;
    - % sin clasificar;
    - huérfanos listados.
14. **Léame** («Cómo hacer el informe de noviembre»):
    - copiar el CSV en `ERP/`;
    - Datos > Actualizar todo (Ctrl+Alt+F5 [VERIFICADO en es-referencia]);
    - mirar la hoja Controles;
    - exportar «Reunión» a PDF.
15. Opcional: **macro grabada** «ExportarReunion» (Actualizar todo + exportar PDF), guardada en .xlsm y asignada a un botón; o un Office Script (Automatizar > Grabar acciones).
16. **IA con verificación**: pedir a Copilot (o al chat autorizado por la empresa) que explique en llano la consulta M generada. Anotar en el Léame qué se comprobó. No pegar datos de clientes en herramientas no autorizadas (AEPD, octubre de 2026: usar solo asistentes autorizados [VERIFICADO en `excel-moderno.md` §0.20]).
17. Correo con 3 conclusiones y los límites («con 2025 solo hay detalle por delegación y familia»).

**Controles** (identidades + cifras de pandas)
- Por cada mes: Σ ImporteNeto = `control_erp` (**10 de 10** meses, diferencia 0,00).
  - Si marzo sale con 1 columna o con importes multiplicados por 100, está mal importado.
  - Si mayo tiene una línea de menos o encabezados raros, también.
- Nº total de líneas = Σ de `control_erp`.
- Σ por delegación = Σ total; Σ por familia (incluidas «Sin clasificar», «Portes y servicios» y «Ajustes») = Σ total.
- Códigos huérfanos = **7**; tras darlos de alta en el maestro, «Sin clasificar» = 0,00.
- Margen total = Σ (ImporteNeto − Coste).
- Prueba de mantenimiento: al añadir noviembre, enero-octubre **no cambian**.

**Rúbrica específica**

| Criterio | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| Exactitud | No cuadra con el ERP, o marzo y mayo están mal sin que se vea | Cuadra en total, pero el margen usa un solo coste o las devoluciones suman | Cuadran los 10 meses; margen con el coste correcto en cada periodo; huérfanos tratados | Además, explica el efecto del cambio de coste en julio y el peso del pronto pago |
| Estructura | Copias pegadas de cada mes | Power Query, pero con pasos frágiles (por posición de columna) | Consultas por nombre, maestros y mapas en tablas, hecho de comparación anexado | Además, consultas con nombres claros, agrupadas y documentadas en el Léame |
| Automatización y mantenimiento | Cada mes a mano | Hay que tocar las consultas cada mes | Copiar el CSV y Actualizar todo; controles en verde | Además, el cambio de esquema de noviembre se resuelve en menos de 30 min y queda anotado en el registro de cambios |
| Presentación | Tablas dinámicas en crudo | Gráficos sin jerarquía o 3D | Dos salidas limpias, gráfico combinado, minigráficos, segmentaciones | Además, títulos dinámicos y una página por audiencia |
| Comunicación | Sin conclusiones | Describe los datos («Lleida sube») | 3 conclusiones con cifra y causa probable | Además, separa lo que sabe de lo que no (no hay detalle de 2025 por comercial) y propone vigilar a los 2 comerciales con margen bajo |

**Errores típicos:**
- Combinar archivos con la carpeta llena de otras cosas.
- Pasos por posición de columna (se rompen en julio).
- Tipos sin configuración regional (fechas mm/dd, importes ×100).
- Media de márgenes por comercial en lugar de Σ margen / Σ ventas.
- Comparar con 2025 por comercial, cuando no hay datos.
- Contar el pronto pago en las ventas del comercial.
- Repartir el informe con márgenes a todo el equipo.
- No conectar las segmentaciones.
- Gráfico combinado con el % en el eje principal.

**Ampliaciones:**
- **Modelo de datos** (relaciones Ventas → Productos, Clientes y Calendario) en lugar de combinaciones (puente hacia P8).
- Gráfico de **proyección solar** Familia > Subfamilia.
- `AGRUPARPOR` o `PIVOTARPOR` (365) como informe con fórmulas frente a la tabla dinámica.
- Comisiones por tramos de cumplimiento (ver la reserva R1).

**Cambio inesperado** (diciembre): llega `ventas_2026_11.csv` con:
- la columna **«Importe Neto»** (con espacio) en lugar de «ImporteNeto»;
- la delegación nueva **«Logroño»**, que no está en el mapa;
- 2 comerciales nuevos sin objetivo.

La actualización falla con un error de Power Query del tipo «No se encontró la columna '…' de la tabla» [VERIFICADO: https://support.microsoft.com/es-es/Excel/rename-a-column-power-query]. Solución: paso de renombrado tolerante o pedir al ERP que mantenga el nombre; añadir Logroño al mapa y los objetivos; anotar el cambio. Javier recibe un aviso de que Logroño no tiene comparación con 2025.

**Hoja en vivo / .xlsx.**
- **En vivo:** % de cumplimiento y variación interanual con SI.ERROR, margen % de totales frente a media de porcentajes (ejercicio «predice»), Pareto con % acumulado, coste de la línea con SI(ESBLANCO(...)).
- **.xlsx:** todo lo demás.

---

### P6 · Stock, punto de pedido y clasificación ABC (Operaciones)

**Ficha.**
- Departamento: Compras y almacén.
- Nivel: **N4**.
- Duración: **8-10 h**.
- Versión: 365 o 2021+ (LET, FILTRAR, ORDENAR), con alternativas clásicas.
- Habilidades: movimientos con signo según el tipo, falsos duplicados (el mismo artículo en dos ubicaciones), solapes de exportación, Agrupar por, demanda semanal **incluidas las semanas a cero**, DESVEST.M, **INV.NORM.ESTAND**, RAIZ, stock de seguridad, punto de pedido, revisión periódica, MULTIPLO.SUPERIOR, LET, ABC con % acumulado y SI.CONJUNTO, gráfico de Pareto, MAX.SI.CONJUNTO (última salida), **Tabla de datos** y **Administrador de escenarios**, hoja de propuesta de pedido con FILTRAR.

**Correo** (de Andrés Molina · 17/11/2026 · Asunto: «El almacén»)
> Hola:
> Nos estamos quedando sin lo que más se vende y tenemos el almacén lleno de cosas que no salen. Quiero una hoja que cada lunes me diga qué tengo que pedir y cuánto, y qué artículos están muertos.
> Te paso el inventario que hicimos el 30 de abril, los movimientos de mayo a octubre y las fichas de proveedores.
> Andrés

**Ambigüedades → aclaraciones**

| Pregunta | Respuesta |
|---|---|
| ¿«Lo que más se vende» en unidades o en euros? | En euros (consumo × coste). A = hasta el **80 %** acumulado, B = hasta el **95 %**, C = el resto. |
| ¿Cuántas roturas de stock aceptamos? | Nivel de servicio del **95 %** para A y B y del **90 %** para C. |
| ¿Plazos de entrega en días naturales o laborables? ¿Son fiables? | **Laborables**, los de la ficha. Son reales. |
| ¿Cuenta lo pedido y aún no recibido? | Sí: **posición = stock + pendiente de recibir**. |
| ¿Qué es un artículo «muerto»? | **Sin salidas en los últimos 90 días naturales** (antes del 02/08/2026) y con stock. Quiero el valor inmovilizado y la lista para negociar devoluciones. |
| ¿Lotes mínimos y múltiplos? | En la ficha. |
| ¿Cada cuánto se pide? | **Cada lunes**: revisión semanal, R = 5 días laborables. |
| ¿Nos podemos fiar del inventario de abril? | El 31/10 se recontaron 10 artículos (hoja «Recuento 31-10»). |

**Datos de entrada**

| Archivo | Filas | Columnas | Problemas |
|---|---|---|---|
| `inventario_2026-04-30.xlsx` | **196** = 180 artículos, **16 de ellos en dos ubicaciones** | CodArticulo (texto «000731»), Descripción, Ubicación («A-01-03»), Unidad (ud, m, rollo, caja), StockContado (los metros llevan decimales) | **Q03**: las 16 repeticiones son legítimas y hay que **sumarlas**, no quitarlas · Q13: 22 códigos como número (731) |
| `movimientos_2026-05_10.csv` | unas **9.400** | Fecha, Tipo, CodArticulo, Cantidad, Documento, Línea, Almacén, Usuario | Tipos: ENT (compra), SAL (venta), DEV (devolución de cliente), DPR (devolución a proveedor), REG+ y REG− (regularización), TRA (traspaso, dos líneas ± con neto 0) · Q08: «SAL», «Salida», «salida » · **Q22: el 31/07 sale dos veces** (extracciones de julio y agosto): **63 filas duplicadas** por Documento + Línea · Q05: «12.5» como texto en cable · Q07 · Q14: 40 SAL en negativo y el resto en positivo |
| `fichas_articulos.xlsx` | 177 | CodArticulo, Proveedor, PlazoEntrega (días laborables), LoteMinimo, Multiplo, CosteUnitario, PendienteRecibir, FechaPrevista | Q16: **3 artículos sin ficha** · Q09: PlazoEntrega vacío ×5 (→ el del proveedor) |
| `recuento_2026-10-31.xlsx` | 10 | CodArticulo, StockFísico | **8 cuadran**; 2 no: LED-0412, −3 ud (rotura conocida), y un cable, −12,5 m (recorte) |

**Calibración** [DISEÑO]:
- Valor del stock a 31/10: alrededor de **1,45 M€**.
- Reparto ABC: unos 36 A, 54 B y 90 C (cerca de 20/30/50).
- **12 artículos muertos**, que suman alrededor del 7 % del valor.
- **2 artículos en negativo** si no se arreglan los códigos sin ceros (prueba de Q13).
- Alrededor de 25 artículos para pedir el lunes 16/11.

**Pasos** (solo hitos)
1. Glosario con las definiciones pactadas (stock, posición, consumo, SS, ROP, cobertura, rotación, ABC) en el Léame.
2. **Power Query** de movimientos:
   - tipos de datos;
   - tabla `TiposMovimiento` (Tipo normalizado → Signo +1 o −1; «es consumo» sí o no);
   - quitar duplicados por Documento + Línea (comprobar que son **63** y que todos son del 31/07);
   - `CantidadFirmada = Number.Abs([Cantidad]) * [Signo]`.
3. **Inventario**: código a texto de 6 dígitos y **Agrupar por** CodArticulo (suma) → 180.
4. **Stock a 31/10** = inventario + Σ CantidadFirmada. Control: Σ TRA = 0; ningún stock negativo.
5. **Demanda semanal** (SAL − DEV) por artículo y semana ISO (`ISO.NUM.DE.SEMANA` o la semana en Power Query): matriz de **26 semanas completas** (de la 19, que empieza el lunes 04/05/2026, a la 44, que acaba el viernes 30/10; la semana 18 solo tiene el viernes 01/05, que es festivo nacional y no se usa) **con ceros** en las semanas sin ventas (tabla dinámica con «Mostrar elementos sin datos» o cruzando con `SECUENCIA`).
6. **Parámetros por artículo** (con LET):
   ```
   =LET(d;Consumo/DiasLab; sd;DESVEST.M(semanas)/RAIZ(5); L;Plazo; z;INV.NORM.ESTAND(Nivel);
        SS;REDONDEAR.MAS(z*sd*RAIZ(L);0); ROP;d*L+SS; S;ROP+d*5; Pos;Stock+Pendiente;
        SI(Pos<=ROP;MAX(LoteMin;MULTIPLO.SUPERIOR(S-Pos;Multiplo));0))
   ```
   Cobertura (días) = Stock / d. Rotación = consumo anualizado / stock medio.
7. **ABC**: consumo valorado anualizado → ORDENAR de mayor a menor → % acumulado → `SI.CONJUNTO(Acum<=80%;"A";Acum<=95%;"B";VERDADERO;"C")`. Gráfico de **Pareto** (Insertar > Insertar gráfico estadístico > Histograma > Pareto) [CORREGIDO: https://support.microsoft.com/es-es/office/crear-un-diagrama-de-pareto-a1512496-6dba-4743-9ab1-df5012972856].
8. **Muertos**: `ÚltimaSalida = MAX.SI.CONJUNTO(Mov[Fecha];Mov[Cod];[@Cod];Mov[TipoN];"SAL")`. Si da 0, no ha tenido salidas en todo el periodo. Muerto si `Corte − ÚltimaSalida > 90` y Stock > 0. Valor inmovilizado.
9. **Hoja «Lunes»**: `ORDENAR(FILTRAR(Propuesta;Propuesta[Cantidad]>0);col_proveedor)` con cantidades, coste y total por proveedor, lista para enviar.
10. **Qué pasaría si**:
    - **Tabla de datos** de una variable: valor total del stock de seguridad con un nivel de servicio del 90, 95, 97,5 y 99 %;
    - **escenario** «Tormes retrasa 5 días» (L + 5 en sus artículos) → artículos que entran en pedido y coste.
11. **Controles**, Léame y correo.

**Ejemplo resuelto** (exacto, para la lección y para el ejercicio `formula`):
- Datos: d = 42 m/día, σ semanal = 61 m, L = 4 días laborables, nivel 95 % → z = INV.NORM.ESTAND(0,95) = 1,6449.
- σ diaria = 61/√5 = 27,28.
- **SS** = REDONDEAR.MAS(1,6449 × 27,28 × 2; 0) = REDONDEAR.MAS(89,74; 0) = **90 m**.
- **ROP** = 42 × 4 + 90 = **258 m**.
- S = 258 + 42 × 5 = 468 m.
- Con stock 230 m y nada pendiente: posición 230 ≤ 258 → hay que pedir.
- 468 − 230 = 238 → múltiplo de 100 → **300 m** (lote mínimo 200: se cumple).

**Controles**
- 180 artículos únicos (196 filas − 16 repeticiones sumadas).
- Duplicados quitados = **63**.
- Σ TRA = 0.
- **Recuento**: 8 de 10 cuadran; las 2 diferencias están explicadas (−3 ud y −12,5 m).
- Stock negativo = 0 (si aparece, revisar los códigos).
- A + B + C = 180; el % acumulado del último artículo = 100 %.
- Valor del stock = Σ (stock × coste).
- Artículos sin ficha = 3 (en la lista de pendientes de Compras, no se piden a ciegas).

**Rúbrica específica**

| Criterio | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| Exactitud | Quita las ubicaciones dobles o suma los duplicados del 31/07 | Stock bien, pero σ sin semanas a cero o plazo en días naturales | Stock, SS, ROP y cantidades correctas; el recuento cuadra o se explica | Además, detecta los artículos sin ficha y el efecto de los códigos sin ceros |
| Estructura | Fórmulas largas sin parámetros | Parámetros, pero con niveles de servicio escritos dentro de las fórmulas | Tablas de tipos, parámetros por clase y LET legibles | Además, glosario y hoja «Lunes» separada del cálculo |
| Automatización y mantenimiento | Hay que rehacerla cada lunes | Se pegan los movimientos y se ajustan rangos | Se añaden los movimientos de la semana y se actualiza | Además, avisa de días repetidos o que faltan en la extracción |
| Presentación | Lista de 180 artículos sin prioridad | Propuesta sin agrupar por proveedor | «Lunes» por proveedor, lista para enviar; Pareto claro | Además, muertos con su valor y semáforo de cobertura accesible |
| Comunicación | «Pide esto» | Lista sin criterio | Explica el método en llano y el coste de subir el nivel de servicio | Además, propone acciones con los muertos y un calendario de revisión |

**Errores típicos:**
- «Quitar duplicados» sobre el inventario (borra las segundas ubicaciones).
- Desviación típica solo de las semanas con venta.
- Plazo en días naturales.
- Olvidar lo pendiente de recibir (se pide dos veces).
- ABC por unidades.
- Redondear el stock de seguridad hacia abajo.
- Contar las devoluciones a proveedor como consumo.
- Tratar los traspasos como salidas.
- MAX.SI.CONJUNTO que devuelve 0 y se lee como «1900».

**Ampliaciones:**
- **Hoja de previsión** (Datos > Previsión) para un artículo A, con la advertencia de que hay menos de dos ciclos de estacionalidad [VERIFICADO: requisitos de Microsoft].
- **Histograma** de plazos reales de entrega (si se añaden las fechas de pedido).
- Clasificación XYZ (coeficiente de variación) cruzada con ABC.
- Cantidad económica de pedido (fórmula de Wilson: Q* = √(2·D·S/H), con D = demanda anual, S = coste de lanzar un pedido y H = coste de mantener una unidad en stock un año; la formuló F. W. Harris en 1913) [VERIFICADO: https://doi.org/10.1287/opre.38.6.947].

**Cambio inesperado:** Andrés avisa de que **Tormes cierra del 21/12/2026 al 08/01/2027**, y desde enero la revisión pasa a **quincenal** (R = 10). Con LET y parámetros se cambian 2 entradas, y se añade el escenario de cierre del proveedor (plazo + 12 laborables). Se evalúa que el correo diga qué hay que pedir antes del 18/12.

**Hoja en vivo / .xlsx.**
- **En vivo:** SS, ROP y cantidad (INV.NORM.ESTAND, RAIZ, REDONDEAR.MAS, MULTIPLO.SUPERIOR, LET), clase ABC con % acumulado y SI.CONJUNTO, cobertura, MAX.SI.CONJUNTO.
- **.xlsx:** Power Query, matriz semanal, Pareto, tabla de datos, escenarios.

---

### P7 · Presupuesto frente a real y previsión de cierre (Control de gestión)

**Ficha.**
- Departamento: Administración y finanzas (control de gestión).
- Nivel: **N4 → N5**.
- Duración: **8-10 h**, más 1 h de auditoría del libro heredado.
- Versión: 365 o 2021+; LAMBDA es opcional (2024+ o 365).
- Habilidades: **auditar un libro heredado** (Rastrear precedentes y dependientes, Mostrar fórmulas, Comprobación de errores, Evaluar fórmula, Ventana Inspección, Ir a Especial > Constantes, opciones de cálculo, vínculos del libro); Power Query para pasar a formato largo 5 pestañas con formatos distintos (anular dinamización, anexar); mapeo de cuentas del PGC con excepciones; signo según ingreso o gasto; desviación en € y %, favorable o desfavorable, umbral doble; **diferencias temporales**; previsión de cierre; **Administrador de escenarios**; **Buscar objetivo**; **gráfico de cascada**; formatos personalizados; Consolidar como alternativa; PAGOINT para los gastos financieros; LAMBDA con nombre.
- Base real: MO-230 «Calculate budget versus actual variance», «Identify variances that differ from provided benchmarks», «Apply What-If Analysis», «Project interest payments»; MO-220 «Use Formula Auditing features to verify and correct calculations» [VERIFICADO].

**Correo** (de Marta Ruiz · lunes 09/11/2026 · Asunto: «Control presupuestario octubre (consejo del 20)»)
> Hola:
> Necesito el presupuesto contra real de enero a octubre por departamento, con las desviaciones que importan explicadas, y una previsión de cómo vamos a cerrar el año.
> Te paso el presupuesto que aprobó el consejo (cada departamento hizo su pestaña) y el extracto de contabilidad. También el archivo que usaba Paco el año pasado, por si te sirve, aunque no me fío mucho de él.
> Lo presento el 20: tiene que caber en una página.
> Marta

**Ambigüedades → aclaraciones**

| Pregunta | Respuesta |
|---|---|
| ¿Qué desviaciones «importan»? ¿Del mes o acumuladas? | Acumuladas de enero a octubre. Importa si **|desv.| ≥ 5 % y ≥ 3.000 €**, las dos cosas a la vez. |
| ¿Cómo presento el signo? | Desviación = Real − Presupuesto. En **gastos**, positiva = **desfavorable**; en **ingresos**, negativa = desfavorable. Columna F/D y color. |
| ¿Con qué detalle? | Partida del informe (según el mapeo) × departamento; el detalle por cuenta, en otra hoja. |
| ¿Cómo hago la previsión de cierre? | **Base: real de enero a octubre + presupuesto de noviembre y diciembre.** Escenarios: ventas de noviembre y diciembre −8 %, 0 % y +4 % con el margen constante, y Logroño con +6.500 €/mes de gastos. |
| Hay gastos que se contabilizan de golpe: el seguro anual en enero y la amortización por trimestres. | No se toca la contabilidad: se marcan como **«diferencia temporal»** y en la previsión se usa el importe del año. |
| Hay cuentas que no están en el mapeo (gastos de Logroño). | Partida nueva **«Apertura Logroño»**, fuera de presupuesto. |
| La pestaña de Dirección solo tiene el total anual. | Se reparte en **doceavas partes**. |
| ¿Arreglo el archivo de Paco o empiezo de cero? | Lo que prefieras, pero dime qué estaba mal y si el resultado de 2025 que presentó era correcto. |

**Datos de entrada**

| Archivo | Contenido | Problemas |
|---|---|---|
| `presupuesto_2026.xlsx` | 5 pestañas: Ingresos, Comercial, Almacén y logística, Administración, Dirección. Filas = cuenta de 3 dígitos + descripción; columnas Ene…Dic + Total | Q12 · Q11 (títulos y encabezado combinado) · Q10 (subtotales «Total servicios exteriores» en 2 pestañas) · meses como fecha «ene-26», como texto «Enero» y como «1» según la pestaña · Dirección, **solo el total anual** · Q05: una pestaña con los números como texto |
| `diario_2026_ene-oct.csv` | Unos **7.800 apuntes** de cuentas de los grupos 6 y 7: Fecha, Asiento, Cuenta (8 dígitos, «62300001»), Concepto, CentroCoste (COM, ALM, ADM, DIR), Debe, Haber | Q14 · Q09: CentroCoste vacío ×210 (se asigna con la tabla «Reparto por cuenta» o va a «Sin asignar») · reclasificación de octubre (asiento 2026/4120: −18.000 en la 629 y +18.000 en la 621) · **seguro anual de 14.400 € en enero** (625) · **amortización trimestral de 24.000 €** en marzo, junio y septiembre (681) · **cuenta 62900099 «Gastos apertura Logroño»** en septiembre y octubre (21.300 €) |
| `mapeo_cuentas.xlsx` | Cuenta3 → Partida, Tipo (Ingreso o Gasto), Bloque (Ventas, Coste de ventas, Personal, Otros gastos de explotación, Amortización, Financiero) | Q16: falta la excepción de 8 dígitos para la 62900099 (si se mapea por 3 dígitos, se esconde en «Otros servicios») · **Cuenta3 guardada como número, mientras que IZQUIERDA devuelve texto** (trampa de tipos: #N/D) |
| `control_2025_Paco.xlsx` | Libro heredado con **8 errores sembrados** (abajo) | — |
| Parámetros de Marta | Presupuesto aprobado por el consejo (cifras de diseño fijas, abajo) | — |

**Presupuesto aprobado 2026** [DISEÑO, cifras fijas que el generador debe respetar]

| Bloque | € | % s/ventas |
|---|---|---|
| Ventas netas | 9.480.000 | 100,0 % |
| Coste de ventas | −6.825.600 | 72,0 % |
| **Margen bruto** | **2.654.400** | **28,0 %** |
| Gastos de personal (640 + 642) | −1.698.000 | 17,9 % |
| Otros gastos de explotación (621-629) | −512.400 | 5,4 % |
| **EBITDA** | **444.000** | **4,7 %** |
| Amortización (681) | −96.000 | |
| Gastos financieros (662) | −41.000 | |
| **Resultado antes de impuestos** | **307.000** | 3,2 % |

Total de gastos presupuestados = 9.173.000.

**Los 8 errores del libro de Paco** (el generador los siembra y calcula su efecto en el resultado de 2025)

| # | Error | Cómo se encuentra |
|---|---|---|
| E1 | SUMA del total anual que deja fuera diciembre (`SUMA(C5:C15)` en lugar de `C5:C16`) | Comprobación de errores («La fórmula omite celdas adyacentes»); Rastrear precedentes |
| E2 | **Valor fijo** de 142.000 sobre la fórmula de personal de marzo | Inicio > Buscar y seleccionar > Ir a Especial > Constantes; Mostrar fórmulas (Ctrl+`) |
| E3 | % de desviación copiado con la referencia mal anclada (`=D5/C$5`) | Mostrar fórmulas: la fila no avanza; Evaluar fórmula |
| E4 | El total de gastos incluye el subtotal «Total servicios exteriores» (se cuenta dos veces) | Rastrear precedentes; Ventana Inspección sobre los totales |
| E5 | Desviación de ingresos con el signo contrario (Ppto − Real) solo en esa fila | Revisar la coherencia fila a fila (distinta fórmula en la misma columna) |
| E6 | `SI.ERROR(…;0)` que esconde un **#¡REF!** de una columna borrada (la amortización sale a 0) | Evaluar fórmula; buscar SI.ERROR |
| E7 | **Vínculo roto** a `presupuesto_2025.xlsx` | Datos > Consultas y conexiones > **Vínculos del libro** |
| E8 | Libro en **cálculo manual**: las cifras no estaban al día | Fórmulas > Cálculo > Opciones para el cálculo |

**Pasos** (solo hitos)
1. **Auditar el libro de Paco** (1 h): una tabla con los 8 errores, cómo se han encontrado, su efecto y si el resultado de 2025 que se presentó era correcto. Decisión razonada: reconstruir.
2. **Presupuesto en formato largo con Power Query**: por cada pestaña, Quitar filas superiores, Usar la primera fila como encabezado, filtrar las filas de subtotal (la Cuenta no es numérica), **Anular dinamización de otras columnas** (Cuenta, Descripción) y normalizar el mes (tabla `Meses`: texto, fecha o número → 1-12). En Dirección, repartir el total en 12 meses. **Anexar** todo en `PptoLargo` (Departamento, Cuenta3, Mes, Importe).
   - **Control**: Σ por bloque = cifras aprobadas.
   - Alternativa sin Power Query: **Datos > Consolidar** (solo vale si las pestañas tienen la misma forma: explicar por qué aquí no basta).
3. **Real**:
   - `Cuenta3 = IZQUIERDA(Cuenta;3)`, **convertida al mismo tipo que el mapeo**.
   - Importe con signo: gasto = Debe − Haber; ingreso = Haber − Debe.
   - Mes; CentroCoste vacío → regla por cuenta.
   - Agrupar en `RealLargo`.
4. **Mapeo con excepciones**:
   `=SI.ND(BUSCARX(Cuenta;Excepciones[Cuenta];Excepciones[Partida]);BUSCARX(VALOR(IZQUIERDA(Cuenta;3));Mapeo[Cuenta3];Mapeo[Partida]))`.
   **Control: 0 cuentas sin partida.**
5. **Informe**: partidas por bloque × (Real acumulado, Presupuesto acumulado, Desv. €, Desv. %, F/D, ¿Importa?, Naturaleza, Presupuesto anual, Previsión de cierre, Desv. de cierre).
   - F/D: `=SI([@Tipo]="Gasto";SI([@Desv]>0;"D";"F");SI([@Desv]<0;"D";"F"))`.
   - Importa: `=Y(ABS([@DesvPct])>=Umbral_pct;ABS([@Desv])>=Umbral_eur)`.
   - Formato personalizado `+#.##0 €;-#.##0 €;0 €`, y el color por F/D con formato condicional (no por el signo).
   - **N5**: `DESV.FAV = LAMBDA(real;ppto;tipo;SI(tipo="Gasto";ppto-real;real-ppto))` en el Administrador de nombres.
6. **Diferencias temporales**:
   - seguro (625): real 14.400 frente a presupuesto acumulado 12.000 → +2.400, D, «temporal»;
   - amortización (681): real 72.000 frente a 80.000 → −8.000, F, «temporal»;
   - en la previsión, seguro 14.400 y amortización 96.000.
   - **No usar «real + presupuesto de noviembre y diciembre» en las partidas temporales**: daría 14.400 + 2.400 = 16.800 de seguro y 72.000 + 16.000 = 88.000 de amortización, las dos mal.
7. **Previsión y qué pasaría si**:
   - **Administrador de escenarios** (Ventas noviembre-diciembre −8 %, 0 %, +4 %; Logroño sí o no) con informe de resumen;
   - **Buscar objetivo**: ¿cuánto hay que vender en noviembre y diciembre para llegar al EBITDA presupuestado (444.000)?;
   - gastos financieros de noviembre y diciembre del préstamo de P4 con `PAGOINT(5%/12;20;48;-85000)` = **222,36** y cuota 21 = **215,13** (intereses de todo 2026 de ese préstamo, cuotas 10 a 21 = **3.052,22**: `PAGO.INT.ENTRE(5%/12;48;85000;10;21;0)`, que devuelve el valor en negativo).
8. **Gráfico de cascada**: del EBITDA presupuestado acumulado al EBITDA real acumulado, pasando por ventas (volumen), margen %, personal, otros gastos, Apertura Logroño y temporales.
9. **Página para el consejo** (A4 horizontal): 3 indicadores (ventas, margen %, EBITDA frente a presupuesto), tabla de las partidas que importan, la cascada y 4 comentarios de una línea. Índice con `HIPERVINCULO` a las hojas de detalle.
10. **Controles**, Léame, registro de cambios y correo.

**Controles**
- Presupuesto largo: Σ ingresos = 9.480.000; Σ gastos = 9.173.000; resultado = 307.000.
- Σ PptoLargo = Σ de las 5 pestañas (sin subtotales).
- Σ real por partida = Σ del diario (Haber − Debe neto de los grupos 6 y 7).
- **Cuentas sin partida = 0.**
- Σ por departamento (incluido «Sin asignar») = total.
- Previsión de amortización = 96.000; seguro = 14.400.
- Control maestro «TODO OK» en la cabecera de la página del consejo.

**Rúbrica específica**

| Criterio | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| Exactitud | Mezcla signos o deja cuentas sin mapear | Cuadra en total, pero Logroño está escondido en «Otros servicios» o falla la trampa de tipos | Todo cuadra; F/D correcto en ingresos y gastos; temporales identificados | Además, cuantifica el error de Paco en el resultado de 2025 y la previsión trata bien las partidas temporales |
| Estructura | Copia del formato de Paco | Hojas nuevas, pero con umbrales y signos dentro de las fórmulas | Hechos largos de presupuesto y real, mapeo con excepciones y parámetros | Además, LAMBDA o LET documentadas y detalle por cuenta enlazado |
| Automatización y mantenimiento | Cada mes a mano | Actualizar exige retocar el diario | Se sustituye el CSV del diario y se actualiza; los escenarios se recalculan | Además, controles de tipo y de cuentas nuevas sin mapear, y registro de cambios |
| Presentación | Tabla de 60 partidas | Una página recargada | Una página: indicadores, tabla de lo que importa, cascada y comentarios | Además, accesible (F/D con texto, no solo color) y lista para el consejo sin retoques |
| Comunicación | Lista de desviaciones | Explica las cifras, no las causas | Distingue entre desviaciones reales, temporales y fuera de presupuesto; 4 comentarios útiles | Además, avisa del riesgo de cierre (escenario −8 %) y de lo que harían falta en noviembre y diciembre para cumplir |

**Errores típicos:**
- Interpretar como mala noticia una desviación positiva de ventas (signo).
- Media de % de desviación.
- IZQUIERDA (texto) contra Cuenta3 (número) → #N/D o 0 silenciosos con SI.ERROR.
- Mapear por 3 dígitos y esconder Logroño.
- Explicar como ahorro la amortización trimestral.
- Previsión «real + presupuesto restante» en partidas temporales.
- Fiarse del libro de Paco (cálculo manual, vínculo roto).
- Repartir el total de Dirección por estacionalidad cuando se pidió en doceavas partes.
- Cascada con totales mal marcados («Establecer como total»).

**Ampliaciones:**
- Análisis **horizontal** (2026 frente a 2025) y **vertical** (% sobre ventas) de la cuenta de resultados (MO-230 [VERIFICADO]).
- Modelo de datos con medidas (puente hacia P8).
- Proyección de 2027 con tasas de crecimiento por partida y tabla de datos de dos variables (ventas × margen %).

**Cambio inesperado** (18/11): contabilidad registra una factura de transporte de octubre de **9.800 €** que faltaba.
- Diseño: la partida 624 pasa de 101.500 frente a 105.000 (−3,3 %, F, no importa) a **111.300 frente a 105.000 (+6.300, +6,0 %, D, sí importa)**.
- Hay que actualizar, ver que la partida entra en «lo que importa» y **cambiar el comentario del consejo**.

**Hoja en vivo / .xlsx.**
- **En vivo:** desviación, F/D, umbral doble con Y y ABS, previsión con las temporales, PAGOINT, PAGO.INT.ENTRE, BUSCARX con SI.ND y el error de tipo (ejercicio «arregla el error»), errores E1, E3 y E5 como ejercicios con `inicial` errónea.
- **.xlsx:** auditoría completa, Power Query, escenarios, Buscar objetivo, cascada.

---

### P8 · Cuadro de mando de dirección (Dirección) · proyecto final de autonomía

**Ficha.**
- Departamento: Dirección general.
- Nivel: **N5 → N6** (proyecto de cierre).
- Duración: **12-16 h**, más una defensa oral de 15 min.
- Versión: Microsoft 365 en **Windows** para Power Pivot. **Plan B obligatorio** para quien lo lee en Mac, iPad o el navegador:
  - PDF A4 apaisado;
  - y/o un libro sin modelo de datos (Power Query → tabla única + tablas dinámicas clásicas + SUMAR.SI.CONJUNTO, o AGRUPARPOR y PIVOTARPOR).
  Power Pivot solo existe en Windows [VERIFICADO parcial en `excel-moderno.md` §0.14].
- Habilidades: **entrevistas y diccionario de indicadores**, boceto, Power Query de 6 fuentes, **modelo de datos en estrella**, tabla de calendario, **medidas DAX** (incluidas las de inteligencia de tiempo y las semiaditivas), segmentaciones que controlan todo, tarjetas de indicador, minigráficos, accesibilidad, protección, manual de actualización, **IA con verificación**, RGPD (solo datos agregados).
- Base real: MO-220 y MO-230 «Create dashboards and charts», «Evaluate and improve accessibility and usability» [VERIFICADO]; N6 de `curriculo.md`.

**Correo** (de Carmen Soler, directora general · 23/11/2026 · Asunto: «Un cuadro de mando para el comité»)
> Hola:
> Cada mes cada director me trae sus números en un formato distinto y no hay forma de ver la película entera. Quiero una sola página con lo importante del mes: ventas, margen, lo que nos deben, el stock, la plantilla… Que se pueda ver por delegación y que lo podáis actualizar vosotros cada mes sin depender de nadie.
> Habla con quien necesites. En el comité de diciembre quiero ver una prueba con noviembre, y estrenarlo en enero con el cierre del año.
> Carmen

**Ambigüedades** (aquí **no hay tabla de aclaraciones cerrada**: la alumna tiene que conseguirlas en las «entrevistas» simuladas con Marta, Javier, Andrés y Lucía; la app responde a preguntas concretas y, si la pregunta es vaga, contesta con vaguedad)
- ¿Qué indicadores, con qué definición, fórmula, fuente y responsable?
- ¿Mes, acumulado, contra el año anterior, contra el presupuesto?
- ¿Quién fija los umbrales del semáforo?
- ¿El filtro de delegación se aplica a todo? El stock es central y no se reparte por delegación → «no aplica».
- ¿En qué se ve? Pantalla en la sala, PDF o iPad de Carmen.
- ¿Qué es confidencial? Nada de personas ni de salud.
- ¿Cuándo está cerrado el dato? El 5.º día laborable. ¿Quién lo actualiza y quién la sustituye?

**Respuestas que da la app si la pregunta es concreta:**
- 7 indicadores (abajo).
- Mes + acumulado + interanual + presupuesto.
- Semáforo: verde ≥ 100 % de la meta, ámbar 95-100 %, rojo < 95 %, invertido en «cuanto menos, mejor» (PMC, cobertura de stock, absentismo).
- PDF + archivo en SharePoint.
- Sin datos personales.
- Actualiza la alumna; suplente, Administración.

**Diccionario de indicadores** (la alumna lo propone; esta es la versión de referencia)

| Indicador | Definición y fórmula | Fuente (proyecto) | Responsable | Meta | ¿Por delegación? |
|---|---|---|---|---|---|
| Ventas netas | Σ ImporteNeto (mes y acumulado); var. % interanual; % cumplimiento | Ventas (P5) y presupuesto de ventas | Javier | Presupuesto | Sí |
| Margen bruto % | Σ margen / Σ ventas | Ventas (P5) | Javier | 28,0 % | Sí |
| Cartera vencida > 60 días | Σ pendiente con más de 60 días vencido / Σ pendiente | Saldos de fin de mes (P3) | Marta | ≤ 10 % | Sí |
| PMC | Saldo de clientes / ventas con IVA de los últimos 3 meses × 92 | P3 + P5 | Marta | ≤ 70 días | Sí |
| Stock valorado y cobertura | Σ stock × coste; cobertura = stock valorado / (coste de ventas de los últimos 90 días / 90) | Stock de fin de mes (P6) | Andrés | ≤ 60 días | **No** (almacén central) |
| Plantilla y absentismo | FTE al cierre; días de IT / días teóricos | Plantilla agregada (P2) | Lucía | ≤ 4 % | Sí |
| EBITDA acumulado frente a presupuesto | Del P&L mensual | P7 | Marta | 100 % | No |

**Datos de entrada** (historia coherente de 2025-2026 que genera el mismo motor; solo agregados en lo que toca a personas)

| Archivo | Grano | Problemas |
|---|---|---|
| `ventas_lineas_2025_2026.csv` | Línea de venta, enero de 2025 a noviembre de 2026 (unas 25.000 filas). Informática ha sacado el detalle de 2025 | Q08: «Lérida» y «Lleida» · Logroño solo desde noviembre de 2026 |
| `presupuesto_ventas_2026.xlsx` | Delegación × Familia × Mes | Grano distinto del de las ventas (Q18): se relaciona con dimensiones, no con la tabla de ventas |
| `saldos_clientes_fin_mes.csv` | Cliente × fin de mes (enero a noviembre de 2026), con Pendiente y Vencido > 60 | **Q22: falta agosto** (no se cerró): hay que mostrar «sin dato», no 0 |
| `stock_fin_mes.csv` | Artículo × fin de mes (mayo a noviembre) | Empieza en mayo |
| `plantilla_fin_mes.csv` | Departamento × Delegación × fin de mes: FTE, Activos, DíasIT, DíasTeóricos | Ya agregado (RGPD) |
| `pyg_mensual.csv` | Partida × Mes: Real y Ppto | — |

**Pasos** (solo el encargo y estos hitos)
1. **Entrevistas** de unos 15 min con 4 directores (guion de 8 preguntas: decisión que toma, frecuencia, definición, fuente, responsable, meta, qué la alarmaría, qué no quiere ver) → **diccionario de indicadores** y **boceto** de una página, aprobados por Carmen antes de construir.
2. **Power Query**: las 6 fuentes, limpias; dimensiones Delegación (con alias), Familia, Cliente y **Calendario** (Fecha, Año, Mes, NombreMes, AñoMes, Trimestre, FinDeMes, EsMesCerrado).
3. **Modelo de datos** (Datos > Herramientas de datos > Relaciones o Administrar modelo de datos): **estrella**.
   - Ventas → Calendario, Clientes, Delegaciones y Familias.
   - Ppto → Calendario (día 1 del mes), Delegaciones y Familias.
   - Saldos, Stock y Plantilla → Calendario (fin de mes).
   - Sin relaciones de varios a varios.
4. **Medidas DAX** (los nombres de las medidas en español; las funciones DAX se escriben **en inglés** en cualquier idioma de Excel; el separador de argumentos en un Power Pivot configurado para España está [NO VERIFICABLE: no enseñarlo como dato]: probar `;` y `,`):
   - `Ventas := SUM(Ventas[ImporteNeto])`
   - `Margen := SUMX(Ventas; Ventas[ImporteNeto] - Ventas[Cantidad] * Ventas[CosteUnitario])`
   - `Margen % := DIVIDE([Margen]; [Ventas])`
   - `Ventas AA := CALCULATE([Ventas]; SAMEPERIODLASTYEAR(Calendario[Fecha]))`
   - `Var AA % := DIVIDE([Ventas] - [Ventas AA]; [Ventas AA])`
   - `Ventas acum. := TOTALYTD([Ventas]; Calendario[Fecha])`
   - `Cumplimiento % := DIVIDE([Ventas]; SUM(Ppto[Importe]))`
   - **Semiaditivas** (fotos de fin de mes, que **no se suman entre meses**): `Saldo clientes := CALCULATE(SUM(Saldos[Pendiente]); LASTDATE(Calendario[Fecha]))`, y lo mismo para stock y FTE.
   - `Absentismo % := DIVIDE(SUM(Plantilla[DíasIT]); SUM(Plantilla[DíasTeóricos]))`
5. **Plan B sin Power Pivot**: tabla única con Power Query y SUMAR.SI.CONJUNTO por mes y delegación. Los saldos se toman con `FIN.MES(Mes;0)` como criterio, no se suman.
6. **Hoja «Cuadro»** (A4 apaisado; legible en una pantalla de 1920×1080 al 100 %):
   - selector de mes (segmentación sobre Calendario[AñoMes]) y de delegación;
   - **7 tarjetas** con: valor, frente al año anterior, frente al presupuesto, ▲▼ y semáforo con texto;
   - líneas de 24 meses (ventas y ventas del año anterior);
   - barras de cumplimiento por delegación;
   - columnas apiladas de antigüedad de saldos;
   - stock por clase ABC;
   - las 5 desviaciones de P&L que más importan;
   - **minigráficos**;
   - títulos dinámicos;
   - un recuadro **«Qué hay que mirar este mes»** (3 frases que escribe la alumna, no la IA).
   Las tarjetas se pueden hacer con tablas dinámicas pequeñas o con fórmulas de cubo (`VALORCUBO` / `MIEMBROCUBO`) sobre el modelo.
7. **Accesibilidad**: Revisar > Comprobar accesibilidad, texto alternativo en cada gráfico, contraste, semáforo con símbolo y texto. **Protección** de la hoja de presentación. **Inspeccionar documento**.
8. **Manual de actualización** (una página): qué archivos dejar y dónde, Actualizar todo, controles, exportar PDF, a quién avisar si falla. **Registro de cambios.**
9. **IA con verificación**: se permite pedir a Copilot (o al asistente autorizado) un boceto de la distribución o una explicación de una medida DAX. Para cada medida que proponga la IA, la alumna anota un **caso de prueba calculado a mano** (por ejemplo, las ventas de octubre de 2026 de Pamplona) y el resultado. Microsoft avisa de que hay que revisar lo que crea Copilot [VERIFICADO en `excel-moderno.md` §0.6].
10. **Defensa oral** (15 min): explicar cada indicador, cómo se actualiza, qué limitaciones tiene y qué pasa si falta un dato.

**Controles** (cada tarjeta debe cuadrar con su fuente; las cifras, de pandas)
- Ventas de octubre de 2026 = Σ de `control_erp` de octubre (P5).
- Saldo de clientes a 31/10 = Σ pendiente de P3 (la misma cifra que la 430 − 555).
- Stock valorado a 31/10 = el de P6.
- FTE = el de P2.
- EBITDA acumulado = el de P7.
- Con la segmentación en «Todas», Σ por delegación = total (salvo el stock, que no aplica).
- **Agosto** de saldos aparece como «sin dato» y no rompe el PMC de septiembre.
- Al cargar noviembre, octubre no cambia.
- 0 errores visibles; control maestro «OK».

**Rúbrica específica**

| Criterio | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| Exactitud | Suma saldos o stock entre meses; tarjetas que no cuadran con su fuente | Cuadran 5 de 7 tarjetas | Cuadran las 7; el interanual y el presupuesto son correctos; agosto se trata como «sin dato» | Además, casos de prueba documentados para cada medida (también las de la IA) |
| Estructura | Copia de los informes de cada director | Tabla única frágil | Estrella con calendario y medidas con nombre; plan B | Además, diccionario de indicadores, convenciones de nombres y medidas comentadas |
| Automatización y mantenimiento | Hay que rehacerlo cada mes | Se actualiza tocando consultas | Dejar los archivos y Actualizar todo; controles | Además, la suplente lo actualiza siguiendo el manual sin ayuda (prueba con otra persona) |
| Presentación | Más de 10 gráficos o gráficos 3D | Muchos datos sin jerarquía | Una página, 7 tarjetas, 4-5 gráficos limpios y semáforos accesibles | Además, una lectura de 30 segundos: lo urgente primero, títulos que dicen la conclusión |
| Comunicación | Sin entrevistas | Entrevistas, pero indicadores sin definición | Diccionario pactado; defensa clara | Además, negocia lo que no se puede medir con los datos actuales y propone cómo conseguirlo |

**Errores típicos:**
- Empezar a construir sin el diccionario de indicadores pactado.
- Relacionar el presupuesto (Delegación × Familia × Mes) directamente con las ventas.
- Sumar fotos de fin de mes.
- Columna calculada de margen % que luego se promedia.
- Una tabla de calendario con huecos o sin marcar como tabla de fechas.
- Filtro de delegación que «filtra» el stock central.
- Más de 7 indicadores.
- Semáforos solo de color.
- Copiar las medidas de la IA sin probarlas.
- Datos de personas en el modelo.

**Ampliaciones:**
- Macro o Office Script que exporta un PDF por delegación (bucle).
- Power BI como siguiente paso (PL-300), sin hacerlo.
- Python en Excel para un análisis de cohortes de clientes (solo si la licencia lo permite [VERIFICADO en `excel-moderno.md` §0.9]).
- Hoja de previsión de ventas para el primer trimestre de 2027.

**Cambio inesperado** (enero de 2027): llegan los datos de diciembre con la delegación Logroño en todas las fuentes y Carmen pide un octavo indicador, «nº de clientes activos».
- Se evalúa que no se rompe nada.
- Se evalúa que la alumna **negocia**: propone sustituir un indicador en lugar de añadirlo, o crear una segunda página.

**Hoja en vivo / .xlsx.**
- **En vivo:** fórmulas de comprobación de las tarjetas (variación interanual, cumplimiento, PMC, cobertura con SI.ERROR), semáforo con SI.CONJUNTO, «sin dato» frente a 0.
- **.xlsx:** todo el modelo.

---

## 6. Proyectos de reserva (por si se quiere sustituir alguno o dar uno extra)

### R1 · Comisiones de comerciales por tramos (Comercial, N3, 5-6 h)
- **Correo** de Javier: «Calcula las comisiones del segundo semestre como dice el acuerdo de 2026 (adjunto) y prepárame una hoja para cada comercial que pueda enviarles.»
- **Ambigüedades**:
  - ¿Comisión sobre lo facturado o sobre lo cobrado?
  - ¿**Tramos escalonados** (cada tramo a su porcentaje) o **por tramo alcanzado** (todo al porcentaje del tramo)?
  - ¿Se descuentan las devoluciones?
  - ¿Y el comercial que cambió de delegación en septiembre?
  - ¿Lleva un mínimo garantizado?
- **Datos**: ventas de P5 (julio-diciembre), cobros de P3, tabla de tramos en el acuerdo (texto en PDF), altas y bajas de comerciales.
- **Habilidades**: BUSCARX aproximada, cálculo por tramos con SUMAPRODUCTO o LET, SUMAR.SI.CONJUNTO, validación con selector de comercial, hoja de liquidación imprimible, protección, PDF por comercial.
- **Control exacto de ejemplo**: ventas de 120.000 € con tramos 0-50.000 al 1 %, 50.000-100.000 al 2 % y más de 100.000 al 3 %:
  - escalonado = 500 + 1.000 + 600 = **2.100 €**;
  - «todo al tramo alcanzado» = **3.600 €**.
  La diferencia entre los dos métodos es justo la ambigüedad que hay que preguntar.
- **Por qué es de reserva**: P3 (tramos de antigüedad) y P6 (ABC) ya practican la búsqueda por tramos.

### R2 · Previsión de tesorería a 13 semanas (Finanzas, N5, 8-10 h)
- **Correo** de Marta: «Con Logroño y la paga de diciembre, no sé si llegamos a febrero sin tirar de la póliza. Hazme la tesorería semana a semana del 16/11/2026 al 14/02/2027.» Son 13 semanas de lunes a domingo; la última acaba el domingo 14/02/2027.
- **Entradas**:
  - saldo inicial de bancos (P4);
  - cobros previstos (vencimientos de P3 con un % de cobro por tramo);
  - pagos a proveedores por vencimiento;
  - nóminas a fin de mes y paga extra (dato del convenio);
  - Seguridad Social e impuestos (IVA e IRPF trimestrales en enero; en el calendario de 2026 de la AEAT, los modelos 111 y 115 del 4.º trimestre vencían el 20 de enero, y el 130 y el 303 el 30 de enero) con las fechas que dé la asesoría [VERIFICADO: https://sede.agenciatributaria.gob.es/Sede/ayuda/calendario-contribuyente/calendario-contribuyente-2026/calendario-anual/enero/hasta-30-enero.html; las fechas exactas de enero de 2027 se comprueban en la AEAT cuando publique el calendario de 2027];
  - cuota del préstamo el día 25 (1.957,49 €);
  - póliza de crédito con un límite de 150.000 € [DISEÑO].
- **Habilidades**: semanas con FECHA, DIASEM y SECUENCIA; SUMAR.SI.CONJUNTO por semana; saldo mínimo; disposición de la póliza sin referencias circulares (MAX y MIN); escenarios (cobros −15 %, retraso del cliente principal); gráfico de líneas con el saldo mínimo; tabla de datos.
- MO-230: «Project cash budgets» [VERIFICADO].
- **Controles**: saldo final de la semana n = saldo inicial + cobros − pagos ± póliza; saldo inicial de la semana n+1 = saldo final de la n; Σ cobros previstos ≤ Σ pendiente de P3.
- **Por qué es de reserva**: solapa con P7 en el análisis de hipótesis y es más propio de un puesto de tesorería o de controller.

### R3 · Coste de personal y simulación de nómina (RRHH y finanzas, N4)
- Cubre el objetivo del MO-220 «Calculate gross and net pay for multiple employees; employer payroll tax liabilities» [VERIFICADO].
- **No se recomienda** para la guía sin una línea legal propia. Los tipos de cotización de 2026, las bases máximas y mínimas, el MEI y las retenciones de IRPF cambian cada año y por normativa [VERIFICADO: Orden PJC/297/2026, de 30 de marzo, BOE de 31/03/2026, https://www.boe.es/eli/es/o/2026/03/30/pjc297]. Si se hace, con parámetros en una hoja y la fuente oficial citada en cada uno.

---

## 7. Examen final · «Prueba técnica de empresa» (120 minutos)

### 7.1 Planteamiento
- **Escenario nuevo**, para que no se pueda resolver de memoria: **Tostadero Albada, S.L.** [DISEÑO], Valladolid, distribuidora de café, infusiones, leche y maquinaria para hostelería. La alumna se presenta al puesto de **«Administrativa de gestión y análisis (Excel avanzado)»**.
- **Formato de prueba real**:
  - un libro con instrucciones;
  - los enunciados **no nombran funciones** (estilo MOS: «function names are avoided and are replaced with descriptors» [VERIFICADO]);
  - cronómetro visible;
  - se permite la ayuda de Excel (F1), pero no internet ni IA.
  - **Variante «modo 2026»** (opcional): Copilot permitido, con la obligación de anotar cómo se ha verificado cada fórmula que proponga.
- **Archivos**:
  - `examen-datos.xlsx`, con las hojas Instrucciones, Pedidos, Clientes, Tarifa, Cobros y Parámetros;
  - `semana45.csv`;
  - `examen-solucion.xlsx`, para la corrección.
- **Tipos de IVA** del escenario: café, infusiones y azúcar al 10 %; leche al 4 %; maquinaria y menaje al 21 % [VERIFICADO local: tiposiva2026.pdf para los tipos; qué producto lleva cada uno es DISEÑO coherente con esa tabla].

### 7.2 Datos (el generador garantiza estas cantidades)

| Hoja | Filas | Columnas | Problemas sembrados |
|---|---|---|---|
| Pedidos | **1.240** brutas → **1.227** limpias (semanas 36 a 44: del 31/08 al 01/11/2026) | Fecha, NumPedido, CodCliente, CodProducto, Cantidad, PrecioUnitario (sin IVA), CodComercial | 12 duplicados exactos · 1 fila «Total» · 60 fechas ISO como texto · 40 precios con punto como texto · 25 CodCliente con espacio final · **8 líneas** con productos descatalogados que no están en la tarifa |
| Clientes | 148 | CodCliente, Nombre, Tipo (Bar, Restaurante, Hotel, Tienda), Zona (Valladolid capital, Valladolid provincia, Palencia, Burgos), DíasPago, Límite | Zona mal escrita ×6 («burgos», «BURGOS ») |
| Tarifa | 64 | CodProducto, Descripción, Familia (Café, Infusiones, Leche, Azúcar y complementos, Maquinaria, Menaje), TipoIVA, Coste, PrecioTarifa | — |
| Cobros | 410 facturas | NumFactura, CodCliente, FechaFactura, Vencimiento, Importe, Cobrado | 3 facturas cobradas de más (saldo a favor) |
| `semana45.csv` | unas 140 | Igual que Pedidos | 1 producto nuevo |

### 7.3 Partes, tareas y puntuación

**Parte A · Criterio (15 min, 15 puntos).** 12 preguntas tipo test con explicación (1,25 puntos cada una). Enunciados y respuestas:
1. Tu búsqueda devuelve «no encontrado» para un código que ves en la tarifa. ¿Qué compruebas primero? → **Espacios o texto frente a número** en una de las dos columnas. Distractores: «reinstalar Excel», «usar coincidencia aproximada» (da un resultado falso) y «ordenar la tarifa» (no hace falta con búsqueda exacta).
2. Pegas los pedidos de ayer debajo y la tabla dinámica no cambia. → El origen era un rango fijo o falta **Actualizar**. La buena práctica es una **Tabla** como origen.
3. Para clasificar por tramos con búsqueda aproximada, la tabla de tramos debe… → estar **ordenada de menor a mayor por el límite inferior** de cada tramo.
4. ¿Cuál es el margen % de la familia Café? → **Σ margen / Σ ventas** de la familia, no el promedio de los porcentajes de cada línea.
5. Un proveedor de EE. UU. manda un CSV con «03/04/2026». → Ambiguo: hay que importarlo con su **configuración regional** y comprobarlo con un día mayor que 12.
6. Cada mes llegan 3 CSV con la misma estructura. ¿Qué herramienta usas? → **Power Query desde carpeta**, más Actualizar.
7. Copilot te propone una fórmula. ¿Qué haces? → La pruebas con **casos conocidos**, revisas sus rangos y no pegas datos personales en asistentes no autorizados (AEPD [VERIFICADO en `excel-moderno.md`]).
8. ¿Qué criterio suma las ventas desde el 1 de octubre? → `">="&FECHA(2026;10;1)` (descripción en llano en el enunciado; la opción incorrecta lleva la fecha dentro de las comillas sin concatenar con una celda).
9. El total de la factura difiere en 0,01 € de la suma de líneas. → Se ha redondeado en un sitio distinto. La regla: **redondear el IVA en el mismo nivel en que se factura** y documentarlo.
10. «=B2*1,21» en 300 filas. ¿Qué problema tiene? → **Valor fijo**: si cambia el tipo, hay que tocar 300 fórmulas. El tipo va en una celda de parámetros con nombre.
11. Vas a proteger la plantilla. ¿Qué haces antes? → **Desbloquear** las celdas de entrada.
12. Mandas al cliente su extracto en un Excel con una hoja oculta con los datos del resto de clientes. → **No se hace**: se manda un PDF o una copia que solo tenga sus datos, después de Inspeccionar documento (RGPD, minimización).

**Parte B · Libro (75 min, 60 puntos).** Seis tareas, con controles autocorregibles (`excel`) y tolerancia de 0,01 € y 0 en recuentos.

| Tarea | Enunciado (tal como lo lee) | Tiempo | Puntos | Controles |
|---|---|---|---|---|
| B1 Limpieza | «Deja Pedidos lista para analizar: una fila por línea real, fechas e importes que Excel reconozca y códigos sin espacios. La hoja original no se toca.» | 15 | 10 | Nº de líneas = **1.227** · Σ Cantidad · nº de fechas no numéricas = 0 |
| B2 Cálculos y cruces | «Añade a cada línea la familia, el tipo de IVA, la zona y el tipo de cliente, y calcula base, IVA, total y margen. Si un producto no está en la tarifa, que se vea y que no rompa los totales.» | 20 | 15 | Σ Base · Σ IVA de cada tipo (4, 10 y 21 %) · Σ Margen · líneas sin tarifa = **8** |
| B3 Análisis | «Resumen de ventas (base) por zona y familia, con el peso de cada familia dentro de su zona, filtrable por tipo de cliente, y un gráfico que muestre qué familia pesa más en cada zona. ¿Cuáles son los 5 clientes con más margen?» | 15 | 12 | Base de Burgos (con la zona ya normalizada) · % de Café en Palencia · margen del cliente con más margen |
| B4 Cartera | «A 31/10/2026: cuánto debe cada cliente y desde cuándo (sin vencer, 1-30, 31-60, más de 60), y marca a los que superan su límite.» | 10 | 10 | Σ vencido a más de 60 · nº de clientes por encima del límite |
| B5 Qué pasaría si | «El director quiere que el margen de Maquinaria en Burgos sea del 35 %. ¿A qué precio medio habría que vender MAQ-ESP-2G, sin tocar los demás productos?» | 10 | 6 | Precio (± 0,01) |
| B6 Robustez | «Haz que el libro avise si algo no cuadra y que mañana se puedan añadir los pedidos de la semana 45 sin rehacer nada. Añádelos y comprueba.» | 5 | 7 | Nº de líneas tras añadir = 1.227 + las de semana45 · control maestro «OK» · producto nuevo detectado |

**Parte C · Correo de entrega (20 min, 25 puntos).** «Escribe a Rodrigo Pardo (jefe de administración) el correo con el que entregas el análisis. Máximo 200 palabras.»
- Criterios (5 puntos cada uno):
  - (1) cifras clave correctas y **iguales a las del libro**;
  - (2) 3 conclusiones con cifra («Burgos pesa X %…»);
  - (3) 2 riesgos o límites de los datos (las 8 líneas sin tarifa, las zonas mal escritas, los saldos a favor);
  - (4) la pregunta que habría hecho antes de empezar (¿ventas con o sin portes? ¿margen sobre coste de tarifa o real?) y los supuestos tomados;
  - (5) tono profesional y claro.
- Modelo de respuesta en `solucion_md`.

**Corrección y aprobado.**
- Partes A y B: automáticas.
- Parte C: tutora IA con la rúbrica y el modelo; si no está disponible, autoevaluación guiada con el modelo.
- **Apta** con ≥ 70 puntos, **≥ 36/60 en la parte B** y **ningún bloqueante**. Bloqueantes:
  - Σ Base de B2 errónea sin un aviso visible;
  - cifras del correo que no coinciden con el libro;
  - haber borrado la hoja original de Pedidos.
- **Variante B** con otra semilla, para repetirlo al cabo de 7 días.
- Al terminar, se enseña la solución comentada y un informe por tarea con la lección donde se aprende cada cosa (campo `leccion`).

### 7.4 Por qué así
- Reparte el peso más o menos como recomienda `curriculo.md` §3.3: datos y formato alrededor del 30 %, fórmulas el 30 %, tablas dinámicas y gráficos el 25 %, robustez y colaboración el 15 %.
- Añade la comunicación (25 %), porque es lo que distingue el N6 y lo que miran las empresas al pedir una tabla «entendible».
- La duración (120 min) está en la franja de los casos de analista y controller (de 60 a 180 min) y por encima de las pruebas administrativas de 30 a 60 min. Así sirve de entrenamiento para las dos.

---

## 8. Prueba de nivel inicial (para saltar niveles · 15-20 min · 22 preguntas)

**Reglas** (encajan con `pedagogia.md` §2.5).
- Primera pregunta, fuera de la nota: «¿Has usado Excel alguna vez para algo más que mirar una tabla?».
  - **No** → empieza en el N0, sin prueba.
  - **Sí** → empieza en el bloque N1.
- Cada nivel es un escalón:
  - se **supera** si acierta todas o todas menos una (la lección de la fallada queda marcada para repasar);
  - con **2 fallos en un nivel**, se para.
- Se propone empezar en el nivel siguiente al último superado.
- Cada pregunta lleva «¿Qué seguridad tienes?». Si acierta con poca seguridad, se recomienda repasar ese módulo aunque lo haya superado.
- Lo superado queda como «Superado en la prueba» y sus tarjetas entran en el repaso espaciado.
- **Todas se corrigen solas.** Las de tipo `formula` usan funciones que calcula el motor (`funciones-motor.txt`).

| Id | Nivel | Modo | Enunciado (resumen) | Respuesta correcta | Lo que revela el fallo |
|---|---|---|---|---|---|
| pn-0a | N0 | respuesta_corta | La celda resaltada está en la columna C y en la fila 5. ¿Cómo se llama? | `C5` (se acepta `c5`) | No sabe qué es una dirección de celda |
| pn-0b | N0 | test | Escribes `3.5` y se queda a la izquierda. ¿Por qué? | Excel en español no lo reconoce como número: el decimal es la coma | Confunde el punto y la coma; no sabe leer la alineación |
| pn-0c | N0 | predice | A1 = 4, A2 = 6. ¿Qué da `=A1*A2+1`? | **25** | Prioridad de los operadores |
| pn-0d | N0 | test | Has borrado una columna sin querer. ¿Qué haces primero? | Ctrl+Z (deshacer) | No conoce deshacer (distractores: Ctrl+Y, cerrar sin guardar) |
| pn-1a | N1 | formula | Precios en B2:B4 (120; 80; 45,5) e IVA en F1 (21 %). En C2, el total con IVA, que se pueda copiar hasta C4 | `=B2*(1+$F$1)` · `variantes`: F1 = 10 % · `copiar_a` C3:C4 · `errores_tipicos`: `=B2*(1+F1)`, `=B2*1,21` | Referencia absoluta; valores fijos dentro de la fórmula |
| pn-1b | N1 | predice | A1 = 10, A2 vacía, A3 = 20, A4 = 0. ¿Qué da `=PROMEDIO(A1:A4)`? | **10** (la vacía no cuenta; el 0 sí) | Vacío frente a cero |
| pn-1c | N1 | formula | En C2, «Grande» si el pedido de B2 es de 1.000 € o más y «Normal» si no | `=SI(B2>=1000;"Grande";"Normal")` · `variantes`: B2 = 999 y B2 = 1000 | SI y ≥ frente a > |
| pn-1d | N1 | test | ¿Por qué no conviene combinar celdas dentro de una lista que vas a ordenar o filtrar? | Ordenar falla con celdas combinadas de distinto tamaño y el filtro solo ve la primera celda | Datos frente a presentación |
| pn-2a | N2 | formula | Zonas en A2:A9 e importes en B2:B9. En E2, el total de la zona escrita en D2 («Norte») | `=SUMAR.SI(A2:A9;D2;B2:B9)` · `variantes`: D2 = «Sur» | Suma condicional |
| pn-2b | N2 | formula | Códigos en A2:A8 y precios en B2:B8. En F2, el precio del código de E2, o «No existe» si no está | `=BUSCARX(E2;A2:A8;B2:B8;"No existe")` · `alternativas`: `=SI.ERROR(BUSCARV(E2;A2:B8;2;FALSO);"No existe")`, `=SI.ERROR(INDICE(B2:B8;COINCIDIR(E2;A2:A8;0));"No existe")` · `variantes`: un código que no existe | Búsqueda exacta |
| pn-2c | N2 | test | `=BUSCARV(E2;A2:B8;2)` devuelve el precio de otro producto. ¿Por qué? | Sin el cuarto argumento hace coincidencia **aproximada** | El error clásico de BUSCARV (E15) |
| pn-2d | N2 | predice | ¿Qué da `=LARGO(ESPACIOS("  Ana   López "))`? | **9** | Espacios sobrantes (E17) |
| pn-3a | N3 | formula | Fecha en A2:A10, zona en B2:B10, importe en C2:C10. En F2, las ventas de «Norte» desde el 01/10/2026 | `=SUMAR.SI.CONJUNTO(C2:C10;B2:B10;"Norte";A2:A10;">="&FECHA(2026;10;1))` · `alternativas`: con la fecha en una celda (`">="&E2`) · `variantes`: cambia una fecha de septiembre a octubre | Criterios de fecha concatenados |
| pn-3b | N3 | formula | Días vencidos en B2:B6 (45; 0; 30; 61; 200) y tabla de tramos en E2:F5 (0 → «0-30»; 31 → «31-60»; 61 → «61-90»; 91 → «Más de 90»). En C2, el tramo; cópialo hasta C6 | `=BUSCARV(B2;$E$2:$F$5;2;VERDADERO)` · `alternativas`: `=BUSCARX(B2;$E$2:$E$5;$F$2:$F$5;;-1)` · `copiar_a` C3:C6 | Búsqueda aproximada bien usada; $ en el rango |
| pn-3c | N3 | test | Añades 50 pedidos y la tabla dinámica no los muestra. ¿Lo más probable? | Origen fijo o sin actualizar; la buena práctica es Tabla + Actualizar | Tablas dinámicas en la vida real (E28) |
| pn-3d | N3 | test | `=SUMA(C2:C50)` no suma algunos importes que se ven en la columna. ¿Causa más probable? | Son **números guardados como texto** | E08 |
| pn-4a | N4 | ordenar | Pasos para unir los CSV de cada mes con Power Query | 1 Carpeta solo para los CSV · 2 Datos > Obtener datos > Del archivo > De la carpeta · 3 Combinar y transformar datos · 4 Tipos con configuración regional · 5 Cerrar y cargar · 6 Al mes siguiente: dejar el CSV nuevo y Actualizar todo | Flujo de Power Query |
| pn-4b | N4 | formula | Préstamo de 85.000 € al 5 % anual en 48 cuotas mensuales. En B5, la cuota (positiva) | `=PAGO(5%/12;48;-85000)` = **1.957,49** · `alternativas`: `=-PAGO(B2/12;B3;B1)` con los datos en celdas · tolerancia 0,01 | Tasa mensual y signo |
| pn-4c | N4 | test | Vas a proteger una plantilla para que solo se escriba en las celdas amarillas. ¿Qué haces antes de Proteger hoja? | Desbloquearlas (Formato de celdas > Proteger > quitar «Bloqueada») | Protección |
| pn-5a | N5 | test | En una tabla dinámica, el saldo de clientes del trimestre sale 5,4 M€ cuando cada mes ronda 1,8 M€. ¿Qué pasa? | Está **sumando 3 fotos** de fin de mes: hay que tomar el último saldo del periodo | Medidas semiaditivas |
| pn-5b | N5 | test | ¿Por qué el margen % de una familia es Σ margen / Σ ventas y no el promedio de los márgenes % de cada línea? | El promedio pesa igual una línea de 5 € que una de 5.000 € | Cálculos sobre totales (medida frente a columna) |
| pn-5c | N5 | formula | B2 = 42 (consumo diario), B3 = 4 (plazo), B4 = 27,28 (desviación diaria), B5 = 1,645 (z). En B7, el punto de pedido con el stock de seguridad redondeado hacia arriba, usando nombres dentro de la fórmula | `=LET(d;B2;L;B3;s;B4;z;B5;d*L+REDONDEAR.MAS(z*s*RAIZ(L);0))` = **258** · `debe_usar`: LET | LET y modelado legible |

---

## 9. Alertas (lo que no hay que olvidar)

1. **Se agotó el cupo de búsquedas web** a mitad de la investigación. La parte «pruebas reales de selección en España» se apoya en lo que ya reunió `curriculo.md` §3 y en la prueba de Madrid, el MO-220 y el MO-230, que se han leído enteros hoy. Si se quiere más, hacen falta más búsquedas: casos de ETT (Randstad, Adecco), pruebas de grandes empresas españolas y más oposiciones con supuesto de Excel.
2. **La ayuda de Microsoft en español tiene errores de traducción** también en limpieza de datos: la página «Diez formas principales de limpiar los datos» llama **RECORTAR** a la función de quitar espacios; en Excel en español es **ESPACIOS** [VERIFICADO]. No hay que copiar nombres de esa página (ver `localizacion.md` §0).
3. **Festivos sin verificar.** Antes de generar los datos de P2 (y los días laborables de P3, P5 y P6) hay que sacar del BOE la resolución de fiestas laborales de 2026 y de 2027, los boletines de Aragón, Navarra y Cataluña y los festivos locales de Zaragoza, Pamplona y Lleida. En este documento solo se usan como seguros el 25/12, el 01/01, el 06/01, el 08/12 y el 01/05 (nacionales), y la Pascua: domingo 05/04/2026 y domingo 28/03/2027 [VERIFICADO: BOE-A-2025-21667, fiestas de 2026 con Viernes Santo el 03/04/2026, https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-21667; BOE-A-2026-21254, fiestas de 2027 con Viernes Santo el 26/03/2027, https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-21254].
4. **Rótulos del editor de Power Query en es-ES** sin verificar uno a uno: «Usar configuración regional», «Quitar filas superiores», «Usar la primera fila como encabezado», tipos de combinación («Externa izquierda», «Anti izquierda», «Externa completa»), «Anular dinamización de otras columnas», y también «Conexiones de informe» de las segmentaciones. Hay que comprobarlos en un Excel real antes de escribir las lecciones.
5. **DAX en un Excel en español**: las funciones DAX van en inglés (CALCULATE, DIVIDE…). El **separador de argumentos** (`;` o `,`) en Power Pivot con la configuración de España está [NO VERIFICABLE: no enseñarlo como dato]. Probarlo antes de publicar P8.
6. **Power Pivot solo en Windows.** P8 necesita plan B (tabla única + SUMAR.SI.CONJUNTO o AGRUPARPOR) y entregar en PDF a quien use Mac o iPad.
7. **Error silencioso probable en Power Query**: un texto «1234.56» convertido a número con la configuración es-ES puede acabar como 123456 (el punto se lee como separador de miles) [NO VERIFICABLE: no enseñarlo como dato; hay que probarlo]. Por eso P3 pide el control «Σ Total ≈ Σ Base × (1 + IVA)», que lo delata.
8. **La validación de datos no acepta referencias estructuradas**, y una **Tabla no crece en una hoja protegida** [VERIFICADO: https://learn.microsoft.com/en-us/answers/questions/4775077/using-a-tables-name-as-the-data-validation-source y https://learn.microsoft.com/en-us/answers/questions/5225737/why-dont-my-tablesauto-expand-when-table-is-protec (respuestas de la comunidad de Microsoft, no documentación oficial)]. P2 da la alternativa (rangos normales, Tabla dimensionada de antemano, o un nombre definido que apunte a Tabla[Columna] o INDIRECTO("Tabla[Columna]") como origen de la lista). Comprobarlo en Excel 365 y en Excel para la web.
9. **Detalles legales que hay que confirmar** antes de convertirlos en contenido:
   - que 30 días naturales equivalgan a 22 laborables (depende del convenio);
   - que una persona a tiempo parcial tenga los mismos días de vacaciones (ET art. 12.4.d);
   - el plazo de 6 meses para que el deterioro de clientes sea deducible (LIS art. 13.1);
   - el interés de demora del semestre (Ley 3/2004 art. 7: es un dato de entrada, no se escribe un tipo fijo);
   - las fechas del calendario fiscal (modelos 303 y 111) para la R2.
   **Verifactu**: la AEAT anunció el 05/10/2026 que se amplía el plazo de adaptación [VERIFICADO: sede de la AEAT]. No hay que poner fechas de Verifactu en los proyectos.
10. **Datos de salud (P2).** El RGPD prohíbe tratarlos salvo excepciones (art. 9.1) [VERIFICADO]. Los datos del proyecto deben usar observaciones **genéricas** («lumbalgia», «ansiedad»), solo como ejemplo de lo que hay que borrar. Nunca se combinan con nombres que puedan parecer reales.
11. **Nombres ficticios** (Electro Cierzo Suministros, Arnedo, Elecvía, Cables Tormes, Yesa, Tostadero Albada): comprobar en el BORME o con una búsqueda que no coinciden con empresas reales. El CIF ficticio lleva un dígito de control erróneo a propósito (§2).
12. **Las cifras exactas de P1 y P4 dependen de los datos de diseño.** Si alguien cambia un precio o una partida, hay que volver a ejecutar `work/proyectos/p1_calc.py` o `p4_calc.py` y actualizar este documento y `pN.json`.
13. **Fechas que caen en fin de semana**: la cuota del préstamo «del 25» de octubre de 2026 cae en domingo. El banco la carga el lunes 26 con fecha valor del 25. Es intencionado (P4) y sirve para enseñar la diferencia entre fecha valor y fecha de operación.
14. **Lo que la hoja en vivo no calcula** (`GUIA-AUTORES.md` §4): LAMBDA, AGRUPARPOR, PIVOTARPOR, REGEX, INDIRECTO, referencias estructuradas, referencias a otras hojas, tablas dinámicas, Power Query, gráficos, formato condicional, validación, macros. En cada ficha, el apartado «Hoja en vivo / .xlsx» separa lo que se practica en la web de lo que va en el libro.
15. **MO-220 y MO-230 solo existen en inglés.** Se usan como referencia de tareas reales, no como certificación recomendada si la alumna no sabe inglés (ver `curriculo.md`).
16. **No dar más peso a las macros que a Power Query**: en las ofertas españolas las macros son casi siempre «valorables» (`curriculo.md`). Por eso solo aparecen como opción en P5 y P8.
17. **Cada proyecto tiene una sola «conclusión defendible»**, no una única respuesta correcta en lo cualitativo (P1: precio frente a simplicidad; P7: qué es una desviación real). La tutora IA tiene que valorar el razonamiento con la rúbrica, no buscar una frase concreta.

---

## 10. Fuentes consultadas (14/11/2026)

**Primarias leídas hoy**
- Ayuntamiento de Madrid, supuesto de Excel para auxiliar administrativo (modelo C): https://www.madrid.es/UnidadWeb/Contenidos/Oposiciones/AuxAdtvo2020/ficheros/cexcel.pdf (texto en `raw/proyectos/madrid_cexcel.txt`)
- Certiport/Microsoft, objetivos del MO-220: https://arch-center.azureedge.net/Credentials/exam-mo-220-mos-excel-for-accounting-associate.pdf (`raw/proyectos/mo220.txt`)
- Certiport/Microsoft, objetivos del MO-230: https://arch-center.azureedge.net/Credentials/exam-mo-230-mos-excel-for-business-finance-associate.pdf (`raw/proyectos/mo230.txt`) · página de la certificación: https://learn.microsoft.com/en-us/credentials/certifications/mos-excel-for-business-finance-associate/
- TestGorilla, Microsoft Excel (Advanced): https://www.testgorilla.com/test-library/role-specific-skills-tests/microsoft-excel-advanced-test/
- Microsoft, Diez formas principales de limpiar los datos: https://support.microsoft.com/es-es/office/diez-formas-principales-de-limpiar-los-datos-2844b620-677c-47a7-ac3e-c2e157d1db19
- Microsoft, Importar datos de una carpeta con varios archivos (Power Query): https://support.microsoft.com/es-es/office/importar-datos-de-una-carpeta-con-varios-archivos-power-query-94b8023c-2e66-4f6b-8c78-6a00041c90e4
- Microsoft, Crear una previsión en Excel para Windows: https://support.microsoft.com/es-es/office/crear-una-previsi%C3%B3n-en-excel-para-windows-22c500da-6da7-45e5-bfdc-60a7062329fd
- Ley 3/2004 de morosidad (consolidada): https://www.boe.es/eli/es/l/2004/12/29/3/con
- Estatuto de los Trabajadores (consolidado, actualizado el 21/10/2026): https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430
- AEAT, sistemas de facturación VERI*FACTU (aviso de ampliación de plazos del 05/10/2026): https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu.html

**Primarias descargadas por otras líneas y leídas aquí** (`research/raw/empresa/`)
- ICAEW, Financial Modelling Code (2024): `fmc.pdf` (referencia icaew.com/financialmodelling)
- FAST Standard 02c (julio de 2019): `fast02c.pdf` (fast-standard.org)
- Panko (2015), «What We Don't Know About Spreadsheet Errors Today»: `panko2016.txt` (https://arxiv.org/pdf/1602.02601.pdf)
- AEB/CECA, Norma 43 «Información normalizada de cuenta corriente» (junio de 2012): `n43.pdf`
- Plan General de Contabilidad, RD 1514/2007 (BOE-A-2007-19884): `pgc.html` (https://www.boe.es/buscar/act.php?id=BOE-A-2007-19884)
- RGPD (DOUE-L-2016-80807): `rgpd_boe.html` (https://www.boe.es/buscar/doc.php?id=DOUE-L-2016-80807)
- AEAT, Tipos impositivos en el IVA 2026: `tiposiva2026.pdf`

**Documentos internos de la investigación**
- `curriculo.md` (§3 pruebas de selección, §5 niveles N0-N6) · `pedagogia.md` (§1.10 tareas completas, §2.5 prueba de nivel, errores E01-E28) · `excel-moderno.md` (versiones, Copilot, Power Query y Power Pivot por plataforma) · `localizacion.md` (nombres, separadores, CSV) · `es-referencia.json` (nombres, sintaxis, cinta, atajos) · `funciones-motor.txt` y `GUIA-AUTORES.md` (formato de `pN.json` y límites de la hoja en vivo).

**Comprobaciones propias**
- `research/work/proyectos/p1_calc.py` y `p4_calc.py` (cifras de P1 y P4).
- Cálculo en Python de: los días de la semana de las fechas clave; las semanas ISO de mayo a octubre de 2026; los días laborables de los ejemplos de P2; PAGO y PAGOINT del préstamo de 85.000 € (cuotas 19, 20 y 21, y PAGO.INT.ENTRE de la 10 a la 21); el ejemplo de stock de seguridad y punto de pedido de P6; el ejemplo de comisiones de R1.
