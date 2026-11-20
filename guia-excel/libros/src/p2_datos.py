# -*- coding: utf-8 -*-
"""
P2 · Vacaciones, ausencias y plantilla (RRHH) · DATOS DE PARTIDA
================================================================

Genera (carpeta libros/):
  p2-datos.xlsx               lo que Lucía pasa a la alumna: exportación de nóminas (texto),
                              las 4 hojas de vacaciones de los responsables y los festivos
                              de la gestoría. Primera hoja: «Instrucciones».
  p2-ausencias.xlsx           listado de ausencias de 2026 (SOLO RRHH: trae diagnósticos).
  p2-nomina-empleados.csv     la misma exportación de nóminas como CSV («;», UTF-8 con BOM).
  p2-ausencias-2026.csv       el mismo listado de ausencias como CSV («;», UTF-8 con BOM).
y (carpeta libros/src/, NO se entregan):
  p2_log_suciedad.csv         cada problema sembrado: hoja, fila, columna, problema, valor
                              verdadero y valor sembrado.
  p2_verdad.json              los datos «verdaderos» (limpios) y los totales de control
                              calculados con pandas a partir de ellos.

Empresa ficticia: Electro Cierzo Suministros, S.L. (Zaragoza, Pamplona y Lleida).
Encargo de Lucía Fernández (RRHH), lunes 16/11/2026. Meses cerrados: enero-octubre 2026.
Todas las personas son inventadas; los DNI llevan letra de control válida con números al azar.

FESTIVOS 2026 (comprobados el 14/11/2026 en fuentes oficiales)
--------------------------------------------------------------
- BOE-A-2025-21667 (BOE 28/10/2025, Resolución de 17/10/2025 de la Dirección General de
  Trabajo): nacionales y autonómicos de Aragón, Navarra y Cataluña. Tabla leída del PDF.
- Navarra: Resolución 390/2025 (BON 02/07/2025) fija 13 fiestas forales (incluye el
  03/12 San Francisco Javier, que no sale en la tabla del BOE) + 1 fiesta local por
  ayuntamiento (Resolución 682/2025, BON 241 de 02/12/2025). Pamplona: 07/07 San Fermín
  [comprobado en fuentes secundarias; el anexo del BON no se pudo descargar]. Por eso
  ningún periodo ni ausencia de Pamplona toca el 6-8/07 ni el 29-30/11: los controles
  no dependen de ese dato.
- Zaragoza: 29/01 San Valero y 05/03 Cincomarzada (BOA 20/11/2025; calendario del
  Ayuntamiento). Lleida: 11/05 Sant Anastasi y 29/09 Sant Miquel.
- 2027: solo Año Nuevo (01/01) y Epifanía (06/01); el calendario completo de 2027 llega
  en el «cambio inesperado».

PROBLEMAS DE CALIDAD SEMBRADOS (códigos de research/proyectos.md §3.5), cantidades exactas
-----------------------------------------------------------------------------------------
Hoja «Nomina_export» (y p2-nomina-empleados.csv): 62 filas = 59 contratos (58 personas;
E0047 tiene 2 contratos: se fue el 28/02/2026 y volvió el 04/05/2026) + 2 duplicados
exactos + 1 fila de total. Todo guardado como TEXTO, tal como sale del programa.
  Q01 ×2   duplicados exactos (la exportación se solapa: cada copia va justo debajo).
  Q10 ×1   última fila «Total empleados: 61».
  Q13 ×9   códigos sin el prefijo ni los ceros («12» en vez de «E0012»).
  Q04 ×14  dobles espacios (o espacio final) en ApellidosNombre.
  Q08      Departamento en 6 grafías para 2 departamentos: «Almacén», «almacen»,
           «ALMACÉN », «Almacén y Logística», «Admón.», «Administración»;
           Delegación «Zgz» ×3.
  Q07      FechaAlta/FechaBaja: 39 contratos en dd/mm/aaaa, 15 en aaaa-mm-dd (ISO) y
           5 en dd-mm-aa (todos de 2000 o después). Los 2 duplicados copian su fila.
  Q06      Jornada en formatos mezclados: «1», «100», «100%», «0,5», «50%», «75», «0,75».
Hojas de los responsables:
  Q12      «Vac_Administracion»: cuadrícula persona × día con «V» (formato ancho).
  Q16      Comercial y Almacén: nombres sin código y abreviados («Ana G.»);
           Administración: «Paco Gil» (en nóminas, «GIL BIELSA, francisco»).
  —        Comercial: 6 «Días» mal calculados a mano.
  Q10 ×7   Almacén: filas «Total Juan: 15» con la suma en la columna Días.
  Q11      Almacén: título combinado y nombre combinado en vertical para cada persona.
  Q17 ×2   1 periodo con Hasta < Desde (Comercial, fechas cruzadas) y 1 año «2062»
           (Almacén, debía ser 2026).
  Q08      Tipo en 4 grafías: «Vac.», «vacaciones», «V» y «AP» (asuntos propios: no
           descuentan vacaciones).
  Q21      «Vac_Direccion»: texto libre («del 3 al 21 de agosto»).
Hoja «Festivos_gestoria»:
  Q17 ×1   Sant Miquel (local de Lleida) con fecha 29/10/2026; la buena es 29/09/2026.
  Q16 ×1   falta un festivo autonómico de Aragón: 07/12/2026 (lunes siguiente al Día
           de la Constitución). Afecta al puente de diciembre en Zaragoza.
p2-ausencias.xlsx (y p2-ausencias-2026.csv):
  Q20 ×11  observaciones con información de salud (diagnósticos) que hay que borrar.
  —   ×3   bajas abiertas (Hasta vacía → se cuentan hasta el corte 31/10/2026).
  Q17 ×2   permisos con duración incoherente con el ET art. 37.3: matrimonio de 20 días
           (máx. 15 naturales) y traslado de 3 días (máx. 1).
  —   ×1   una IT empezó en 2025 (E0031, del 10/11/2025 al 16/01/2026): solo cuenta 2026.

REGLAS DE LIMPIEZA Y ACLARACIONES DE LUCÍA (con las que se calculan los controles)
-------------------------------------------------------------------------------
- Vacaciones: 22 días laborables (lunes a viernes, sin festivos de la delegación) por año
  completo; con alta o baja durante el año, 22 × días naturales de alta en 2026 / 365,
  redondeado AL MEDIO DÍA SUPERIOR. Para E0047 cuenta solo el contrato vigente (el primero
  se liquidó en su finiquito). Arrastre de 2025: solo E0031, 6 días. La jornada no cambia
  los días.
- Cada día de un periodo descuenta del año al que pertenece.
- Absentismo = días laborables de IT (IT_EC + IT_AT) / días laborables teóricos; teórico
  de cada mes = para cada contrato en alta el día 15, días laborables del mes en el
  calendario de su delegación. Los permisos no son absentismo. Enero-octubre de 2026.
"""
import csv
import datetime as dt
import json
import math
import os
import random
from fractions import Fraction

import pandas as pd
import xlsxwriter

random.seed(20261116)  # semilla fija
D = dt.date
AQUI = os.path.dirname(os.path.abspath(__file__))
LIBROS = os.path.dirname(AQUI)

ANIO = 2026
INI, FIN = D(2026, 1, 1), D(2026, 12, 31)
CORTE = D(2026, 10, 31)
DIAS_CONVENIO = 22

