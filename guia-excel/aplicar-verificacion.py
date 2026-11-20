#!/usr/bin/env python3
"""Aplica los resultados de los workflows de verificación a los archivos de investigación.
Uso: python3 aplicar-verificacion.py <dir_workflow> [<dir_workflow> ...]
Lee journal.jsonl de cada workflow, sustituye cada línea verificada en research/<archivo>
(solo si la línea sigue igual que cuando se extrajo) y escribe research/verificaciones.md."""
import json, sys, os, collections
BASE = os.path.dirname(os.path.abspath(__file__))
R = os.path.join(BASE, 'research')
lotes = {l['id']: l for l in json.load(open(os.path.join(R, 'verificacion', 'lotes.json')))}
extra = os.path.join(R, 'verificacion', 'lotes-proyectos.json')
if os.path.exists(extra):
    for l in json.load(open(extra)): lotes[l['id']] = l
resultados = []
for d in sys.argv[1:]:
    etiquetas = {}
    for linea in open(os.path.join(d, 'journal.jsonl')):
        e = json.loads(linea)
        if e.get('type') == 'started': etiquetas[e['agentId']] = e.get('label', '')
        elif e.get('type') == 'result':
            lab = etiquetas.get(e.get('agentId'), '')
            r = e.get('result') or {}
            if lab.startswith('verificar:') and isinstance(r, dict) and 'resultados' in r:
                lid = lab.split(':', 1)[1]
                for x in r['resultados']: resultados.append((lid, x))
print(len(resultados), 'resultados')
archivos = {}
aplicados = 0; saltados = []
por_archivo = collections.defaultdict(list)
for lid, x in resultados:
    lote = lotes.get(lid)
    if not lote: saltados.append((lid, x.get('linea'), 'lote desconocido')); continue
    f = lote['archivo']
    if f not in archivos: archivos[f] = open(os.path.join(R, f)).read().split('\n')
    lineas = archivos[f]
    orig = next((it for it in lote['items'] if it['linea'] == x.get('linea')), None)
    por_archivo[f].append(x)
    if not orig: saltados.append((lid, x.get('linea'), 'línea no está en el lote')); continue
    i = orig['linea'] - 1
    if i < len(lineas) and lineas[i].strip() == orig['texto']:
        pass
    else:
        cand = [k for k, l in enumerate(lineas) if l.strip() == orig['texto']]
        if len(cand) == 1: i = cand[0]
        else: saltados.append((lid, x.get('linea'), 'la línea ha cambiado')); continue
    sangria = lineas[i][: len(lineas[i]) - len(lineas[i].lstrip())]
    nueva = x.get('texto_corregido', '').strip()
    if nueva:
        lineas[i] = sangria + nueva; aplicados += 1
for f, lineas in archivos.items():
    open(os.path.join(R, f), 'w').write('\n'.join(lineas))
cuenta = collections.Counter(x['veredicto'] for _, x in resultados)
out = ['# Verificación de los datos marcados [SIN VERIFICAR]', '',
       'Comprobados uno a uno contra fuentes primarias el 14/11/2026. **Este archivo prevalece** sobre lo que digan los demás archivos de investigación.',
       'Regla para el contenido: lo «no verificable» NO se enseña como dato (ni cifras, ni nombres, ni plazos).', '',
       f"Resumen: {dict(cuenta)}", '']
for f, xs in por_archivo.items():
    out.append(f'## {f}'); out.append('')
    for x in sorted(xs, key=lambda y: y.get('linea', 0)):
        out.append(f"- **{x['veredicto']}** (línea {x.get('linea')}): {x.get('nota','')} — {x.get('fuente','')}")
    out.append('')
open(os.path.join(R, 'verificaciones.md'), 'w').write('\n'.join(out))
print('aplicados', aplicados, 'saltados', len(saltados), dict(cuenta))
for s in saltados[:20]: print('  saltado', s)
