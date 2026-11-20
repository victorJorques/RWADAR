const path=require('path'); const base=path.resolve(__dirname,'..','..');
const HFmod = require(require.resolve('hyperformula',{paths:[base]})); const HF = HFmod.HyperFormula; Object.assign(HF, {FunctionPlugin:HFmod.FunctionPlugin, FunctionArgumentType:HFmod.FunctionArgumentType, SimpleRangeValue:HFmod.SimpleRangeValue, CellError:HFmod.CellError, ErrorType:HFmod.ErrorType, ArraySize:HFmod.ArraySize});
const es = require(require.resolve('hyperformula/i18n/languages/esES',{paths:[base]}));
const M = require(base+'/app/motor.js'); M.preparar(HF, es.default || es);
const h={celdas:{B2:10,B3:20,B4:30,B5:'=SUBTOTALES(9;B2:B4)',B6:5,B7:5,B8:'=SUBTOTALES(9;B6:B7)'}};
for (const f of ['=SUMA(B2:B8)','=SUBTOTALES(9;B2:B8)','=HORA("12:00")','="12:00"*24','=FECHA(2026;12;25)-FECHA(2026;11;14)'])
  console.log(f.padEnd(40), JSON.stringify(M.evaluar(HF,h,'Z1',f).valor));
