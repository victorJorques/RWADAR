"""Genera la biblioteca de fotos de las noticias (fotos.json) con el modelo
«realvisxl» (RealVisXL V5.0 Lightning, licencia CreativeML Open RAIL++-M) en CPU.

  python fotografiar.py                        las que falten en fotos/
  python fotografiar.py --solo=clave1,clave2   esas, aunque ya existan
  python fotografiar.py --solo=clave --semilla=23   otra toma (y apunta la semilla)
  python fotografiar.py --solo=clave --semillas=3,7,9   solo candidatas: tomas
                                               en RWADAR_MAESTRAS, sin exportar
  python fotografiar.py --exportar             vuelve a recortar y exportar desde
                                               las tomas guardadas (sin el modelo)

Cada toma sale a 1344×768, se guarda tal cual (como <clave>-<semilla>-<huella>.png)
en RWADAR_MAESTRAS (fuera de Git;
por defecto, una carpeta temporal), se recorta a 3:2 según «encuadre», se
reduce a 1200×800 y se exporta a fotos/<clave>.webp sin metadatos, bajando la
calidad hasta que pese como mucho «maxBytes». Si la foto declara un «retoque»
(desenfocar una pantalla, voltear en espejo), se aplica antes del recorte. Del
mismo recorte salen también las variantes de «salida.variantes» (14/11/2026):
fotos/480/<clave>.webp (480×320) y fotos/960/<clave>.webp (960×640), que la web
elige con srcset y la app según la pantalla. Después apunta en fotos.json la
semilla, los bytes y el sha256 de cada una.

Necesita torch, diffusers, transformers, accelerate y pillow, y unos 7 GB del
modelo (RWADAR_MODELO=carpeta local, o se descarga de Hugging Face). Tarda unos
dos minutos por toma con cuatro núcleos. Mira cada foto antes de usarla.
"""
import hashlib, json, os, sys, tempfile, time

from PIL import Image, ImageDraw, ImageFilter

AQUI = os.path.dirname(os.path.abspath(__file__))
RUTA_SPEC = os.path.join(AQUI, 'fotos.json')
spec = json.load(open(RUTA_SPEC, encoding='utf-8'))
modelo = spec['modelos']['realvisxl']
salida = spec['salida']
MAESTRAS = os.environ.get('RWADAR_MAESTRAS') or os.path.join(tempfile.gettempdir(), 'rwadar-noticias-maestras')
os.makedirs(MAESTRAS, exist_ok=True)
os.makedirs(os.path.join(AQUI, 'fotos'), exist_ok=True)

args = dict(a[2:].split('=', 1) for a in sys.argv[1:] if a.startswith('--') and '=' in a)
banderas = {a[2:] for a in sys.argv[1:] if a.startswith('--') and '=' not in a}
solo = set(filter(None, args.get('solo', '').split(',')))
semilla = int(args['semilla']) if 'semilla' in args else None
candidatas = [int(s) for s in args.get('semillas', '').split(',') if s]
desconocidas = solo - set(spec['fotos'])
if desconocidas:
    sys.exit(f'claves desconocidas: {", ".join(sorted(desconocidas))}')


def maestra(clave, s):
    """La toma depende de la clave, la semilla y la descripción: si cambia el prompt, es otra toma."""
    f = spec['fotos'][clave]
    huella = hashlib.sha256(f"{f['prompt']}|{modelo['estilo']}|{modelo['negativo']}|{json.dumps(modelo['ajustes'], sort_keys=True)}".encode()).hexdigest()[:8]
    return os.path.join(MAESTRAS, f'{clave}-{s}-{huella}.png')


def recortar(img, encuadre, destino_ancho=None, destino_alto=None):
    """Recorte 3:2 en la posición «x% y%» y reducción al tamaño pedido (el de salida, si no se dice)."""
    destino_ancho, destino_alto = destino_ancho or salida['ancho'], destino_alto or salida['alto']
    ancho, alto = img.size
    objetivo = salida['ancho'] / salida['alto']
    if ancho / alto > objetivo:
        w, h = round(alto * objetivo), alto
    else:
        w, h = ancho, round(ancho / objetivo)
    px, py = (float(v.rstrip('%')) / 100 for v in encuadre.split())
    x, y = round((ancho - w) * px), round((alto - h) * py)
    return img.crop((x, y, x + w, y + h)).resize((destino_ancho, destino_alto), Image.LANCZOS)


def retocar(img, retoque):
    """Retoque declarado en fotos.json: «difuminar» desenfoca polígonos (en píxeles de
    la toma) con borde suave, para que una pantalla o un rótulo falso no se lea;
    «espejo» voltea la toma en horizontal para llevar el sujeto a la derecha."""
    for poligono in retoque.get('difuminar', []):
        mascara = Image.new('L', img.size, 0)
        ImageDraw.Draw(mascara).polygon([tuple(p) for p in poligono['puntos']], fill=255)
        mascara = mascara.filter(ImageFilter.GaussianBlur(6))
        img = Image.composite(img.filter(ImageFilter.GaussianBlur(poligono.get('radio', 12))), img, mascara)
    if retoque.get('espejo'):
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    return img


