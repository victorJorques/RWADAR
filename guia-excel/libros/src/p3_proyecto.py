# -*- coding: utf-8 -*-
"""
P3 · genera proyectos/p3.json con las cifras de p3_controles.json (las calcula p3_solucion.py con
pandas desde los archivos sucios y las comprueba contra p3_verdad.json). Así ninguna cifra del
proyecto se copia a mano. Orden: p3_datos.py → p3_solucion.py → p3_proyecto.py.
"""
import json
import os
import re

import pandas as pd

AQUI = os.path.dirname(os.path.abspath(__file__))
LIBROS = os.path.dirname(AQUI)
EXCEL = os.path.dirname(LIBROS)
K = json.load(open(os.path.join(AQUI, "p3_controles.json"), encoding="utf-8"))


def eur(x):
    return f"{x:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") + " €"


def n0(x):
    return f"{int(x):,}".replace(",", ".")


def pc(x):
    return f"{x:.1f}".replace(".", ",") + " %"


def d1(x):
    return f"{x:.1f}".replace(".", ",")


T = K["por_tramo"]
TR = list(T)
PEND, ACTA, S430 = K["pendiente"], K["a_cuenta"], K["saldo430"]
top10_sum = sum(x[2] for x in K["top10"])
favor_sum = sum(x[2] for x in K["favor"])
bloq = K["bloqueado"]
tc = K["tipos_cobro"]

# Ejemplo real de cobro agrupado parcial (para la solución comentada)
fac = pd.read_csv(os.path.join(LIBROS, "p3-facturas-emitidas.csv"), sep=";", dtype=str, keep_default_na=False)
fac = fac[fac["NumFactura"] != "TOTAL GENERAL"].drop_duplicates()
tot = dict(zip(fac["NumFactura"], fac["TotalFactura"].astype(float)))
ffe = dict(zip(fac["NumFactura"], fac["FechaFactura"]))
cob = pd.read_csv(os.path.join(LIBROS, "p3-cobros-2026.csv"), sep=";", dtype=str, keep_default_na=False)
ej = None
for r in cob[cob["NumFactura"] == ""].itertuples():
    refs = re.findall(r"\b[FR]2[56]-\d{6}\b", r.Concepto)
    imp = float(r.Importe.replace(",", "."))
    if len(refs) >= 3 and imp < round(sum(tot[n] for n in refs), 2) - 0.005:
        ej = (r, refs, imp)
        break
r, refs, imp = ej
refs = sorted(refs, key=lambda n: (ffe[n][6:] + ffe[n][3:5] + ffe[n][:2], n))
filas_ej, previo = [], 0.0
for n in refs:
    ap = round(min(tot[n], max(0.0, imp - previo)), 2)
    filas_ej.append(f"| {n} | {ffe[n]} | {eur(tot[n])} | {eur(previo)} | {eur(ap)} | {eur(round(tot[n] - ap, 2))} |")
    previo += tot[n]
EJEMPLO = (f"Ejemplo real: el cobro **{r.IdCobro}** del {r.FechaCobro} trae {eur(imp)} y en el concepto «{r.Concepto}». "
           f"Lo citado suma {eur(round(sum(tot[n] for n in refs), 2))}: no llega, así que se aplica de la más antigua a la más reciente.\n\n"
           "| Documento | Fecha | Total | Más antiguos del cobro | Aplicado | Queda |\n|---|---|---:|---:|---:|---:|\n" + "\n".join(filas_ej))

tabla_tramos = "| Tramo (desde el vencimiento) | Pendiente | % |\n|---|---:|---:|\n" + "\n".join(
    f"| {t} | {eur(T[t])} | {pc(K['pct_tramo'][t])} |" for t in TR) + f"\n| **Total** | **{eur(PEND)}** | **100 %** |"
tabla_top = "| Código | Cliente | Vencido > 60 días |\n|---|---|---:|\n" + "\n".join(f"| {c} | {n} | {eur(v)} |" for c, n, v in K["top10"])
tabla_sup = "| Código | Cliente | Saldo | Límite | Exceso |\n|---|---|---:|---:|---:|\n" + "\n".join(
    f"| {c} | {n}{' (bloqueado)' if e == 'Bloqueado' else ''} | {eur(s)} | {eur(l)} | {eur(x)} |" for c, n, s, l, x, e in K["supera"])
tabla_ley = "| Código | Cliente | Días pactados | Saldo |\n|---|---|---:|---:|\n" + "\n".join(
    f"| {c} | {n} | {int(dp)} | {eur(s)} |" for c, n, dp, s in K["ley"])

CAL = f"""| Código | Problema | Filas | Decisión |
|---|---|---:|---|
| Q19 | CSV en UTF-8 con «ñ» y tildes | todo | Importar con 65001: Unicode (UTF-8) y punto y coma |
| Q10 | Fila «TOTAL GENERAL» al final ({eur(K['total_csv'])}, con los duplicados dentro) | 1 | Quitarla |
| Q01 | Duplicados exactos del {K['duplicados_fechas'][0]} y del {K['duplicados_fechas'][1]} (exportación en dos tandas) | {K['duplicados']} | Comprobar que son idénticos y quitarlos por NumFactura ({eur(K['duplicados_eur'])}) |
| Q05 | TotalFactura con punto decimal; Base y Cuota con coma | {n0(K['n_docs'])} | TotalFactura con configuración regional Inglés (EE. UU.) |
| Q04 | CodCliente con espacios al final | {K['espacios']} | Recortar |
| Q16 | «C0O45» con letra O | {K['o45']} | Corregir a C0045 (visto bueno de Marta) |
| Q16 | C0322 y C0323 no están en el maestro | {K['altas_docs']} | Añadir las fichas de Altas_ERP |
| Q17 | Total ≠ Base + Cuota: 4 por ±0,01 y {K['anomalias'][-1]['NumFactura']} por +100,00 € | 5 | Redondeos tolerados; la de 100 € se comunica |
| Q09 | FechaVencimiento vacía | {K['venc_vacio']} | FechaFactura + días de FormasPago |
| Q07 | Fechas ISO (AAAA-MM-DD) en una tanda de marzo | {K['iso']} | Convertir a fecha |
| Q03 | IVA 0 % a C0321 (Portugal) | 6 | No es un error: entrega intracomunitaria |
| Q21 | Cobros sin NumFactura: {tc['Agrupado']} agrupados, {tc['Factura en el concepto']} con una factura en el concepto, {tc['A cuenta']} a cuenta | {tc['Agrupado'] + tc['Factura en el concepto'] + tc['A cuenta']} | Tabla Aplicaciones ({K['filas_aplicaciones']} filas) y línea de entregas a cuenta |
| Q14 | Devoluciones de recibo en negativo ({K['devol_antes']} antes del corte) | {tc['Devolución']} | Restan del cobrado: reabren la factura |
| — | Cobros posteriores al 31/10 | {K['cobros_nov']} | No cuentan ({eur(K['cobros_nov_eur'])}) |
| — | CodCliente vacío en cobros | {K['cod_vacio']} | No afecta: se aplican por número de factura |
| — | Cliente bloqueado {bloq[0]} con facturas posteriores al bloqueo | {bloq[2]} | Se comunica ({eur(bloq[4])} pendientes) |"""

