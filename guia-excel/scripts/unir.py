#!/usr/bin/env python3
"""Uso: python3 scripts/unir.py n1m2
Une contenido/tmp/n1m2-cabecera.json ({id,nivel,titulo,intro,repaso_inicial,practica_excel}) y las lecciones
contenido/tmp/n1m2l1.json, n1m2l2.json… (cada una un objeto lección) en contenido/n1m2.json."""
import json, sys, os, glob, re
B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
mid = sys.argv[1]; T = os.path.join(B, 'contenido', 'tmp')
cab = json.load(open(os.path.join(T, mid + '-cabecera.json')))
fs = sorted(glob.glob(os.path.join(T, mid + 'l*.json')), key=lambda p: int(re.search(r'l(\d+)\.json$', p).group(1)))
cab['lecciones'] = [json.load(open(f)) for f in fs]
cab.setdefault('practica_excel', None)
json.dump(cab, open(os.path.join(B, 'contenido', mid + '.json'), 'w'), ensure_ascii=False, indent=1)
print(f"contenido/{mid}.json: {len(fs)} lecciones")
