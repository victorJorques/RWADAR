"""Vuelve a generar las fotos maestras de fotos.json con el modelo «realvisxl»
(RealVisXL V5.0 Lightning, licencia CreativeML Open RAIL++-M) en CPU.

  python fotografiar.py                      las que falten en fotos/
  python fotografiar.py --solo=slug1,slug2   esas, aunque ya existan
  python fotografiar.py --semilla=23 --solo=slug   otra toma (y apunta la semilla en fotos.json)

Necesita torch, diffusers, transformers, accelerate y pillow, y unos 7 GB del
modelo (RWADAR_MODELO=carpeta local, o se descarga de Hugging Face). Tarda
unos dos minutos por foto con cuatro núcleos. Las de «canva» no se pueden
regenerar aquí: se encargaron con la misma descripción en Canva.
"""
import json, os, sys, time

AQUI = os.path.dirname(os.path.abspath(__file__))
spec = json.load(open(os.path.join(AQUI, 'fotos.json'), encoding='utf-8'))
modelo = spec['modelos']['realvisxl']
args = dict(a[2:].split('=', 1) for a in sys.argv[1:] if a.startswith('--') and '=' in a)
solo = set(filter(None, args.get('solo', '').split(',')))
semilla = int(args['semilla']) if 'semilla' in args else None

pendientes = []
for slug, f in spec['fotos'].items():
    if f['modelo'] != 'realvisxl' or (solo and slug not in solo):
        continue
    destino = os.path.join(AQUI, 'fotos', f'{slug}.webp')
    if solo or not os.path.exists(destino):
        pendientes.append((slug, f, destino))
if not pendientes:
    sys.exit('no hay fotos que generar')

import torch
from diffusers import StableDiffusionXLPipeline, DPMSolverMultistepScheduler

torch.set_num_threads(os.cpu_count() or 4)
ruta = os.environ.get('RWADAR_MODELO') or 'SG161222/RealVisXL_V5.0_Lightning'
pipe = StableDiffusionXLPipeline.from_pretrained(ruta, torch_dtype=torch.bfloat16, variant='fp16', use_safetensors=True)
pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config, algorithm_type='sde-dpmsolver++', use_karras_sigmas=True)
pipe.set_progress_bar_config(disable=True)
a = modelo['ajustes']
for slug, f, destino in pendientes:
    s = semilla if semilla is not None else f['semilla']
    t0 = time.time()
    with torch.inference_mode():
        img = pipe(prompt=f"{f['prompt']}, {modelo['estilo']}", negative_prompt=modelo['negativo'],
                   width=a['ancho'], height=a['alto'], num_inference_steps=a['pasos'], guidance_scale=a['cfg'],
                   generator=torch.Generator('cpu').manual_seed(s)).images[0]
    img.save(destino, 'WEBP', quality=90, method=6)
    f['semilla'] = s
    print(f'{slug} semilla {s}: {time.time() - t0:.0f} s', flush=True)
if semilla is not None:
    with open(os.path.join(AQUI, 'fotos.json'), 'w', encoding='utf-8') as fh:
        json.dump(spec, fh, ensure_ascii=False, indent=1)
        fh.write('\n')