# --------------------------------------------------------------------------------------
# 1. FESTIVOS (los verdaderos)
# --------------------------------------------------------------------------------------
FESTIVOS = [  # (fecha, descripción, ámbito)
    (D(2026, 1, 1), "Año Nuevo", "Nacional"),
    (D(2026, 1, 6), "Epifanía del Señor", "Nacional"),
    (D(2026, 4, 3), "Viernes Santo", "Nacional"),
    (D(2026, 5, 1), "Fiesta del Trabajo", "Nacional"),
    (D(2026, 8, 15), "Asunción de la Virgen", "Nacional"),
    (D(2026, 10, 12), "Fiesta Nacional de España", "Nacional"),
    (D(2026, 12, 8), "Inmaculada Concepción", "Nacional"),
    (D(2026, 12, 25), "Natividad del Señor", "Nacional"),
    (D(2026, 4, 2), "Jueves Santo", "Aragón"),
    (D(2026, 4, 23), "San Jorge / Día de Aragón", "Aragón"),
    (D(2026, 11, 2), "Día siguiente a Todos los Santos", "Aragón"),
    (D(2026, 12, 7), "Lunes siguiente al Día de la Constitución Española", "Aragón"),
    (D(2026, 3, 19), "San José", "Navarra"),
    (D(2026, 4, 2), "Jueves Santo", "Navarra"),
    (D(2026, 4, 6), "Lunes de Pascua", "Navarra"),
    (D(2026, 11, 2), "Día siguiente a Todos los Santos", "Navarra"),
    (D(2026, 12, 3), "San Francisco Javier", "Navarra"),
    (D(2026, 4, 6), "Lunes de Pascua", "Cataluña"),
    (D(2026, 6, 24), "Sant Joan", "Cataluña"),
    (D(2026, 9, 11), "Diada Nacional de Catalunya", "Cataluña"),
    (D(2026, 12, 26), "Sant Esteve", "Cataluña"),
    (D(2026, 1, 29), "San Valero", "Local Zaragoza"),
    (D(2026, 3, 5), "Cincomarzada", "Local Zaragoza"),
    (D(2026, 7, 7), "San Fermín", "Local Pamplona"),
    (D(2026, 5, 11), "Sant Anastasi", "Local Lleida"),
    (D(2026, 9, 29), "Sant Miquel", "Local Lleida"),
    (D(2027, 1, 1), "Año Nuevo", "Nacional"),
    (D(2027, 1, 6), "Epifanía del Señor", "Nacional"),
]
AMBITOS = {"Zaragoza": {"Nacional", "Aragón", "Local Zaragoza"},
           "Pamplona": {"Nacional", "Navarra", "Local Pamplona"},
           "Lleida": {"Nacional", "Cataluña", "Local Lleida"}}
FEST = {dl: {f for f, _, a in FESTIVOS if a in amb} for dl, amb in AMBITOS.items()}
for dl in FEST:  # 14 festivos en 2026 por delegación (Navarra: 13 forales + 1 local)
    assert len([f for f in FEST[dl] if f.year == 2026]) == 14, dl


def laborable(d, dl, fest=None):
    fest = FEST if fest is None else fest
    return d.weekday() < 5 and d not in fest[dl]


def dias_lab(a, b, dl, fest=None):
    """Días laborables entre a y b, ambos incluidos (como DIAS.LAB.INTL(a;b;1;festivos))."""
    if a > b:
        return 0
    n, d = 0, a
    while d <= b:
        n += laborable(d, dl, fest)
        d += dt.timedelta(1)
    return n


def fin_tras_n(inicio, n, dl):
    """Último día laborable de un bloque de n laborables que empieza en «inicio»."""
    d, k = inicio, 0
    while True:
        if laborable(d, dl):
            k += 1
            if k == n:
                return d
        d += dt.timedelta(1)


def derecho(dias_alta, dias_anio=365):
    x = Fraction(DIAS_CONVENIO * dias_alta, dias_anio)
    return math.ceil(x * 2) / 2  # al medio día superior (MULTIPLO.SUPERIOR(x;0,5))


# Comprobaciones de los ejemplos de la ficha
assert dias_lab(D(2026, 8, 3), D(2026, 8, 21), "Zaragoza") == 15
assert dias_lab(D(2026, 12, 21), D(2026, 12, 31), "Zaragoza") == 8
assert dias_lab(D(2027, 1, 1), D(2027, 1, 8), "Zaragoza") == 4
assert derecho((FIN - D(2026, 3, 1)).days + 1) == 18.5
assert derecho((D(2026, 6, 15) - INI).days + 1) == 10.5

# --------------------------------------------------------------------------------------
# 2. PLANTILLA (maestro verdadero)
# --------------------------------------------------------------------------------------
NOMBRES_M = ["Jorge", "Daniel", "Pablo", "Sergio", "Alberto", "Rubén", "Óscar", "Iván", "Miguel",
             "Antonio", "José Luis", "Juan", "Carlos", "Fernando", "Raúl", "Diego", "Álvaro",
             "Ignacio", "Alejandro", "Hugo", "Mario", "Adrián", "Gonzalo", "Héctor", "Luis",
             "Manuel", "Roberto", "Santiago", "Enrique", "Tomás", "Ramón", "Joaquín"]
NOMBRES_F = ["Ana", "María", "Laura", "Elena", "Pilar", "Isabel", "Cristina", "Raquel", "Beatriz",
             "Sara", "Nuria", "Silvia", "Rosa", "Teresa", "Patricia", "Sonia", "Eva", "Inés",
             "Irene", "Alba", "Noelia", "Begoña", "Rocío", "Yolanda", "Marina", "Paula",
             "Andrea", "Natalia", "Esther", "Lorena", "Amparo", "Clara"]
NOMBRES_PAM = {"M": ["Mikel", "Iñaki", "Xabier", "Unai"], "F": ["Ainhoa", "Itziar", "Maite", "Leire"]}
NOMBRES_LLE = {"M": ["Jordi", "Marc", "Pau", "Oriol"], "F": ["Mireia", "Laia", "Montserrat", "Núria"]}
APELLIDOS = ["García", "López", "Martínez", "Sánchez", "Pérez", "Gómez", "Martín", "Jiménez",
             "Hernández", "Díaz", "Moreno", "Muñoz", "Álvarez", "Romero", "Navarro", "Torres",
             "Domínguez", "Serrano", "Blasco", "Lambán", "Aznar", "Lacasa", "Gracia", "Sanz",
             "Pardo", "Esteban", "Lorente", "Calvo", "Marín", "Ortiz", "Castillo", "Rubio",
             "Delgado", "Ramos", "Vicente", "Aragüés", "Lafuente", "Cebrián", "Lasierra",
             "Tello", "Bernal", "Escartín", "Casas", "Prados", "Urrea", "Benedí"]
APELLIDOS_PAM = ["Echeverría", "Goñi", "Iriarte", "Zubiri", "Arregui", "Elizalde", "Garcés", "Erro"]
APELLIDOS_LLE = ["Puig", "Vidal", "Roca", "Casals", "Font", "Pujol", "Badia", "Mas", "Solé", "Farré"]

LETRAS = "TRWAGMYFPDXBNJZSQVHLCKE"
usados_dni, usadas_abrev, nombres_almacen = set(), set(), set()


def dni():
    while True:
        n = random.randint(10_000_000, 79_999_999)
        if n not in usados_dni:
            usados_dni.add(n)
            return f"{n:08d}{LETRAS[n % 23]}"


def fecha_al_azar(a, b):
    return a + dt.timedelta(random.randint(0, (b - a).days))


# (código, departamento, delegación, puesto, sexo)  ·  los personajes de la guía van fijos
FIJOS = {
    1: ("Carmen", "Soler", "Ibáñez", "F", "Dirección", "Zaragoza", "Directora general", D(2009, 3, 2)),
    2: ("Marta", "Ruiz", "Ferrer", "F", "Dirección", "Zaragoza", "Directora financiera", D(2014, 9, 1)),
    3: ("Javier", "Ortega", "Lasheras", "M", "Dirección", "Zaragoza", "Director comercial", D(2012, 1, 16)),
    4: ("Andrés", "Molina", "Royo", "M", "Dirección", "Zaragoza", "Jefe de compras y almacén", D(2011, 5, 9)),
    5: ("Lucía", "Fernández", "Arnal", "F", "Administración", "Zaragoza", "Responsable de RRHH", D(2016, 2, 1)),
    6: ("Francisco", "Gil", "Bielsa", "M", "Administración", "Zaragoza", "Administrativo", D(1990, 10, 1)),
}
plan = []  # (cod, dept, deleg, puesto)
plan += [(c, "Dirección", "Zaragoza", None) for c in range(1, 5)]
plan += [(c, "Administración", "Zaragoza", None) for c in range(5, 15)]
plan += [(c, "Comercial", "Zaragoza", None) for c in range(15, 25)]
plan += [(c, "Comercial", "Pamplona", None) for c in range(25, 29)]
plan += [(c, "Comercial", "Lleida", None) for c in range(29, 33)]
plan += [(c, "Almacén", "Zaragoza", None) for c in range(33, 51)]
plan += [(c, "Almacén", "Pamplona", None) for c in range(51, 55)]
plan += [(c, "Almacén", "Lleida", None) for c in range(55, 59)]
PUESTOS = {
    "Administración": ["Técnico de contabilidad", "Administrativo contable", "Administrativo de facturación",
                       "Administrativo de cobros", "Técnico de nóminas", "Recepcionista", "Administrativo de compras",
                       "Técnico de administración"],
    "Comercial": ["Comercial de zona", "Comercial de mostrador", "Técnico comercial", "Comercial de cuentas clave"],
    "Almacén": ["Mozo de almacén", "Carretillero", "Preparador de pedidos", "Repartidor", "Oficial de almacén"],
}
FEM = {"Mozo de almacén": "Moza de almacén", "Carretillero": "Carretillera", "Preparador de pedidos": "Preparadora de pedidos",
       "Repartidor": "Repartidora", "Oficial de almacén": "Oficiala de almacén", "Técnico comercial": "Técnica comercial",
       "Técnico de contabilidad": "Técnica de contabilidad", "Administrativo contable": "Administrativa contable",
       "Administrativo de facturación": "Administrativa de facturación", "Administrativo de cobros": "Administrativa de cobros",
       "Técnico de nóminas": "Técnica de nóminas", "Administrativo de compras": "Administrativa de compras",
       "Técnico de administración": "Técnica de administración"}

