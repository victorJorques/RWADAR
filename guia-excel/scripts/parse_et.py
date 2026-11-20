import sys, json
from bs4 import BeautifulSoup
s=BeautifulSoup(open(sys.argv[1],encoding='utf-8').read(),'lxml')
out=[]
for t in s.find_all('table')[1:]:
    rows=t.find_all('tr')
    hdr=[c.get_text(' ',strip=True) for c in rows[0].find_all(['td','th'])]
    ei=hdr.index('English')
    for tr in rows[1:]:
        cells=[c.get_text(' ',strip=True) for c in tr.find_all(['td','th'])]
        if len(cells)<=ei: continue
        a=tr.find('a',href=True)
        out.append({'es':cells[0],'en':cells[ei],'pt_pt':cells[hdr.index('Portuguese, Portugal')],'link':a['href'] if a else None})
json.dump(out,open(sys.argv[2],'w',encoding='utf-8'),ensure_ascii=False,indent=0)
print(len(out))
