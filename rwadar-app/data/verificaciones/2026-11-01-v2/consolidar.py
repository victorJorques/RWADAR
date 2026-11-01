"""Valida los expedientes del ciclo del 01/11/2026 y genera la tabla consolidada.

Solo lee archivos locales. No consulta la red, no toca Supabase ni publica.
Uso (desde la raíz del repositorio):
    python3 -I rwadar-app/data/verificaciones/2026-11-01-v2/consolidar.py
"""
import json
import re
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
EXP = BASE / 'expedientes'
PUBLICADO = BASE.parent / '2026-10-23-v2' / 'escaparate-publicacion.json'

DECISIONES = {'mantener', 'actualizar', 'retirar_propuesta', 'admitir_propuesta', 'no_admitir'}
ESTADOS_CLAIM = {'respaldado', 'respaldado_con_alcance', 'en_conflicto', 'no_verificable'}
VEREDICTOS = {'cumple', 'cumple_con_limites', 'no_cumple', 'no_verificable'}
COLECCIONES = {'principales', 'secundario', 'en_camino'}
DISPONIBLE = {'confirmado', 'solo_acreditados', 'no_confirmado', 'excluido'}
UTC = re.compile(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z$')
FECHA = re.compile(r'^\d{4}-\d{2}-\d{2}$')
PROHIBIDO_PASOS = re.compile(r'[0-9%€$£¥]|garantiz|rentab|benefici|segur[oa]\b|gana', re.I)


def cargar_publicadas():
    datos = json.loads(PUBLICADO.read_text(encoding='utf-8'))
    return {o['slug']: o for o in datos['ofertas']}


def validar(exp, publicadas):
    errores, avisos = [], []
    slug = exp.get('slug')
    if not slug or not re.fullmatch(r'[a-z0-9]+(-[a-z0-9]+)*', slug):
        errores.append('slug no válido')
    tipo = exp.get('tipoExpediente')
    if tipo not in ('publicada', 'candidata'):
        errores.append('tipoExpediente no válido')
    if tipo == 'publicada' and slug not in publicadas:
        errores.append('se declara publicada pero no está en el lote publicado')
    if tipo == 'candidata' and slug in publicadas:
        errores.append('se declara candidata pero el slug ya está publicado')
    decision = exp.get('decision')
    if decision not in DECISIONES:
        errores.append(f'decision no válida: {decision}')
    if tipo == 'candidata' and decision not in ('admitir_propuesta', 'no_admitir'):
        errores.append('una candidata solo puede ser admitir_propuesta o no_admitir')
    if tipo == 'publicada' and decision in ('admitir_propuesta', 'no_admitir'):
        errores.append('una publicada no se admite/no admite: mantener, actualizar o retirar_propuesta')
    claims = exp.get('claims') or []
    if not claims:
        (errores if decision in ('admitir_propuesta', 'actualizar') else avisos).append('sin afirmaciones (claims)')
    for i, c in enumerate(claims):
        fuente = str(c.get('fuentePrimaria') or '')
        if not fuente.startswith('https://'):
            errores.append(f'claim {i} ({c.get("campo")}): fuente no HTTPS')
        if c.get('estado') not in ESTADOS_CLAIM:
            errores.append(f'claim {i} ({c.get("campo")}): estado no válido {c.get("estado")}')
        hora = c.get('consultadoUtc')
        if not (isinstance(hora, str) and UTC.match(hora)):
            errores.append(f'claim {i} ({c.get("campo")}): consultadoUtc no válido {hora}')
        elif not hora.startswith(('2026-11-01', '2026-11-02')):
            avisos.append(f'claim {i} ({c.get("campo")}): consulta fuera del ciclo ({hora})')
        fd = c.get('fechaDato')
        if fd is not None and not (isinstance(fd, str) and FECHA.match(fd)):
            avisos.append(f'claim {i} ({c.get("campo")}): fechaDato no normalizada {fd}')
        if len(str(c.get('literal') or '')) > 400:
            avisos.append(f'claim {i} ({c.get("campo")}): literal largo')
    crit = exp.get('criterios') or {}
    for nombre in ('entidadYPermisos', 'actividadYFecha', 'accesoYCondiciones', 'riesgosYAlertas'):
        v = (crit.get(nombre) or {}).get('veredicto')
        if v not in VEREDICTOS:
            errores.append(f'criterio {nombre}: veredicto no válido {v}')
    if exp.get('disponibleEs') not in DISPONIBLE:
        avisos.append(f'disponibleEs no normalizado: {exp.get("disponibleEs")}')
    tarjeta = exp.get('propuestaTarjeta')
    if decision in ('admitir_propuesta', 'actualizar'):
        if not isinstance(tarjeta, dict):
            errores.append('falta propuestaTarjeta')
        else:
            if tarjeta.get('coleccion') not in COLECCIONES:
                errores.append(f'coleccion no válida: {tarjeta.get("coleccion")}')
            if not str(tarjeta.get('url') or '').startswith('https://'):
                errores.append('url de la tarjeta no HTTPS')
            pasos = tarjeta.get('pasos') or []
            if decision == 'admitir_propuesta' and len(pasos) != 3:
                errores.append('la tarjeta nueva necesita exactamente 3 pasos')
            for p in pasos:
                if PROHIBIDO_PASOS.search(p) or len(p) > 28:
                    errores.append(f'paso no válido (cifra, promesa o largo): «{p}»')
            concepto = str(tarjeta.get('concepto') or '')
            if decision == 'admitir_propuesta' and not (8 <= len(concepto) <= 300):
                errores.append('concepto de imagen ausente o fuera de rango')
            if re.search(r'[0-9%€$]', concepto):
                errores.append('concepto con cifras o moneda')
            rent = tarjeta.get('rentabilidad')
            if rent:
                respaldo = [c for c in claims if c.get('campo') in ('rentabilidad', 'apy', 'ytw', 'rendimiento')
                            and c.get('estado') in ('respaldado', 'respaldado_con_alcance')
                            and str(c.get('consultadoUtc', '')).startswith(('2026-11-01', '2026-11-02'))]
                if not respaldo:
                    errores.append('rentabilidad mostrada sin claim de rentabilidad respaldado hoy')
    if decision == 'admitir_propuesta':
        for nombre in ('entidadYPermisos', 'actividadYFecha', 'accesoYCondiciones'):
            if (crit.get(nombre) or {}).get('veredicto') in ('no_cumple', 'no_verificable'):
                errores.append(f'se propone admitir con {nombre} = {crit[nombre]["veredicto"]}')
        if not exp.get('registros'):
            errores.append('se propone admitir sin registro regulador consultado')
    return errores, avisos


def main():
    publicadas = cargar_publicadas()
    filas, problemas = [], 0
    vistos = set()
    for archivo in sorted(EXP.glob('*.json')):
        try:
            exp = json.loads(archivo.read_text(encoding='utf-8'))
        except json.JSONDecodeError as e:
            print(f'[ERROR] {archivo.name}: JSON no válido ({e})')
            problemas += 1
            continue
        if archivo.stem != exp.get('slug'):
            print(f'[ERROR] {archivo.name}: el nombre no coincide con el slug {exp.get("slug")}')
            problemas += 1
        errores, avisos = validar(exp, publicadas)
        vistos.add(exp.get('slug'))
        for e in errores:
            print(f'[ERROR] {archivo.name}: {e}')
        for a in avisos:
            print(f'[aviso] {archivo.name}: {a}')
        problemas += len(errores)
        t = exp.get('propuestaTarjeta') or {}
        filas.append({
            'slug': exp.get('slug'), 'grupo': exp.get('grupo'), 'tipo': exp.get('tipoExpediente'),
            'proveedor': exp.get('proveedor'), 'decision': exp.get('decision'),
            'estadoOferta': exp.get('estadoOferta'), 'disponibleEs': exp.get('disponibleEs'),
            'coleccion': t.get('coleccion'), 'categoria': t.get('categoria'),
            'rentabilidad': (t.get('rentabilidad') or {}).get('mostrada'),
            'criterios': {k: (v or {}).get('veredicto') for k, v in (exp.get('criterios') or {}).items()},
            'cambiosCriticos': sum(1 for c in exp.get('cambiosRespectoPublicado') or [] if c.get('critico')),
            'claims': len(exp.get('claims') or []), 'errores': len(errores),
        })
    sin_expediente = sorted(set(publicadas) - vistos)
    for s in sin_expediente:
        print(f'[ERROR] publicada sin expediente: {s}')
    problemas += len(sin_expediente)
    (BASE / 'consolidado.json').write_text(json.dumps({'filas': filas, 'sinExpediente': sin_expediente},
                                                      ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    resumen = {}
    for f in filas:
        resumen.setdefault((f['tipo'], f['decision']), 0)
        resumen[(f['tipo'], f['decision'])] += 1
    print('\nExpedientes:', len(filas), '· publicadas sin expediente:', len(sin_expediente))
    for (tipo, dec), n in sorted(resumen.items(), key=lambda x: (str(x[0][0]), str(x[0][1]))):
        print(f'  {tipo:10} {dec:18} {n}')
    print('Errores:', problemas)
    return 1 if problemas else 0


if __name__ == '__main__':
    sys.exit(main())
