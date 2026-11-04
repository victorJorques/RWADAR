// Rótulos en frase normal, sin mayúsculas (GUIA-ACABADOS §5, aplicada a la web el 04/11/2026).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const leer = (...partes) => fs.readFileSync(path.join(RAIZ, ...partes), 'utf8');

// Barra de cinco botones (ESPEC-INICIO §4, decisión de Víctor del 04/11/2026):
// Ofertas y Plataformas sustituyen a «Buscar» y su selector interno.
test('la navegación inferior ofrece Inicio, Ofertas, Plataformas, Academy y Perfil y respeta el safe area', () => {
  const codigo = leer('componentes', 'Navegacion.js');

  for (const destino of [
    "['inicio', 'Inicio', 'inicio']",
    "['ofertas', 'Ofertas', 'etiqueta']",
    "['plataformas', 'Plataformas', 'diana']",
    "['academy', 'Academy', 'academy']",
    "['perfil', 'Perfil', 'perfil']",
  ]) assert.ok(codigo.includes(destino), `falta el destino ${destino}`);
  for (const antiguo of ["'Siguiendo'", "'Avisos'", "'Más'", "'Radar'", "'Buscar'"]) {
    assert.ok(!codigo.includes(`, ${antiguo}, `), `sigue el destino antiguo ${antiguo}`);
  }
  assert.match(codigo, /const insignia = id === 'perfil' \? guardados : id === 'inicio' \? novedades : 0;/);
  assert.match(codigo, /useSafeAreaInsets\(\)/);
  assert.match(codigo, /paddingBottom: Math\.max\(insets\.bottom, 7\)/);
  assert.match(codigo, /accessibilityRole="tablist"/);
  assert.match(codigo, /accessibilityRole="tab"/);
  assert.match(codigo, /accessibilityState=\{\{ selected: seleccionada \}\}/);
  for (const icono of ['inicio', 'etiqueta', 'diana', 'perfil', 'comunidad', 'guardar', 'guardada']) {
    assert.match(codigo, new RegExp(`nombre === '${icono}'`), `falta el icono ${icono}`);
  }
});

