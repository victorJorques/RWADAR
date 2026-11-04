import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// QA escritorio 04/11/2026, n.º 27: en /acceso, el botón de la vista que ya está
// abierta no se repite bajo el formulario («Entrar» y «Ya tengo cuenta» a la vez).
const html = fs.readFileSync(new URL('../rwadar-site/acceso.html', import.meta.url), 'utf8');
const script = fs.readFileSync(new URL('../rwadar-site/assets/acceso.js', import.meta.url), 'utf8');

function pagina() {
  const elementos = new Map(), botones = [];
  const acciones = html.slice(html.indexOf('<div class="acciones" id="acciones">'));
  const finAcciones = acciones.indexOf('</div>');
  for (const m of html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/g)) {
    const [, tag, atributos] = m;
    const id = atributos.match(/\bid="([^"]+)"/)?.[1];
    const vista = atributos.match(/\bdata-vista="([^"]+)"/)?.[1];
    if (!id && !vista) continue;
    const enAcciones = m.index > html.indexOf('<div class="acciones" id="acciones">') &&
      m.index < html.indexOf('<div class="acciones" id="acciones">') + finAcciones;
    const elemento = { value: '', checked: false, textContent: '', hidden: /\bhidden\b/.test(atributos), dataset: { vista },
      eventos: {}, addEventListener(tipo, fn) { this.eventos[tipo] = fn; }, reportValidity: () => true, focus() {},
      closest: selector => selector === '#acciones' && enAcciones ? {} : null };
    if (id) elementos.set(id, elemento);
    if (tag === 'button' && vista) botones.push(elemento);
  }
  vm.runInContext(script, vm.createContext({
    document: { getElementById: id => elementos.get(id), querySelectorAll: () => botones },
    sessionStorage: { getItem: () => null, removeItem() {} },
    location: { origin: 'https://rwadar.pages.dev', pathname: '/acceso', search: '', hash: '', replace() {} },
    history: { replaceState() {} }, URL, URLSearchParams, AbortController, setTimeout, clearTimeout,
    fetch: async () => Response.json({ sesion: null }, { status: 401 }),
  }));
  const visibles = () => botones.filter(b => b.closest('#acciones') && !b.hidden).map(b => b.dataset.vista);
  return { botones, visibles };
}

test('la vista abierta no repite su botón debajo del formulario', () => {
  const p = pagina();
  assert.deepEqual(p.visibles(), ['registrar', 'recuperar', 'reenviar'], 'al abrir, «Entrar» no se repite');
  p.botones.find(b => b.closest('#acciones') && b.dataset.vista === 'registrar').eventos.click();
  assert.deepEqual(p.visibles(), ['entrar', 'recuperar', 'reenviar'], 'en el alta vuelve «Ya tengo cuenta»');
  p.botones.find(b => b.closest('#acciones') && b.dataset.vista === 'entrar').eventos.click();
  assert.deepEqual(p.visibles(), ['registrar', 'recuperar', 'reenviar']);
});
