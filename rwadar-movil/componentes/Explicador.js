import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Pressable, Text, View } from './Idioma';
import { WebView } from 'react-native-webview';
import ExplicadorNativo from './ExplicadorNativo';
import { C, T, F, R } from '../lib/tema';

/* ---------------------------------------------------------------------
   El explicador: el edificio 3D de la web, dentro de la app
   ---------------------------------------------------------------------
   POR QUÉ SE REUTILIZA LA WEB EN VEZ DE REESCRIBIRLO

   El 3D son shaders WebGL escritos a mano: un rascacielos de 885 paneles
   con las ventanas encendidas, sobre cristal negro, con reflejo, sombra
   de contacto y viñeta, en tres pasadas de render. Reescribir eso con
   expo-gl son días de trabajo y —lo que de verdad importa— garantiza que
   la app y la web se separen la próxima vez que se toque cualquiera de
   los dos. Ya pasó con el diseño: la app se quedó con la piel de papel
   meses después de que la web cambiara.

   Apuntando a la misma página publicada, el edificio es exactamente el
   mismo, y si mañana cambia el 3D en la web, cambia solo aquí.

   La lista, el buscador, el radar SVG y los favoritos son nativos. La
   revisión de cada tienda sigue pendiente: usar este módulo web no
   acredita aprobación. Los servicios remotos y push están desactivados.

   La sesión nativa se comprueba antes de abrir el tutorial. El servidor
   adopta el JWT recibido solo en cabecera y crea su cookie HttpOnly. Sin
   conexión el 3D no carga; el tutorial nativo conserva la explicación.
   --------------------------------------------------------------------- */

const PAGINA = 'https://rwadar.pages.dev/#explain';
const ORIGEN_RWADAR = new URL(PAGINA).origin;

/* Compara el origen que calcula URL, no un prefijo de texto: así una dirección
   como `rwadar.pages.dev.ejemplo.test` nunca puede pasar por propia. También
   se rechazan credenciales embebidas aunque el host final sea el correcto. */
export function esOrigenRWAdar(valor) {
  try {
    const destino = new URL(String(valor || ''));
    return destino.origin === ORIGEN_RWADAR && !destino.username && !destino.password;
  } catch {
    return false;
  }
}

/* Se conserva la lección y su cadena de contenedores, no una lista de
   secciones que esconder. En móvil la web mueve #explain a Academy, que
   empieza oculta. No clonamos ni movemos el canvas: conserva sus eventos. */
const SOLO_EL_EXPLICADOR = `
  (function(){
    if (location.pathname === '/api/acceso/tutorial') return;
    if (typeof location !== 'undefined' && location.pathname === '/api/acceso/tutorial') return;
    if (document.documentElement.hasAttribute('data-rwadar-explicador-activo')) return;
    var atributo = 'data-rwadar-explicador-ruta';
    var anteriores = [], rutaAnterior = [];
    function estilo(nodo, propiedad, valor){
      anteriores.push({ nodo: nodo, propiedad: propiedad,
        valor: nodo.style.getPropertyValue(propiedad), prioridad: nodo.style.getPropertyPriority(propiedad) });
      nodo.style.setProperty(propiedad, valor, 'important');
    }
    function aislar(){
      var leccion = document.getElementById('explain');
      if (!leccion) return false;
      for (var i = 0; i < anteriores.length; i++) {
        var previo = anteriores[i];
        if (previo.valor) previo.nodo.style.setProperty(previo.propiedad, previo.valor, previo.prioridad);
        else previo.nodo.style.removeProperty(previo.propiedad);
      }
      for (var i = 0; i < rutaAnterior.length; i++) rutaAnterior[i].removeAttribute(atributo);
      anteriores = [];
      rutaAnterior = [];
      for (var nodo = leccion; nodo && nodo !== document.documentElement; nodo = nodo.parentElement) {
        rutaAnterior.push(nodo);
        nodo.setAttribute(atributo, '');
        nodo.removeAttribute('hidden');
        nodo.removeAttribute('inert');
        nodo.removeAttribute('aria-hidden');
        estilo(nodo, 'display', 'block');
        if (nodo !== leccion) {
          estilo(nodo, 'padding', '0');
          estilo(nodo, 'margin', '0');
          estilo(nodo, 'min-height', '0');
          estilo(nodo, 'max-width', 'none');
        }
        if (nodo.parentElement && nodo.parentElement !== document.documentElement) {
          var hermanos = nodo.parentElement.children;
          for (var j = 0; j < hermanos.length; j++) {
            if (hermanos[j] !== nodo) estilo(hermanos[j], 'display', 'none');
          }
        }
      }
      // CSSOM directo: la CSP pública style-src 'self' bloquea un <style>
      // creado con texto. No se relaja la política ni se añade unsafe-inline.
      estilo(document.documentElement, 'background', '#0B0A0A');
      estilo(document.documentElement, 'overflow-x', 'hidden');
      estilo(document.documentElement, 'scroll-padding-top', '0');
      estilo(document.documentElement, 'scroll-behavior', 'auto');
      estilo(document.body, 'background', '#0B0A0A');
      estilo(document.body, 'overflow-x', 'hidden');
      estilo(leccion, 'padding-top', '6px');
      estilo(leccion, 'padding-inline', '16px');
      estilo(leccion, 'margin', '0 auto');
      var escena = document.getElementById('scene');
      if (escena && leccion.contains(escena)) estilo(escena, 'height', 'min(58vh,430px)');
      return true;
    }
    if (!aislar()) {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage('rwadar:explicador-no-disponible');
      return;
    }
    document.documentElement.setAttribute('data-rwadar-explicador-activo', '');
    // La web puede recolocar la lección si cambia su breakpoint.
    window.addEventListener('resize', aislar);
    /* El explicador arranca solo al entrar en pantalla; aquí ya lo está. */
    if (window.irPaso) { try { window.irPaso(0, true); } catch (e) {} }
    window.scrollTo(0, 0);
    window.requestAnimationFrame(function(){ window.dispatchEvent(new Event('resize')); });
  })();
  true;
`;

