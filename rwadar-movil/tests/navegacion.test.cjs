const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const leer = (...partes) => fs.readFileSync(path.join(RAIZ, ...partes), 'utf8');

test('la navegación inferior ofrece Inicio, Buscar, Academy y Perfil y respeta el safe area', () => {
  const codigo = leer('componentes', 'Navegacion.js');

  for (const destino of [
    "['inicio', 'Inicio', 'inicio']",
    "['buscar', 'Buscar', 'buscar']",
    "['academy', 'Academy', 'academy']",
    "['perfil', 'Perfil', 'perfil']",
  ]) assert.ok(codigo.includes(destino), `falta el destino ${destino}`);
  for (const antiguo of ["'Siguiendo'", "'Avisos'", "'Más'", "'Radar'", "'Ofertas'"]) {
    assert.ok(!codigo.includes(`, ${antiguo}, `), `sigue el destino antiguo ${antiguo}`);
  }
  assert.match(codigo, /const insignia = id === 'perfil' \? guardados : id === 'inicio' \? novedades : 0;/);
  assert.match(codigo, /useSafeAreaInsets\(\)/);
  assert.match(codigo, /paddingBottom: Math\.max\(insets\.bottom, 7\)/);
  assert.match(codigo, /accessibilityRole="tablist"/);
  assert.match(codigo, /accessibilityRole="tab"/);
  assert.match(codigo, /accessibilityState=\{\{ selected: seleccionada \}\}/);
  for (const icono of ['inicio', 'perfil', 'comunidad', 'guardar', 'guardada']) {
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
  for (const viejo of ["pestana === 'sigo'", "pestana === 'avisos'", "pestana === 'mas'", 'PantallaMas']) {
    assert.ok(!codigo.includes(viejo), `queda la pantalla antigua ${viejo}`);
  }

  for (const pieza of [
    '<Radar', '<Detalle', '<FichaOferta', '<DetalleOferta', '<ExclusionesOfertas',
    '<Descartadas', '<PanelAvisos', '<Explicador', '<Privacidad', '<Inicio', '<SelectorBuscar',
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

test('Perfil reúne lo guardado y anuncia los avisos como próximamente', () => {
  const codigo = leer('App.js');
  assert.match(codigo, /Empresas guardadas · \$\{seguidas\.length\}/);
  assert.match(codigo, /Ofertas guardadas · \$\{ofertasGuardadas\.length\}/);
  assert.match(codigo, /Los avisos llegarán próximamente a la app con las nuevas actualizaciones\./);
  assert.match(codigo, /\{USUARIO_LOCAL \? \(\s*<View style=\{e\.avisoProximo\}>/);
  assert.match(codigo, /guardada=\{!!ofertaAbierta && guardadas\.includes\(ofertaAbierta\.slug\)\}/);
  const ofertas = leer('componentes', 'Ofertas.js');
  assert.match(ofertas, /accessibilityLabel=\{guardada \? `Quitar \$\{oferta\.titulo\} de guardadas` : `Guardar \$\{oferta\.titulo\} en Perfil`\}/);
  const datos = leer('lib', 'datos.js');
  assert.match(datos, /const OFERTAS_GUARDADAS = `\$\{PREFIJO\}ofertas\.guardadas\.v1`;/);
  assert.match(datos, /PROGRESO_ACADEMY,\s*OFERTAS_GUARDADAS,\s*\];/);
});

test('Inicio muestra las mismas noticias que la web y anuncia la comunidad sin simularla', () => {
  const inicio = leer('componentes', 'Inicio.js');
  const noticias = leer('lib', 'noticias-contenido.js');
  assert.match(noticias, /GENERADO por rwadar-noticias\.js/);
  assert.match(inicio, /from '\.\.\/lib\/noticias-contenido'/);
  assert.match(inicio, /Cuando se abran las cuentas, cada cuenta podrá compartir aquí una publicación al día/);
  assert.doesNotMatch(inicio, /TextInput|fetch\(|supabase/);
  const fuente = JSON.parse(fs.readFileSync(path.join(RAIZ, '..', 'rwadar-noticias', 'noticias.json'), 'utf8'));
  for (const n of fuente.noticias) assert.ok(noticias.includes(n.titulo), `falta la noticia ${n.id} en la app`);
});

test('las 52 imágenes originales se conservan y la interfaz prefiere cuatro fallbacks editoriales', () => {
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
  assert.equal(requiresEditoriales.length, 4);
  assert.deepEqual(new Set(manifiesto.archivos.map((x) => x.categoria)),
    new Set(ofertas.map((x) => x.categoria)));
  assert.match(componente, /imagenEditorial\(oferta\.categoria\)/);
  assert.doesNotMatch(componente, /imagenes-ofertas|imagenOferta\(oferta\.slug\)/);
  assert.match(componente, /\{editorial\.etiqueta\}/);
  assert.match(componente, /accessibilityLabel=\{decorativa \? undefined : editorial\.alt\}/);
  assert.doesNotMatch(componente, /oferta\.imagenAlt/);
  assert.match(componente, /Proveedor solo del escaparate · no admite seguimiento/);
  assert.match(componente, /La referencia sigue documentada; ha vencido la actualización de sus cifras/);
  assert.doesNotMatch(componente, /Producto activo/);
  assert.match(componente, /permanente-vencida/);
  assert.match(componente, /accessibilityLabel=\{etiquetaAccesible\}/);
  assert.match(componente, /avisosCriticos\(oferta\)/);
  assert.match(componente, /aviso\.tono === 'stop'/);
  assert.match(componente, /aviso\.tono === 'warn'/);
  assert.match(componente, /RENTABILIDAD AJUSTADA \/ PUBLICADA/);
  assert.match(componente, /PATROCINADA/);
  assert.match(componente, /Patrocinada\. Consulta la relación comercial en la ficha; no altera el ranking/);
  assert.match(componente, /Ver oferta'\} en \{oferta\.plataformaNombre\}/);
  assert.match(componente, /RWAdar no cobra comisión al inversor/);
  assert.match(componente, /Disponibilidad desde España sin comprobar/);
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
  assert.match(app, /key=\{`ofertas-\$\{columnasOfertas\}`\}/);
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
  assert.match(ficha, /accessibilityHint="Abre la ficha completa de la oferta"/);
  assert.doesNotMatch(ficha, /oferta\.resumen|VER →|criticos\.slice\(0, 2\)/);
  assert.match(ficha, /numberOfLines=\{2\}>\{oferta\.titulo\}/);
  assert.match(ficha, /const primerCritico = criticos\[0\]/);
  assert.match(ficha, /aspectRatio|imagenFicha/);
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
