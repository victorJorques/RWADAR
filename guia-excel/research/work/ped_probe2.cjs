const path=require('path'); const base=path.resolve(__dirname,'..','..');
const HFmod = require(require.resolve('hyperformula',{paths:[base]})); const HF = HFmod.HyperFormula; Object.assign(HF, {FunctionPlugin:HFmod.FunctionPlugin, FunctionArgumentType:HFmod.FunctionArgumentType, SimpleRangeValue:HFmod.SimpleRangeValue, CellError:HFmod.CellError, ErrorType:HFmod.ErrorType, ArraySize:HFmod.ArraySize});
const es = require(require.resolve('hyperformula/i18n/languages/esES',{paths:[base]}));
const M = require(base+'/app/motor.js'); M.preparar(HF, es.default || es);
for (const [label,celdas] of [["{texto:'20'}",{A1:10,A2:{texto:'20'},A3:30}],["{texto:'001'}",{A1:10,A2:{texto:'001'},A3:30}],["\"'20\" (apóstrofo)",{A1:10,A2:"'20",A3:30}],["{v:\"'20\"}",{A1:10,A2:{v:"'20"},A3:30}]]) {
  const hoja={celdas};
  const out=['=SUMA(A1:A3)','=A1+A2+A3','=CONTAR(A1:A3)','=ESNUMERO(A2)','=ESTEXTO(A2)','=A2'].map(f=>f+' → '+JSON.stringify(M.evaluar(HF,hoja,'Z1',f).valor));
  console.log(label.padEnd(22), out.join(' | '));
}
// BUSCARV aproximado con datos ORDENADOS (determinista): código inexistente
const t={celdas:{A1:100,B1:'Lápiz',A2:200,B2:'Goma',A3:300,B3:'Regla'}};
for (const f of ['=BUSCARV(250;A1:B3;2)','=BUSCARV(250;A1:B3;2;FALSO)','=BUSCARV(50;A1:B3;2)','=BUSCARX(250;A1:A3;B1:B3)','=BUSCARX(250;A1:A3;B1:B3;"No existe")']) console.log(f.padEnd(40), JSON.stringify(M.evaluar(HF,t,'Z1',f).valor));
// tabla de tramos (uso correcto del aproximado)
const tr={celdas:{A1:0,B1:0,A2:1000,B2:0.02,A3:5000,B3:0.05,D1:3200}};
console.log('tramos', JSON.stringify(M.evaluar(HF,tr,'Z1','=BUSCARV(D1;A1:B3;2;VERDADERO)').valor));
// Comprobación automática: referencia absoluta que sobrevive al copiar + variante
const ej={hoja:{celdas:{A1:'Importe',B1:'Con IVA',A2:100,A3:250,A4:80,D1:'IVA',E1:0.21}},objetivo:'B2',copiar_a:['B3:B4'],solucion:'=A2*(1+$E$1)',variantes:[{E1:0.1,A3:999}]};
for (const f of ['=A2*(1+$E$1)','=A2*(1+E1)','=A2*1,21','=121','=A2*(1+E$1)','=A2+A2*$E$1']) console.log(f.padEnd(18), JSON.stringify(M.comprobar(HF,ej,f).mensajes));