P = {
    "id": "p3",
    "titulo": "Facturas, cobros y antigüedad de saldos",
    "departamento": "Administración y finanzas",
    "nivel_requerido": "n3",
    "horas": 7,
    "resumen": "Convierte el listado de facturas del ERP y los cobros de contabilidad en la antigüedad de saldos a 31/10/2026, cuadrada con la cuenta 430: cobros agrupados, devoluciones, tramos, riesgo, Ley 3/2004 y periodo medio de cobro, y déjalo listo para repetirlo cada mes en una hora.",
    "habilidades": ["Importar CSV (UTF-8 y configuración regional)", "Power Query", "Limpieza y perfilado de datos", "BUSCARX con «HUÉRFANO»",
                    "SUMAR.SI.CONJUNTO con fecha de corte", "Aplicación de cobros", "Tramos con búsqueda aproximada", "Tablas dinámicas y segmentaciones",
                    "Filtro Diez mejores", "FILTRAR y ORDENARPOR", "Subtotales y esquema", "Ley 3/2004 y PMC", "Controles de cuadre"],
    "correo": {
        "de": "Marta Ruiz (Directora financiera)",
        "para": "ti",
        "asunto": "Lo que nos deben",
        "cuerpo": "Hola:\n\nEl martes tengo comité y quiero llevar cuánto nos deben los clientes a cierre de octubre, desde cuándo y quiénes me preocupan. Te adjunto el listado de facturas que saca el ERP y el de cobros de contabilidad; el maestro de clientes y el saldo de la 430 te los dejo en el libro de datos.\n\nPaco lo hacía a mano y tardaba dos días; a ver si lo dejas montado para que el mes que viene sea cosa de una hora.\n\nY que se vea lo de los 60 días, que el auditor nos dio un toque.\n\nMarta",
    },
    "preguntas_previas": {
        "pregunta": "Antes de abrir Excel: ¿qué le preguntarías a Marta? Escribe el correo con tus preguntas (de 5 a 8, concretas).",
        "modelo": "Hola, Marta:\n\nPara que el martes lleves justo lo que necesitas, antes de empezar:\n1. «Cierre de octubre»: ¿hago la foto a 31/10/2026? ¿Cuento los cobros de noviembre que ya han llegado?\n2. «Desde cuándo»: ¿cuento los días desde la fecha de factura o desde el vencimiento? ¿Qué tramos quieres?\n3. «Lo que nos deben»: ¿con IVA? ¿Qué hago con los abonos, con los cobros que no citan ninguna factura y con los clientes que tienen saldo a favor?\n4. Cuando un cobro paga varias facturas y no llega para todas, ¿a cuál lo aplico primero?\n5. «Me preocupan»: ¿con qué criterio? ¿Los que más deben vencido, los que superan su límite de riesgo…?\n6. «Lo de los 60 días»: ¿quieres ver los plazos pactados de más de 60 días (Ley 3/2004), el periodo medio de cobro o las dos cosas? ¿Con qué fórmula de PMC?\n7. ¿Con qué cifra de contabilidad tengo que cuadrar? ¿El saldo de la 430 a 31/10?\n8. ¿Cómo lo quieres para el comité: una página en PDF, el Excel o los dos?\n\nGracias,\n[tu nombre]",
        "criterios": ["Pregunta la fecha de corte y qué hacer con los cobros posteriores.",
                      "Pregunta desde cuándo se cuentan los días (vencimiento o factura) y qué tramos usar.",
                      "Pregunta si es con IVA y qué hacer con abonos, cobros sin identificar y saldos a favor.",
                      "Pide un criterio objetivo para «me preocupan» y para «lo de los 60 días».",
                      "Pregunta con qué cifra de contabilidad tiene que cuadrar.",
                      "Las preguntas son concretas, numeradas y van en un correo breve y educado."],
    },
    "aclaraciones": [
        {"pregunta": "«Cierre de octubre»: ¿cuentan los cobros de noviembre que ya han llegado?",
         "respuesta": "No. Foto a 31/10/2026: los cobros de noviembre se quedan fuera aunque ya estén en el archivo."},
        {"pregunta": "«Desde cuándo»: ¿desde la fecha de factura o desde el vencimiento? ¿Qué tramos?",
         "respuesta": "Desde el vencimiento: No vencido · 1-30 · 31-60 · 61-90 · 91-180 · más de 180 días. Para el auditor, también los días desde la factura. Si falta el vencimiento, calcúlalo con la forma de pago (los días que dice el texto; «Contado» = 0)."},
        {"pregunta": "«Lo que nos deben»: ¿con IVA? ¿Y los abonos, los cobros sin identificar y los saldos a favor?",
         "respuesta": "Con IVA. Los abonos restan a su cliente. Los cobros que no citan ninguna factura son entregas a cuenta: no los apliques a ninguna; van en una línea aparte, «Cobros a cuenta pendientes de aplicar». Contabilidad ya los tiene restados en la 430 de cada cliente. Los saldos a favor, en una lista aparte."},
        {"pregunta": "Si un cobro cita varias facturas y no llega para todas, ¿a cuál se aplica?",
         "respuesta": "Si el importe cubre todo lo que cita el concepto, da por cobrado cada documento entero (también los abonos citados, que restan). Si no llega, aplícalo primero a la factura más antigua (si tienen la misma fecha, a la de número menor)."},
        {"pregunta": "«Me preocupan»: ¿con qué criterio?",
         "respuesta": "El top 10 por importe vencido a más de 60 días y todos los que superan su límite de riesgo: su saldo, ya descontadas sus entregas a cuenta, frente a LimiteRiesgo."},
        {"pregunta": "«Lo de los 60 días»: ¿qué quieres ver? ¿Con qué PMC?",
         "respuesta": "Los clientes con condiciones pactadas de más de 60 días, que la Ley 3/2004 no permite (art. 4.3: ningún pacto puede pasar de 60 días naturales), y el PMC. Usa este: saldo de clientes de la 430 / facturación con IVA, neta de abonos, de agosto a octubre × 92 días. Sé que hay otras fórmulas; esta es la que quiero, y que se diga en el informe."},
        {"pregunta": "¿Con qué cifra tengo que cuadrar?",
         "respuesta": "Con el saldo de la cuenta 430 a 31/10/2026 que da contabilidad (hoja Contabilidad del libro de datos). Pásalo a tu hoja Parámetros."},
        {"pregunta": "Hay códigos de cliente que no están en el maestro. ¿Qué hago?",
         "respuesta": "«C0O45» es una errata del ERP: es C0045. Corrígelo y apúntalo. Los dos clientes nuevos de octubre están en la hoja Altas_ERP: añádelos al maestro."},
        {"pregunta": "¿En qué formato lo quieres?",
         "respuesta": "Una página en PDF para el comité y el Excel con el detalle para Administración."},
    ],
    "datos_md": "Guarda los tres archivos **sin abrirlos** en una carpeta `Clientes\\2026-10\\`:\n\n| Archivo | Qué es |\n|---|---|\n| `p3-facturas-emitidas.csv` | Facturas y abonos que saca el ERP: 2.651 filas. NumFactura (F26-000123; abonos R26, en negativo; F25 de 2025 que seguían pendientes al empezar el año), FechaFactura, CodCliente, NombreCliente, BaseImponible, TipoIVA, CuotaIVA, TotalFactura, FormaPago (texto, como «Transferencia 60 días») y FechaVencimiento |\n| `p3-cobros-2026.csv` | Cobros de 2026 que pasa contabilidad, exportados el 13/11/2026: IdCobro, FechaCobro, CodCliente, Importe, NumFactura, Concepto (el texto del banco), Medio y Remesa |\n| `p3-datos.xlsx` | Instrucciones · Clientes (maestro exportado el 30/09/2026, con días de pago pactados, límite de riesgo y estado) · Altas_ERP (fichas creadas en octubre) · Contabilidad (saldo de la cuenta 430 a 31/10/2026) |\n\nLos CSV vienen en UTF-8 con separador punto y coma: **impórtalos**, no los abras con doble clic.\n\nLo que tienes que esperar (no todo está dicho):\n- El ERP no exporta todos los importes igual, y el listado se sacó en dos tandas.\n- Al final del listado hay una fila que no es una factura.\n- Faltan vencimientos y hay fechas que no vienen como las demás.\n- Los códigos de cliente no siempre casan con el maestro, y el maestro es de antes de octubre.\n- Bastantes cobros no dicen qué factura pagan… salvo en el concepto del banco. Y no todos los cobros son positivos.\n- Algún «error» no lo es.",
    "archivos": [
        {"archivo": "p3-facturas-emitidas.csv", "titulo": "Facturas emitidas (ERP)", "descripcion": "2.651 filas, UTF-8, separador punto y coma."},
        {"archivo": "p3-cobros-2026.csv", "titulo": "Cobros de 2026 (contabilidad)", "descripcion": "Cobros exportados el 13/11/2026, UTF-8, separador punto y coma."},
        {"archivo": "p3-datos.xlsx", "titulo": "Maestro de clientes y saldo 430", "descripcion": "Instrucciones, Clientes, Altas_ERP y Contabilidad."},
    ],
    "pasos": [
        {"titulo": "1. Preguntar y preparar el libro",
         "md": "Manda tus preguntas a Marta y apunta sus respuestas en una hoja **Léame** (objetivo, fecha de corte, fuentes, supuestos). Deja los originales intactos en `Clientes\\2026-10\\` y crea `P3_Antiguedad_saldos_2026-10_v01.xlsx` con Léame, Parámetros, Calidad_datos, las hojas de datos, Informe y Controles.",
         "pista": "En **Parámetros** pon FechaCorte (31/10/2026), Saldo430 (hoja Contabilidad), el umbral de 60 días y el plazo legal de 60 días, en celdas amarillas con nombre definido (cuadro de nombres o Fórmulas > Administrador de nombres). Así ninguna fórmula lleva una fecha o una cifra escrita dentro."},
        {"titulo": "2. Importar los CSV",
         "md": "Trae los dos CSV con **Datos > Obtener y transformar datos > De texto/CSV** y **Transformar datos**. Al terminar, los importes tienen que ser números y las fechas, fechas.",
         "pista": "Origen del archivo: 65001: Unicode (UTF-8); delimitador: punto y coma. TotalFactura viene con punto decimal y el resto con coma: cambia su tipo con clic derecho > Cambiar tipo > Usar configuración regional… > Decimal, Inglés (Estados Unidos). Sin Power Query: Texto en columnas y `=VALOR.NUMERO(H2;\".\";\",\")`."},
        {"titulo": "3. Perfilar y limpiar las facturas",
         "md": "Cuenta filas, comprueba que NumFactura no se repite y busca filas que no son facturas, espacios, códigos sin pareja, fechas raras e importes que no cuadran. Anota cada problema en **Calidad_datos**: código, filas afectadas, importe y decisión.",
         "pista": "Antes de quitar duplicados, comprueba que las filas repetidas son idénticas en todas las columnas (en Power Query, Mantener filas > Mantener duplicados). Quítalos por NumFactura, nunca por cliente. Recorta CodCliente. Añade la columna `Total − (Base + Cuota)` y mira las que pasan de 0,01."},
        {"titulo": "4. Completar el maestro y el vencimiento",
         "md": "Añade las altas de octubre al maestro y trae el cliente de cada factura (lo que no esté debe decir «HUÉRFANO»). Calcula los vencimientos que faltan con una tabla **FormasPago** (texto → días).",
         "pista": "`=BUSCARX([@CodCliente];Clientes[CodCliente];Clientes[Nombre];\"HUÉRFANO\")`. Vencimiento: `=SI([@FechaVencimiento]=\"\";[@FechaFactura]+BUSCARV([@FormaPago];FormasPago;2;FALSO);[@FechaVencimiento])`."},
        {"titulo": "5. Clasificar los cobros y sacar las referencias",
         "md": "Clasifica cada cobro: con NumFactura (directo o devolución), con la factura solo en el concepto, agrupado (varias referencias) o a cuenta (ninguna). Lleva las referencias del concepto a una tabla **Aplicaciones** (IdCobro, NumFactura) con una fila por documento citado.",
         "pista": "Las referencias son F25-, F26- y también R26- (abonos), siempre de 10 caracteres. En Power Query: columna personalizada que parte el concepto en palabras y se queda con las que empiezan así; después, Expandir a nuevas filas. En Microsoft 365: `=REGEXEXTRACCION([@Concepto];\"[FR]2[56]-\\d{6}\";1)` (escribe =REGEX y elige la función de la lista)."},
        {"titulo": "6. Aplicar los cobros a la fecha de corte",
         "md": "Calcula el **Cobrado** de cada documento con los cobros hasta el 31/10/2026: los directos (las devoluciones restan) más lo que le toque en **Aplicaciones** según la regla de Marta. Después, **Pendiente** = Total − Cobrado y **Estado** (Cobrada, Parcial, Pendiente o Saldo a favor).",
         "pista": "Directos: `=SUMAR.SI.CONJUNTO(Cobros[Importe];Cobros[NumFactura];[@NumFactura];Cobros[FechaCobro];\"<=\"&FechaCorte)`. En Aplicaciones, por fila: si el cobro cubre la suma citada, el total del documento; si no, `MIN(total; MAX(0; importe − totales de los documentos más antiguos del mismo cobro))`."},
        {"titulo": "7. Días y tramos",
         "md": "Calcula los días vencidos (desde el vencimiento), los días desde la factura y el **tramo** con una tabla **Tramos** y búsqueda aproximada.",
         "pista": "`=SI([@DiasVencidos]<=0;\"0 · No vencido\";BUSCARX([@DiasVencidos];Tramos[Desde];Tramos[Tramo];;-1))` con Desde = 1, 31, 61, 91 y 181. Con BUSCARV, el cuarto argumento VERDADERO (su único uso correcto) y la tabla de menor a mayor. Los prefijos («1 · 1-30») hacen que se ordenen solos."},
        {"titulo": "8. Saldo por cliente y riesgo",
         "md": "Por cliente: pendiente, entregas a cuenta, saldo, vencido a más de 60 días y exceso sobre el límite. Saca la lista de los que superan su límite, de mayor a menor exceso, y la de saldos a favor.",
         "pista": "`=FILTRAR(…;Clientes[Saldo]>Clientes[LimiteRiesgo])` dentro de `ORDENARPOR(…;exceso;-1)`. Sin Microsoft 365: filtro y orden en la Tabla de clientes."},
        {"titulo": "9. Informe de antigüedad",
         "md": "Tabla dinámica con el cliente en filas, el tramo en columnas, la suma de Pendiente y el % del total; segmentaciones por delegación y comercial; top 10 del vencido a más de 60 días y gráfico de columnas apiladas.",
         "pista": "Insertar > Tabla dinámica. El % con Mostrar valores como > % del total general. Analizar tabla dinámica > Insertar segmentación de datos. Top 10: tramo filtrado a los tres de más de 60 días y Filtros de valor > Diez mejores. En Microsoft 365, también `=PIVOTARPOR(…;…;…;SUMA)`."},
        {"titulo": "10. Ley 3/2004 y periodo medio de cobro",
         "md": "Lista los clientes con más de 60 días pactados y cuenta los documentos cuyo vencimiento está a más de 60 días de la factura. Calcula el PMC con la definición de Marta y escríbela junto a la cifra.",
         "pista": "`=FILTRAR(Clientes;Clientes[DiasPago]>DiasMaxLey)`. PMC = saldo 430 / facturación con IVA del 01/08 al 31/10 × (FechaCorte − inicio + 1), con el inicio sin fechas a mano: `=FECHA.MES(FechaCorte;-3)+1`."},
        {"titulo": "11. Listado para el auditor",
         "md": "Pendientes ordenados por cliente, con un subtotal por cliente y el esquema contraído al nivel 2.",
         "pista": "Copia el detalle como valores (Subtotal no funciona dentro de una Tabla), ordena por cliente y usa **Datos > Esquema > Subtotal** (Para cada cambio en CodCliente, Suma, Pendiente). El total general tiene que dar el pendiente."},
        {"titulo": "12. Controles, informe de una página y entrega",
         "md": "Hoja **Controles** (esperado, obtenido, diferencia, tolerancia y estado) con el control maestro `=Y(…)` repetido en el Informe. Informe de una página en PDF con la fecha de corte en el título y Léame con «Cómo actualizar en noviembre». Intenta cerrar los controles en menos de 20 minutos.",
         "pista": "El control principal: Σ Pendiente − Σ entregas a cuenta = saldo 430 (diferencia 0,00). Si no cuadra, revisa por este orden: fecha de corte, cobros de noviembre, entregas a cuenta, devoluciones y duplicados."},
        {"titulo": "13. Cambio inesperado (cierre de noviembre)",
         "md": "Marta te escribe a primeros de diciembre:\n\n> Hola: en noviembre hemos dado de alta un cliente que paga con «Pagaré 120 días». Y para el comité quiero ver aparte lo que tiene más de un año: un tramo «más de 365». ¿Lo tienes en media hora? Marta\n\nResuélvelo sin rehacer nada y dile en tu respuesta lo que tiene que saber.",
         "pista": "Una fila en FormasPago (Pagaré 120 días → 120), una en Tramos (366 → «6 · Más de 365», y la anterior pasa a «5 · 181-365») y el alta en el maestro. Avísale de que 120 días supera el máximo de 60 de la Ley 3/2004 (art. 4.3): ese plazo no se puede pactar. Anótalo en el registro de cambios."},
    ],
    "controles": [
        {"pregunta": "Documentos (facturas y abonos) que quedan tras limpiar el CSV de facturas", "respuesta": K["n_docs"], "tolerancia": 0,
         "pista": "2.651 filas − la fila TOTAL GENERAL − los duplicados exactos del 1 y 2 de julio. Comprueba antes que son idénticos en todas las columnas."},
        {"pregunta": "Σ TotalFactura − (Σ BaseImponible + Σ CuotaIVA) de los documentos limpios (€)", "respuesta": K["dif_total"], "tolerancia": 0.01,
         "pista": "Son cinco facturas: cuatro redondeos de un céntimo y una de 100 €. Si te sale una diferencia de miles o millones, TotalFactura se ha leído con la configuración española, donde el punto es el separador de miles."},
        {"pregunta": "Pendiente de cobro de facturas y abonos a 31/10/2026, con IVA (€)", "respuesta": PEND, "tolerancia": 0.01,
         "pista": "Pendiente = Total − Cobrado, con los cobros hasta el 31/10 (las devoluciones restan del cobrado). Comprueba: este importe − las entregas a cuenta = saldo 430 de la hoja Contabilidad."},
        {"pregunta": "Entregas a cuenta sin factura recibidas hasta el 31/10/2026 (€)", "respuesta": ACTA, "tolerancia": 0.01,
         "pista": "Son los cobros sin NumFactura y sin ninguna referencia F25, F26 o R26 en el concepto."},
        {"pregunta": "Pendiente en el tramo de 91 a 180 días desde el vencimiento (€)", "respuesta": T["4 · 91-180"], "tolerancia": 0.01,
         "pista": "Días = FechaCorte − Vencimiento, no desde la factura. ¿Has calculado los 120 vencimientos que faltan con la forma de pago?"},
        {"pregunta": "Pendiente vencido a más de 60 días (€)", "respuesta": K["venc60"], "tolerancia": 0.01,
         "pista": f"Es la suma de los tramos 61-90, 91-180 y más de 180. Si te sale {eur(K['venc60_desde_factura'])}, has contado los días desde la fecha de factura."},
        {"pregunta": "Clientes cuyo saldo (pendiente − entregas a cuenta) supera su límite de riesgo", "respuesta": len(K["supera"]), "tolerancia": 0,
         "pista": "Necesitas las dos altas de octubre en el maestro y el saldo de cada cliente con sus entregas a cuenta restadas."},
        {"pregunta": "Periodo medio de cobro aproximado (días, con un decimal)", "respuesta": K["pmc"], "tolerancia": 0.1,
         "pista": f"Saldo 430 / facturación con IVA, neta de abonos, del 01/08 al 31/10 × 92. Con la facturación sin IVA saldría {d1(K['pmc_sin_iva'])}: no mezcles un saldo con IVA con ventas sin IVA."},
    ],
    "entregables": [
        "Libro `P3_Antiguedad_saldos_2026-10_v01.xlsx` con Léame, Parámetros, Calidad_datos, las Tablas de facturas, cobros, aplicaciones y clientes, la tabla dinámica con segmentaciones y gráfico, el Informe, el listado para el auditor y Controles con el control maestro en VERDADERO.",
        "PDF de una página para el comité, con la fecha de corte en el título.",
        "Listado de pendientes por cliente con subtotales para el auditor.",
        "Correo de entrega a Marta con 3 conclusiones con cifra, supuestos, avisos y propuestas.",
        "Tras el cambio de noviembre: el libro con la forma de pago y el tramo nuevos, el registro de cambios al día y el aviso del plazo que no permite la ley.",
    ],
    "rubrica": [
        {"criterio": "Exactitud", "niveles": [
            "En desarrollo: no cuadra con la 430, o suma los duplicados del 1 y 2 de julio o la fila TOTAL GENERAL.",
            "Aceptable: cuadra en total, pero los tramos o los cobros agrupados están mal (días desde la factura, agrupados sin repartir).",
            "Bien: los 8 controles cuadran dentro de la tolerancia; devoluciones, abonos, entregas a cuenta y cobros de noviembre, bien tratados.",
            "Excelente: además, documenta con su importe la factura de los 100 €, el cliente bloqueado que sigue facturando y los saldos a favor, y deja el IVA 0 % de Portugal como está."]},
        {"criterio": "Estructura", "niveles": [
            "En desarrollo: datos pegados a mano y la fecha de corte escrita dentro de las fórmulas.",
            "Aceptable: detalle y resumen separados, pero con la fecha de corte o los tramos escritos dentro de las fórmulas.",
            "Bien: Tablas de FormasPago, Tramos y Aplicaciones; parámetros con nombre; una fórmula por columna.",
            "Excelente: además, hoja Calidad_datos con filas e importes, flujo de izquierda a derecha y un Léame con el que otra persona lo actualiza sin preguntar."]},
        {"criterio": "Automatización y mantenimiento", "niveles": [
            "En desarrollo: el mes siguiente hay que repetirlo todo.",
            "Aceptable: hay que pegar los datos nuevos y ampliar rangos a mano.",
            "Bien: se sustituyen los CSV, Actualizar todo ([[Ctrl]]+[[Alt]]+[[F5]]) y se cambia la fecha de corte; tramos y formas de pago se cambian en una tabla; el cambio de noviembre sale en menos de 30 minutos.",
            "Excelente: además, los controles avisan solos de cobros que citan facturas que no existen, clientes sin pareja y formas de pago sin días."]},
        {"criterio": "Presentación", "niveles": [
            "En desarrollo: el informe es el listado de 2.600 filas.",
            "Aceptable: tabla dinámica con los tramos desordenados o sin formato de euros; no cabe en una página.",
            "Bien: una página con total, cuadre con la 430, tramos con %, top 10, excesos de riesgo, Ley 3/2004, PMC y gráfico.",
            "Excelente: además, lo importante va primero, el estado de los controles se lee sin depender del color, el gráfico tiene texto alternativo y el título lleva la fecha de corte dinámica."]},
        {"criterio": "Comunicación", "niveles": [
            "En desarrollo: no pregunta nada antes de empezar o entrega solo cifras.",
            "Aceptable: pregunta parte de lo ambiguo; cifras con algún comentario.",
            "Bien: 3 mensajes con cifra («el 12,7 % está vencido a más de 60 días…»), la Ley 3/2004, el PMC usado y los supuestos.",
            "Excelente: además, propone acciones (reclamar, bloquear, renegociar plazos, rectificar la factura de 100 €) y avisa de los límites de los datos."]},
    ],
    "correo_entrega": {
        "pregunta": "Escribe el correo con el que entregas el trabajo a Marta (máximo 15 líneas).",
        "modelo": (f"Asunto: Saldos de clientes a 31/10/2026 para el comité\n\nHola, Marta:\n\n"
                   f"Te dejo en Clientes\\2026-10 el libro P3_Antiguedad_saldos_2026-10_v01.xlsx y el PDF de una página. Cuadra al céntimo con la 430: "
                   f"{eur(PEND)} pendientes de facturas y abonos − {eur(ACTA)} de entregas a cuenta = {eur(S430)}.\n\n"
                   f"1. El {pc(K['pct_tramo'][TR[0]])} no está vencido, pero hay {eur(K['venc60'])} vencidos a más de 60 días ({pc(K['pct_venc60'])}). "
                   f"Diez clientes suman el {pc(top10_sum / K['venc60'] * 100)} de esa cifra, y solo {K['top10'][0][1].split(',')[0]} ({K['top10'][0][0]}) debe {eur(K['top10'][0][2])}. Propongo reclamarles esta semana.\n"
                   f"2. {len(K['supera'])} clientes superan su límite: " + ", ".join(f"{x[1].split(',')[0]} (+{eur(x[4])})" for x in K["supera"]) +
                   f". El cliente {bloq[1].split(',')[0]} está bloqueado desde el 15/06 y aun así se le han emitido {bloq[2]} facturas ({eur(bloq[3])}), todas sin cobrar.\n"
                   f"3. {len(K['ley'])} clientes tienen pactados 75 o 90 días, más de los 60 que permite la Ley 3/2004 (art. 4.3), con {eur(K['pend_plazo'])} pendientes: habría que renegociarlos. "
                   f"El PMC aproximado es de {d1(K['pmc'])} días (saldo 430 / facturación con IVA de agosto a octubre × 92).\n\n"
                   f"Avisos: la factura {K['anomalias'][-1]['NumFactura']} tiene 100,00 € más de total que base + IVA (¿rectificativa?) y {len(K['favor'])} clientes tienen saldo a favor "
                   f"({eur(-favor_sum)}) por abonos sin compensar. Supuestos: foto a 31/10 sin los cobros de noviembre, con IVA y días desde el vencimiento.\n\n"
                   f"El mes que viene: cambiar los CSV y la fecha de corte, Actualizar todo y mirar Controles.\n\nUn saludo,\n[tu nombre]"),
        "criterios": ["Las cifras coinciden con las del libro (pendiente, cuadre con la 430, vencido a más de 60 días, excesos y PMC).",
                      "Da 3 conclusiones con cifra y una propuesta de acción.",
                      "Menciona la Ley 3/2004 y dice qué PMC se ha usado.",
                      "Avisa de la factura de 100 €, del cliente bloqueado y de los saldos a favor, y dice los supuestos (fecha de corte, con IVA, días desde el vencimiento).",
                      "Es breve y dice cómo se actualiza el mes que viene."],
    },
    "archivo_solucion": "p3-solucion.xlsx",
}