def guardar_webp(img, destino, calidades, max_bytes, nombre):
    """Guarda el WebP bajando la calidad hasta que pese como mucho max_bytes."""
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    for calidad in calidades:
        img.save(destino, 'WEBP', quality=calidad, method=6)
        if os.path.getsize(destino) <= max_bytes:
            break
    else:
        sys.exit(f'{nombre}: no baja de {max_bytes} bytes')
    datos = open(destino, 'rb').read()
    return calidad, len(datos), hashlib.sha256(datos).hexdigest()


def exportar(clave, f):
    base = retocar(Image.open(maestra(clave, f['semilla'])).convert('RGB'), f.get('retoque', {}))
    calidad, f['bytes'], f['sha256'] = guardar_webp(recortar(base, f['encuadre']), os.path.join(AQUI, 'fotos', f'{clave}.webp'),
                                                   range(86, 40, -3), salida['maxBytes'], clave)
    print(f'{clave}: semilla {f["semilla"]}, calidad {calidad}, {f["bytes"]} bytes', flush=True)
    # Las variantes, del mismo recorte (no de la de 1200: un paso menos de compresión).
    f['variantes'] = {}
    for ancho, v in sorted(salida.get('variantes', {}).items(), key=lambda x: int(x[0])):
        calidad, n, huella = guardar_webp(recortar(base, f['encuadre'], int(ancho), v['alto']),
                                          os.path.join(AQUI, 'fotos', ancho, f'{clave}.webp'),
                                          range(v['calidad'], 40, -3), v['maxBytes'], f'{clave} ({ancho})')
        f['variantes'][ancho] = {'bytes': n, 'sha256': huella}
        print(f'  {ancho}: calidad {calidad}, {n} bytes', flush=True)


def guardar_spec():
    with open(RUTA_SPEC, 'w', encoding='utf-8') as fh:
        json.dump(spec, fh, ensure_ascii=False, indent=1)
        fh.write('\n')


tomas = []  # (clave, f, semilla)
for clave, f in spec['fotos'].items():
    if f['modelo'] != 'realvisxl' or (solo and clave not in solo):
        continue
    if candidatas:
        tomas += [(clave, f, s) for s in candidatas]
        continue
    if semilla is not None:
        f['semilla'] = semilla
    if 'exportar' in banderas or solo or not os.path.exists(os.path.join(AQUI, 'fotos', f'{clave}.webp')):
        tomas.append((clave, f, f['semilla']))
if not tomas:
    sys.exit('no hay fotos que generar')

faltan = [(c, f, s) for c, f, s in tomas if not os.path.exists(maestra(c, s))]
if faltan and 'exportar' in banderas:
    sys.exit('faltan tomas guardadas: ' + ', '.join(f'{c}-{s}' for c, _, s in faltan))
if faltan:
    import torch
    from diffusers import StableDiffusionXLPipeline, DPMSolverMultistepScheduler

    torch.set_num_threads(os.cpu_count() or 4)
    ruta = os.environ.get('RWADAR_MODELO') or 'SG161222/RealVisXL_V5.0_Lightning'
    pipe = StableDiffusionXLPipeline.from_pretrained(ruta, torch_dtype=torch.bfloat16, variant='fp16', use_safetensors=True)
    pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config, algorithm_type='sde-dpmsolver++', use_karras_sigmas=True)
    pipe.set_progress_bar_config(disable=True)
    a = modelo['ajustes']
    # CLIP solo lee 77 fichas: lo que pase de ahí se pierde sin avisar en la imagen.
    if len(pipe.tokenizer(modelo['negativo']).input_ids) > 77:
        sys.exit('la lista negativa pasa de 77 fichas de CLIP: acórtala')
    for clave, f, s in faltan:
        n = len(pipe.tokenizer(f"{f['prompt']}, {modelo['estilo']}").input_ids)
        if n > 77:
            sys.exit(f'{clave}: el prompt con el estilo ocupa {n} fichas de CLIP (máximo 77): acórtalo')
    for clave, f, s in faltan:
        t0 = time.time()
        with torch.inference_mode():
            img = pipe(prompt=f"{f['prompt']}, {modelo['estilo']}", negative_prompt=modelo['negativo'],
                       width=a['ancho'], height=a['alto'], num_inference_steps=a['pasos'], guidance_scale=a['cfg'],
                       generator=torch.Generator('cpu').manual_seed(s)).images[0]
        img.save(maestra(clave, s))
        print(f'toma {clave}-{s}: {time.time() - t0:.0f} s -> {maestra(clave, s)}', flush=True)

if candidatas:
    sys.exit(0)
for clave, f, _ in tomas:
    exportar(clave, f)
guardar_spec()
