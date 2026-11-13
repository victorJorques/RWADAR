"""Monta los correos a partir de PLANTILLAS-FINAL.md y empresas.json.

Uso: python3 -I montar.py  -> escribe salida/<n>-<slug>.json con
{to, cc, subject, body, htmlBody, lang, name} y un resumen.
"""
import html
import json
import os
import re
import sys

D = os.path.dirname(os.path.abspath(__file__))
CC_FIJO = ["victorjorquesgranero@gmail.com"]
REENVIO = {
    "ES": "(Si este buzón no es el adecuado, ¿podríais hacer llegar este correo al equipo de marketing o de alianzas? Muchas gracias.)",
    "EN": "(If this inbox is not the right one, could you please forward this email to your marketing or partnerships team? Thank you.)",
}


def secciones(texto):
    out, actual, buf = {}, None, []
    for linea in texto.splitlines():
        m = re.match(r"^## +([A-Z-]+)\s*$", linea)
        if m:
            if actual:
                out[actual] = "\n".join(buf).strip("\n")
            actual, buf = m.group(1), []
        elif actual:
            buf.append(linea)
    if actual:
        out[actual] = "\n".join(buf).strip("\n")
    return out


URL = re.compile(r"(https?://[^\s<>()]+[^\s<>().,;:!?»”])")
MAIL = re.compile(r"(?<![\w.+-])([\w.+-]+@[\w-]+(?:\.[\w-]+)+)")


def enlazar(t):
    t = html.escape(t, quote=False)
    t = URL.sub(lambda m: f'<a href="{m.group(1)}">{m.group(1)}</a>', t)
    # correos fuera de enlaces
    partes = re.split(r"(<a [^>]*>.*?</a>)", t)
    partes = [p if p.startswith("<a ") else MAIL.sub(lambda m: f'<a href="mailto:{m.group(1)}">{m.group(1)}</a>', p) for p in partes]
    return "".join(partes)


def montar(cuerpo):
    lineas = cuerpo.splitlines()
    asunto = None
    if lineas and lineas[0].upper().startswith(("ASUNTO:", "SUBJECT:", "BETREFF:")):
        asunto = lineas[0].split(":", 1)[1].strip()
        lineas = lineas[1:]
    bloques, buf = [], []
    for l in lineas + [""]:
        if l.strip() == "":
            if buf:
                bloques.append(buf)
                buf = []
        else:
            buf.append(l.rstrip())
    h, p = [], []
    for b in bloques:
        if all(x.startswith("- ") for x in b):
            h.append("<ul>" + "".join(f"<li>{enlazar(x[2:])}</li>" for x in b) + "</ul>")
            p.append("\n".join("• " + x[2:] for x in b))
            continue
        hb, pb, lista = [], [], []
        for x in b:
            if x.startswith("### "):
                hb.append(("t", x[4:]))
            elif x.startswith("- "):
                hb.append(("l", x[2:]))
            else:
                hb.append(("p", x))
        # agrupa
        i = 0
        while i < len(hb):
            k, v = hb[i]
            if k == "t":
                h.append(f"<p style=\"margin:18px 0 6px\"><b>{enlazar(v)}</b></p>")
                p.append(v.upper() if False else v)
                i += 1
            elif k == "l":
                items = []
                while i < len(hb) and hb[i][0] == "l":
                    items.append(hb[i][1]); i += 1
                h.append("<ul>" + "".join(f"<li>{enlazar(x)}</li>" for x in items) + "</ul>")
                p.append("\n".join("• " + x for x in items))
            else:
                ps = []
                while i < len(hb) and hb[i][0] == "p":
                    ps.append(hb[i][1]); i += 1
                h.append("<p>" + "<br>".join(enlazar(x) for x in ps) + "</p>")
                p.append("\n".join(ps))
    cuerpo_html = (
        '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#1a1a1a">'
        + "\n".join(h) + "</div>"
    )
    texto = "\n\n".join(p)
    # la línea de baja, más pequeña en HTML
    cuerpo_html = re.sub(r"<p>((?:Si preferís|If you would rather|If you'd rather|Falls Sie|Sollten Sie|Wenn Sie keine)[^<]*(?:<[^p][^>]*>[^<]*)*)</p>",
                         r'<p style="font-size:12px;color:#666">\1</p>', cuerpo_html)
    return asunto, texto, cuerpo_html


def main():
    plant = secciones(open(os.path.join(D, "PLANTILLAS-FINAL.md"), encoding="utf-8").read())
    emp = json.load(open(os.path.join(D, "empresas.json"), encoding="utf-8"))
    os.makedirs(os.path.join(D, "salida"), exist_ok=True)
    resumen = []
    for n, e in enumerate(emp, 1):
        sec = plant[e["lang"]]
        if e["lang"] != "LUNA":
            if "{BLOQUE_FICHA}" not in sec or "{EMPRESA}" not in sec:
                sys.exit(f"falta marcador en {e['lang']}")
            sec = sec.replace("{EMPRESA}", e["empresa"]).replace("{BLOQUE_FICHA}", e["bloque"])
            lineas = sec.splitlines()
            j = next(i for i, l in enumerate(lineas) if l.startswith(("Estimado equipo", "Dear ", "Sehr geehrtes")))
            if e.get("saludo"):
                lineas[j] = e["saludo"]
            if e.get("reenvio"):
                nota = REENVIO[e["lang"]]
                lineas[j + 1:j + 1] = ["", nota]
            sec = "\n".join(lineas)
        asunto, texto, cuerpo_html = montar(sec)
        if "{" in texto or "}" in texto:
            sys.exit(f"marcador sin sustituir en {e['empresa']}")
        slug = re.sub(r"[^a-z0-9]+", "-", e["empresa"].lower()).strip("-")
        out = {"name": e["empresa"], "lang": e["lang"], "to": e["to"], "cc": e.get("cc", []) + CC_FIJO,
               "subject": asunto, "body": texto, "htmlBody": cuerpo_html}
        json.dump(out, open(os.path.join(D, "salida", f"{n:02d}-{slug}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        resumen.append(f"{n:02d} {e['lang']:5} {e['empresa'][:22]:22} -> {', '.join(e['to'])} cc={e.get('cc', [])}  | {asunto}")
    print("\n".join(resumen))


if __name__ == "__main__":
    main()
