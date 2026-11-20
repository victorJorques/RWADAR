# Cálculo de comprobación del Proyecto 1 (comparativa de proveedores). Datos diseñados a mano.
from itertools import combinations
from decimal import Decimal as D, ROUND_HALF_UP
def r2(x): return float(D(str(x)).quantize(D('0.01'), rounding=ROUND_HALF_UP))
arts = [ # cod, desc, unidad base, cantidad anual 2027
 ("CAB-RZ1K-3G25","Cable RZ1-K 0,6/1 kV 3G2,5 mm²","m",18000),
 ("CAB-RZ1K-3G15","Cable RZ1-K 0,6/1 kV 3G1,5 mm²","m",12000),
 ("CAB-H07Z1-6","Cable H07Z1-K 6 mm²","m",9000),
 ("CAB-H07Z1-25","Cable H07Z1-K 2,5 mm²","m",30000),
 ("CAB-H07Z1-15","Cable H07Z1-K 1,5 mm²","m",24000),
 ("CAN-40X60","Canaleta PVC 40×60 (tramo de 2 m)","tramo",1500),
 ("CAN-60X100","Canaleta PVC 60×100 (tramo de 2 m)","tramo",800),
 ("TUB-M20","Tubo corrugado M20 (rollo de 100 m)","rollo",600),
 ("CAJ-100","Caja de registro 100×100","ud",4000),
 ("BRI-200","Bridas 200 mm (bolsa de 100)","bolsa",2500),
]
# precio por unidad BASE, sin IVA, ya normalizado (lo que la alumna debe obtener)
A = [1.12,0.78,0.69,0.31,0.21,3.95,7.60,14.20,0.88,2.35]          # Arnedo: €/unidad base, portes incluidos
# Elecvía: precios ofertados con IVA incluido y en sus unidades
B_ofer = [ # (precio ofertado con IVA, factor = unidades base por unidad de oferta)
 (128.26,100),(89.54,100),(79.86,100),(35.09,100),(23.60,100),  # €/rollo de 100 m con IVA
 (2.36,0.5),  # €/metro de canaleta con IVA -> tramo de 2 m = 2 metros => 1 metro = 0,5 tramos
 (4.48,0.5),
 (16.70,1),   # rollo
 (25.41,25),  # caja de 25 uds
 (2.66,1)]    # bolsa
B = [p/1.21/f for p,f in B_ofer]
# Tormes: cables por bobina de 500 m; texto con punto decimal; falta TUB-M20 ("consultar") y BRI-200 (vacío)
C_ofer = [(490.00,500),(345.00,500),(310.00,500),(135.00,500),(92.50,500),(3.90,1),(7.55,1),None,(0.84,1),None]
C = [None if o is None else o[0]/o[1] for o in C_ofer]
# Yesa: cables en €/km; resto por unidad; precios 2026, +3 % para 2027 (aclaración)
D_ofer = [1090,760,700,305,205,3.85,7.40,13.90,0.86,2.30]
Dp = [ (p/1000 if i<5 else p)*1.03 for i,p in enumerate(D_ofer)]
prov = {"Arnedo":A,"Elecvía":B,"Tormes":C,"Yesa":Dp}
def coste(p, arts_idx):
    return sum(arts[i][3]*prov[p][i] for i in arts_idx)
idx=range(10)
print("Precio normalizado (€/ud base, sin IVA):")
for i,a in enumerate(arts):
    print(a[0], [None if prov[p][i] is None else round(prov[p][i],4) for p in prov])
def total_prov(p, items):
    base = sum(arts[i][3]*prov[p][i] for i in items)
    if p=="Arnedo": return base, 0, 0
    if p=="Elecvía":
        dto = 0.05*base if base>15000 else 0
        portes = 0.02*(base-dto)
        return base, -dto, portes
    if p=="Tormes": return base, 0, 90*12
    if p=="Yesa": return base,0,0
res={}
print("\nProveedor único (solo si oferta todo):")
for p in prov:
    if any(prov[p][i] is None for i in idx):
        b=sum(arts[i][3]*prov[p][i] for i in idx if prov[p][i] is not None)
        print(p,"incompleto; base de lo ofertado", r2(b)); continue
    b,dto,port=total_prov(p,idx); t=b+dto+port; res[p]=t
    print(p, "base",r2(b),"dto",r2(dto),"portes",r2(port),"TOTAL",r2(t))

from itertools import product
best=None; allres=[]
for k in (1,2):
    for combo in combinations(prov,k):
        for assign in product(combo, repeat=10):
            if any(prov[p][i] is None for i,p in enumerate(assign)): continue
            det={}; tot=0
            for p in combo:
                items=[i for i in idx if assign[i]==p]
                if not items: continue
                b,dto,port=total_prov(p,items); det[p]=(r2(b),r2(dto),r2(port),r2(b+dto+port),[arts[i][0] for i in items]); tot+=b+dto+port
            if any(v[3]<3000 for v in det.values()): continue
            if best is None or tot<best[0]-1e-9: best=(tot,combo,det)
print("MEJOR reparto:",r2(best[0]),best[1])
for p,v in best[2].items(): print(" ",p,v)
mejor_unico=min(res,key=res.get)
print("Mejor único:",mejor_unico,r2(res[mejor_unico]),"ahorro",r2(res[mejor_unico]-best[0]),"%",round((res[mejor_unico]-best[0])/res[mejor_unico]*100,2))
# regla sencilla: cables a Tormes y el resto a Elecvía
items_c=[0,1,2,3,4]; items_b=[5,6,7,8,9]
bc,_,pc=total_prov("Tormes",items_c); bb,db,pb=total_prov("Elecvía",items_b)
print("Regla cables->Tormes, resto->Elecvía:", r2(bc+pc), r2(bb+db+pb), "TOTAL", r2(bc+pc+bb+db+pb), "dto",r2(db),"portesB",r2(pb))
# errores típicos
bB=sum(arts[i][3]*B_ofer[i][0]/B_ofer[i][1] for i in idx)
print("Error IVA: Elecvía sin quitar IVA (base)", r2(bB), "con dto y portes", r2(bB*0.95*1.02))
print("Error unidades: Elecvía canaleta por metro tomado como tramo ->", r2(1500*2.36/1.21+800*4.48/1.21))
print("Error €/km Yesa tomado como €/m: absurdo",)
print("Yesa sin el +3%:", r2(sum(arts[i][3]*((D_ofer[i]/1000) if i<5 else D_ofer[i]) for i in idx)))
print("Elecvía sin descuento:", r2(76193.06*1.02))
plazo={"Arnedo":3,"Elecvía":5,"Tormes":2,"Yesa":7}; cal={"Arnedo":4,"Elecvía":3,"Tormes":5,"Yesa":4}
pmin=min(res.values()); plmin=min(plazo[p] for p in res)
for p in res:
    sp=pmin/res[p]*100; sl=plmin/plazo[p]*100; sc=cal[p]/5*100
    print("Puntos",p, round(sp,2), round(sl,2), round(sc,2), "TOTAL", round(0.6*sp+0.25*sl+0.15*sc,2))
for i,a in enumerate(arts):
    vals={p:prov[p][i] for p in prov if prov[p][i] is not None}
    m=min(vals,key=vals.get); print("Más barato (precio unitario)",a[0],m,round(vals[m],4))
