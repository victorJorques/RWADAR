import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

// Una misma salida para X y Atrás. El padre solo desmonta la ficha después
// de terminar la transición, y una segunda pulsación no vuelve a cerrarla.
export default function useTransicionFicha(visible, onCerrar) {
  const [reducir, setReducir] = useState(true);
  const avance = useRef(new Animated.Value(1)).current;
  const cerrando = useRef(false);
  const vivo = useRef(true);
  const cerrarActual = useRef(onCerrar);
  cerrarActual.current = onCerrar;

  useEffect(() => {
    vivo.current = true;
    let cambiado = false;
    const cambio = valor => { cambiado = true; if (vivo.current) setReducir(Boolean(valor)); };
    const escucha = AccessibilityInfo.addEventListener('reduceMotionChanged', cambio);
    AccessibilityInfo.isReduceMotionEnabled().then(valor => {
      if (vivo.current && !cambiado) setReducir(Boolean(valor));
    }).catch(() => { if (vivo.current && !cambiado) setReducir(true); });
    return () => { vivo.current = false; escucha.remove(); avance.stopAnimation(); };
  }, [avance]);

  useEffect(() => {
    avance.stopAnimation();
    if (!visible) { cerrando.current = false; avance.setValue(1); return; }
    if (cerrando.current) {
      if (reducir) cerrarActual.current?.();
      return;
    }
    if (reducir) { avance.setValue(1); return; }
    avance.setValue(0);
    Animated.timing(avance, {
      toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true,
    }).start();
  }, [visible, reducir, avance]);

  const cerrar = useCallback(() => {
    if (cerrando.current) return;
    cerrando.current = true;
    if (reducir) { cerrarActual.current?.(); return; }
    avance.stopAnimation();
    Animated.timing(avance, {
      toValue: 0, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && vivo.current) cerrarActual.current?.();
    });
  }, [reducir, avance]);

  return { cerrar, estilo: {
    opacity: avance,
    transform: [{ translateY: avance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  } };
}
