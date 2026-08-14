-- =====================================================================
-- RWAdar · seguridad a nivel de fila (Supabase)
-- ---------------------------------------------------------------------
-- Regla de oro: la clave anónima va dentro de la app y del navegador,
-- así que cualquiera puede leerla. Por tanto la clave anónima NO puede
-- tener permiso de escritura sobre el contenido editorial. El catálogo
-- solo se modifica con la clave de servicio, que nunca sale del
-- ordenador de quien publica.
-- =====================================================================

alter table categorias      enable row level security;
alter table regiones        enable row level security;
alter table plataformas     enable row level security;
alter table fuentes         enable row level security;
alter table cambios_estado  enable row level security;
alter table dispositivos    enable row level security;
alter table seguimiento     enable row level security;

-- ---------------------------------------------------------------------
-- Contenido editorial: lectura pública, escritura cerrada
-- ---------------------------------------------------------------------
create policy "catalogo visible" on categorias
  for select to anon, authenticated using (true);

create policy "regiones visibles" on regiones
  for select to anon, authenticated using (true);

-- Las descartadas se publican igual que las del radar: forman parte del
-- valor del registro. Pero solo se leen, nunca se escriben desde fuera.
create policy "plataformas visibles" on plataformas
  for select to anon, authenticated using (true);

create policy "fuentes visibles" on fuentes
  for select to anon, authenticated using (true);

create policy "historial visible" on cambios_estado
  for select to anon, authenticated using (true);

-- Sin políticas de insert/update/delete, quedan prohibidas para anon y
-- authenticated. service_role se salta RLS por definición.

-- ---------------------------------------------------------------------
-- Datos del dispositivo: cada uno con lo suyo
-- ---------------------------------------------------------------------
-- La app manda su identificador de instalación en la cabecera
-- 'x-instalacion'. No es un secreto ni identifica a una persona: solo
-- separa los datos de un dispositivo de los del resto.
create function instalacion_actual() returns text language sql stable as $$
  select nullif(current_setting('request.headers', true)::json ->> 'x-instalacion', '')
$$;

create policy "el dispositivo se ve a si mismo" on dispositivos
  for select to anon, authenticated
  using (instalacion = instalacion_actual());

create policy "el dispositivo se registra" on dispositivos
  for insert to anon, authenticated
  with check (instalacion = instalacion_actual());

create policy "el dispositivo se actualiza" on dispositivos
  for update to anon, authenticated
  using (instalacion = instalacion_actual())
  with check (instalacion = instalacion_actual());

create policy "el dispositivo se borra" on dispositivos
  for delete to anon, authenticated
  using (instalacion = instalacion_actual());

create policy "seguimiento propio visible" on seguimiento
  for select to anon, authenticated
  using (instalacion = instalacion_actual());

create policy "seguimiento propio se anade" on seguimiento
  for insert to anon, authenticated
  with check (instalacion = instalacion_actual());

create policy "seguimiento propio se quita" on seguimiento
  for delete to anon, authenticated
  using (instalacion = instalacion_actual());

-- ---------------------------------------------------------------------
-- Permisos explícitos (mínimo privilegio)
-- ---------------------------------------------------------------------
-- El proyecto se creó con la exposición automática de tablas DESACTIVADA,
-- que es lo que recomienda Supabase. Por tanto nada es accesible hasta
-- que se concede a mano. RLS decide QUÉ filas; estos grants deciden
-- SOBRE QUÉ TABLAS. Hacen falta los dos.
grant usage on schema public to anon, authenticated;

-- Catálogo: solo lectura para todo el mundo
grant select on categorias, regiones, plataformas, fuentes, cambios_estado
  to anon, authenticated;

-- Datos del propio dispositivo: RLS ya limita a los suyos
grant select, insert, update, delete on dispositivos   to anon, authenticated;
grant select, insert, delete          on seguimiento   to anon, authenticated;

-- ---------------------------------------------------------------------
-- Vistas
-- ---------------------------------------------------------------------
-- radar_publico se declara security_invoker para que respete las
-- políticas de las tablas de origen en lugar de saltárselas.
alter view radar_publico set (security_invoker = on);
grant select on radar_publico to anon, authenticated;

-- Estas dos NO se conceden a nadie a propósito:
--   avisos_pendientes       contiene tokens push de dispositivos
--   descartadas_sin_fuente  es control de calidad interno
-- Solo son accesibles con la clave de servicio.

