#!/usr/bin/env python3
"""Monta contenido/prueba_nivel.json con 3 preguntas de cada examen de nivel disponible
(las saca del final del examen si este tiene más de 12, para que no se repitan; si no, las copia)."""
import json, os, glob, re
B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = os.path.join(B, 'contenido')
preguntas = []
for f in sorted(glob.glob(os.path.join(C, 'n*-examen.json'))):
    ex = json.load(open(f)); niv = ex['nivel']; qs = ex['preguntas']
    marcadas = [q for q in qs if q.get('para_prueba_nivel')]
    if len(marcadas) >= 3: elegidas = marcadas[:3]
    else:
        # prioriza variedad: una fórmula, una predice/test y otra distinta, tomadas del final
        elegidas = []
        for modo in ('formula', 'test', 'predice', 'respuesta_corta', 'senala', 'cinta', 'ordenar'):
            for q in reversed(qs):
                if q['modo'] == modo and q not in elegidas: elegidas.append(q); break
            if len(elegidas) == 3: break
    if len(qs) - len(elegidas) >= 12:
        ex['preguntas'] = [q for q in qs if q not in elegidas]
        json.dump(ex, open(f, 'w'), ensure_ascii=False, indent=1)
    for q in elegidas:
        q2 = dict(q); q2['nivel'] = niv; q2['id'] = 'pn-' + q['id']; q2.pop('para_prueba_nivel', None); q2.pop('pistas', None)
        preguntas.append(q2)
out = {'intro': 'Contesta sin buscar. Si no sabes algo, elige lo que creas y sigue: no pasa nada, solo sirve para saber por dónde te conviene empezar.', 'umbral': 0.67, 'preguntas': preguntas}
json.dump(out, open(os.path.join(C, 'prueba_nivel.json'), 'w'), ensure_ascii=False, indent=1)
print(len(preguntas), 'preguntas de', len({q['nivel'] for q in preguntas}), 'niveles')
