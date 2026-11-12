-- =====================================================================
-- RWAdar · marcar una cuenta como administración por la huella de su correo
-- ---------------------------------------------------------------------
-- Para que el titular pueda moderar y recibir la «prueba» de las
-- notificaciones con la cuenta que usa en su móvil, sin escribir su correo
-- en Git, en la entrada del flujo ni en los registros: el flujo solo recibe
-- la huella SHA-256 (hex, 64 caracteres) del correo en minúsculas y sin
-- espacios. Lo lanza «Avisos a registrados (base)» › hacer-admin, con
-- AVISOS y copia cifrada antes. La huella va en un SELECT (set_config
-- local a la transacción), nunca en una DDL.
--
-- Solo marca una cuenta confirmada y no anónima; si la huella no casa con
-- exactamente una, no cambia nada. El disparador perfiles_protegen_admin
-- (14) solo impide el cambio a anon y authenticated; aquí corre postgres.
-- Para quitar la marca: establecer_admin(id, false) o este mismo patrón.
-- =====================================================================
\set ON_ERROR_STOP on
\set VERBOSITY terse
begin;
select set_config('rwadar.admin_huella', :'huella', true) is not null as huella_recibida;
do $marcar$
declare
  v_huella text := current_setting('rwadar.admin_huella', true);
  v_ids uuid[];
  v_total integer;
begin
  if v_huella is null or v_huella !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'hacer-admin: la huella debe ser SHA-256 en hexadecimal (64 caracteres, minúsculas)';
  end if;
  select array_agg(u.id) into v_ids
    from auth.users u
   where u.email_confirmed_at is not null
     and u.is_anonymous is not true
     and encode(sha256(convert_to(lower(btrim(u.email)), 'UTF8')), 'hex') = v_huella;
  v_total := coalesce(array_length(v_ids, 1), 0);
  if v_total <> 1 then
    raise exception using errcode = 'P0002',
      message = format('hacer-admin: la huella casa con %s cuentas confirmadas (hace falta exactamente 1); no se cambia nada', v_total);
  end if;
  update public.perfiles p set es_admin = true where p.id = v_ids[1] and not p.es_admin;
  if not exists (select 1 from public.perfiles p where p.id = v_ids[1] and p.es_admin) then
    raise exception using errcode = 'P0002', message = 'hacer-admin: esa cuenta no tiene perfil; no se cambia nada';
  end if;
  raise notice 'RWAdar: 1 cuenta marcada como administración (ninguna otra cambia).';
end
$marcar$;
commit;
