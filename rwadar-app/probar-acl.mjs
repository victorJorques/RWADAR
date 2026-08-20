/* Regresión específica de 15 sobre el estado real: 14 aplicada, 13 ausente. */
import fs from 'node:fs';
import {
  MIGRACIONES, baseConMigraciones, filas, sesion, alta, informe,
} from './pruebas-soporte.mjs';

const previas = MIGRACIONES.slice(0, MIGRACIONES.indexOf('15_acl_funciones.sql'));
const db = await baseConMigraciones(previas);
const ok = [], fail = [];
const paso = (t, c) => (c ? ok : fail).push(t);

paso('el escenario reproduce producción sin migración 13',
  (await filas(db, "select count(*)::int n from pg_proc where proname='avisos_ciclo'"))[0].n === 0);

const sql15 = fs.readFileSync('db/15_acl_funciones.sql', 'utf8');
await db.exec(sql15);
await db.exec(sql15);
paso('15 se aplica y reaplica aunque 13 no exista', true);
await db.exec(fs.readFileSync('db/15_acl_funciones_verificar.sql', 'utf8'));
paso('el verificador de ACL pasa sin 13', true);

const funcionesInternas = [
  'crea_perfil()', 'encola_avisos_correo()', 'revisa_denuncias()',
  'sincroniza_autor_opiniones()',
];
for (const funcion of funcionesInternas) {
  const [acl] = await filas(db, `select
    has_function_privilege('anon',$1,'EXECUTE') anon,
    has_function_privilege('authenticated',$1,'EXECUTE') autenticado`, [funcion]);
  paso(`${funcion} no es RPC pública`, !acl.anon && !acl.autenticado);
}

// Revocar EXECUTE directo no debe romper disparadores ni las RPC legítimas.
const usuario = await alta(db, 'acl@prueba.invalid', { nombre: 'ACL' });
paso('el trigger de alta sigue creando perfiles',
  (await filas(db, 'select count(*)::int n from perfiles where id=$1', [usuario.id]))[0].n === 1);

const [plataforma] = await filas(db, "select id from plataformas where slug='reental'");
await sesion(db, usuario.id, 'authenticated');
const opinion = (await filas(db, 'select guardar_opinion($1,7,$2) id', [plataforma.id,
  'Una opinión válida para probar la ACL explícita de las funciones.']))[0].id;
await filas(db, "update perfiles set nombre='ACL editada' where id=$1", [usuario.id]);
await sesion(db);
paso('RPC y sincronización interna siguen funcionando',
  (await filas(db, 'select autor_publico from opiniones where opinion_id=$1', [opinion]))[0].autor_publico === 'ACL editada');

informe('PRUEBAS DE ACL DE FUNCIONES', ok, fail);
await db.close();
