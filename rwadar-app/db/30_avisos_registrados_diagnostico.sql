-- =====================================================================
-- RWAdar 30 · diagnóstico de permisos de Vault y pg_net (SOLO LEE)
-- Para saber, sin cambiar nada, si los clientes (anon, authenticated)
-- pueden leer los secretos o las colas de pg_net, quién dio esos permisos
-- y si esos esquemas están publicados en la API. No muestra secretos: solo
-- permisos (ACL), dueños y la lista de esquemas publicados.
-- =====================================================================
begin transaction read only;

select current_user as usuario,
       (select rolsuper from pg_roles where rolname = current_user) as superusuario;

select r.rolname as rol,
       has_table_privilege(r.rolname, 'vault.decrypted_secrets', 'SELECT') as lee_vault_descifrado,
       case when to_regclass('vault.secrets') is null then null
            else has_table_privilege(r.rolname, 'vault.secrets', 'SELECT') end as lee_vault_secrets,
       case when to_regclass('net.http_request_queue') is null then null
            else has_table_privilege(r.rolname, 'net.http_request_queue', 'SELECT') end as lee_cola_pg_net,
       case when to_regclass('net._http_response') is null then null
            else has_table_privilege(r.rolname, 'net._http_response', 'SELECT') end as lee_respuestas_pg_net,
       has_schema_privilege(r.rolname, 'vault', 'USAGE') as usa_esquema_vault,
       case when to_regnamespace('net') is null then null
            else has_schema_privilege(r.rolname, 'net', 'USAGE') end as usa_esquema_net
  from pg_roles r where r.rolname in ('anon', 'authenticated', 'public') order by 1;

select c.oid::regclass as objeto, c.relowner::regrole as dueno, c.relacl as permisos
  from pg_class c
 where c.oid in (to_regclass('vault.decrypted_secrets'), to_regclass('vault.secrets'),
                 to_regclass('net.http_request_queue'), to_regclass('net._http_response'));

select n.nspname as esquema, n.nspowner::regrole as dueno, n.nspacl as permisos
  from pg_namespace n where n.nspname in ('vault', 'net');

-- Esquemas que publica la API (PostgREST), si están en la configuración del rol.
select r.rolname, c as ajuste
  from pg_roles r, unnest(coalesce(r.rolconfig, '{}')) c
 where r.rolname = 'authenticator' and c like 'pgrst.%';

rollback;
