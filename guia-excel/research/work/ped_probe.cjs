const path=require('path'); const base=path.resolve(__dirname,'..','..');
const HFmod = require(require.resolve('hyperformula',{paths:[base]})); const HF = HFmod.HyperFormula; Object.assign(HF, {FunctionPlugin:HFmod.FunctionPlugin, FunctionArgumentType:HFmod.FunctionArgumentType, SimpleRangeValue:HFmod.SimpleRangeValue, CellError:HFmod.CellError, ErrorType:HFmod.ErrorType, ArraySize:HFmod.ArraySize});
const es = require(require.resolve('hyperformula/i18n/languages/esES',{paths:[base]}));
const M = require(base+'/app/motor.js'); M.preparar(HF, es.default || es);
const hoja = { celdas: {
  A1:10, A2:{texto:'20'}, A3:30,              // número guardado como texto en A2
  B1:'Ana ', B2:'Ana', B3:'Ana ',        // espacios final y no separable
  C1:1/3, C2:1/3, C3:1/3,                      // redondeo visual
  D1:2.345, D2:0.1, D3:0.2,
  E1:'Zaragoza', E2:'Bilbao', E3:'Madrid', F1:3, F2:1, F3:2, // tabla SIN ordenar para BUSCARV aproximado
  G1:{fecha:'2026-11-14'}, G2:{fecha:'1900-02-28'},
  H1:100, H2:120,
}, formatos: { C1:'num2', C2:'num2', C3:'num2' } };
const tests = [
 ['SUMA ignora número-texto','=SUMA(A1:A3)'],
 ['+ convierte número-texto','=A1+A2+A3'],
 ['CONTAR no cuenta texto','=CONTAR(A1:A3)'],
 ['ESNUMERO(A2)','=ESNUMERO(A2)'],
 ['texto con espacio final','=B1=B2'],
 ['ESPACIOS arregla','=ESPACIOS(B1)=B2'],
 ['nbsp con ESPACIOS','=ESPACIOS(B3)=B2'],
 ['nbsp sustituido','=SUSTITUIR(B3;CARACTER(160);"")=B2'],
 ['mayúsculas = ','="ana"=B2'],
 ['IGUAL distingue','=IGUAL("ana";B2)'],
 ['suma de 1/3 x3','=SUMA(C1:C3)'],
 ['REDONDEAR(2,345;2)','=REDONDEAR(D1;2)'],
 ['0,1+0,2=0,3','=D2+D3=0,3'],
 ['1*(0,5-0,4-0,1)','=1*(0,5-0,4-0,1)'],
 ['-2^2','=-2^2'],
 ['=0-2^2','=0-2^2'],
 ['5+2*3','=5+2*3'],
 ['10%','=10%'],
 ['H1*10%+H1','=H1+H1*10%'],
 ['incremento %','=(H2-H1)/H1'],
 ['mal: H2-H1/H1','=H2-H1/H1'],
 ['BUSCARV aprox sin ordenar (Madrid)','=BUSCARV("Madrid";E1:F3;2)'],
 ['BUSCARV exacto (Madrid)','=BUSCARV("Madrid";E1:F3;2;FALSO)'],
 ['BUSCARV aprox sin ordenar (Bilbao)','=BUSCARV("Bilbao";E1:F3;2)'],
 ['BUSCARX (Madrid)','=BUSCARX("Madrid";E1:E3;F1:F3)'],
 ['fecha serie 14/11/2026','=G1*1'],
 ['FECHA(2026;11;14)','=FECHA(2026;11;14)'],
 ['29/02/1900 existe?','=FECHA(1900;2;29)'],
 ['G2+1 (28/02/1900+1)','=G2+1'],
 ['DIA(60)','=DIA(60)'],
 ['texto fecha "14/11/2026"*1','="14/11/2026"*1'],
 ['SUMA(A1+A3) uso raro','=SUMA(A1+A3)'],
 ['referencia circular? (no)','=1'],
];
for (const [n,f] of tests) { try { const r = M.evaluar(HF, hoja, 'Z1', f); console.log(n.padEnd(36), f.padEnd(36), '=>', JSON.stringify(r.valor)); } catch(e) { console.log(n, f, 'ERROR', e.message); } }
