const path='/tmp/claude-0/-home-user-RWADAR/2f4f48c6-5daf-5e88-a4f7-bdceb91de476/scratchpad/excel/node_modules/';
const { HyperFormula } = require(path+'hyperformula');
const base = require(path+'hyperformula/commonjs/i18n/languages/esES');
HyperFormula.registerLanguage('esES', base.default||base);
for (const cfg of [{},{arrayColumnSeparator:';',arrayRowSeparator:'|'},{arrayColumnSeparator:'\\',arrayRowSeparator:';'}]) {
  try {
    const hf = HyperFormula.buildEmpty(Object.assign({ licenseKey:'gpl-v3', language:'esES', functionArgSeparator:';', decimalSeparator:',', thousandSeparator:'.', useArrayArithmetic:true }, cfg));
    hf.addSheet('H');
    const tests=['=SUMA({1\\2\\3})','=SUMA({1;2;3})','=SUMA({1,5;2,5})','=COLUMNAS({1\\2\\3})','=FILAS({1;2;3})','=SUMA({1|2})'];
    tests.forEach((t,i)=>{ hf.setCellContents({sheet:0,row:i,col:0},[[t]]); const v=hf.getCellValue({sheet:0,row:i,col:0}); console.log(JSON.stringify(cfg),t,'=>',v&&v.type?('ERR '+v.value+' '+v.message):v); });
  } catch(e) { console.log(JSON.stringify(cfg),'CONFIG ERROR:',e.message); }
}