personas = []  # una por persona
for cod, dept, dl, _ in plan:
    if cod in FIJOS:
        nom, a1, a2, sexo, dept, dl, puesto, alta = FIJOS[cod]
    else:
        while True:
            sexo = random.choice("MF")
            if dl == "Pamplona" and random.random() < 0.6:
                nom = random.choice(NOMBRES_PAM[sexo]); a1 = random.choice(APELLIDOS_PAM)
            elif dl == "Lleida" and random.random() < 0.6:
                nom = random.choice(NOMBRES_LLE[sexo]); a1 = random.choice(APELLIDOS_LLE)
            else:
                nom = random.choice(NOMBRES_M if sexo == "M" else NOMBRES_F); a1 = random.choice(APELLIDOS)
            a2 = random.choice(APELLIDOS + APELLIDOS_PAM + APELLIDOS_LLE)
            abrev = f"{nom} {a1[0]}."
            if a2 == a1 or abrev in usadas_abrev or (dept == "Almacén" and nom in nombres_almacen):
                continue
            if nom in ("Carmen", "Marta", "Javier", "Andrés", "Lucía", "Francisco", "Paco"):
                continue
            break
        if dept == "Comercial" and cod in (15, 25, 29):
            puesto = "Delegado comercial" if sexo == "M" else "Delegada comercial"
        elif dept == "Almacén" and cod in (33, 51, 55):
            puesto = "Jefe de almacén" if sexo == "M" else "Jefa de almacén"
        else:
            puesto = random.choice(PUESTOS[dept])
            if sexo == "F":
                puesto = FEM.get(puesto, puesto)
        alta = fecha_al_azar(D(2003, 1, 1), D(2025, 6, 30))
    usadas_abrev.add(f"{nom} {a1[0]}.")
    if dept == "Almacén":
        nombres_almacen.add(nom)
    personas.append(dict(cod=f"E{cod:04d}", n=cod, nombre=nom, ap1=a1, ap2=a2, sexo=sexo, dept=dept, deleg=dl,
                         puesto=puesto, nif=dni()))

P = {p["cod"]: p for p in personas}
# Contratos (una fila por contrato)
contratos = []
for p in personas:
    n = p["n"]
    alta = FIJOS[n][7] if n in FIJOS else None
    if alta is None:
        alta = fecha_al_azar(D(2003, 1, 1), D(2025, 6, 30))
    baja = None
    jornada = 1.0
    if n == 6: baja = D(2026, 6, 15)            # Paco Gil se jubila
    if n == 40: baja = D(2026, 3, 31)           # baja voluntaria
    if n == 20: baja = D(2026, 9, 30)           # baja voluntaria
    if n == 49: alta = D(2026, 3, 1)            # alta 2026 (ejemplo 18,5)
    if n == 58: alta = D(2026, 7, 1)            # alta 2026 (sustituye a la vacante)
    if n in (10, 19, 37, 44, 53):
        jornada = random.choice([0.5, 0.75])
    if n == 47:                                 # recontratación
        contratos.append(dict(cod=p["cod"], alta=D(2024, 2, 1), baja=D(2026, 2, 28), jornada=1.0, contrato=1))
        contratos.append(dict(cod=p["cod"], alta=D(2026, 5, 4), baja=None, jornada=1.0, contrato=2))
        continue
    contratos.append(dict(cod=p["cod"], alta=alta, baja=baja, jornada=jornada, contrato=1))
assert len(contratos) == 59 and len(personas) == 58


def contrato_vigente(cod):
    """Contrato que cuenta para las vacaciones de 2026: el último con días en 2026."""
    cs = [c for c in contratos if c["cod"] == cod and c["alta"] <= FIN and (c["baja"] is None or c["baja"] >= INI)]
    return cs[-1]


def activo(cod, dia):
    return any(c["alta"] <= dia and (c["baja"] is None or c["baja"] >= dia) for c in contratos if c["cod"] == cod)


ACTIVOS = [p["cod"] for p in personas if activo(p["cod"], CORTE)]
assert len(ACTIVOS) == 55

# --------------------------------------------------------------------------------------
# 3. VACACIONES Y ASUNTOS PROPIOS (verdaderos)
# --------------------------------------------------------------------------------------
periodos = []  # dict(cod, tipo, desde, hasta)
ocupado = {p["cod"]: set() for p in personas}
PROHIBIDO_PAM = {D(2026, 7, 6), D(2026, 7, 7), D(2026, 7, 8), D(2026, 11, 29), D(2026, 11, 30)}


def rango(a, b):
    return [a + dt.timedelta(i) for i in range((b - a).days + 1)]


def libre(cod, a, b, margen=2):
    dl = P[cod]["deleg"]
    for d in rango(a - dt.timedelta(margen), b + dt.timedelta(margen)):
        if d in ocupado[cod]:
            return False
    if dl == "Pamplona" and any(d in PROHIBIDO_PAM for d in rango(a, b)):
        return False
    return True


def poner(cod, tipo, a, b):
    assert libre(cod, a, b, margen=0), (cod, a, b)
    periodos.append(dict(cod=cod, tipo=tipo, desde=a, hasta=b))
    ocupado[cod].update(rango(a, b))


# Periodos fijos (casos de la ficha y problemas que tienen que aparecer)
poner("E0001", "Vacaciones", D(2026, 8, 3), D(2026, 8, 21))      # «del 3 al 21 de agosto»: 15
poner("E0001", "Vacaciones", D(2026, 12, 28), D(2026, 12, 31))
poner("E0002", "Vacaciones", D(2026, 4, 6), D(2026, 4, 10))
poner("E0002", "Vacaciones", D(2026, 8, 10), D(2026, 8, 21))
poner("E0002", "Vacaciones", D(2026, 12, 7), D(2026, 12, 11))    # puente: 3 laborables en Zaragoza
poner("E0003", "Vacaciones", D(2026, 7, 13), D(2026, 7, 24))
poner("E0003", "Vacaciones", D(2026, 12, 21), D(2027, 1, 8))     # cruza el año: 8 + 4
poner("E0004", "Vacaciones", D(2026, 8, 17), D(2026, 8, 28))
poner("E0004", "Vacaciones", D(2026, 10, 26), D(2026, 10, 30))
poner("E0004", "Vacaciones", D(2026, 12, 23), D(2026, 12, 24))
FIJOS_VAC = {"E0001", "E0002", "E0003", "E0004"}
# Administración: 3 personas a la vez del 28 al 31/12 (límite 2) -> alerta en el cuadrante
for c in ("E0007", "E0009", "E0012"):
    poner(c, "Vacaciones", D(2026, 12, 28), D(2026, 12, 31))
# Puente de diciembre en Zaragoza (el 07/12 falta en la hoja de la gestoría)
for c in ("E0011", "E0017", "E0036", "E0042"):
    poner(c, "Vacaciones", D(2026, 12, 7), D(2026, 12, 11))
# Lleida: un periodo que incluye el 29/09 y otro que incluye el 29/10 (fecha errónea)
poner("E0030", "Vacaciones", D(2026, 9, 28), D(2026, 10, 2))
poner("E0056", "Vacaciones", D(2026, 10, 26), D(2026, 10, 30))
# Cruce de año en Comercial (Zaragoza)
poner("E0016", "Vacaciones", D(2026, 12, 28), D(2027, 1, 5))

# Personas con baja abierta a 31/10 (se generan aquí para no planificarles vacaciones después)
BAJA_ABIERTA = {"E0039": D(2026, 9, 14), "E0022": D(2026, 10, 5), "E0057": D(2026, 10, 19)}

ARRASTRE = {"E0031": 6}


def dias_2026_de(cod):
    return sum(dias_lab(max(x["desde"], INI), min(x["hasta"], FIN), P[cod]["deleg"])
               for x in periodos if x["cod"] == cod and x["tipo"] == "Vacaciones")


