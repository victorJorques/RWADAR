import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
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

   No compromete la revisión de Apple. La directriz 4.2 rechaza las apps
   que son SOLO una web envuelta; esta tiene lista nativa, buscador,
   filtros, radar nativo en SVG, caché sin conexión, seguimiento y avisos
   push. Un módulo embebido dentro de eso es lo corriente.

   SIN CONEXIÓN NO HAY WEB, y la app promete funcionar sin conexión. Por
   eso el explicador nativo no se borra: es lo que se enseña cuando esto
   no carga. Se ve peor, pero se ve.
   --------------------------------------------------------------------- */

const PAGINA = 'https://rwadar.netlify.app/#explain';

/* Se esconde todo menos el explicador, y se desactiva el desplazamiento
   horizontal y el rebote para que dentro de la app no se note que es una
   página. El fondo es el mismo `--noche` de los dos sitios, así que no hay
   costura visible entre lo nativo y lo embebido. */
const SOLO_EL_EXPLICADOR = `
  (function(){
    var quitar = ['header.hdr', '.portada', '#metodo', '#tool', '#fuera',
                  'footer', '.saltar', '.cmpbar', '.aviso'];
    var css = quitar.join(',') + '{display:none!important}'
      + 'html,body{background:#0B0A0A!important;overflow-x:hidden!important}'
      + '#explain{padding-top:6px!important;margin:0!important}'
      + '#explain .escena{height:min(58vh,430px)!important}'
      + '::-webkit-scrollbar{display:none}';
    var s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
    /* El explicador arranca solo al entrar en pantalla; aquí ya lo está. */
    if (window.irPaso) { try { window.irPaso(0, true); } catch (e) {} }
    true;
  })();
`;

export default function Explicador({ onCerrar }) {
  const [cargando, setCargando] = useState(true);
  const [fallo, setFallo] = useState(false);
  const web = useRef(null);

  /* Sin red se cae al explicador nativo, que no necesita nada. */
  if (fallo) return <ExplicadorNativo onCerrar={onCerrar} />;

  return (
    <View style={e.pantalla}>
      <View style={e.cabecera}>
        <View style={{ flex: 1 }}>
          <Text style={e.arriba}>CÓMO FUNCIONA</Text>
          <Text style={e.titulo}>¿Qué es tokenizar un activo?</Text>
        </View>
        <Pressable onPress={onCerrar} hitSlop={12}
          style={({ pressed }) => [e.cerrar, pressed && { opacity: 0.6 }]}
          accessibilityRole="button" accessibilityLabel="Cerrar el explicador">
          <Text style={e.cerrarTxt}>✕</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        <WebView
          ref={web}
          source={{ uri: PAGINA }}
          injectedJavaScript={SOLO_EL_EXPLICADOR}
          onMessage={() => {}}
          onLoadEnd={() => setCargando(false)}
          onError={() => setFallo(true)}
          onHttpError={() => setFallo(true)}
          startInLoadingState={false}
          originWhitelist={['https://rwadar.netlify.app']}
          /* Que no se pueda navegar fuera del explicador: cualquier enlace
             a otra dirección se ignora en vez de convertir la app en un
             navegador. */
          onShouldStartLoadWithRequest={(r) => r.url.startsWith('https://rwadar.netlify.app')}
          allowsBackForwardNavigationGestures={false}
          scrollEnabled
          bounces={false}
          overScrollMode="never"
          style={e.web}
          /* El 3D necesita aceleración; sin esto va a tirones en Android. */
          androidLayerType="hardware"
          javaScriptEnabled
          domStorageEnabled
        />
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
  arriba: { ...T.etiqueta, color: C.senal, marginBottom: 8 },
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
