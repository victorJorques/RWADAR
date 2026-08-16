-- =====================================================================
-- RWAdar · los dos estados que faltaban a las emisiones
-- ---------------------------------------------------------------------
-- La migración 18 se diseñó sobre cómo DEBERÍAN publicarse las emisiones.
-- Al ir a cargar las primeras nueve reales, cinco supuestos se cayeron.
-- Esto los corrige. Cada cambio lleva el caso concreto que lo obligó,
-- porque dentro de seis meses el porqué vale más que el qué.
--
--   1. CASI NINGUNA PUBLICA FECHA DE CIERRE. Las nueve encontradas el
--      16-08-2026 tienen `cierra_el` vacío: cierran cuando se llenan, no
--      en una fecha. La regla «abierta obliga a fecha de cierre» dejaba
--      fuera al 100% del mercado real. La urgencia sale del porcentaje
--      captado, no del calendario.
--   2. TAMPOCO PUBLICAN SIEMPRE TICKET MÍNIMO. Las cinco de Wecity no lo
--      dicen. `ticket_minimo not null` bloqueaba cinco de las seis
--      abiertas. Un hueco es correcto; inventar la cifra, no. Es la
--      misma regla que ya aplica la tarjeta al no pintar rentabilidad
--      cuando no la hay.
--   3. EL PLAZO A VECES ES UN RANGO. Urbanitae publica «30-34 meses».
--      Un `smallint` obligaba a elegir un extremo y perder el dato.
--   4. FALTABAN DOS ESTADOS: `programada` y `en_estudio`. Tres de las
--      nueve son exactamente eso, con fecha y hora de apertura. Y «abre
--      el martes a las 12:00» es lo más Booking que existe: es lo que
--      hace que alguien ponga una alarma.
--   5. HAY RENTABILIDADES QUE NO SE PUBLICAN NUNCA, por criterio del
--      supervisor: Urbanitae no la da en equity. Eso no es un hueco
--      pendiente de rellenar, es permanente, y confundir las dos cosas
--      haría que `emisiones_rancias` gritara para siempre por algo que
--      no se puede arreglar.
--
-- Y uno que no es de forma sino de honradez: hay emisiones abiertas que
-- NO puede suscribir cualquiera. Las cinco de Flix están reservadas a
-- empadronados en la comarca con dos años de antigüedad, y además son
-- reservas no vinculantes sin desembolso. Listarlas como «invierte ya»
-- sería engañar. Ahora la restricción viaja en el dato y la web la
-- enseña.
-- =====================================================================

-- ESTE ARCHIVO VA SOLO, Y ANTES QUE EL 20. Postgres no permite usar un
-- valor de enum en la misma transacción en la que se crea: la vista del
-- 20 filtra por 'programada' y falla si van juntos. Por eso están
-- separados, y no por gusto.

-- 4 · los dos estados que faltaban
alter type rwa_emision add value if not exists 'programada';
alter type rwa_emision add value if not exists 'en_estudio';

