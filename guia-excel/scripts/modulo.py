#!/usr/bin/env python3
"""Uso: python3 scripts/modulo.py n1m2  → imprime el encargo del módulo: su ficha del temario,
lo que ya se ha enseñado antes (para el repaso y para no usar nada sin enseñar) y lo que viene después."""
import json, sys, os
B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bp = json.load(open(os.path.join(B, 'research', 'blueprint.json')))
mid = sys.argv[1]
antes, despues, yo, nivel_yo = [], [], None, None
for n in bp['niveles']:
    for m in n['modulos']:
        if m['id'] == mid: yo, nivel_yo = m, n; continue
        (antes if yo is None else despues).append((n, m))
if yo is None: sys.exit('módulo no encontrado: ' + mid)
print('=== TU MÓDULO ===')
print(f"Nivel {nivel_yo['id']} «{nivel_yo['nombre']}»: {nivel_yo['lema']}")
print('Al terminar el nivel, la alumna puede hacer sola:', '; '.join(nivel_yo['puede_hacer_sola']))
print(json.dumps(yo, ensure_ascii=False, indent=1))
print('\n=== YA ENSEÑADO ANTES (puedes usarlo y debes repasarlo en repaso_inicial; NO uses nada que no esté aquí o en tu módulo) ===')
for n, m in antes:
    print(f"[{m['id']}] {m['titulo']}")
    for l in m['lecciones']:
        f = (' · funciones: ' + ', '.join(l['funciones'])) if l['funciones'] else ''
        print(f"   - {l['id']} {l['titulo']}{f}")
if not antes: print('(nada: es el primer módulo del curso; el repaso_inicial son 2 preguntas de sentido común muy fáciles)')
print('\n=== VIENE DESPUÉS (no te adelantes) ===')
for n, m in despues[:6]:
    print(f"[{m['id']}] {m['titulo']}: " + '; '.join(l['titulo'] for l in m['lecciones']))