def ventana(cod):
    c = contrato_vigente(cod)
    a = max(c["alta"], INI)
    b = min(c["baja"] or FIN, FIN)
    if cod in BAJA_ABIERTA:
        b = BAJA_ABIERTA[cod] - dt.timedelta(4)
    return a, b


def intentar_bloque(cod, n, desde, hasta, lunes=True, intentos=400):
    dl = P[cod]["deleg"]
    a0, b0 = ventana(cod)
    desde, hasta = max(desde, a0), min(hasta, b0)
    if desde > hasta:
        return False
    for _ in range(intentos):
        d = fecha_al_azar(desde, hasta)
        if lunes and d.weekday() != 0:
            continue
        if not laborable(d, dl):
            continue
        fin = fin_tras_n(d, n, dl)
        if fin > b0 or fin > FIN:
            continue
        if libre(cod, d, fin):
            poner(cod, "Vacaciones", d, fin)
            return True
    return False


SOBRANTE = {}
for p in personas:
    cod = p["cod"]
    if cod in FIJOS_VAC:
        continue
    a, b = ventana(cod)
    c = contrato_vigente(cod)
    dalta = (min(c["baja"] or FIN, FIN) - max(c["alta"], INI)).days + 1
    der = derecho(dalta)
    if cod in ACTIVOS:
        r = random.choices([0, 1, 2, 3, 4, 6, 7, 8], weights=[28, 24, 18, 10, 5, 5, 5, 5])[0]
    else:
        r = random.choice([0, 1])
    objetivo = math.floor(der + ARRASTRE.get(cod, 0) - r)
    hecho = dias_2026_de(cod)
    falta = max(0, objetivo - hecho)
    # verano
    if falta >= 10 and b >= D(2026, 7, 20):
        n = 15 if (falta >= 18 and random.random() < 0.45) else 10
        if intentar_bloque(cod, n, D(2026, 6, 29), D(2026, 9, 7)):
            falta -= n
    # Navidad / noviembre-diciembre (planificados), para ~2/3 de la plantilla activa
    if falta >= 2 and cod in ACTIVOS and cod not in BAJA_ABIERTA and random.random() < 0.7:
        n = min(falta, random.choice([2, 3, 4, 5]))
        if intentar_bloque(cod, n, D(2026, 11, 3), D(2026, 12, 21), lunes=random.random() < 0.6):
            falta -= n
    # resto, en bloques de 1 a 5 días entre febrero y octubre
    vueltas = 0
    while falta > 0 and vueltas < 60:
        vueltas += 1
        n = min(falta, random.choice([1, 2, 3, 4, 5, 5]))
        mes = random.choice([2, 3, 4, 5, 6, 9, 10, 10])
        ini_m = D(2026, mes, 1)
        fin_m = D(2026, mes, 28)
        if intentar_bloque(cod, n, ini_m, fin_m, lunes=(n >= 4)):
            falta -= n
    assert falta == 0, (cod, falta)

# Asuntos propios (no descuentan vacaciones): 3 en Comercial y 3 en Almacén
for cod, d in [("E0018", D(2026, 3, 13)), ("E0026", D(2026, 5, 22)), ("E0032", D(2026, 10, 16)),
               ("E0035", D(2026, 2, 20)), ("E0045", D(2026, 6, 12)), ("E0053", D(2026, 11, 20))]:
    assert laborable(d, P[cod]["deleg"]) and libre(cod, d, d), (cod, d)
    poner(cod, "Asuntos propios", d, d)

periodos.sort(key=lambda x: (x["cod"], x["desde"]))
for x in periodos:
    x["deleg"] = P[x["cod"]]["deleg"]
    x["dl_total"] = dias_lab(x["desde"], x["hasta"], x["deleg"])
    x["dl_2026"] = dias_lab(max(x["desde"], INI), min(x["hasta"], FIN), x["deleg"])
    x["dl_2027"] = dias_lab(max(x["desde"], D(2027, 1, 1)), x["hasta"], x["deleg"])
    x["disfrutados"] = dias_lab(max(x["desde"], INI), min(x["hasta"], CORTE), x["deleg"])
    assert x["dl_total"] == x["dl_2026"] + x["dl_2027"]

# --------------------------------------------------------------------------------------
# 4. AUSENCIAS 2026 (verdaderas)
# --------------------------------------------------------------------------------------
ausencias = []  # dict(cod, tipo, desde, hasta(None=abierta), obs)
ocup_aus = {p["cod"]: set() for p in personas}


def libre_aus(cod, a, b):
    if any(d in ocupado[cod] or d in ocup_aus[cod] for d in rango(a - dt.timedelta(1), b + dt.timedelta(1))):
        return False
    if P[cod]["deleg"] == "Pamplona" and any(d in PROHIBIDO_PAM for d in rango(a, b)):
        return False
    return all(activo(cod, d) for d in rango(a, b))


def poner_aus(cod, tipo, a, b, abierta=False):
    ausencias.append(dict(cod=cod, tipo=tipo, desde=a, hasta=None if abierta else b))
    ocup_aus[cod].update(rango(a, b))


poner_aus("E0031", "IT_EC", D(2025, 11, 10), D(2026, 1, 16))   # empezó en 2025 (origen del arrastre)
for cod, ini in BAJA_ABIERTA.items():
    poner_aus(cod, "IT_EC" if cod != "E0039" else "IT_AT", ini, CORTE, abierta=True)


def colocar_aus(cod, tipo, dur, solo_laborable_inicio=True, intentos=500, lunes=False):
    a0 = max(contrato_vigente(cod)["alta"], D(2026, 1, 2))
    if cod == "E0047":
        a0 = D(2026, 5, 4)
    b0 = CORTE - dt.timedelta(dur)
    if cod in BAJA_ABIERTA:
        b0 = min(b0, BAJA_ABIERTA[cod] - dt.timedelta(dur + 3))
    c = contrato_vigente(cod)
    if c["baja"]:
        b0 = min(b0, c["baja"] - dt.timedelta(dur))
    if a0 > b0:
        return None
    for _ in range(intentos):
        d = fecha_al_azar(a0, b0)
        if solo_laborable_inicio and d.weekday() >= 5:
            continue
        if lunes and d.weekday() != 0:
            continue
        fin = d + dt.timedelta(dur - 1)
        if libre_aus(cod, d, fin):
            poner_aus(cod, tipo, d, fin)
            return ausencias[-1]
    return None


def dur_it():
    r = random.random()
    if r < 0.58: return random.randint(1, 5)
    if r < 0.84: return random.randint(6, 15)
    if r < 0.95: return random.randint(16, 45)
    return random.randint(46, 110)


for p in personas:
    cod = p["cod"]
    k = random.choices([0, 1, 2, 3], weights=[34, 36, 20, 10])[0]
    for _ in range(k):
        colocar_aus(cod, "IT_EC", dur_it())
almacen = [p["cod"] for p in personas if p["dept"] == "Almacén" and p["cod"] not in ("E0040",)]
for cod in random.sample(almacen, 7):
    colocar_aus(cod, "IT_AT", random.randint(4, 40))
todos = [p["cod"] for p in personas]
for cod in random.sample(todos, 22):
    colocar_aus(cod, "PR_FALL", random.choice([2, 2, 2, 4]))
for cod in random.sample(todos, 18):
    colocar_aus(cod, "PR_ENF", 5, lunes=True)          # cinco días, de lunes a viernes
tras = None
for k, cod in enumerate(random.sample(todos, 9)):
    x = colocar_aus(cod, "PR_TRAS", 3 if k == 0 else 1)  # el primero, con 3 días (incoherente)
    if k == 0:
        tras = x
mat = None
for k, cod in enumerate(random.sample(todos, 3)):
    x = colocar_aus(cod, "PR_MAT", 20 if k == 0 else 15)  # el primero, con 20 días (incoherente)
    if k == 0:
        mat = x
for cod in random.sample(todos, 6):
    colocar_aus(cod, "PNR", random.randint(2, 10))
assert mat is not None and tras is not None
ausencias.sort(key=lambda x: (x["desde"], x["cod"]))
# no hay solapes entre ausencias de la misma persona
for cod in todos:
    xs = sorted([x for x in ausencias if x["cod"] == cod], key=lambda x: x["desde"])
    for u, v in zip(xs, xs[1:]):
        assert (u["hasta"] or CORTE) < v["desde"], (cod, u, v)

# Observaciones: 11 con información de salud (Q20) y otras neutras
SALUD = ["lumbalgia", "ansiedad", "gastroenteritis", "fractura de muñeca", "gripe con fiebre alta",
         "operación de rodilla", "migrañas", "depresión", "hernia discal", "esguince de tobillo",
         "bronquitis"]