SOL = f"""### La idea
Power Query trae y limpia los dos CSV; una consulta **Aplicaciones** saca de los conceptos del banco qué documentos paga cada cobro; la Tabla **Facturas** calcula con fórmulas el cobrado a la fecha de corte, el pendiente, los días y el tramo; la hoja **Controles** dice si todo cuadra con la 430. El mes siguiente: cambiar los CSV y la fecha de corte y pulsar **Datos > Actualizar todo** ([[Ctrl]]+[[Alt]]+[[F5]]).

El libro resuelto (`p3-solucion.xlsx`) trae las Tablas tal como las cargan las consultas, las columnas calculadas con sus fórmulas, el Informe de una página, el listado para el auditor, los Controles y la hoja **Cómo se hizo** con el código de las consultas y los pasos de la tabla dinámica.

### 1. Lo que había en los datos (hoja Calidad_datos)
{CAL}

### 2. Importar y limpiar
1. **Datos > Obtener y transformar datos > De texto/CSV**, Origen del archivo **65001: Unicode (UTF-8)**, delimitador **Punto y coma**, **Transformar datos**.
2. Filtra NumFactura distinto de «TOTAL GENERAL». Comprueba con **Mantener filas > Mantener duplicados** que las {K['duplicados']} repetidas son idénticas y quítalas con **Quitar duplicados**. Quedan **{n0(K['n_docs'])} documentos** ({n0(K['filas_csv'])} − 1 − {K['duplicados']}).
3. CodCliente: **Recortar** y reemplazar «C0O45» por «C0045». TotalFactura: **Cambiar tipo > Usar configuración regional** > Decimal, Inglés (Estados Unidos); BaseImponible y CuotaIVA, con Español (España).
4. Fechas: la tanda ISO de marzo se convierte aparte (en la hoja «Cómo se hizo» está la función que lee los dos formatos).
5. Columna de comprobación `=REDONDEAR([@TotalFactura]-([@BaseImponible]+[@CuotaIVA]);2)`: cinco documentos se salen; la suma de las diferencias es **{eur(K['dif_total'])}**.

### 3. Maestro y vencimiento
- Añade C0322 y C0323 de Altas_ERP a la Tabla Clientes. Después: `=BUSCARX([@CodCliente];Clientes[CodCliente];Clientes[Nombre];"HUÉRFANO")` no debe dar ningún «HUÉRFANO».
- Tabla **FormasPago** (FormaPago, Dias): Contado 0; Transferencia 30, 45, 60, 75 y 90; Recibo domiciliado 30 y 60; Confirming 60 y 90.
- En el libro, la FechaVencimiento del ERP se llama **VencimientoERP** para no confundirla con la calculada: `Vencimiento = SI([@VencimientoERP]="";[@FechaFactura]+BUSCARV([@FormaPago];FormasPago;2;FALSO);[@VencimientoERP])`.

### 4. Aplicar los cobros
- **Tipos de cobro**: {n0(tc['Directo'])} directos, {tc['Devolución']} devoluciones, {tc['Factura en el concepto']} con la factura solo en el concepto, {tc['Agrupado']} agrupados ({K['agrupados_parciales']} no cubren todo y {K['agrupados_con_abono']} citan un abono R26) y {tc['A cuenta']} entregas a cuenta. La tabla Aplicaciones tiene {K['filas_aplicaciones']} filas.
- **Cobrado** de cada documento:
  `=REDONDEAR(SUMAR.SI.CONJUNTO(Cobros[Importe];Cobros[NumFactura];[@NumFactura];Cobros[FechaCobro];"<="&FechaCorte)+SUMAR.SI.CONJUNTO(Aplicaciones[Aplicado];Aplicaciones[NumFactura];[@NumFactura];Aplicaciones[FechaCobro];"<="&FechaCorte);2)`
- En **Aplicaciones**: SumaCitada (suma de los totales citados en ese cobro), Previo, los totales de los documentos más antiguos del mismo cobro (`=SUMAR.SI.CONJUNTO(Aplicaciones[TotalDoc];Aplicaciones[IdCobro];[@IdCobro];Aplicaciones[FechaDoc];"<"&[@FechaDoc])`, más un segundo SUMAR.SI.CONJUNTO con la misma fecha y `"<"&[@NumFactura]` para desempatar), y
  `Aplicado = REDONDEAR(SI([@NRefs]=1;[@ImporteCobro];SI([@ImporteCobro]>=[@SumaCitada];[@TotalDoc];MIN([@TotalDoc];MAX(0;[@ImporteCobro]-[@Previo]))));2)`

{EJEMPLO}

- **Pendiente** = `REDONDEAR([@TotalFactura]-[@Cobrado];2)`. Estados: {n0(K['estados']['Cobrada'])} cobradas, {K['estados']['Pendiente']} pendientes, {K['estados']['Parcial']} parciales y {K['estados']['Saldo a favor']} abonos sin compensar.
- Las entregas a cuenta ({K['a_cuenta_n']}, {eur(ACTA)}) no se aplican: van en su línea.

### 5. Días y tramos
- `DiasVencidos = FechaCorte-[@Vencimiento]`; para el auditor, `DiasDesdeFactura = FechaCorte-[@FechaFactura]`.
- Tabla **Tramos** ordenada (Desde, Tramo): 0 «0 · No vencido», 1 «1 · 1-30», 31 «2 · 31-60», 61 «3 · 61-90», 91 «4 · 91-180», 181 «5 · Más de 180».
- `Tramo = SI([@DiasVencidos]<=0;INDICE(Tramos[Tramo];1);BUSCARV([@DiasVencidos];Tramos;2;VERDADERO))`, o `BUSCARX([@DiasVencidos];Tramos[Desde];Tramos[Tramo];;-1)`.

### 6. Resultados a 31/10/2026
| Concepto | Importe |
|---|---:|
| Pendiente de facturas y abonos | {eur(PEND)} |
| − Cobros a cuenta pendientes de aplicar | {eur(ACTA)} |
| **= Saldo de clientes (cuenta 430)** | **{eur(S430)}** |
| Vencido | {eur(K['vencido'])} ({pc(K['pct_vencido'])}) |
| Vencido a más de 60 días | {eur(K['venc60'])} ({pc(K['pct_venc60'])}) |
| Facturación con IVA del 01/08 al 31/10 | {eur(K['fact_pmc'])} |
| PMC aproximado | {d1(K['pmc'])} días |

{tabla_tramos}

**Top 10 vencido a más de 60 días** ({eur(top10_sum)}, el {pc(top10_sum / K['venc60'] * 100)} de ese vencido):

{tabla_top}

**Por encima de su límite de riesgo** (saldo = pendiente − entregas a cuenta):

{tabla_sup}

**Ley 3/2004**: {len(K['ley'])} clientes con más de 60 días pactados; {K['docs_plazo']} documentos con vencimiento a más de 60 días de la factura, con {eur(K['pend_plazo'])} pendientes.

{tabla_ley}

**Saldos a favor** (lista aparte): {"; ".join(f"{c} {n} ({eur(v)})" for c, n, v in K['favor'])}. Son abonos R26 sin compensar.

**Avisos**: {bloq[0]} ({bloq[1]}) está bloqueado desde el 15/06/2026 y tiene {bloq[2]} facturas posteriores ({eur(bloq[3])}), todas pendientes; además supera su límite y está en el top 10. La factura {K['anomalias'][-1]['NumFactura']} ({K['cien_cliente'][1]}) quedó con 100,00 € pendientes porque el total del ERP no es Base + Cuota.

### 7. Controles (todos en VERDADERO)
| Control | Esperado | Cómo se calcula |
|---|---|---|
| Documentos | {n0(K['n_docs'])} | `=FILAS(Facturas[NumFactura])` frente a filas − duplicados − total |
| NumFactura repetidos | 0 | `=SUMAPRODUCTO(--(CONTAR.SI(Facturas[NumFactura];Facturas[NumFactura])>1))` |
| Σ Total − (Σ Base + Σ Cuota) | 100,00 ± 0,04 | sale {eur(K['dif_total'])} |
| Σ por tramos = Σ Pendiente | {eur(PEND)} | total del Informe frente a `=SUMA(Facturas[Pendiente])` |
| Σ Cobrado = cobros con factura + aplicaciones | {eur(K['cobrado'])} | hasta FechaCorte |
| Cobros agrupados repartidos enteros | Σ aplicado = Σ importe | si no, la regla de reparto está mal |
| **Pendiente − a cuenta = saldo 430** | **{eur(S430)}** | diferencia 0,00 |
| Σ saldo por clientes = Σ Pendiente | {eur(PEND)} | detecta clientes fuera del maestro |
| Huérfanos, cobros que citan facturas inexistentes, formas de pago sin días | 0 | avisan solos el mes que viene |

Control maestro: `=Y(G6:G16)` con formato condicional, repetido en el Informe como «Controles: OK».

### 8. Informe, auditor y Léame
- **Informe** (una página, horizontal): título `="Lo que nos deben los clientes a "&TEXTO(DIA(FechaCorte);"00")&"/"&TEXTO(MES(FechaCorte);"00")&"/"&AÑO(FechaCorte)`, cifras clave, tramos con %, columnas apiladas por delegación y tramo (con texto alternativo), top 10 con `=TOMAR(ORDENARPOR(APILARH(Clientes[[CodCliente]:[Nombre]];Clientes[VencidoMas60]);Clientes[VencidoMas60];-1);10)`, excesos, Ley 3/2004, saldos a favor y avisos.
- **Tabla dinámica** (hoja «Cómo se hizo»): NombreMaestro en filas, Tramo en columnas, suma de Pendiente y % del total general; segmentaciones de Delegacion y Comercial; Diez mejores con los tramos de más de 60 días.
- **Para_auditor**: {K['filas_auditor']} documentos pendientes de {K['clientes_con_saldo']} clientes, con **Datos > Esquema > Subtotal** y el esquema en el nivel 2. El total general da {eur(PEND)}.
- **Léame**: supuestos pactados, «Cómo actualizar en noviembre» y registro de cambios.

### 9. Cambio inesperado
Una fila en FormasPago («Pagaré 120 días», 120), una en Tramos (366, «6 · Más de 365», cambiando la etiqueta anterior a «5 · 181-365»), el alta del cliente y una línea en el registro de cambios. En el correo: el pagaré a 120 días **no se puede pactar** (Ley 3/2004, art. 4.3, máximo 60 días naturales) y hay que hablarlo con Comercial antes de aceptarlo."""
P["solucion_md"] = SOL
P["errores_tipicos"] = [
    f"Contar los días desde la factura y no desde el vencimiento: el vencido a más de 60 días sale {eur(K['venc60_desde_factura'])} en lugar de {eur(K['venc60'])}.",
    "BUSCARV aproximada (VERDADERO) con la tabla de tramos desordenada: los tramos salen cambiados sin ningún error visible.",
    f"Sumar los duplicados del 1 y 2 de julio ({K['duplicados']} facturas, {eur(K['duplicados_eur'])}) o la fila TOTAL GENERAL.",
    "Perder las devoluciones de recibo: la factura parece cobrada y el saldo no cuadra con la 430.",
    "Tratar el IVA 0 % de las facturas a Portugal como un error: es una entrega intracomunitaria.",
    "Quitar duplicados por cliente o por importe: borra facturas legítimas.",
    "Escribir 31/10/2026 dentro de las fórmulas: en noviembre hay que cambiarlas una a una.",
    "Buscar las referencias solo con «F2…»: los cobros agrupados que citan un abono R26 no se reparten bien.",
    f"Olvidar las entregas a cuenta (el saldo no cuadra con la 430 por {eur(ACTA)}) o aplicarlas a una factura sin que nadie lo haya decidido.",
    f"Contar los cobros de noviembre ({K['cobros_nov']} cobros, {eur(K['cobros_nov_eur'])}): la foto ya no es a 31/10.",
    f"Calcular el PMC con la facturación sin IVA frente a un saldo con IVA (sale {d1(K['pmc_sin_iva'])} días en lugar de {d1(K['pmc'])}).",
    "Calcular el % vencido como media de los porcentajes de cada cliente en lugar de vencido total / pendiente total.",
]
P["ampliaciones"] = [
    "**Deterioro de clientes** (MO-220, «bad debt expense»): un porcentaje por tramo, en la cuenta 694 contra la 490. Ojo con la regla fiscal: el art. 13.1.a de la LIS solo deja deducir el deterioro de un deudor concreto cuando han pasado 6 meses desde el vencimiento (o hay concurso, procesamiento por alzamiento de bienes o reclamación judicial) y excluye las estimaciones globales, como un % por tramo; solo las empresas de reducida dimensión pueden deducir una dotación global de hasta el 1 % de los deudores (art. 104 LIS).",
    "**Carta de reclamación** con los intereses de demora de la Ley 3/2004 (art. 7: tipo del BCE + 8 puntos; el tipo de cada semestre lo publica el BOE y es un dato de entrada) y los 40 € de costes de cobro del art. 8.",
    "Power Query: **Dividir columna > Por delimitador > en filas** para los cobros agrupados, y leer cada mes desde una carpeta.",
    "PIVOTARPOR (solo Microsoft 365) como informe con fórmulas frente a la tabla dinámica.",
    "Semáforo por cliente (formato condicional con iconos y una columna de texto) según el % de su saldo vencido a más de 60 días.",
]
salida = os.path.join(EXCEL, "proyectos", "p3.json")
with open(salida, "w", encoding="utf-8") as fh:
    json.dump(P, fh, ensure_ascii=False, indent=2)
    fh.write("\n")
print("escrito", salida)
print(P["correo_entrega"]["modelo"])
print(EJEMPLO)
