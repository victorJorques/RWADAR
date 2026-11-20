import sys, json
from bs4 import BeautifulSoup
html = open(sys.argv[1], encoding='utf-8').read()
soup = BeautifulSoup(html, 'lxml')
rows = []
for table in soup.find_all('table'):
    for tr in table.find_all('tr'):
        tds = tr.find_all(['td','th'])
        if len(tds) < 2: continue
        name_cell = tds[0]
        a = name_cell.find('a')
        name = name_cell.get_text(' ', strip=True)
        href = a['href'] if a and a.has_attr('href') else None
        desc = tds[1].get_text(' ', strip=True)
        rows.append({'name': name, 'href': href, 'desc': desc})
json.dump(rows, open(sys.argv[2],'w',encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(rows))
