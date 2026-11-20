const HFmod = require('hyperformula'); const HF = HFmod.HyperFormula; Object.assign(HF, {FunctionPlugin:HFmod.FunctionPlugin, FunctionArgumentType:HFmod.FunctionArgumentType, SimpleRangeValue:HFmod.SimpleRangeValue, CellError:HFmod.CellError, ErrorType:HFmod.ErrorType, ArraySize:HFmod.ArraySize});
const es = require('hyperformula/i18n/languages/esES');
const M = require('./app/motor.js');
M.preparar(HF, es.default || es);
const hoja = { celdas: { A1:'Producto',B1:'Precio',C1:'Uds',D1:'Fecha', A2:'Café',B2:1.5,C2:10,D2:{fecha:'2026-11-14'}, A3:'Té',B3:2,C3:5,D3:{fecha:'2026-01-05'}, A4:'Agua',B4:0.8,C4:20,D4:{fecha:'2026-03-31'}, A6:'IVA', B6:0.21, A7:'  Juan  Pérez ', A8:'ES-2026-001' } };
const tests = [
 '=BUSCARV("Agua";A2:B4;2;FALSO)', '=SI(B2>1;VERDADERO;FALSO)', '=TEXTO(D2;"dd/mm/aaaa")', '=TEXTO(D2;"dddd, d \\"de\\" mmmm \\"de\\" aaaa")', '=TEXTO(D2;"dddd d mmmm aaaa")','=TEXTO(1234,5;"#.##0,00 €")', '=TEXTO(0,256;"0,0%")', '=TEXTO(7;"000")',
 '=LET(t;B2*C2;iva;$B$6;t*(1+iva))', '=CAMBIAR(A3;"Café";"C";"Té";"T";"?")', '=PROMEDIO.SI.CONJUNTO(B2:B4;C2:C4;">5")', '=COINCIDIRX("Té";A2:A4)', '=JERARQUIA.EQV(B3;B2:B4)', '=TEXTOANTES(A8;"-")', '=TEXTODESPUES(A8;"-";-1)', '=CONCAT(A2:A4)', '=MODA.UNO(1;2;2;3)',
 '=ESPACIOS(A7)', '=SIFECHA(D3;D2;"m")', '=DIAS(D2;D3)', '=SI.ND(BUSCARX("X";A2:A4;B2:B4);"no")', '=FILTRAR(A2:A4;B2:B4>1)', '=ORDENARPOR(A2:A4;B2:B4;-1)', '=ELEGIRCOLS(A1:C4;3;1)', '=TOMAR(A2:C4;2)', '=EXCLUIR(A2:C4;1)', '=DIVIDIRTEXTO(A8;"-")', '=SUMA(B2:B4*C2:C4)', '=AÑO(D2)', '=FIN.MES(D3;0)', '=DIAS.LAB(D3;D2)','=MES(D2)','=XO(VERDADERO;FALSO)','=PORCENTAJEDE(C2;C2:C4)'
];
for (const f of tests) { const r = M.evaluar(HF, hoja, 'H1', f); console.log(f.padEnd(48), '=>', JSON.stringify(r.valor), r.celdas.length>1? JSON.stringify(Object.values(r.valores)):'' ); }
// comprobar
const ej = { hoja, objetivo:'E2', copiar_a:['E3:E4'], solucion:'=B2*C2*(1+$B$6)', variantes:[{B2:3, B6:0.1}], debe_usar:[] };
for (const f of ['=B2*C2*(1+B6)','=B2*C2*(1+$B$6)','=18,15','=B2*C2*1,21','=SUMA(B2,C2)','B2*C2','=SUM(B2:C2)','=B2*C2*(1+$B$6']) console.log(f.padEnd(24), JSON.stringify(M.comprobar(HF, ej, f)));
console.log(M.formatear(1234567.891,'#.##0,00 €'), M.formatear(1000,'num'), M.formatear(0.5,'pct'), M.formatear(46340,'fecha'), M.formatear(-5,'#.##0,00;[Rojo]-#.##0,00'), M.formatear(3.14159,null));