/* «Calcula con tus números →» (11/11/2026): la calculadora de la web enseña
   ese enlace dentro de la app solo si la app sabe abrir la suya; esta marca,
   puesta antes de que cargue la página y otra vez al terminar (por si al
   principio aún no había <html>), se lo dice. Al tocarlo, la página manda
   'rwadar:tutorial-calculadora' y la app lleva a la calculadora de Inicio.
   La app ya instalada no pone la marca: allí el enlace no sale. */
export const CON_CALCULADORA = `
  (function(){
    window.RWAdarCalculadoraApp = true;
    try { document.documentElement.setAttribute('data-rwadar-calculadora-app', ''); } catch (e) {}
    try { var ir = document.getElementById('calcIrInicio'); if (ir) ir.hidden = false; } catch (e) {}
  })();
  true;
`;

export default function Explicador({ onCerrar, obtenerAcceso, onPrimeraLeccion, onCalculadora }) {
  const [cargando, setCargando] = useState(true);
  const [fallo, setFallo] = useState(false);
  const [acceso, setAcceso] = useState(null);
  const web = useRef(null);
  useEffect(() => {
    let vivo = true;
    Promise.resolve().then(() => obtenerAcceso()).then(value => {
      if (value?.uri !== 'https://rwadar.pages.dev/api/acceso/tutorial' ||
        !/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value?.headers?.Authorization || '')) throw new Error('Acceso no válido');
      if (vivo) setAcceso(value);
    }).catch(() => { if (vivo) setFallo(true); });
    return () => { vivo = false; };
  }, [obtenerAcceso]);

  if (fallo) return <ExplicadorNativo onCerrar={onCerrar} onCalculadora={onCalculadora} />;

  return (
    <View style={e.pantalla}>
      <View style={e.cabecera}>
        <View style={{ flex: 1 }}>
          <Text style={e.arriba}>Academy · tutorial 3D</Text>
          <Text style={e.titulo}>Aprende a tokenizar un activo</Text>
        </View>
        <Pressable onPress={onCerrar} hitSlop={12}
          style={({ pressed }) => [e.cerrar, pressed && { opacity: 0.6 }]}
          accessibilityRole="button" accessibilityLabel="Cerrar el explicador">
          <Text style={e.cerrarTxt}>✕</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        {acceso && <WebView
          ref={web}
          source={acceso}
          injectedJavaScript={onCalculadora ? CON_CALCULADORA + SOLO_EL_EXPLICADOR : SOLO_EL_EXPLICADOR}
          injectedJavaScriptBeforeContentLoaded={onCalculadora ? CON_CALCULADORA : undefined}
          onMessage={(evento) => {
            if (evento?.nativeEvent?.data === 'rwadar:explicador-no-disponible') setFallo(true);
            if (evento?.nativeEvent?.data === 'rwadar:tutorial-finalizado') onCerrar();
            if (evento?.nativeEvent?.data === 'rwadar:tutorial-primera-leccion') onPrimeraLeccion?.();
            if (evento?.nativeEvent?.data === 'rwadar:tutorial-calculadora') onCalculadora?.();
          }}
          onLoadEnd={(evento) => {
            if (evento?.nativeEvent?.url === 'https://rwadar.pages.dev/api/acceso/tutorial' && acceso.headers) {
              // Cookie is now installed in this WebView. No Authorization on the page request.
              setAcceso({ uri: PAGINA }); return;
            }
            setCargando(false);
          }}
          onError={() => setFallo(true)}
          onHttpError={() => setFallo(true)}
          startInLoadingState={false}
          originWhitelist={['https://rwadar.pages.dev']}
          /* Que no se pueda navegar fuera del explicador: cualquier enlace
             a otra dirección se ignora en vez de convertir la app en un
             navegador. */
          onShouldStartLoadWithRequest={(r) => {
            if (!esOrigenRWAdar(r?.url)) return false;
            const destino = new URL(r.url);
            return !destino.search && ['/', '/api/acceso/tutorial'].includes(destino.pathname);
          }}
          allowsBackForwardNavigationGestures={false}
          scrollEnabled
          bounces={false}
          overScrollMode="never"
          style={e.web}
          /* El 3D necesita aceleración; sin esto va a tirones en Android. */
          androidLayerType="hardware"
          javaScriptEnabled
          domStorageEnabled
          incognito
          cacheEnabled={false}
          cacheMode="LOAD_NO_CACHE"
        />}
        {cargando && (
          <View style={e.cargando}>
            <ActivityIndicator size="large" color={C.senal} />
            <Text style={e.cargandoTxt}>Levantando el edificio…</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const e = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: C.noche },
  cabecera: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: 22, paddingTop: 18, paddingBottom: 10,
  },
  arriba: { ...T.etiqueta, color: C.tx3, marginBottom: 8 },
  titulo: { ...T.titular, color: C.tx },
  cerrar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: C.sup2,
    alignItems: 'center', justifyContent: 'center',
  },
  cerrarTxt: { color: C.tx2, fontSize: 15, fontFamily: F.media },

  web: { flex: 1, backgroundColor: C.noche },
  cargando: {
    ...StyleSheet.absoluteFillObject, backgroundColor: C.noche,
    alignItems: 'center', justifyContent: 'center', gap: 14,
  },
  cargandoTxt: { ...T.cuerpo, color: C.tx2 },
});