test('el rediseño conserva radar, ofertas, 3D, detalle, descartes, avisos y privacidad', () => {
  const codigo = leer('App.js');

  assert.match(codigo, /const \[pestana, setPestana\] = useState\('inicio'\)/);
  for (const pantalla of ['inicio', 'academy', 'perfil']) {
    assert.ok(codigo.includes(`pestana === '${pantalla}'`), `falta la pantalla ${pantalla}`);
  }
  assert.ok(codigo.includes("pestana === 'buscar' && vistaBuscar === 'empresas'"), 'Buscar perdió las empresas');
  assert.ok(codigo.includes("pestana === 'buscar' && vistaBuscar === 'ofertas'"), 'Buscar perdió las ofertas');
  // Sin selector dentro de Buscar: la barra elige la vista (ESPEC-INICIO §4).
  assert.ok(!codigo.includes('SelectorBuscar'), 'vuelve el selector Ofertas/Plataformas de Buscar');
  assert.match(codigo, /const destinoBarra = pestana === 'buscar' \? \(vistaBuscar === 'ofertas' \? 'ofertas' : 'plataformas'\) : pestana;/);
  assert.match(codigo, /activa=\{destinoBarra\}/);
  for (const viejo of ["pestana === 'sigo'", "pestana === 'avisos'", "pestana === 'mas'", 'PantallaMas']) {
    assert.ok(!codigo.includes(viejo), `queda la pantalla antigua ${viejo}`);
  }

  for (const pieza of [
    '<Radar', '<Detalle', '<FichaOferta', '<DetalleOferta', '<ExclusionesOfertas',
    '<Descartadas', '<PanelAvisos', '<Explicador', '<Privacidad', '<Inicio',
    '<PantallaPerfil', '<Academy',
    'alternarSeguimiento', 'sincronizarSeguimientoPendiente', 'borrarDatosDispositivo',
    'alternarOfertaGuardada', 'ofertasGuardadas',
  ]) assert.ok(codigo.includes(pieza), `el rediseño perdió ${pieza}`);

  assert.match(leer('componentes', 'Inicio.js'), /Explicado con una animación 3D/);
  assert.match(codigo, /accessibilityLabel="Buscar plataforma o palabra clave"/);
  assert.match(codigo, /accessibilityLabel=\{sigue \? `Dejar de seguir/);
  assert.match(codigo, /accessibilityLiveRegion="polite"/);
  assert.match(codigo, /INTERNO · datos locales · sin conexión a Supabase de producción/);
  assert.match(codigo, /Buscar ofertas por nombre, proveedor, país o métrica/);
  assert.match(codigo, /no hay comisiones ni enlaces remunerados activos/);
  assert.match(codigo, /Una relación comercial debe identificarse y no altera el ranking editorial/);
  assert.match(codigo, /oferta\.plataformaSlug !== proveedorOferta/);
  assert.match(codigo, /proveedor\.slug/);
  assert.match(codigo, /const escaparate = MODO_LOCAL \? \[/);
  assert.match(codigo, /cargarCatalogo\(\), cargarFuera\(\), \.\.\.escaparate, siguiendo\(\)/);
  assert.match(codigo, /setRadar\(catalogo\.plataformas\); setFuera\(f\.datos\); setOfertas\(principales\)/);
  assert.match(codigo, /\{!MODO_LOCAL \? \(/);
});

test('el aviso de catálogo se desplaza dentro de las listas de Buscar sin ocultarlo ni truncarlo', () => {
  const ast = require('@babel/core').parseSync(leer('App.js'), {
    babelrc: false, configFile: false, sourceType: 'module', parserOpts: { plugins: ['jsx'] },
  });
  const nodos = [];
  function recorrer(nodo, padres = []) {
    if (!nodo || typeof nodo !== 'object') return;
    if (Array.isArray(nodo)) { for (const hijo of nodo) recorrer(hijo, padres); return; }
    if (nodo.type) nodos.push({ nodo, padres });
    for (const [clave, hijo] of Object.entries(nodo)) {
      if (!['loc', 'start', 'end', 'extra'].includes(clave)) recorrer(hijo, [...padres, nodo]);
    }
  }
  recorrer(ast);
  const declaracion = nodos.find(({ nodo }) => nodo.type === 'VariableDeclarator' && nodo.id.name === 'avisoCatalogo')?.nodo;
  assert.ok(declaracion, 'el aviso debe poder incluirse en el contenido desplazable');
  assert.equal(declaracion.init.test.name, 'estadoDatos');
  const alerta = declaracion.init.consequent.openingElement;
  assert.ok(alerta.attributes.some((a) => a.name?.name === 'accessibilityRole' && a.value.value === 'alert'));
  assert.ok(alerta.attributes.some((a) => a.name?.name === 'accessibilityLiveRegion' && a.value.value === 'polite'));
  assert.ok(!alerta.attributes.some((a) => ['numberOfLines', 'ellipsizeMode'].includes(a.name?.name)),
    'el aviso completo debe seguir siendo legible con texto grande');
  const referencias = nodos.filter(({ nodo, padres }) => nodo.type === 'Identifier' && nodo.name === 'avisoCatalogo'
    && padres.at(-1)?.type !== 'VariableDeclarator');
  const enListas = referencias.filter(({ padres }) => padres.some((p) => p.type === 'JSXAttribute'
    && p.name.name === 'ListHeaderComponent'));
  assert.equal(enListas.length, 2, 'ofertas y plataformas deben incluir el aviso dentro de su propia lista');
  assert.ok(enListas.every(({ padres }) => padres.some((p) => p.type === 'JSXElement'
    && p.openingElement.name.name === 'FlatList')));
  const fijo = referencias.filter((r) => !enListas.includes(r));
  assert.equal(fijo.length, 1);
  const condicion = fijo[0].padres.findLast((p) => p.type === 'ConditionalExpression')?.test;
  assert.equal(condicion?.operator, '!=='); assert.equal(condicion?.left.name, 'pestana');
  assert.equal(condicion?.right.value, 'buscar', 'Buscar no debe reservar altura fija para el aviso');
});

test('Perfil reúne lo guardado y anuncia los avisos como próximamente', () => {
  const codigo = leer('App.js');
  assert.match(codigo, /Plataformas guardadas · \$\{seguidas\.length\}/);
  assert.match(codigo, /Ofertas guardadas · \$\{ofertasGuardadas\.length\}/);
  assert.match(codigo, /Los avisos llegarán próximamente a la app con las nuevas actualizaciones\./);
  assert.match(codigo, /\{USUARIO_LOCAL \? \(\s*<View style=\{e\.avisoProximo\}>/);
  assert.match(codigo, /guardada=\{!!ofertaAbierta && guardadas\.includes\(ofertaAbierta\.slug\)\}/);
  const ofertas = leer('componentes', 'Ofertas.js');
  assert.match(ofertas, /accessibilityLabel=\{guardada \? `\$\{traducir\('Quitar'\)\} \$\{oferta\.titulo\} \$\{traducir\('de guardadas'\)\}` : `\$\{traducir\('Guardar'\)\} \$\{oferta\.titulo\} \$\{traducir\('en Perfil'\)\}`\}/);
  const datos = leer('lib', 'datos.js');
  assert.match(datos, /const OFERTAS_GUARDADAS = `\$\{PREFIJO\}ofertas\.guardadas\.v1`;/);
  assert.match(datos, /PROGRESO_ACADEMY,\s*OFERTAS_GUARDADAS,\s*\];/);
});

test('Inicio muestra las mismas noticias que la web y no enseña la comunidad mientras esté apagada', () => {
  const inicio = leer('componentes', 'Inicio.js');
  const noticias = leer('lib', 'noticias-contenido.js');
  assert.match(noticias, /GENERADO por rwadar-noticias\.js/);
  assert.match(inicio, /from '\.\.\/lib\/noticias-contenido'/);
  assert.match(inicio, /Cuando se abran las cuentas, cada cuenta podrá compartir aquí una publicación al día/);
  assert.doesNotMatch(inicio, /TextInput|fetch\(|supabase/);
  const fuente = JSON.parse(fs.readFileSync(path.join(RAIZ, '..', 'rwadar-noticias', 'noticias.json'), 'utf8'));
  for (const n of fuente.noticias) assert.ok(noticias.includes(n.titulo), `falta la noticia ${n.id} en la app`);
});

test('las 52 imágenes originales se conservan y la interfaz usa la ilustración de cada ficha o la de su categoría', () => {
  const fixture = JSON.parse(leer('fixtures', 'escaparate-local.json'));
  const imagenes = leer('fixtures', 'imagenes-ofertas.js');
  const editoriales = leer('fixtures', 'imagenes-editoriales.js');
  const manifiesto = JSON.parse(leer('assets', 'ofertas-editoriales', 'manifest.json'));
  const componente = leer('componentes', 'Ofertas.js');
  const ofertas = [...fixture.ofertas, ...fixture.secundario];
  const requires = [...imagenes.matchAll(/require\("\.\.\/assets\/ofertas\/[^"\n]+\.webp"\)/g)];
  const requiresEditoriales = [...editoriales.matchAll(
    /require\('\.\.\/assets\/ofertas-editoriales\/[^'\n]+\.webp'\)/g
  )];

  assert.equal(fixture.ofertas.length, 28);
  assert.equal(fixture.secundario.length, 24);
  assert.equal(requires.length, ofertas.length);
  for (const oferta of ofertas) {
    assert.match(imagenes, new RegExp(`"${oferta.slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  }
  assert.equal(manifiesto.etiquetaVisibleObligatoria, 'Ilustración editorial');
  assert.equal(manifiesto.versionEsquema, 2);
  assert.equal(requiresEditoriales.length, 4 + manifiesto.fichas.length);
  for (const ficha of manifiesto.fichas) {
    assert.equal(editoriales.split(`require('../assets/ofertas-editoriales/${ficha.archivo}')`).length, 2,
      `la app empaqueta una sola vez ${ficha.archivo}`);
  }
  assert.deepEqual(new Set(manifiesto.archivos.map((x) => x.categoria)),
    new Set(ofertas.map((x) => x.categoria)));
  assert.match(componente, /imagenEditorialOferta\(oferta\)/);
  assert.doesNotMatch(componente, /imagenes-ofertas|imagenOferta\(oferta\.slug\)/);
  assert.match(componente, /\{editorial\.etiqueta\}/);
  assert.match(componente, /accessibilityLabel=\{decorativa \? undefined : editorial\.alt\}/);
  assert.doesNotMatch(componente, /oferta\.imagenAlt/);
  // La ficha de la web final (04/11/2026) ya no dice si el proveedor está en el radar.
  assert.match(componente, /La referencia sigue documentada; ha vencido la actualización de sus cifras/);
  assert.doesNotMatch(componente, /Producto activo/);
  assert.match(componente, /permanente-vencida/);
  assert.match(componente, /accessibilityLabel=\{etiquetaAccesible\}/);
  assert.match(componente, /avisosCriticos\(oferta\)/);
  assert.match(componente, /aviso\.tono === 'stop'/);
  assert.match(componente, /aviso\.tono === 'warn'/);
  assert.match(componente, /Rentabilidad ajustada \/ publicada/);
  // Rótulos en frase normal (GUIA-ACABADOS §5, aplicada a la web el 04/11).
  assert.match(componente, /Patrocinada/);
  assert.match(componente, /Patrocinada\. Consulta la relación comercial en la ficha; no altera el ranking/);
  // El botón de la ficha se nombra «Ver oferta en <proveedor> ↗», como la web (04/11/2026).
  assert.match(componente, /Ver oferta en <Text noTraducir idiomaOriginal="es-ES">\{oferta\.plataformaNombre\}/);
  assert.match(componente, /RWAdar no cobra comisión al inversor/);
  assert.match(componente, /\['Desde España', resumen\.accesoEspana\]/);
  assert.match(componente, /item\.alcance/);
  assert.doesNotMatch(componente, /alternarSeguimiento|onSeguir|Seguir esta plataforma/);
});

test('ofertas separa tres colecciones y adapta una, dos o tres columnas al ancho', () => {
  const app = leer('App.js');

  assert.match(app, /const \[grupoOfertas, setGrupoOfertas\] = useState\('principales'\)/);
  for (const grupo of ['principales', 'secundario', 'en_camino']) {
    assert.match(app, new RegExp(`catalogo\\.ofertas\\.filter\\(o => o\\.coleccion === '${grupo}'\\)`));
    assert.match(app, new RegExp(`activo=\\{grupoOfertas === '${grupo}'\\}[\\s\\S]{0,180}seleccionarGrupoOfertas\\('${grupo}'\\)`));
  }
  assert.match(app, /MODO_LOCAL \? <SegmentoOferta texto="Todo"/);
  assert.match(app, /No confirman precio, liquidez ni disponibilidad actuales/);
  assert.match(app, /No confirman apertura, fecha de lanzamiento ni acceso/);
  assert.match(app, /setSecundario\(\[\]\); setEnCamino\(\[\]\)/);

  assert.match(app, /accessibilityLabel="Seleccionar grupo de ofertas"/);
  assert.match(app, /accessibilityRole="tab"/);
  assert.match(app, /accessibilityState=\{\{ selected: activo \}\}/);
  assert.match(app, /const \{ width: anchoPantalla \} = useWindowDimensions\(\)/);
  assert.match(app, /const columnasOfertas = anchoPantalla >= 1120 \? 3 : anchoPantalla >= 720 \? 2 : 1;/);
  assert.match(app, /key=\{`ofertas-\$\{columnasOfertas\}-\$\{grupoOfertas\}-\$\{grupoProveedorAbierto \|\| 'lista'\}`\}/);
  assert.match(app, /numColumns=\{columnasOfertas\}/);
  assert.match(app, /columnWrapperStyle=\{columnasOfertas > 1 \? e\.filaOfertas : null\}/);
  assert.match(app, /width: columnasOfertas > 1 \? anchoCeldaOferta : '100%'/);
  assert.match(app, /filtrosOfertasAbiertos \? \(/);
});

test('la ficha compacta prioriza imagen y una parada accesible, y las exclusiones nacen cerradas', () => {
  const componente = leer('componentes', 'Ofertas.js');
  const imagen = componente.slice(
    componente.indexOf('function ImagenOferta'),
    componente.indexOf('export function FichaOferta')
  );
  const ficha = componente.slice(
    componente.indexOf('export function FichaOferta'),
    componente.indexOf('function FilaMetrica')
  );
  const detalle = componente.slice(
    componente.indexOf('export function DetalleOferta'),
    componente.indexOf('export function ExclusionesOfertas')
  );
  const exclusiones = componente.slice(
    componente.indexOf('export function ExclusionesOfertas'),
    componente.indexOf('const e = StyleSheet.create')
  );

  assert.match(imagen, /decorativa = false/);
  assert.equal((imagen.match(/accessible=\{!decorativa\}/g) || []).length, 2);
  assert.doesNotMatch(imagen, /accessibilityElementsHidden/);
  assert.equal((imagen.match(/importantForAccessibility=\{decorativa \? 'no-hide-descendants' : 'auto'\}/g) || []).length, 2);
  assert.match(ficha, /<ImagenOferta oferta=\{oferta\} decorativa estilo=\{e\.imagenEnFicha\} \/>/);
  assert.match(ficha, /accessibilityHint=\{traducir\('Abre la ficha completa de la oferta'\)\}/);
  assert.doesNotMatch(ficha, /oferta\.resumen|documentacion\.descripcion|rentabilidadSecundaria\(|VER →|criticos\.slice\(0, 2\)/);
  assert.match(ficha, /numberOfLines=\{2\}>\{oferta\.titulo\}/);
  assert.match(ficha, /const primerCritico = criticos\[0\]/);
  assert.match(ficha, /aspectRatio|imagenFicha/);
  assert.match(ficha, /Fuente consultada \$\{fechaVerificacionLocalVisible\(resumen\.fechas\.comprobadaEl\)\}/);
  assert.match(ficha, /Revisión documental \$\{fechaVerificacionLocalVisible\(documentacion\.fecha\)\}/);
  assert.match(ficha, /Ver ficha →/);
  assert.doesNotMatch(ficha, /vigenciaSobreImagen|datoCompactoSecundario/);
  assert.match(detalle, /<ImagenOferta oferta=\{oferta\} grande \/>/);

  assert.match(exclusiones, /const \[abiertas, setAbiertas\] = useState\(false\)/);
  assert.match(exclusiones, /accessibilityState=\{\{ expanded: abiertas \}\}/);
  assert.match(exclusiones, /abiertas \? 'Ocultar exclusiones' : `Ver \$\{datos\.length\} exclusiones`/);
  assert.match(exclusiones, /\{abiertas \? \(/);
});

test('las dianas y acciones principales comparten mínimos táctiles suficientes', () => {
  const tema = leer('lib', 'tema.js');
  const app = leer('App.js');

  const tactil = Number(tema.match(/tactil:\s*(\d+)/)?.[1]);
  const boton = Number(tema.match(/boton:\s*(\d+)/)?.[1]);
  const nav = Number(tema.match(/nav:\s*(\d+)/)?.[1]);

  assert.ok(tactil >= 44, `mínimo táctil insuficiente: ${tactil}`);
  assert.ok(boton >= 48, `botón principal insuficiente: ${boton}`);
  assert.ok(nav >= 60, `barra inferior insuficiente: ${nav}`);
  assert.match(app, /minHeight: UI\.tactil/);
  assert.match(app, /selectorOfertas:\s*\{\s*minHeight: UI\.tactil \+ 6/);
  assert.match(app, /segmentoOferta:\s*\{\s*flex: 1, minHeight: UI\.tactil/);
  assert.match(app, /botonFiltrosOfertas:\s*\{\s*minHeight: UI\.tactil/);
  assert.match(app, /minHeight: UI\.boton/);
});

test('la nueva interfaz no introduce identidad ni funciones ficticias de la referencia', () => {
  const codigo = `${leer('App.js')}\n${leer('componentes', 'Navegacion.js')}`;

  for (const ajeno of ['Booking.com', 'Genius', 'Reservas', 'Métodos de pago', 'Mi cuenta']) {
    assert.equal(codigo.includes(ajeno), false, `se introdujo texto ajeno: ${ajeno}`);
  }
  assert.match(codigo, /Las cuentas llegarán próximamente a la app con las nuevas actualizaciones/);
});

test('las ilustraciones por ficha son de su categoría y no llevan cifras ni promesas', () => {
  const manifiesto = JSON.parse(leer('assets', 'ofertas-editoriales', 'manifest.json'));
  const base = path.join(RAIZ, '..', 'rwadar-app', 'data', 'verificaciones');
  const ultima = fs.readdirSync(base).filter((n) => /^\d{4}-\d{2}-\d{2}-v2$/.test(n)).sort()
    .reverse().find((n) => fs.existsSync(path.join(base, n, 'escaparate-publicacion.json')));
  const catalogo = JSON.parse(fs.readFileSync(path.join(base, ultima, 'escaparate-publicacion.json'), 'utf8')).ofertas;
  const porSlug = new Map(manifiesto.fichas.map((x) => [x.slug, x]));
  // Una ficha nueva sin ilustración usa la de su categoría: se avisa, no se bloquea.
  const sinIlustracion = catalogo.filter((oferta) => !porSlug.has(oferta.slug)).map((oferta) => oferta.slug);
  if (sinIlustracion.length) console.warn(`fichas sin ilustración propia: ${sinIlustracion.join(', ')}`);
  for (const oferta of catalogo.filter((x) => porSlug.has(x.slug))) {
    assert.equal(porSlug.get(oferta.slug).categoria, oferta.categoria, oferta.slug);
  }
  const prohibido = /[0-9%€$£]|rentab|garantiz|benefici|gananci|retorno|asegurad|sin riesgo/i;
  for (const ficha of manifiesto.fichas) {
    assert.equal(ficha.archivo, `oferta-${ficha.slug}.webp`);
    assert.ok(fs.existsSync(path.join(RAIZ, 'assets', 'ofertas-editoriales', ficha.archivo)), ficha.archivo);
    assert.ok(ficha.alt.startsWith('Ilustración editorial'), ficha.slug);
    for (const texto of [ficha.alt, ficha.lugar || '', ...ficha.pasos]) {
      assert.doesNotMatch(texto, prohibido, `${ficha.slug}: «${texto}»`);
    }
  }
});