NEUTRAS = ["Parte de baja recibido", "Parte de confirmación recibido", "Justificante entregado",
           "Avisó por teléfono", "Parte de alta entregado", "Documentación completa", "Pendiente de justificante"]
its = [x for x in ausencias if x["tipo"].startswith("IT")]
con_salud = random.sample(its, 11)
for x in ausencias:
    if x in con_salud:
        txt = SALUD[con_salud.index(x)]
        x["obs"] = random.choice([f"{txt.capitalize()}", f"Baja por {txt}", f"{txt.capitalize()}, según el parte",
                                  f"Dice que es {txt}"])
    else:
        x["obs"] = random.choice(NEUTRAS) if random.random() < 0.45 else ""
    x["deleg"] = P[x["cod"]]["deleg"]
    x["dept"] = P[x["cod"]]["dept"]

# --------------------------------------------------------------------------------------
# 5. TOTALES DE CONTROL (pandas, desde los datos verdaderos)
# --------------------------------------------------------------------------------------
dfp = pd.DataFrame(personas)
dfc = pd.DataFrame(contratos)
dfv = pd.DataFrame(periodos)
dfa = pd.DataFrame(ausencias)

c_personas = dfp["nif"].nunique()
c_activos = len(ACTIVOS)
vac = dfv[dfv["tipo"] == "Vacaciones"]
c_vac2026 = int(vac["dl_2026"].sum())

saldos = []
for p in personas:
    cod = p["cod"]
    c = contrato_vigente(cod)
    dalta = (min(c["baja"] or FIN, FIN) - max(c["alta"], INI)).days + 1
    der = derecho(dalta)
    usados = int(vac.loc[vac["cod"] == cod, "dl_2026"].sum())
    disf = int(vac.loc[vac["cod"] == cod, "disfrutados"].sum())
    saldos.append(dict(cod=cod, dias_alta=dalta, derecho=der, arrastre=ARRASTRE.get(cod, 0), disfrutados=disf,
                       planificados=usados - disf, saldo=der + ARRASTRE.get(cod, 0) - usados,
                       activo=cod in ACTIVOS))
dfs = pd.DataFrame(saldos)
assert (dfs["saldo"] >= 0).all()
c_derecho = float(dfs.loc[dfs["activo"], "derecho"].sum())
c_saldo = float(dfs.loc[dfs["activo"], "saldo"].sum())

# Absentismo
MESES = list(range(1, 11))


def fin_mes(m):
    return (D(ANIO, m, 28) + dt.timedelta(4)).replace(day=1) - dt.timedelta(1)


it_mes = {}  # (dept, mes) -> días
for x in ausencias:
    if not x["tipo"].startswith("IT"):
        continue
    h = x["hasta"] or CORTE
    for m in MESES:
        n = dias_lab(max(x["desde"], D(ANIO, m, 1)), min(h, fin_mes(m)), x["deleg"])
        it_mes[(x["dept"], m)] = it_mes.get((x["dept"], m), 0) + n
teo_mes = {}
for c in contratos:
    p = P[c["cod"]]
    for m in MESES:
        mitad = D(ANIO, m, 15)
        if c["alta"] <= mitad and (c["baja"] is None or c["baja"] >= mitad):
            teo_mes[(p["dept"], m)] = teo_mes.get((p["dept"], m), 0) + dias_lab(D(ANIO, m, 1), fin_mes(m), p["deleg"])
c_it = sum(it_mes.values())
c_teo = sum(teo_mes.values())
c_tasa = round(100 * c_it / c_teo, 2)
c_obs = 11

admin_v = int(vac[vac["cod"].map(lambda c: P[c]["dept"]) == "Administración"]["dl_2026"].sum())

CONTROLES = dict(personas=int(c_personas), activos=c_activos, vac2026=c_vac2026, derecho_activos=c_derecho,
                 saldo_activos=c_saldo, it_dias=int(c_it), teorico=int(c_teo), tasa_pct=c_tasa,
                 tasa_exacta=100 * c_it / c_teo, obs_salud=c_obs, admin_v=admin_v)

# --------------------------------------------------------------------------------------
# 6. SUCIEDAD: cómo llegan los datos
# --------------------------------------------------------------------------------------
log = []  # (archivo/hoja, fila excel, columna, problema, verdadero, sembrado)


def fmt_fecha(d, estilo):
    if d is None:
        return ""
    return {"dma": d.strftime("%d/%m/%Y"), "iso": d.strftime("%Y-%m-%d"), "dma2": d.strftime("%d-%m-%y")}[estilo]


# 6.1 Nómina
filas_nom = []
estilos = ["dma"] * 39 + ["iso"] * 15 + ["dma2"] * 5
idx_dma2 = [i for i, c in enumerate(contratos) if c["alta"].year >= 2000]
random.shuffle(estilos)
# los dd-mm-aa solo en altas de 2000 o después (siempre se cumple: todas son >= 2003, salvo Paco Gil)
for i, c in enumerate(contratos):
    if estilos[i] == "dma2" and c["alta"].year < 2000:
        j = next(k for k in range(len(estilos)) if estilos[k] == "dma" and contratos[k]["alta"].year >= 2000)
        estilos[i], estilos[j] = estilos[j], estilos[i]
cods_sin_prefijo = set(random.sample([p["cod"] for p in personas if p["n"] >= 10 and p["n"] != 47], 9))
dobles = set(random.sample([p["cod"] for p in personas], 14))
DEP_ALM = ["Almacén"] * 15 + ["almacen"] * 4 + ["ALMACÉN "] * 4 + ["Almacén y Logística"] * 4
DEP_ADM = ["Administración"] * 6 + ["Admón."] * 4
random.shuffle(DEP_ALM); random.shuffle(DEP_ADM)
zgz_cortas = set(random.sample([c["cod"] for c in contratos if P[c["cod"]]["deleg"] == "Zaragoza"], 3))
JORN_1 = ["1", "100", "100%", "1", "100"]
for i, c in enumerate(contratos):
    p = P[c["cod"]]
    cod_txt = c["cod"]
    if c["cod"] in cods_sin_prefijo:
        cod_txt = str(int(c["cod"][1:]))
        log.append(("Nomina_export", None, "CodEmpleado", "Q13 código sin prefijo", c["cod"], cod_txt))
    nom = f"{p['ap1'].upper()} {p['ap2'].upper()}, {p['nombre'].lower()}"
    if c["cod"] in dobles and c["contrato"] == 1:
        k = random.choice([0, 1, 2])
        sucio = [nom.replace(" ", "  ", 1), nom.replace(", ", ",  "), nom + " "][k]
        log.append(("Nomina_export", None, "ApellidosNombre", "Q04 espacios sobrantes", nom, sucio))
        nom = sucio
    if p["dept"] == "Almacén":
        dep = DEP_ALM.pop() if DEP_ALM else "Almacén"
    elif p["dept"] == "Administración":
        dep = DEP_ADM.pop()
    else:
        dep = p["dept"]
    if dep != p["dept"]:
        log.append(("Nomina_export", None, "Departamento", "Q08 grafía", p["dept"], dep))
    dl = p["deleg"]
    if c["cod"] in zgz_cortas and c["contrato"] == 1:
        dl = "Zgz"
        log.append(("Nomina_export", None, "Delegación", "Q08 grafía", "Zaragoza", "Zgz"))
    est = estilos[i]
    if est != "dma":
        log.append(("Nomina_export", None, "FechaAlta", f"Q07 fecha en formato {est}", c["alta"].isoformat(),
                    fmt_fecha(c["alta"], est)))
    if c["jornada"] == 1:
        jt = random.choice(JORN_1)
    elif c["jornada"] == 0.5:
        jt = random.choice(["0,5", "50%", "50"])
    else:
        jt = random.choice(["0,75", "75%", "75"])
    if jt not in ("1",):
        log.append(("Nomina_export", None, "Jornada", "Q06 formato de jornada", str(c["jornada"]).replace(".", ","), jt))
    filas_nom.append([cod_txt, p["nif"], nom, dep, dl, fmt_fecha(c["alta"], est), fmt_fecha(c["baja"], est), jt,
                      p["puesto"]])
assert not DEP_ADM and len(DEP_ALM) == 0
# Duplicados exactos (la exportación se solapa): copia justo debajo de su original
for j in sorted(random.sample([k for k in range(len(filas_nom)) if estilos[k] == "dma"], 2), reverse=True):
    filas_nom.insert(j + 1, list(filas_nom[j]))
    log.append(("Nomina_export", None, "(fila entera)", "Q01 duplicado exacto", "", filas_nom[j][0]))
