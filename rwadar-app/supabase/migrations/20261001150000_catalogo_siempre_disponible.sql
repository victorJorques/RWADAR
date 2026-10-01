-- =====================================================================
-- RWAdar · el catálogo siempre disponible salvo orden expresa
-- ---------------------------------------------------------------------
-- Decisión de Víctor (1 de octubre de 2026): el catálogo tiene que estar
-- siempre disponible para el público, a no ser que él diga lo contrario.
--
-- Hasta ahora una revisión V2 dejaba de publicarse al vencer su vigencia
-- (7 días) y la web se quedaba vacía. Desde aquí:
--
--   1. La última revisión V2 aprobada y COMPLETA se sigue publicando
--      aunque haya vencido. Los clientes calculan que está caducada con
--      verificado_lote_el + vigencia_lote_dias, que ya reciben, y lo
--      avisan. Las cifras comerciales vencidas siguen ocultas oferta a
--      oferta (cifras_vigentes en catalogo_ofertas_publicas_v2, sin
--      cambios).
--   2. Una revisión incompleta, futura o retirada sigue sin publicarse.
--      Nunca se vuelve a una revisión anterior.
--   3. public.catalogo_publicacion es la orden expresa: retirado = true
--      significa «no mostrar el catálogo». Se activa sola al retirar la
--      revisión publicada y se desactiva al aprobar una nueva. Víctor
--      también puede activarla a mano desde el editor SQL.
--
-- Compatibilidad: las vistas públicas no cambian de columnas. Una web o
-- un APK anteriores que reciban un lote caducado lo rechazan igual que
-- antes, así que su comportamiento no cambia. Es idempotente.
-- =====================================================================
begin;

-- ---------------------------------------------------------------------
-- 1 · La revisión publicada se puede leer aunque haya vencido
-- ---------------------------------------------------------------------
-- Las políticas *_de_revision_vigente siguen igual. Estas se suman (las
-- políticas permisivas se combinan con OR) y solo abren la revisión a la
-- que apunta publicacion_v2: aprobada, de esquema 2 y no futura.
drop policy if exists revisiones_publicada_v2 on rwadar_catalogo.revisiones;
create policy revisiones_publicada_v2 on rwadar_catalogo.revisiones
  for select to anon, authenticated
  using (estado = 'aprobada' and version_esquema = 2 and verificado_el <= current_date
    and exists (select 1 from rwadar_catalogo.publicacion_v2 pub
                 where pub.revision_id = revisiones.id));

drop policy if exists fuentes_de_revision_publicada_v2 on rwadar_catalogo.fuentes;
create policy fuentes_de_revision_publicada_v2 on rwadar_catalogo.fuentes
  for select to anon, authenticated using (exists (
    select 1 from rwadar_catalogo.revisiones r
     where r.id = fuentes.revision_id and r.estado = 'aprobada'
       and r.version_esquema = 2 and r.verificado_el <= current_date
       and exists (select 1 from rwadar_catalogo.publicacion_v2 pub where pub.revision_id = r.id)));

drop policy if exists plataformas_de_revision_publicada_v2 on rwadar_catalogo.plataformas;
create policy plataformas_de_revision_publicada_v2 on rwadar_catalogo.plataformas
  for select to anon, authenticated using (exists (
    select 1 from rwadar_catalogo.revisiones r
     where r.id = plataformas.revision_id and r.estado = 'aprobada'
       and r.version_esquema = 2 and r.verificado_el <= current_date
       and exists (select 1 from rwadar_catalogo.publicacion_v2 pub where pub.revision_id = r.id)));

drop policy if exists plataforma_fuentes_de_revision_publicada_v2 on rwadar_catalogo.plataforma_fuentes;
create policy plataforma_fuentes_de_revision_publicada_v2 on rwadar_catalogo.plataforma_fuentes
  for select to anon, authenticated using (exists (
    select 1 from rwadar_catalogo.revisiones r
     where r.id = plataforma_fuentes.revision_id and r.estado = 'aprobada'
       and r.version_esquema = 2 and r.verificado_el <= current_date
       and exists (select 1 from rwadar_catalogo.publicacion_v2 pub where pub.revision_id = r.id)));

