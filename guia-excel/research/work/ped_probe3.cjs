const path=require('path'); const base=path.resolve(__dirname,'..','..');
const HFmod = require(require.resolve('hyperformula',{paths:[base]})); const HF = HFmod.HyperFormula; Object.assign(HF, {FunctionPlugin:HFmod.FunctionPlugin, FunctionArgumentType:HFmod.FunctionArgumentType, SimpleRangeValue:HFmod.SimpleRangeValue, CellError:HFmod.CellError, ErrorType:HFmod.ErrorType, ArraySize:HFmod.ArraySize});
const es = require(require.resolve('hyperformula/i18n/languages/esES',{paths:[base]}));
const M = require(base+'/app/motor.js'); M.preparar(HF, es.default || es);
const hoja={celdas:{A1:100,A2:15,B1:8,B2:null,B3:6,C1:8,C2:0,C3:6,D1:'Norte',D2:'Sur',D3:'Norte',E1:120,E2:80,E3:50, F1:0.5,F2:0.25, G1:10,G2:1000,G3:1,H1:9,H2:9000}};
const T=[
 ['A1+10%','=A1+10%'],['A1*(1+10%)','=A1*(1+10%)'],['10<A2<20 (A2=15)','=10<A2<20'],['Y(A2>10;A2<20)','=Y(A2>10;A2<20)'],
 ['PROMEDIO con vacío','=PROMEDIO(B1:B3)'],['PROMEDIO con cero','=PROMEDIO(C1:C3)'],
 ['CONTAR.SI ">"&A2','=CONTAR.SI(E1:E3;">"&A2*5)'],['CONTAR.SI ">A2" literal','=CONTAR.SI(E1:E3;">A2")'],
 ['SUMAR.SI Norte','=SUMAR.SI(D1:D3;"Norte";E1:E3)'],['SUMAR.SI "norte" minúsc','=SUMAR.SI(D1:D3;"norte";E1:E3)'],
 ['media de % (mal)','=PROMEDIO(F1:F2)'],
 ['media ponderada','=SUMAPRODUCTO(G1:G2;H1:H2)/SUMA(G1:G2)'],
 ['promedio simple de tasas','=PROMEDIO(H1;H2)'],
 ['SI orden mal','=SI(E1>50;"Medio";SI(E1>100;"Alto";"Bajo"))'],['SI orden bien','=SI(E1>100;"Alto";SI(E1>50;"Medio";"Bajo"))'],
 ['SI.ERROR oculta','=SI.ERROR(BUSCARV("Este";D1:E3;2;FALSO);0)'],
 ['circular','=Z1+1'],
];
for (const [n,f] of T){ const r=M.evaluar(HF,hoja,'Z1',f); console.log(n.padEnd(28), f.padEnd(44),'=>',JSON.stringify(r.valor)); }
