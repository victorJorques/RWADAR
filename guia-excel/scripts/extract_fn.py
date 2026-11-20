import sys, json, os, re
from bs4 import BeautifulSoup
d=sys.argv[1]; out={}
for fn in sorted(os.listdir(d)):
    if not fn.endswith('.html') or fn.startswith('probe'): continue
    s=BeautifulSoup(open(os.path.join(d,fn),encoding='utf-8').read(),'lxml')
    main=s.find('article') or s.find('main') or s
    lines=main.get_text('\n',strip=True).split('\n')
    title=lines[0] if lines else ''
    applies=[]
    if 'Se aplica a' in lines:
        i=lines.index('Se aplica a')+1
        while i<len(lines) and (lines[i].startswith('Excel') or lines[i].startswith('Office') or lines[i].startswith('Microsoft 365') or 'Canal' in lines[i] or lines[i].startswith('Notas de la versión')):
            applies.append(lines[i]); i+=1
    syn=[]
    for i,l in enumerate(lines):
        if l.strip().lower().startswith('sintaxis'):
            # gather following lines that contain '('
            j=i+1; cnt=0
            buf=[]
            while j<len(lines) and cnt<14:
                buf.append(lines[j]); j+=1; cnt+=1
            syn.append(' '.join(buf))
    # compact syntax candidates: regex NAME(...) patterns
    txt=' '.join(lines)
    out[fn[:-5]]={'title':title,'applies':applies,'syntax_ctx':syn[:2],'len':len(txt)}
json.dump(out,open(sys.argv[2],'w',encoding='utf-8'),ensure_ascii=False,indent=1)
print(len(out))
