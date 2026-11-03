'use strict';
/* Solo para preparar y ensayar EN LOCAL, el 03/11, la entrega fechada el 04/11:
   adelanta el reloj del proceso a 2026-11-04T09:00Z para que los validadores
   acepten la fecha documental. El 04/11 se vuelve a montar sin este reloj y se
   comprueba que los bytes son idénticos antes de aplicar nada. */
const Real = Date;
const delta = Real.parse('2026-11-04T09:00:00Z') - Real.now();
if (delta > 0) {
  class Reloj extends Real {
    constructor(...a) { if (a.length) super(...a); else super(Real.now() + delta); }
    static now() { return Real.now() + delta; }
  }
  globalThis.Date = Reloj;
}
