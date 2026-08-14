-- =====================================================================
-- RWAdar · alta de Archax y Republic en el radar
-- ---------------------------------------------------------------------
-- Las dos salen del estudio del 8 de agosto de 2026, pero NINGÚN dato de
-- aquí procede del estudio: cada aval se ha comprobado contra el
-- regulador que lo emite. El estudio sirvió para saber a quién mirar.
--
--   Archax   · FCA (Reino Unido), FRN 838656
--   Republic · SEC + FINRA (EE. UU.), OpenDeal Portal / OpenDeal Broker
--
-- Es idempotente: se puede aplicar dos veces sin duplicar nada.
-- =====================================================================
begin;

-- ---------------------------------------------------------------------
-- Reino Unido no existía como región: Archax es la primera británica.
-- ---------------------------------------------------------------------
insert into regiones (slug, nombre) values ('reino-unido', 'Reino Unido')
  on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Archax
-- ---------------------------------------------------------------------
-- Aval comprobado en el registro de la FCA: Archax Ltd, FRN 838656,
-- autorizada como exchange, bróker y custodio, con permiso de sistema
-- multilateral de negociación (MTF) e inscrita en el registro de
-- criptoactivos. La propia FCA mantiene avisos publicados sobre clones
-- ("Archax-EU", "Archax Trade") que suplantan a la entidad autorizada:
-- el dominio válido es archax.com y solo ese.
-- ---------------------------------------------------------------------
insert into plataformas
  (slug, nombre, estado, categoria_slug, region_slug, actor, acceso, ticket,
   cadenas, web, aval, nota, verificada_el)
values (
  'archax', 'Archax', 'en_radar',
  'acciones-y-capital-privado', 'reino-unido', 'Marketplace',
  'Institucional', 'Alto', 'Varias', 'https://archax.com',
  'Autorizada y supervisada por la FCA británica con el número 838656, como exchange, bróker y custodio, e inscrita en su registro de criptoactivos. Tiene permiso para operar un sistema multilateral de negociación, no solo para intermediar.',
  'Mercado regulado de valores digitales en Londres que reúne emisión, negociación y custodia bajo la misma licencia. Cuidado con los clones: la FCA tiene avisos publicados sobre webs que la suplantan, y el dominio válido es archax.com.',
  '2026-08-08'
) on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Republic
-- ---------------------------------------------------------------------
-- Aval comprobado: OpenDeal Portal LLC opera como portal de financiación
-- registrado ante la SEC y miembro de FINRA desde 2016 (expediente SEC
-- 7-167), y OpenDeal Broker LLC como bróker-dealer miembro de FINRA y
-- SIPC para las emisiones Reg A+, Reg D y Reg S.
--
-- La nota dice lo que el usuario NO compra, y es deliberado. Los Mirror
-- Tokens de Republic no son acciones de la empresa que replican: son
-- pagarés de pago contingente, deuda no garantizada emitida por la
-- propia Republic, que paga si llega un evento de liquidez. No dan
-- propiedad, ni voto, ni derecho de información frente a la empresa de
-- referencia, y el riesgo de contraparte es de Republic. Hay bloqueo de
-- 12 meses y la liquidez posterior no está garantizada.
-- ---------------------------------------------------------------------
insert into plataformas
  (slug, nombre, estado, categoria_slug, region_slug, actor, acceso, ticket,
   cadenas, web, aval, nota, verificada_el)
values (
  'republic', 'Republic', 'en_radar',
  'acciones-y-capital-privado', 'ee-uu', 'Marketplace',
  'Minorista', 'Bajo', 'Varias', 'https://republic.com',
  'Opera con entidades registradas y supervisadas en EE. UU.: OpenDeal Portal LLC como portal de financiación ante la SEC y FINRA desde 2016, y OpenDeal Broker LLC como bróker-dealer miembro de FINRA y SIPC.',
  'Mercados privados troceados desde importes pequeños: empresas sin cotizar, fondos, cine, deporte y arte. Importante: sus Mirror Tokens no son acciones de la empresa que replican, sino pagarés de la propia Republic que pagan solo si llega una salida a bolsa o una compra.',
  '2026-08-08'
) on conflict (slug) do nothing;

commit;
