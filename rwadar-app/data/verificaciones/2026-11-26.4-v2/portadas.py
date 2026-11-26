"""Portadas de las 25 plataformas nuevas de la entrega 2026-11-26.4: una representación editorial por empresa,
con el mismo modelo y el mismo estilo realista que las fotos de las ofertas (fotos.json, «realvisxl»), en 1024×1024.
Los maestros quedan en rwadar-editorial-source/<slug>.webp, como los de las demás plataformas; portadas.mjs los
convierte a la portada publicable de 720×720 y los apunta en rwadar-site/plataformas/fuentes.json.

  RWADAR_MODELO=<carpeta del modelo> python portadas.py [--solo=slug1,slug2]
"""
import json, os, sys, time

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, '..', '..', '..', '..'))
spec = json.load(open(os.path.join(RAIZ, 'rwadar-editorial-source', 'ofertas', 'fotos.json'), encoding='utf-8'))
modelo = spec['modelos']['realvisxl']

PORTADAS = json.load(open(os.path.join(AQUI, 'portadas.json'), encoding='utf-8'))['portadas']

if __name__ == '__main__':
    args = dict(a[2:].split('=', 1) for a in sys.argv[1:] if a.startswith('--') and '=' in a)
    solo = set(filter(None, args.get('solo', '').split(',')))
    import torch
    from diffusers import StableDiffusionXLPipeline, DPMSolverMultistepScheduler
    torch.set_num_threads(os.cpu_count() or 4)
    pipe = StableDiffusionXLPipeline.from_pretrained(os.environ['RWADAR_MODELO'], torch_dtype=torch.bfloat16, variant='fp16', use_safetensors=True)
    pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config, algorithm_type='sde-dpmsolver++', use_karras_sigmas=True)
    pipe.set_progress_bar_config(disable=True)
    a = modelo['ajustes']
    for x in PORTADAS:
        empresa, archivo, semilla, prompt = x['empresa'], x['maestro'], x['semilla'], x['prompt']
        if solo and archivo[:-5] not in solo:
            continue
        t0 = time.time()
        with torch.inference_mode():
            img = pipe(prompt=f"{prompt}, {modelo['estilo']}", negative_prompt=modelo['negativo'], width=1024, height=1024,
                       num_inference_steps=a['pasos'], guidance_scale=a['cfg'], generator=torch.Generator('cpu').manual_seed(semilla)).images[0]
        img.save(os.path.join(RAIZ, 'rwadar-editorial-source', archivo), 'WEBP', quality=90, method=6)
        print(f'{empresa} semilla {semilla}: {time.time() - t0:.0f} s', flush=True)