filas_nom.append(["Total empleados: 61", "", "", "", "", "", "", "", ""])
log.append(("Nomina_export", len(filas_nom) + 1, "CodEmpleado", "Q10 fila de total", "", "Total empleados: 61"))
assert len(filas_nom) == 62
CAB_NOM = ["CodEmpleado", "NIF", "ApellidosNombre", "Departamento", "Delegación", "FechaAlta", "FechaBaja",
           "Jornada", "Puesto"]

# 6.2 Vacaciones de los responsables
TIPOS_V = ["Vac.", "vacaciones", "V"]


def abrev(cod):
    p = P[cod]
    return f"{p['nombre']} {p['ap1'][0]}."


# Comercial
com = [x for x in periodos if P[x["cod"]]["dept"] == "Comercial"]
com.sort(key=lambda x: (P[x["cod"]]["deleg"] != "Zaragoza", P[x["cod"]]["deleg"], abrev(x["cod"]), x["desde"]))
filas_com = []
mal = set(random.sample([i for i, x in enumerate(com) if x["tipo"] == "Vacaciones" and x["dl_total"] >= 3], 6))
cruzada = random.choice([i for i, x in enumerate(com) if x["tipo"] == "Vacaciones" and i not in mal and x["desde"].month in (7, 8)])
for i, x in enumerate(com):
    dias = x["dl_total"]
    hasta = x["hasta"]
    if x["tipo"] == "Vacaciones" and hasta.weekday() == 4 and x["dl_total"] >= 5 and random.random() < 0.3:
        hasta = hasta + dt.timedelta(2)  # el responsable pone el domingo (no cambia los laborables)
    if i in mal:
        k = len([m for m in sorted(mal) if m <= i])
        sucio = [(hasta - x["desde"]).days + 1, dias + 1, dias - 1][k % 3]
        if sucio == dias:
            sucio = dias + 2
        log.append(("Vac_Comercial", len(filas_com) + 2, "Días", "Días mal calculados a mano", dias, sucio))
        dias = sucio
    tipo = "AP" if x["tipo"] == "Asuntos propios" else random.choice(TIPOS_V)
    desde = x["desde"]
    if i == cruzada:
        log.append(("Vac_Comercial", len(filas_com) + 2, "Desde/Hasta", "Q17 Hasta < Desde (fechas cruzadas)",
                    f"{desde:%d/%m/%Y}-{hasta:%d/%m/%Y}", f"{hasta:%d/%m/%Y}-{desde:%d/%m/%Y}"))
        desde, hasta = hasta, desde
    filas_com.append([abrev(x["cod"]), desde, hasta, dias, tipo])

# Almacén: con nombres combinados en vertical, 7 subtotales y un año 2062
alm = [x for x in periodos if P[x["cod"]]["dept"] == "Almacén"]
alm.sort(key=lambda x: (P[x["cod"]]["deleg"] != "Zaragoza", P[x["cod"]]["deleg"], abrev(x["cod"]), x["desde"]))
grupos = []
for x in alm:
    if not grupos or grupos[-1][0] != x["cod"]:
        grupos.append((x["cod"], []))
    grupos[-1][1].append(x)
con_total = set(random.sample([g[0] for g in grupos if len(g[1]) >= 2], 7))
fila_2062 = random.choice([x for x in alm if x["tipo"] == "Vacaciones" and x["cod"] not in con_total and x["hasta"].year == 2026])
filas_alm = []  # (tipo_fila, valores, cod)
for cod, xs in grupos:
    for x in xs:
        hasta = x["hasta"]
        if x is fila_2062:
            hasta = hasta.replace(year=2062)
            log.append(("Vac_Almacen", None, "Hasta", "Q17 año 2062", f"{x['hasta']:%d/%m/%Y}", f"{hasta:%d/%m/%Y}"))
        tipo = "AP" if x["tipo"] == "Asuntos propios" else random.choice(TIPOS_V)
        filas_alm.append(("dato", [abrev(cod), x["desde"], hasta, x["dl_total"], tipo], cod))
    if cod in con_total:
        s = sum(x["dl_total"] for x in xs)
        filas_alm.append(("total", [f"Total {P[cod]['nombre']}: {s}", None, None, s, None], cod))
        log.append(("Vac_Almacen", None, "Nombre/Días", "Q10 subtotal entre los datos", "", f"Total {P[cod]['nombre']}: {s}"))

# Administración: cuadrícula
adm_cods = [p["cod"] for p in personas if p["dept"] == "Administración"]


def etiqueta_adm(cod):
    p = P[cod]
    return "Paco Gil" if cod == "E0006" else f"{p['nombre']} {p['ap1']}"


DIAS_ANIO = rango(INI, FIN)
cuadricula = {cod: {d: "" for d in DIAS_ANIO} for cod in adm_cods}
for x in periodos:
    if x["cod"] in cuadricula and x["tipo"] == "Vacaciones":
        for d in rango(x["desde"], min(x["hasta"], FIN)):
            if laborable(d, "Zaragoza"):
                cuadricula[x["cod"]][d] = "V"
assert sum(v == "V" for c in cuadricula for v in cuadricula[c].values()) == admin_v

# Dirección: texto libre
MESES_TXT = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre",
             "noviembre", "diciembre"]
TEXTO_DIR = {
    "E0001": "Del 3 al 21 de agosto. Y del 28 al 31 de diciembre",
    "E0002": "6-10 abril, del 10 al 21 de agosto y el puente de diciembre (7 al 11)",
    "E0003": "13/07 al 24/07 y del 21/12 al 8/01 (ya de 2027)",
    "E0004": "Del 17 al 28 de agosto; semana del 26 al 30 de octubre; 23 y 24 de diciembre",
}
log.append(("Vac_Direccion", None, "Vacaciones", "Q21 periodos en texto libre", "", "4 filas"))

# 6.3 Festivos de la gestoría (con 1 fecha errónea y 1 que falta)
fest_gestoria = []
for f, desc, amb in FESTIVOS:
    if (f, amb) == (D(2026, 12, 7), "Aragón"):
        log.append(("Festivos_gestoria", None, "Fecha", "Falta un festivo autonómico", "07/12/2026 Aragón", "(no está)"))
        continue
    if (f, amb) == (D(2026, 9, 29), "Local Lleida"):
        log.append(("Festivos_gestoria", None, "Fecha", "Q17 fecha errónea", "29/09/2026", "29/10/2026"))
        f = D(2026, 10, 29)
    fest_gestoria.append((f, desc, amb))
fest_gestoria.sort(key=lambda t: (t[0], t[2]))

# --------------------------------------------------------------------------------------
# 7. ESCRIBIR p2-datos.xlsx
# --------------------------------------------------------------------------------------
wb = xlsxwriter.Workbook(os.path.join(LIBROS, "p2-datos.xlsx"))
wb.set_properties({"title": "P2 · Datos de partida · Vacaciones, ausencias y plantilla",
                   "author": "Electro Cierzo Suministros, S.L. (ficticia)", "company": "Hoja a hoja"})
f_tit = wb.add_format({"bold": True, "font_size": 15, "font_color": "#1F3864"})
f_sub = wb.add_format({"bold": True, "font_size": 12, "font_color": "#1F3864", "top": 1, "top_color": "#BFBFBF"})
f_txt = wb.add_format({"text_wrap": True, "valign": "top"})
f_cab = wb.add_format({"bold": True, "bg_color": "#D9E1F2", "border": 1, "text_wrap": True, "valign": "vcenter"})
f_cel = wb.add_format({"border": 1, "border_color": "#BFBFBF"})
f_txtcel = wb.add_format({"border": 1, "border_color": "#BFBFBF", "num_format": "@"})
f_fec = wb.add_format({"border": 1, "border_color": "#BFBFBF", "num_format": "dd/mm/yyyy"})
f_fec_d = wb.add_format({"border": 1, "border_color": "#BFBFBF", "num_format": "dd/mm/yyyy", "valign": "top"})
f_tot = wb.add_format({"bold": True, "italic": True, "border": 1, "border_color": "#BFBFBF"})
f_comb = wb.add_format({"border": 1, "border_color": "#BFBFBF", "valign": "vcenter", "bold": True})
f_cmes = wb.add_format({"bold": True, "bg_color": "#D9E1F2", "border": 1, "num_format": "dd/mm", "rotation": 90,
                        "align": "center"})
f_cmes_f = wb.add_format({"bold": True, "bg_color": "#BFBFBF", "border": 1, "num_format": "dd/mm", "rotation": 90,
                          "align": "center"})
