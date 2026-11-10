'use strict';
/* =====================================================================
   RWAdar · /aprende/ (rediseño de Inicio, 10/11/2026)
   ---------------------------------------------------------------------
   Los seis capítulos que antes iban en Inicio. Aquí solo hace falta:
   - «Fuentes de este apartado»: abre la lista del final en su grupo y
     «Volver al texto» regresa al enlace (igual que en Inicio);
   - el carrusel «Quién más se ha movido» del 03 («1 de 5», ‹ ›, flechas);
   - /aprende/#nota-legal abre la nota legal completa;
   - /aprende/#fuentes-… abre la lista en ese grupo.
   Sin red, sin innerHTML y sin estilos en línea (CSP).
   ===================================================================== */
(() => {
  const $ = id => document.getElementById(id);
  const quieto = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function iniciar() {
    const raiz = document.querySelector('.sec-aprende');
    if (!raiz) return;
    const refs = $('relRefs');
    let origen = null;
    const llevar = (n, centro) => { n.scrollIntoView({ block: centro ? 'center' : 'start', behavior: quieto() ? 'auto' : 'smooth' }); n.focus({ preventScroll: true }); };
    const abrirGrupo = g => {
      if (!refs || !g) return;
      refs.open = true;
      raiz.querySelectorAll('.rel-refs-grupo').forEach(x => { const on = x === g; x.classList.toggle('activa', on); x.querySelector('.rel-refs-volver').hidden = !(on && origen); });
    };
    raiz.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('a[data-rel-fuentes]');
      if (a) {
        const g = $('fuentes-' + a.dataset.relFuentes);
        if (!g || !refs) return;
        e.preventDefault(); origen = a; abrirGrupo(g); llevar(g, false); return;
      }
      const v = e.target.closest && e.target.closest('.rel-refs-volver');
      if (v && origen && origen.isConnected) { e.preventDefault(); v.hidden = true; llevar(origen, true); }
    });
    /* «Quién más se ha movido» (capítulo 03). */
    const lista = $('relQuienLista'), items = lista ? [...lista.children] : [], pos = $('relQuienPos');
    const ant = raiz.querySelector('.rel-quien-ant'), sig = raiz.querySelector('.rel-quien-sig');
    if ($('relQuienTotal')) $('relQuienTotal').textContent = String(items.length);
    const paso = () => (items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : lista.clientWidth);
    const actual = () => { const p = paso(); return p > 0 ? Math.max(0, Math.min(items.length - 1, Math.round(lista.scrollLeft / p))) : 0; };
    function quien() {
      if (!lista) return;
      const ancho = lista.clientWidth;
      if (pos) pos.textContent = String(ancho ? actual() + 1 : 1);
      if (ant) ant.disabled = !ancho || lista.scrollLeft < 4;
      if (sig) sig.disabled = ancho ? lista.scrollLeft + ancho >= lista.scrollWidth - 4 : items.length < 2;
    }
    if (lista) {
      const ir = d => lista.scrollTo({ left: Math.max(0, actual() + d) * paso(), behavior: quieto() ? 'auto' : 'smooth' });
      let raf = 0;
      lista.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; quien(); }); }, { passive: true });
      if (ant) ant.addEventListener('click', () => ir(-1));
      if (sig) sig.addEventListener('click', () => ir(1));
      lista.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); ir(e.key === 'ArrowRight' ? 1 : -1); } });
      if (typeof ResizeObserver === 'function') new ResizeObserver(quien).observe(lista);
      quien();
    }
    /* Anclas: la nota legal completa, abierta; un grupo de fuentes, abierto. */
    function ancla() {
      const h = location.hash || '';
      if (h === '#nota-legal') {
        const det = $('notaLegalCompleta'), sec = $('nota-legal');
        if (det) det.open = true;
        if (sec) setTimeout(() => requestAnimationFrame(() => llevar(sec, false)), 60);
        return;
      }
      const m = /^#fuentes-(\w+)$/.exec(h), g = m && $('fuentes-' + m[1]);
      if (g) { abrirGrupo(g); setTimeout(() => requestAnimationFrame(() => llevar(g, false)), 60); }
    }
    addEventListener('hashchange', ancla);
    ancla();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  else iniciar();
})();
