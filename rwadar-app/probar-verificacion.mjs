/* Ejecuta el verificador SQL y demuestra que el rollback falla cerrado. */
import fs from 'node:fs';
import {
  MIGRACIONES,
  baseCompleta,
  baseConMigraciones,
  filas,
} from './pruebas-soporte.mjs';

const db = await baseCompleta();
await db.exec(fs.readFileSync('db/14_seguridad_integral_verificar.sql', 'utf8'));
console.log('Verificación posterior: OK');

await db.exec(fs.readFileSync('db/15_acl_funciones.sql', 'utf8'));
await db.exec(fs.readFileSync('db/15_acl_funciones_verificar.sql', 'utf8'));
console.log('ACL de funciones y search_path: OK');

await db.exec(fs.readFileSync('db/22_cierre_regresiones_verificar.sql', 'utf8'));
console.log('Cierre posterior a push/emisiones: OK');

await db.exec(fs.readFileSync('db/22_cierre_regresiones_rollback.sql', 'utf8'));
const permisos = (await filas(db, `select
  has_function_privilege('authenticated','guardar_opinion(uuid,integer,text)','EXECUTE') guarda,
  has_function_privilege('authenticated','denunciar_opinion(uuid,text)','EXECUTE') denuncia,
  has_column_privilege('authenticated','perfiles','es_admin','UPDATE') admin,
  has_column_privilege('authenticated','opiniones','estado','UPDATE') estado`))[0];
const reloj = (await filas(db,
  "select count(*)::int n from cron.job where jobname='rwadar-push'"))[0].n;
if (permisos.guarda || permisos.denuncia || permisos.admin || permisos.estado
    || reloj !== 0) {
  throw new Error('el rollback no quedó cerrado');
}
console.log('Rollback 22 seguro: OK (mutaciones desactivadas, push parado, permisos cerrados)');
await db.close();

// Simula la peor regresion conocida (16 aplicada tras 14/15) y demuestra
// que el mecanismo universal sacrifica disponibilidad sin borrar datos.
const vulnerable = await baseConMigraciones([
  ...MIGRACIONES.slice(0, MIGRACIONES.indexOf('17_avisos_push.sql')),
  '16_reparacion.sql',
]);
const antes = (await filas(vulnerable, `select
  has_column_privilege('anon','opiniones','usuario_id','SELECT') uuid_anon,
  has_table_privilege('authenticated','opiniones','INSERT') inserta,
  has_function_privilege(
    'authenticated','moderar(uuid,uuid,text,text)','EXECUTE'
  ) modera_antigua`))[0];
if (!antes.uuid_anon || !antes.inserta || !antes.modera_antigua) {
  throw new Error('la precondicion vulnerable de 16 no se reprodujo');
}

await vulnerable.exec(fs.readFileSync('db/fallo_cerrado.sql', 'utf8'));
const despues = (await filas(vulnerable, `select
  has_table_privilege('anon','categorias','SELECT') catalogo,
  has_column_privilege('anon','opiniones','usuario_id','SELECT') uuid_anon,
  has_table_privilege('authenticated','opiniones','INSERT') inserta,
  has_function_privilege(
    'authenticated','moderar(uuid,uuid,text,text)','EXECUTE'
  ) modera_antigua,
  (select relrowsecurity from pg_class
    where oid='public.opiniones'::regclass) rls,
  (select count(*)::int from cron.job
    where jobname in ('rwadar-avisos','rwadar-push')) relojes`))[0];
if (despues.catalogo || despues.uuid_anon || despues.inserta
    || despues.modera_antigua || !despues.rls || despues.relojes !== 0) {
  throw new Error('fallo_cerrado.sql no aisló completamente la base vulnerable');
}
const conservadas = (await filas(vulnerable,
  'select count(*)::int n from plataformas'))[0].n;
if (conservadas !== 30) throw new Error('el cierre alteró los datos del catálogo');
console.log('Fallo universal seguro: OK (API aislada, relojes parados, datos conservados)');
await vulnerable.close();

// Comprueba que la migracion de cierre tambien sirve para recuperar una base
// completa que haya entrado en modo de fallo cerrado.
const recuperada = await baseCompleta();
await recuperada.exec(fs.readFileSync('db/fallo_cerrado.sql', 'utf8'));
const cerradoCompleto = (await filas(recuperada, `select
  (select habilitado from push_configuracion where singleton) push_activo,
  (select count(*)::int from cron.job where jobname='rwadar-push') push_relojes,
  (select count(*)::int from cron.job
    where jobname='rwadar-retencion-dispositivos') retencion`))[0];
if (cerradoCompleto.push_activo || cerradoCompleto.push_relojes !== 0
    || cerradoCompleto.retencion !== 1) {
  throw new Error('fallo cerrado no separó push de la retención de privacidad');
}
console.log('Fallo cerrado completo: OK (push apagado, retención conservada)');
await recuperada.exec(fs.readFileSync('db/22_cierre_regresiones.sql', 'utf8'));
await recuperada.exec(fs.readFileSync('db/14_seguridad_integral_verificar.sql', 'utf8'));
await recuperada.exec(fs.readFileSync('db/15_acl_funciones_verificar.sql', 'utf8'));
await recuperada.exec(fs.readFileSync('db/22_cierre_regresiones_verificar.sql', 'utf8'));
await recuperada.exec(fs.readFileSync('db/fresh_install_verificar.sql', 'utf8'));
const reabierta = (await filas(recuperada, `select
  has_table_privilege('anon','categorias','SELECT') catalogo,
  has_function_privilege(
    'authenticated','guardar_opinion(uuid,integer,text)','EXECUTE'
  ) guarda,
  (select count(*)::int from cron.job
    where jobname='rwadar-push') reloj,
  (select count(*)::int from cron.job
    where jobname='rwadar-retencion-dispositivos') retencion,
  (select habilitado from push_configuracion where singleton) push_activo`))[0];
if (!reabierta.catalogo || !reabierta.guarda || reabierta.reloj !== 0
    || reabierta.retencion !== 1 || reabierta.push_activo) {
  throw new Error('22 no recuperó API/retención con push cerrado');
}
console.log('Recuperación tras fallo cerrado: OK (API/retención sí, push no)');

await recuperada.exec(fs.readFileSync('db/activar_push.sql', 'utf8'));
await recuperada.exec(fs.readFileSync('db/activar_push_verificar.sql', 'utf8'));
const optIn = (await filas(recuperada, `select
  (select habilitado from push_configuracion where singleton) activo,
  (select count(*)::int from cron.job where jobname='rwadar-push') reloj`))[0];
if (!optIn.activo || optIn.reloj !== 1) {
  throw new Error('el artefacto opt-in no activó exactamente un reloj push');
}
console.log('Activación push separada: OK (solo el opt-in agenda el reloj)');
await recuperada.close();