f_v = wb.add_format({"border": 1, "border_color": "#BFBFBF", "align": "center"})
f_v_f = wb.add_format({"border": 1, "border_color": "#BFBFBF", "align": "center", "bg_color": "#D9D9D9"})
f_aviso = wb.add_format({"bold": True, "font_color": "#9C0006", "text_wrap": True, "valign": "top"})

ws = wb.add_worksheet("Instrucciones")
ws.set_column("A:A", 110)
r = 0
ws.write(r, 0, "P2 · Vacaciones, ausencias y plantilla · Datos de partida", f_tit); r += 2
lineas = [
    ("sub", "Qué es este libro"),
    ("txt", "Lo que te pasa Lucía Fernández (RRHH) el lunes 16/11/2026 para el encargo «Vacaciones (socorro)». "
            "Electro Cierzo Suministros, S.L. es una empresa ficticia; todas las personas son inventadas."),
    ("sub", "Qué hay en cada hoja"),
    ("txt", "1. Nomina_export: la exportación del programa de nóminas, pegada tal cual (todo guardado como texto). "
            "Una fila por contrato. Trae NIF y jornada: no los copies al archivo que verán los responsables."),
    ("txt", "2. Vac_Administracion: el cuadrante de Administración (Zaragoza): una fila por persona, un día por "
            "columna y una «V» en cada día de vacaciones."),
    ("txt", "3. Vac_Comercial: Nombre (abreviado), Desde, Hasta, Días (calculados a mano por el responsable) y Tipo."),
    ("txt", "4. Vac_Almacen: como Comercial, con algún subtotal por medio y celdas combinadas."),
    ("txt", "5. Vac_Direccion: lo que contestó cada directivo, en texto libre."),
    ("txt", "6. Festivos_gestoria: la lista de festivos que mandó la gestoría (2026 y enero de 2027). "
            "Lucía cree que la de Lleida tiene algún fallo."),
    ("txt", "Las ausencias de 2026 (bajas y permisos) están en otro archivo, p2-ausencias.xlsx, porque llevan "
            "datos de salud: solo las puede ver RRHH."),
    ("sub", "Qué tienes que hacer (resumen; los pasos detallados están en la guía)"),
    ("txt", "1. Lee el correo de Lucía y escribe tus preguntas antes de abrir Excel."),
    ("txt", "2. Perfila los datos: cuenta filas, busca duplicados, totales, fechas como texto, nombres mal escritos. "
            "Apunta cada problema en una hoja «Calidad de datos» (problema, filas afectadas, decisión)."),
    ("txt", "3. Monta el maestro limpio de empleados (Tabla), los festivos por delegación y una Tabla «Periodos» "
            "con una fila por periodo de vacaciones o asuntos propios."),
    ("txt", "4. Calcula el derecho, lo disfrutado, lo planificado y el saldo de cada persona; monta el cuadrante "
            "mensual con alertas por departamento; añade validación y protección."),
    ("txt", "5. En un archivo aparte, solo para RRHH, calcula el absentismo por departamento y mes y la plantilla."),
    ("txt", "6. Comprueba los totales de control de la guía y escribe el correo de entrega."),
    ("sub", "Cómo comprobar"),
    ("txt", "La guía te da los totales de control (personas, días de vacaciones, saldos, días de IT, tasa). Si una "
            "cifra no cuadra, casi siempre el problema está en la limpieza o en los festivos."),
    ("aviso", "No modifiques estas hojas: son el origen. Trabaja en un libro nuevo y deja aquí los datos intactos "
              "para poder rehacer el trabajo si algo sale mal."),
]
for tipo, t in lineas:
    if tipo == "sub":
        r += 1; ws.write(r, 0, t, f_sub)
    elif tipo == "aviso":
        ws.write(r, 0, t, f_aviso)
    else:
        ws.write(r, 0, t, f_txt)
    r += 1

# Nomina_export (todo texto)
wn = wb.add_worksheet("Nomina_export")
for j, h in enumerate(CAB_NOM):
    wn.write_string(0, j, h, f_cab)
for i, fila in enumerate(filas_nom, start=1):
    for j, v in enumerate(fila):
        if v != "":
            wn.write_string(i, j, v, f_txtcel)
wn.set_column("A:A", 18); wn.set_column("B:B", 11); wn.set_column("C:C", 34); wn.set_column("D:D", 20)
wn.set_column("E:E", 11); wn.set_column("F:H", 11); wn.set_column("I:I", 28)
wn.freeze_panes(1, 0)

# Vac_Administracion
wa = wb.add_worksheet("Vac_Administracion")
wa.write(0, 0, "VACACIONES ADMINISTRACIÓN 2026 · ZARAGOZA (pon una V en cada día de vacaciones)", f_tit)
wa.write_string(2, 0, "Empleado", f_cab)
for j, d in enumerate(DIAS_ANIO, start=1):
    wa.write_datetime(2, j, dt.datetime(d.year, d.month, d.day), f_cmes_f if d.weekday() >= 5 else f_cmes)
for i, cod in enumerate(adm_cods, start=3):
    wa.write_string(i, 0, etiqueta_adm(cod), f_cel)
    for j, d in enumerate(DIAS_ANIO, start=1):
        v = cuadricula[cod][d]
        fmt = f_v_f if d.weekday() >= 5 else f_v
        if v:
            wa.write_string(i, j, v, fmt)
        else:
            wa.write_blank(i, j, None, fmt)
wa.set_column(0, 0, 20); wa.set_column(1, len(DIAS_ANIO), 3.2)
wa.set_row(2, 42)
wa.freeze_panes(3, 1)

# Vac_Comercial
wc = wb.add_worksheet("Vac_Comercial")
for j, h in enumerate(["Nombre", "Desde", "Hasta", "Días", "Tipo"]):
    wc.write_string(0, j, h, f_cab)
for i, (nom, a, b, dias, tipo) in enumerate(filas_com, start=1):
    wc.write_string(i, 0, nom, f_cel)
    wc.write_datetime(i, 1, dt.datetime(a.year, a.month, a.day), f_fec)
    wc.write_datetime(i, 2, dt.datetime(b.year, b.month, b.day), f_fec)
    wc.write_number(i, 3, dias, f_cel)
    wc.write_string(i, 4, tipo, f_cel)
wc.set_column("A:A", 16); wc.set_column("B:C", 12); wc.set_column("D:E", 10)
wc.freeze_panes(1, 0)

# Vac_Almacen
wl = wb.add_worksheet("Vac_Almacen")
wl.merge_range(0, 0, 0, 4, "VACACIONES ALMACÉN 2026", wb.add_format({"bold": True, "font_size": 14, "align": "center"}))
for j, h in enumerate(["Nombre", "Desde", "Hasta", "Días", "Tipo"]):
    wl.write_string(2, j, h, f_cab)
fila = 3
i = 0
while i < len(filas_alm):
    tipo_f, vals, cod = filas_alm[i]
    if tipo_f == "total":
        wl.write_string(fila, 0, vals[0], f_tot)
        wl.write_blank(fila, 1, None, f_tot); wl.write_blank(fila, 2, None, f_tot)
        wl.write_number(fila, 3, vals[3], f_tot); wl.write_blank(fila, 4, None, f_tot)
        fila += 1; i += 1
        continue
    j = i
    while j < len(filas_alm) and filas_alm[j][0] == "dato" and filas_alm[j][2] == cod:
        j += 1
    n = j - i
    if n >= 2:
        wl.merge_range(fila, 0, fila + n - 1, 0, vals[0], f_comb)
    else:
        wl.write_string(fila, 0, vals[0], f_comb)
    for k in range(n):
        _, v, _ = filas_alm[i + k]
        wl.write_datetime(fila + k, 1, dt.datetime(v[1].year, v[1].month, v[1].day), f_fec)
        wl.write_datetime(fila + k, 2, dt.datetime(v[2].year, v[2].month, v[2].day), f_fec)
        wl.write_number(fila + k, 3, v[3], f_cel)
        wl.write_string(fila + k, 4, v[4], f_cel)
    fila += n; i = j
wl.set_column("A:A", 20); wl.set_column("B:C", 12); wl.set_column("D:E", 10)

# Vac_Direccion
wd = wb.add_worksheet("Vac_Direccion")
wd.write_string(0, 0, "Persona", f_cab); wd.write_string(0, 1, "Vacaciones 2026 (lo que contestó cada uno por correo)", f_cab)
for i, cod in enumerate(["E0001", "E0002", "E0003", "E0004"], start=1):
    wd.write_string(i, 0, P[cod]["nombre"], f_cel)
    wd.write_string(i, 1, TEXTO_DIR[cod], f_txt)
wd.set_column("A:A", 12); wd.set_column("B:B", 80)

