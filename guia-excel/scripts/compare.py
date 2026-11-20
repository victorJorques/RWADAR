import json, re
B='/tmp/claude-0/-home-user-RWADAR/2f4f48c6-5daf-5e88-a4f7-bdceb91de476/scratchpad/excel/research/'
L=json.load(open(B+'work/lista.json'))
et=json.load(open(B+'raw/et_es_en.json'))
et_en={}
for x in et: et_en.setdefault(x['en'],x['es'])
hf=json.load(open(B+'raw/hf_esES.json'))
ms=json.load(open(B+'work/ms_es_pages.json'))
alpha=json.load(open(B+'raw/alfabetico.json'))
alpha_en=json.load(open(B+'raw/alpha_en.json'))
# map slug -> (es alpha name, version tag)
def tag(n):
    m=re.search(r'\(([^)]*)\)\s*$',n); return (re.sub(r'\s*\([^)]*\)\s*$','',n).strip(), m.group(1) if m else None)
a_es={}
for x in alpha:
    if x['href']: a_es[x['href'].split('/')[-1]]=tag(x['name'])
a_en={}
for x in alpha_en:
    if x['href']: a_en[x['href'].split('/')[-1]]=tag(x['name'])
rows=[]
for x in L:
    en=x['en']; slug=x['slug']
    t=ms.get(slug,{}).get('title','')
    t2=re.sub(r'^Función(es)?\s+','',t); t2=re.sub(r'\s*\(función.*\)$','',t2).strip()
    r={'en':en,'cat':x['cat'],'slug':slug,'translator':et_en.get(en),'ms_title':t2,'ms_alpha':a_es.get(slug,(None,None))[0],'ver_es':a_es.get(slug,(None,None))[1],'ver_en':a_en.get(slug,(None,None))[1],'hf':hf.get(en),'applies':ms.get(slug,{}).get('applies',[])}
    rows.append(r)
json.dump(rows,open(B+'work/compare.json','w'),ensure_ascii=False,indent=1)
for r in rows:
    vals={r['translator'],r['ms_title'],r['hf']}-{None,''}
    flag='OK ' if len(vals)==1 else 'DIF'
    print(flag, r['en'], '| T:',r['translator'],'| MS:',r['ms_title'],'| A:',r['ms_alpha'],'| HF:',r['hf'],'| v:',r['ver_en'])
