const path='/tmp/claude-0/-home-user-RWADAR/2f4f48c6-5daf-5e88-a4f7-bdceb91de476/scratchpad/excel/node_modules/';
const { HyperFormula } = require(path+'hyperformula');
const base = require(path+'hyperformula/commonjs/i18n/languages/esES');
const es = JSON.parse(JSON.stringify(base.default||base));
const fix={IFNA:'SI.ND',SWITCH:'CAMBIAR',FILTER:'FILTRAR',DAYS:'DIAS',DATEDIF:'SIFECHA',XOR:'XO',ARABIC:'NUMERO.ARABE','CEILING.MATH':'MULTIPLO.SUPERIOR.MAT','FLOOR.MATH':'MULTIPLO.INFERIOR.MAT',ISOWEEKNUM:'ISO.NUM.DE.SEMANA',ISFORMULA:'ESFORMULA',UNICHAR:'UNICAR',PDURATION:'P.DURACION','COVARIANCE.P':'COVARIANCE.P','CEILING.PRECISE':'MULTIPLO.SUPERIOR.EXACTO','FLOOR.PRECISE':'MULTIPLO.INFERIOR.EXACTO','ISO.CEILING':'MULTIPLO.SUPERIOR.ISO',BITAND:'BIT.Y',BITOR:'BIT.O',BITXOR:'BIT.XO',BITLSHIFT:'BIT.DESPLIZQDA',BITRSHIFT:'BIT.DESPLDCHA'};
Object.assign(es.functions, fix);
HyperFormula.registerLanguage('esES', es);
const hf = HyperFormula.buildFromArray([[1,'a',10],[2,'b',20],[3,'a',30]], { licenseKey:'gpl-v3', language:'esES', functionArgSeparator:';', decimalSeparator:',', thousandSeparator:'.', dateFormats:['DD/MM/YYYY'], useArrayArithmetic:true });
const tests=['=SI.ND(NOD();0)','=CAMBIAR(1;1;"x";"y")','=FILTRAR(A1:A3;C1:C3>15)','=DIAS("10/01/2026";"01/01/2026")','=SIFECHA("01/01/2026";"10/03/2026";"d")','=SIFECHA("01/01/2026";"10/03/2026";"D")','=SIFECHA("01/01/2026";"10/03/2026";"m")','=SIFECHA("01/01/2020";"10/03/2026";"y")','=XO(1;0)','=BUSCARV(2;A1:C3;3;FALSO)','=BUSCARV(2;A1:C3;3;FALSE)','=BUSCARV(2;A1:C3;3;0)','=SI(A1>0;VERDADERO;FALSO)','=TEXTO(1234,5;"#.##0,00")','=TEXTO(1234,5;"#,##0.00")','=TEXTO(0,256;"0,0%")','=TEXTO(0,256;"0.0%")','=TEXTO(FECHA(2026;11;14);"dd/mm/aaaa")','=TEXTO(FECHA(2026;11;14);"dd/mm/yyyy")','=TEXTO(FECHA(2026;11;14);"dddd")','=1,5+1','=SUMA(1;2)','=SUMA(A1:A3)','=A1&" €"','="1.234,5"*1','=VALOR("1.234,5")','=MULTIPLO.SUPERIOR.MAT(2,3)','=ISO.NUM.DE.SEMANA("14/11/2026")'];
for (let i=0;i<tests.length;i++){
  hf.setCellContents({sheet:0,row:i+5,col:5},[[tests[i]]]); const v=hf.getCellValue({sheet:0,row:i+5,col:5}); const out = (v && typeof v==='object' && 'type' in v) ? ('ERR '+v.value+' '+(v.message||'')) : JSON.stringify(v); console.log(tests[i].padEnd(48),'=>',out);
}
// boolean via named expressions
try { hf.addNamedExpression('VERDADERO','=VERDADERO()'); console.log('named VERDADERO ok'); } catch(e){ console.log('named VERDADERO fail:', e.message); }
try { hf.addNamedExpression('FALSO','=FALSO()'); console.log('named FALSO ok'); } catch(e){ console.log('named FALSO fail:', e.message); }
for (const t of ['=BUSCARV(2;A1:C3;3;FALSO)','=SI(A1>0;VERDADERO;FALSO)','=UNIRCADENAS("-";VERDADERO;"a";"";"b")']) { hf.setCellContents({sheet:0,row:60,col:5},[[t]]); const v=hf.getCellValue({sheet:0,row:60,col:5}); console.log(t,'=>', (v&&v.type)?('ERR '+v.value+' '+v.message):JSON.stringify(v)); }
// see how formulas are serialized back
console.log('formula back:', hf.getCellFormula({sheet:0,row:60,col:5}));
