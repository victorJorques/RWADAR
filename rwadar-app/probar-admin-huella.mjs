/* hacer-admin (avisos-base.yml): marcar una cuenta como administración por la
   huella SHA-256 de su correo, sin escribir el correo en Git, en la entrada
   del flujo ni en los registros. Postgres real (PGlite) con las migraciones
   de la base: perfiles, su disparador perfiles_protegen_admin y auth.users. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import { baseCompleta, filas, informe } from './pruebas-soporte.mjs';

const SQL = fs.readFileSync('db/admin_por_huella.sql', 'utf8');
const FLUJO = fs.readFileSync('../.github/workflows/avisos-base.yml', 'utf8');
const huella = (correo) => crypto.createHash('sha256').update(correo.trim().toLowerCase()).digest('hex');
// psql: quita las metaórdenes y sustituye :'huella' como haría -v (literal entre comillas).
const comoPsql = (h) => SQL.split('\n').filter((l) => !l.startsWith('\\')).join('\n')
  .replace(":'huella'", `'${String(h).replace(/'/g, "''")}'`);

const r = [];
const paso = (n, ok) => { r.push([n, !!ok]); };
const db = await baseCompleta();
await db.exec('alter table auth.users add column if not exists is_anonymous boolean default false');
const alta = async (correo, { confirmada = true, anonima = false } = {}) => {
  const [u] = await filas(db, `insert into auth.users (email, email_confirmed_at, is_anonymous) values ($1, $2, $3) returning id`,
    [correo, confirmada ? new Date().toISOString() : null, anonima]);
  await db.query('insert into public.perfiles (id) values ($1) on conflict do nothing', [u.id]);
  return u.id;
};
const esAdmin = async (id) => (await filas(db, 'select es_admin from public.perfiles where id = $1', [id]))[0]?.es_admin;
const ejecuta = async (h) => { try { await db.exec(comoPsql(h)); return 'ok'; } catch (e) { await db.exec('rollback').catch(() => {}); return e.message; } };

const ana = await alta('Ana.Prueba@Example.com');
const beto = await alta('beto@example.com');
const sinConfirmar = await alta('sin@example.com', { confirmada: false });

paso('una huella sin forma se rechaza y no cambia nada', /64 caracteres/.test(await ejecuta('no-es-una-huella')) && !(await esAdmin(ana)));
paso('una huella que no casa con ninguna cuenta no cambia nada', /0 cuentas/.test(await ejecuta(huella('nadie@example.com'))));
paso('una cuenta sin confirmar no se marca', /0 cuentas/.test(await ejecuta(huella('sin@example.com'))) && !(await esAdmin(sinConfirmar)));
paso('con la huella del correo (mayúsculas y espacios dan igual) se marca esa cuenta y ninguna otra',
  (await ejecuta(huella('  ana.prueba@example.com '))) === 'ok' && (await esAdmin(ana)) === true && (await esAdmin(beto)) === false);
paso('repetir no falla y no cambia nada más', (await ejecuta(huella('ana.prueba@example.com'))) === 'ok' && (await esAdmin(beto)) === false);
paso('el SQL no lleva ningún correo ni huella fijos, y la huella solo va en un SELECT (set_config)',
  !/@/.test(SQL.replace(/--.*$/gm, '')) && /select set_config\('rwadar\.admin_huella', :'huella', true\)/.test(SQL) && !/[0-9a-f]{64}/.test(SQL));
paso('el flujo: acción hacer-admin, entrada «huella» validada (64 hex), con AVISOS y copia; la huella pasa a psql con -v y el paso Aplicar no la ejecuta',
  /- hacer-admin\n/.test(FLUJO) && /hacer-admin\)\s+SQL="\$D\/admin_por_huella\.sql";\s+CAMBIA=si ;;/.test(FLUJO)
  && /\[ "\$ACCION" = hacer-admin \] && ! \[\[ "\$\{HUELLA:-\}" =~ \^\[0-9a-f\]\{64\}\$ \]\]/.test(FLUJO)
  && /inputs\.accion != 'hacer-admin'/.test(FLUJO) && /-v huella="\$HUELLA" -f "\$SQL"/.test(FLUJO));

informe('hacer-admin: administración por la huella del correo', r.filter(([, ok]) => ok).map(([n]) => n), r.filter(([, ok]) => !ok).map(([n]) => n));
