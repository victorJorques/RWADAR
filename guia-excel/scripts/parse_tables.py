import sys, json
from bs4 import BeautifulSoup
s=BeautifulSoup(open(sys.argv[1],encoding='utf-8').read(),'lxml')
main=s.find('article') or s.find('main') or s
out=[]
for t in main.find_all('table'):
    # nearest previous heading
    h=t.find_previous(['h2','h3','h4'])
    head=h.get_text(' ',strip=True) if h else ''
    for tr in t.find_all('tr'):
        c=[x.get_text(' ',strip=True) for x in tr.find_all(['td','th'])]
        if len(c)>=2: out.append({'sec':head,'a':c[0],'b':c[1]})
json.dump(out,open(sys.argv[2],'w',encoding='utf-8'),ensure_ascii=False,indent=0)
print(len(out))