# Festivos_gestoria
wf = wb.add_worksheet("Festivos_gestoria")
wf.write_string(0, 0, "Fecha", f_cab); wf.write_string(0, 1, "Descripción", f_cab); wf.write_string(0, 2, "Ámbito", f_cab)
for i, (f, desc, amb) in enumerate(fest_gestoria, start=1):
    wf.write_datetime(i, 0, dt.datetime(f.year, f.month, f.day), f_fec)
    wf.write_string(i, 1, desc, f_cel)
    wf.write_string(i, 2, amb, f_cel)
wf.write_string(len(fest_gestoria) + 2, 0, "De 2027 solo están los de enero; el calendario completo lo mandamos en diciembre. (La gestoría)", f_txt)
wf.set_column("A:A", 12); wf.set_column("B:B", 46); wf.set_column("C:C", 16)
wb.close()

# --------------------------------------------------------------------------------------
# 8. ESCRIBIR p2-ausencias.xlsx (solo RRHH)
# --------------------------------------------------------------------------------------
CAB_AUS = ["CodEmpleado", "Tipo", "Desde", "Hasta", "DíasNaturales", "Observaciones"]
wb2 = xlsxwriter.Workbook(os.path.join(LIBROS, "p2-ausencias.xlsx"))
wb2.set_properties({"title": "P2 · Ausencias 2026 (solo RRHH)", "author": "Electro Cierzo Suministros, S.L. (ficticia)"})
g_tit = wb2.add_format({"bold": True, "font_size": 15, "font_color": "#1F3864"})
g_txt = wb2.add_format({"text_wrap": True, "valign": "top"})
g_cab = wb2.add_format({"bold": True, "bg_color": "#D9E1F2", "border": 1})
g_cel = wb2.add_format({"border": 1, "border_color": "#BFBFBF"})
g_fec = wb2.add_format({"border": 1, "border_color": "#BFBFBF", "num_format": "dd/mm/yyyy"})
g_av = wb2.add_format({"bold": True, "font_color": "#9C0006", "text_wrap": True})
wi = wb2.add_worksheet("Instrucciones")
wi.set_column("A:A", 110)
wi.write(0, 0, "P2 · Ausencias de 2026 · SOLO RRHH", g_tit)
txts = [
    "Listado de ausencias de 2026 que exporta el programa de nóminas (una fila por ausencia). Incluye las que "
    "empezaron en 2025 y siguen en 2026.",
    "Tipos: IT_EC = incapacidad temporal por enfermedad común; IT_AT = incapacidad temporal por accidente de trabajo; "
    "PR_MAT = permiso por matrimonio; PR_FALL = permiso por fallecimiento de un familiar; PR_ENF = permiso por "
    "accidente, enfermedad grave u hospitalización de un familiar; PR_TRAS = permiso por traslado de domicilio; "
    "PNR = permiso no retribuido.",
    "Hasta vacía = la ausencia sigue abierta. DíasNaturales = Hasta − Desde + 1 (vacío si sigue abierta).",
    "Úsalo para el informe de absentismo (archivo aparte, solo para RRHH). Las vacaciones están en p2-datos.xlsx.",
]
for k, t in enumerate(txts, start=2):
    wi.write(k, 0, t, g_txt)
wi.write(len(txts) + 3, 0, "CUIDADO: este archivo contiene datos de salud. No lo reenvíes ni copies sus columnas a "
                           "ningún archivo compartido. Revisa qué columnas hacen falta de verdad.", g_av)
wa2 = wb2.add_worksheet("Ausencias_2026")
for j, h in enumerate(CAB_AUS):
    wa2.write_string(0, j, h, g_cab)
for i, x in enumerate(ausencias, start=1):
    wa2.write_string(i, 0, x["cod"], g_cel)
    wa2.write_string(i, 1, x["tipo"], g_cel)
    wa2.write_datetime(i, 2, dt.datetime(x["desde"].year, x["desde"].month, x["desde"].day), g_fec)
    if x["hasta"]:
        wa2.write_datetime(i, 3, dt.datetime(x["hasta"].year, x["hasta"].month, x["hasta"].day), g_fec)
        wa2.write_number(i, 4, (x["hasta"] - x["desde"]).days + 1, g_cel)
    else:
        wa2.write_blank(i, 3, None, g_fec); wa2.write_blank(i, 4, None, g_cel)
    if x["obs"]:
        wa2.write_string(i, 5, x["obs"], g_cel)
    else:
        wa2.write_blank(i, 5, None, g_cel)
    if x in con_salud:
        log.append(("Ausencias_2026", i + 1, "Observaciones", "Q20 dato de salud", "", x["obs"]))
    if x is mat or x is tras:
        log.append(("Ausencias_2026", i + 1, "Hasta", "Duración incoherente con ET 37.3", "",
                    f"{x['tipo']} {(x['hasta'] - x['desde']).days + 1} días"))
    if x["hasta"] is None:
        log.append(("Ausencias_2026", i + 1, "Hasta", "Baja abierta (hasta el corte)", "", ""))
wa2.set_column("A:B", 12); wa2.set_column("C:D", 12); wa2.set_column("E:E", 13); wa2.set_column("F:F", 34)
wa2.freeze_panes(1, 0)
wb2.close()

# --------------------------------------------------------------------------------------
# 9. CSV («;», UTF-8 con BOM), log y verdad
# --------------------------------------------------------------------------------------
with open(os.path.join(LIBROS, "p2-nomina-empleados.csv"), "w", encoding="utf-8-sig", newline="") as fh:
    w = csv.writer(fh, delimiter=";")
    w.writerow(CAB_NOM)
    w.writerows(filas_nom)
with open(os.path.join(LIBROS, "p2-ausencias-2026.csv"), "w", encoding="utf-8-sig", newline="") as fh:
    w = csv.writer(fh, delimiter=";")
    w.writerow(CAB_AUS)
    for x in ausencias:
        w.writerow([x["cod"], x["tipo"], x["desde"].strftime("%d/%m/%Y"), x["hasta"].strftime("%d/%m/%Y") if x["hasta"] else "",
                    (x["hasta"] - x["desde"]).days + 1 if x["hasta"] else "", x["obs"]])
with open(os.path.join(AQUI, "p2_log_suciedad.csv"), "w", encoding="utf-8", newline="") as fh:
    w = csv.writer(fh, delimiter=";")
    w.writerow(["hoja", "fila_excel", "columna", "problema", "valor_verdadero", "valor_sembrado"])
    w.writerows(log)


def iso(d):
    return d.isoformat() if d else None


verdad = dict(
    festivos=[(iso(f), d, a) for f, d, a in FESTIVOS],
    personas=personas,
    contratos=[dict(c, alta=iso(c["alta"]), baja=iso(c["baja"])) for c in contratos],
    periodos=[dict(x, desde=iso(x["desde"]), hasta=iso(x["hasta"])) for x in periodos],
    ausencias=[dict(x, desde=iso(x["desde"]), hasta=iso(x["hasta"])) for x in ausencias],
    saldos=saldos, activos=ACTIVOS, arrastre=ARRASTRE, controles=CONTROLES,
    it_mes={f"{k[0]}|{k[1]}": v for k, v in it_mes.items()},
    teo_mes={f"{k[0]}|{k[1]}": v for k, v in teo_mes.items()},
    etiqueta_adm={c: etiqueta_adm(c) for c in adm_cods},
    texto_dir=TEXTO_DIR,
)
with open(os.path.join(AQUI, "p2_verdad.json"), "w", encoding="utf-8") as fh:
    json.dump(verdad, fh, ensure_ascii=False, indent=1)

for nombre, titulo, desc in [
    ("p2-datos", "P2 · Datos de partida (vacaciones y plantilla)",
     "Exportación de nóminas, las cuatro hojas de vacaciones de los responsables y los festivos de la gestoría, con sus problemas de calidad."),
    ("p2-ausencias", "P2 · Ausencias de 2026 (solo RRHH)",
     "Bajas y permisos de 2026 tal como salen del programa de nóminas, con observaciones que no deberían estar."),
]:
    with open(os.path.join(LIBROS, nombre + ".meta.json"), "w", encoding="utf-8") as fh:
        json.dump({"titulo": titulo, "descripcion": desc, "nivel": "n6"}, fh, ensure_ascii=False, indent=1)

print("Controles:", json.dumps(CONTROLES, ensure_ascii=False))
print("Periodos:", len(periodos), "· Comercial", len(filas_com), "· Almacén", len(filas_alm), "· Ausencias", len(ausencias))
print("Saldos > 5 (activos):", int((dfs[dfs['activo']]['saldo'] > 5).sum()))