drop policy if exists alertas_de_revision_publicada_v2 on rwadar_catalogo.alertas;
create policy alertas_de_revision_publicada_v2 on rwadar_catalogo.alertas
  for select to anon, authenticated using (exists (
    select 1 from rwadar_catalogo.revisiones r
     where r.id = alertas.revision_id and r.estado = 'aprobada'
       and r.version_esquema = 2 and r.verificado_el <= current_date
       and exists (select 1 from rwadar_catalogo.publicacion_v2 pub where pub.revision_id = r.id)));

drop policy if exists alerta_fuentes_de_revision_publicada_v2 on rwadar_catalogo.alerta_fuentes;
create policy alerta_fuentes_de_revision_publicada_v2 on rwadar_catalogo.alerta_fuentes
  for select to anon, authenticated using (exists (
    select 1 from rwadar_catalogo.revisiones r
     where r.id = alerta_fuentes.revision_id and r.estado = 'aprobada'
       and r.version_esquema = 2 and r.verificado_el <= current_date
       and exists (select 1 from rwadar_catalogo.publicacion_v2 pub where pub.revision_id = r.id)));

drop policy if exists ofertas_de_revision_publicada_v2 on rwadar_catalogo.ofertas;
create policy ofertas_de_revision_publicada_v2 on rwadar_catalogo.ofertas
  for select to anon, authenticated using (exists (
    select 1 from rwadar_catalogo.revisiones r
     where r.id = ofertas.revision_id and r.estado = 'aprobada'
       and r.version_esquema = 2 and r.verificado_el <= current_date
       and exists (select 1 from rwadar_catalogo.publicacion_v2 pub where pub.revision_id = r.id)));

-- ---------------------------------------------------------------------
-- 2 · La vista del lote publicable deja de exigir vigencia
-- ---------------------------------------------------------------------
-- Idéntica a 20260930090621_catalogo_v2_colecciones.sql salvo una línea:
-- desaparece «current_date <= r.verificado_el + r.vigencia_dias». Todas
-- las comprobaciones de integridad se conservan: si el lote no está
-- completo, la vista sigue vacía.
create or replace view rwadar_catalogo.revision_publicable_v2 with (security_invoker = true) as
with candidatas as (
  select r.*
    from rwadar_catalogo.revisiones r
    join rwadar_catalogo.publicacion_v2 actual on actual.revision_id = r.id
   where r.version_esquema = 2 and r.estado = 'aprobada'
     and r.verificado_el <= current_date
     and (select count(*) from rwadar_catalogo.plataformas p
           where p.revision_id = r.id) = r.plataformas_esperadas
     and (select count(*) from rwadar_catalogo.ofertas o
           where o.revision_id = r.id) = r.ofertas_esperadas
     and not exists (
       select 1 from jsonb_each_text(r.colecciones_esperadas) esperado
        where (select count(*) from rwadar_catalogo.ofertas o
                where o.revision_id = r.id and o.coleccion = esperado.key) <> esperado.value::integer)
     and not exists (
       select 1 from public.plataformas p
        where p.estado = 'en_radar'
          and not exists (
            select 1 from rwadar_catalogo.plataformas v
             where v.revision_id = r.id and v.plataforma_id = p.id))
     and not exists (
       select 1 from rwadar_catalogo.plataformas v
        join public.plataformas p on p.id = v.plataforma_id
       where v.revision_id = r.id
         and (p.estado <> 'en_radar'
           or v.fecha_canonica_conservada <> p.verificada_el
           or (select count(distinct pf.campo)
                 from rwadar_catalogo.plataforma_fuentes pf
                where pf.revision_id = v.revision_id
                  and pf.plataforma_id = v.plataforma_id) <> 3
           or not exists (
             select 1 from rwadar_catalogo.alertas a
              where a.revision_id = v.revision_id
                and a.plataforma_id = v.plataforma_id)
           or exists (
             select 1 from rwadar_catalogo.alertas a
              where a.revision_id = v.revision_id
                and a.plataforma_id = v.plataforma_id
                and not exists (
                  select 1 from rwadar_catalogo.alerta_fuentes af
                   where af.revision_id = a.revision_id
                     and af.plataforma_id = a.plataforma_id
                     and af.alerta_codigo = a.codigo))))
     and not exists (
       select 1 from rwadar_catalogo.fuentes f
        where f.revision_id = r.id and f.consultada_el <> r.verificado_el)
     and not exists (
       select 1 from rwadar_catalogo.ofertas o
        where o.revision_id = r.id
          and (o.documentacion is null or o.verificada_el > current_date
            or o.verificada_el > r.verificado_el + r.vigencia_dias
            or o.vigencia_dias > r.vigencia_dias))
   order by r.verificado_el desc, r.creada_el desc
   limit 1
)
select * from candidatas;

