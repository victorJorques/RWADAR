const path=require('path'); const base=path.resolve(__dirname,'..','..');
const HFmod = require(require.resolve('hyperformula',{paths:[base]})); const HF = HFmod.HyperFormula; Object.assign(HF, {FunctionPlugin:HFmod.FunctionPlugin, FunctionArgumentType:HFmod.FunctionArgumentType, SimpleRangeValue:HFmod.SimpleRangeValue, CellError:HFmod.CellError, ErrorType:HFmod.ErrorType, ArraySize:HFmod.ArraySize});
const es = require(require.resolve('hyperformula/i18n/languages/esES',{paths:[base]}));
const M = require(base+'/app/motor.js'); M.preparar(HF, es.default || es);
const hoja={celdas:{A1:'Importe',A2:100,A3:250,A4:80,D1:'IVA',E1:0.21}};
const ctx=M.construir(HF,hoja); const s=ctx.principal;
M.escribir(ctx,'B2','=A2*(1+E1)'); M.copiarA(ctx,'B2',['B3:B4']);
console.log('Fórmula copiada a B4 →', ctx.hf.getCellFormula({sheet:s,col:1,row:3}), '| valor', M.leer(ctx,'B4'));
console.log('Precedentes de B4 →', JSON.stringify(ctx.hf.getCellPrecedents({sheet:s,col:1,row:3})));
// rango que no se amplía al añadir fila debajo vs insertar dentro
const c2=M.construir(HF,{celdas:{A1:10,A2:20,A3:30,C1:'=SUMA(A1:A3)'}}); const s2=c2.principal;
c2.hf.setCellContents({sheet:s2,col:0,row:3},[[40]]);
console.log('Añado 40 en A4 (debajo): C1 =', c2.hf.getCellFormula({sheet:s2,col:2,row:0}), '→', M.leer(c2,'C1'));
c2.hf.addRows(s2,[2,1]); c2.hf.setCellContents({sheet:s2,col:0,row:2},[[5]]);
console.log('Inserto fila dentro (fila 3) con 5: C1 =', c2.hf.getCellFormula({sheet:s2,col:2,row:0}), '→', M.leer(c2,'C1'));
console.log('validateFormula("=SUMA(A1;")', ctx.hf.validateFormula('=SUMA(A1;'), '| validateFormula("=SUMA(A1:A3)")', ctx.hf.validateFormula('=SUMA(A1:A3)'));
