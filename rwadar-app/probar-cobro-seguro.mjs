import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lee = (relativa) => fs.readFileSync(path.join(raiz, ...relativa.split('/')), 'utf8');
const normaliza = (texto) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[*_`]/g, '')
  .replace(/\s+/g, ' ').toLowerCase();

const arquitectura = lee('docs/comercial/ARQUITECTURA-COBRO-Y-SEGURIDAD.md');
const fichaCobro = lee('docs/plantillas/FICHA-CONFIGURACION-COBRO-SIN-SECRETOS.md');
const acuerdo = lee('docs/plantillas/ACUERDO-PILOTO-PATROCINIO-B2B.md');
const fichaPatrocinador = lee('docs/plantillas/FICHA-ALTA-PATROCINADOR.md');
const plan = lee('docs/comercial/PLAN-PRIMER-PATROCINADOR.md');
const incidente = lee('docs/seguridad/INCIDENTE-P0-CREDENCIAL-HISTORICA-2026-09-21.md');
const runbook = lee('docs/seguridad/RUNBOOK-REVOCACION-ROTACION.md');
const estado = JSON.parse(lee('rwadar-app/data/relanzamiento/estado.json'));
const textos = [arquitectura, fichaCobro, acuerdo, fichaPatrocinador, plan, incidente, runbook];

let correctas = 0;
const paso = (texto, prueba) => {
  assert.ok(prueba, texto);
  correctas += 1;
  console.log(`  OK    ${texto}`);
};

console.log('=== COBRO B2B Y SEGURIDAD DEL DINERO ===');
const a = normaliza(arquitectura);
const f = normaliza(fichaCobro);
const c = normaliza(acuerdo);

paso('el inversor no paga a RWAdar y no existe circuito de custodia',
  a.includes('el inversor paga 0 eur a rwadar')
  && a.includes('inversor -> rwadar -> emisor, plataforma, wallet o activo'));

paso('el destino exige titular único y una cuenta comercial identificable',
  a.includes('titular exactamente igual al titular juridico y fiscal')
  && a.includes('identificador parcial que permita distinguirla de otra cuenta'));

paso('un pago o webhook jamás publica ni renueva contenido',
  a.includes('nunca publica, activa ni renueva una oferta o campana')
  && c.includes('el pago o su confirmacion tecnica no activa por si solo la campana')
  && normaliza(plan).includes('el cobro solo cambia el estado contable y no activa la campana')
  && f.includes('pago confirmado no publica ni activa contenido'));

paso('las funciones de cobro, seguridad y publicación están segregadas',
  a.includes('segregacion minima de funciones')
  && a.includes('una sola persona no debe solicitar, aprobar, ejecutar y conciliar')
  && f.includes('incompatibilidades de funciones verificadas'));

paso('el protocolo de webhook cubre firma, replay, idempotencia y orden',
  a.includes('cuerpo bruto')
  && a.includes('tolerancia temporal para reducir replays')
  && a.includes('misma transaccion')
  && a.includes('eventos fuera de orden')
  && a.includes('modo, cuenta comercial o version inesperados'));

paso('los logs excluyen payloads y datos de pago',
  a.includes('nunca se registran cuerpo completo, firma, secreto, pan, cvc'));

paso('las devoluciones solo vuelven al método original',
  a.includes('solo se devuelve al metodo de pago original')
  && c.includes('exclusivamente al metodo de pago original')
  && f.includes('solicitudes de iban, tarjeta o wallet alternativos se rechazan'));

paso('la ficha completada debe permanecer fuera del repositorio',
  f.includes('no se rellena dentro del repositorio')
  && f.includes('copia en el archivo privado de administracion')
  && normaliza(fichaPatrocinador).includes('no se rellena en este archivo')
  && c.includes('expediente privado, nunca dentro de git'));

paso('el P0 identifica el commit sin reproducir la credencial',
  incidente.includes('229450ce4ee1690f26e3f7c52e9f0e57d8794ea6')
  && incidente.includes('revocación declarada por el titular')
  && !/sbp_[A-Za-z0-9]{12,}/.test(incidente));

paso('el runbook prohíbe probar el secreto y separa revocación de reescritura',
  normaliza(runbook).includes('no ejecutar el token antiguo para comprobar si funciona')
  && normaliza(runbook).includes('solo despues de revocar y rotar, decidir si se reescribe el historial'));

paso('la revocación declarada no se confunde con una beta validada de extremo a extremo',
  ['en_progreso','aprobado'].includes(estado.controles.beta_segura_extremo_a_extremo.estado)
  && estado.controles.beta_segura_extremo_a_extremo.evidencias.some(evidencia =>
    evidencia.tipo === 'documento' &&
    evidencia.referencia === 'docs/seguridad/REVISION-SEGURIDAD-2026-09-27.md')
  && normaliza(estado.controles.beta_segura_extremo_a_extremo.detalle).includes('revocacion declarada')
  && normaliza(estado.controles.beta_segura_extremo_a_extremo.detalle).includes('historica'));

paso('la documentación no contiene secretos de cobro reconocibles',
  textos.every((texto) => !/(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{12,}|whsec_[A-Za-z0-9]{12,}/.test(texto)));

console.log(`\n${correctas} correctas, 0 fallidas`);
