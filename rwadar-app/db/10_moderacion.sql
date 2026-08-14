-- =====================================================================
-- RWAdar · moderación
-- ---------------------------------------------------------------------
-- Hasta ahora las denuncias se acumulaban y a las tres retiraban la
-- opinión sola, pero nadie las miraba nunca. Eso deja dos agujeros: una
-- opinión legítima puede quedar enterrada por tres amigos, y una
-- difamación puede aguantar indefinidamente con dos denuncias.
--
-- Aquí entra una persona a decidir. Con dos cautelas:
--
--   1 · Ser administrador NO se pide desde el navegador. Se concede
--       desde la base y punto. La columna no está expuesta a la API.
--   2 · Cada decisión queda firmada y fechada. Si mañana alguien
--       reclama por qué se ocultó su opinión, hay respuesta.
--
-- Depende de 07_cuentas.sql y 09_opiniones.sql.  Es idempotente.
-- =====================================================================
begin;

-- ---------------------------------------------------------------------
-- 1 · Quién modera
-- ---------------------------------------------------------------------
alter table perfiles add column if not exists es_admin boolean not null default false;

-- Se consulta muchas veces por consulta; sin esto cada política haría
-- una pasada por la tabla entera.
create index if not exists perfiles_admins on perfiles (id) where es_admin;

-- Función auxiliar: security definer para que pueda leer `perfiles`
-- saltándose la política que solo deja ver el perfil propio. Si no,
-- preguntar «¿soy admin?» se responde a sí misma en círculo.
create or replace function es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select p.es_admin from perfiles p where p.id = auth.uid()), false)
$$;

revoke all on function es_admin() from public, anon;
grant execute on function es_admin() to authenticated;

-- ---------------------------------------------------------------------
-- 2 · Rastro de cada decisión
-- ---------------------------------------------------------------------
create table if not exists moderacion (
  id            bigint generated always as identity primary key,
  -- Admite nulos a proposito: si esa persona borra su cuenta, la
  -- decision sobrevive pero la identidad no. Con "not null" aqui, el
  -- borrado de cuenta fallaba y nadie que hubiera moderado podia irse.
  moderador_id  uuid references auth.users(id) on delete set null,
  usuario_id    uuid not null,
  plataforma_id uuid not null,
  accion        text not null check (accion in ('ocultar','restaurar')),
  motivo        text check (motivo is null or length(trim(motivo)) <= 500),
  creado_el     timestamptz not null default now()
);

create index if not exists moderacion_reciente on moderacion (creado_el desc);

-- ---------------------------------------------------------------------
-- 3 · Las dos acciones
-- ---------------------------------------------------------------------
-- Van en funciones y no en un UPDATE suelto para que sea imposible
-- moderar sin dejar rastro: el registro y el cambio son la misma
-- operación, o pasan las dos o no pasa ninguna.
create or replace function moderar(
  p_usuario uuid, p_plataforma uuid, p_accion text, p_motivo text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then
    raise exception 'solo un administrador puede moderar';
  end if;
  if p_accion not in ('ocultar','restaurar') then
    raise exception 'accion no valida: %', p_accion;
  end if;

  update opiniones
     set estado    = case when p_accion = 'ocultar' then 'oculta' else 'visible' end,
         denuncias = case when p_accion = 'restaurar' then 0 else denuncias end
   where usuario_id = p_usuario and plataforma_id = p_plataforma;

  if not found then raise exception 'esa opinion no existe'; end if;

  -- Restaurar limpia las denuncias: si no, las tres viejas la volverían
  -- a tumbar en cuanto llegara una nueva.
  if p_accion = 'restaurar' then
    delete from denuncias where usuario_id = p_usuario and plataforma_id = p_plataforma;
  end if;

  insert into moderacion (moderador_id, usuario_id, plataforma_id, accion, motivo)
  values (auth.uid(), p_usuario, p_plataforma, p_accion, p_motivo);
end $$;

revoke all on function moderar(uuid,uuid,text,text) from public, anon;
grant execute on function moderar(uuid,uuid,text,text) to authenticated;

-- ---------------------------------------------------------------------
-- 4 · La cola de trabajo
-- ---------------------------------------------------------------------
-- Todo lo denunciado, esté oculto o no, con lo necesario para decidir
-- sin salir de la pantalla: el texto, quién lo firma y por qué lo
-- denuncian. Ordenado por lo más señalado primero.
create or replace view cola_moderacion as
  select o.usuario_id, o.plataforma_id,
         p.nombre  as plataforma,
         coalesce(nullif(trim(pf.nombre), ''), 'Anónimo') as autor,
         o.nota, o.texto, o.estado, o.denuncias, o.creado_el,
         (select array_agg(coalesce(d.motivo,'sin motivo') order by d.creado_el)
            from denuncias d
           where d.usuario_id = o.usuario_id and d.plataforma_id = o.plataforma_id) as motivos
    from opiniones o
    join plataformas p on p.id = o.plataforma_id
    left join perfiles pf on pf.id = o.usuario_id
   where o.denuncias > 0 or o.estado = 'oculta'
   order by o.denuncias desc, o.creado_el desc;

-- ---------------------------------------------------------------------
-- 5 · Permisos
-- ---------------------------------------------------------------------
-- El administrador ve toda opinión, no solo las visibles y la suya.
drop policy if exists "el administrador lo ve todo" on opiniones;
create policy "el administrador lo ve todo" on opiniones
  for select to authenticated using (es_admin());

drop policy if exists "el administrador ve las denuncias" on denuncias;
create policy "el administrador ve las denuncias" on denuncias
  for select to authenticated using (es_admin());

alter table moderacion enable row level security;
drop policy if exists "el historial de moderacion es para administradores" on moderacion;
create policy "el historial de moderacion es para administradores" on moderacion
  for select to authenticated using (es_admin());

grant select on moderacion     to authenticated;
grant select on cola_moderacion to authenticated;

commit;