-- ---------------------------------------------------------------------
-- 3 · La orden expresa: retirar el catálogo
-- ---------------------------------------------------------------------
create table if not exists public.catalogo_publicacion (
  unica          boolean primary key default true check (unica),
  retirado       boolean not null default false,
  motivo         text check (motivo is null or length(btrim(motivo)) between 3 and 300),
  actualizado_el timestamptz not null default now()
);
insert into public.catalogo_publicacion (unica) values (true) on conflict (unica) do nothing;

comment on table public.catalogo_publicacion is
  'Orden expresa de Víctor. retirado = true oculta el catálogo en web y app; si no, se muestra siempre la última copia completa, aunque haya caducado.';

alter table public.catalogo_publicacion enable row level security;
drop policy if exists catalogo_publicacion_visible on public.catalogo_publicacion;
create policy catalogo_publicacion_visible on public.catalogo_publicacion
  for select to anon, authenticated using (true);
revoke all on public.catalogo_publicacion from public, anon, authenticated;
grant select on public.catalogo_publicacion to anon, authenticated;

-- Retirar la revisión publicada es una orden de no mostrarla; aprobar una
-- nueva revisión V2 es la orden de volver a publicar.
create or replace function rwadar_catalogo.sincronizar_publicacion_catalogo() returns trigger
  language plpgsql security invoker set search_path = pg_catalog, rwadar_catalogo, public as $$
begin
  if new.version_esquema = 2 and new.estado = 'aprobada'
     and (tg_op = 'INSERT' or old.estado is distinct from 'aprobada') then
    update public.catalogo_publicacion
       set retirado = false, motivo = null, actualizado_el = now()
     where unica;
  elsif tg_op = 'UPDATE' and old.estado = 'aprobada' and new.estado <> 'aprobada'
        and exists (select 1 from rwadar_catalogo.publicacion_v2 pub where pub.revision_id = new.id) then
    update public.catalogo_publicacion
       set retirado = true, motivo = 'La revisión publicada se ha retirado', actualizado_el = now()
     where unica;
  end if;
  return new;
end $$;
revoke all on function rwadar_catalogo.sincronizar_publicacion_catalogo() from public, anon, authenticated;

drop trigger if exists sincronizar_publicacion_catalogo on rwadar_catalogo.revisiones;
create trigger sincronizar_publicacion_catalogo
  after insert or update of estado on rwadar_catalogo.revisiones
  for each row execute function rwadar_catalogo.sincronizar_publicacion_catalogo();

-- Si la revisión publicada hoy ya está retirada, la orden queda activada.
update public.catalogo_publicacion
   set retirado = true, motivo = 'La revisión publicada se ha retirado', actualizado_el = now()
 where unica and exists (
   select 1 from rwadar_catalogo.publicacion_v2 pub
     join rwadar_catalogo.revisiones r on r.id = pub.revision_id
    where r.estado <> 'aprobada');

revoke all on rwadar_catalogo.revision_publicable_v2,
  public.catalogo_plataformas_publicas_v2, public.catalogo_ofertas_publicas_v2
  from public, anon, authenticated;
grant select on rwadar_catalogo.revision_publicable_v2,
  public.catalogo_plataformas_publicas_v2, public.catalogo_ofertas_publicas_v2
  to anon, authenticated;

notify pgrst, 'reload schema';

commit;
