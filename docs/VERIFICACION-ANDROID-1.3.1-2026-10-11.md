# RWAdar Android 1.3.1 · revisión de acabado · 11 de octubre de 2026

## Motivo y límites

Durante la revisión visual de la evidencia descargada de la versión pública
1.3.0, Codex detectó que la nota sobre favoritos locales cruzaba el borde
inferior del panel de recuperación/confirmación. El estilo histórico
`notaGuardadas` llevaba `marginTop: -14`: era correcto después de la sección
de ofertas retiradas, pero se reutilizó indebidamente después de Cuenta.
Los campos y botones seguían siendo legibles y utilizables; no era un fallo
de autenticación ni una nueva exposición de datos.

Se añade `notaFavoritosLocales` con separación positiva de 16, conservando
el estilo histórico y sus márgenes. También se corrige «1 guardados» por
«1 guardado». App versión 1.3.1; dependencias, sesiones, transporte y funciones
de cuentas no cambian. No se activa OTA, push, anuncios, cobros ni manual.
La web pública permanece idéntica al contenido aprobado previamente.

## Pruebas previas al binario

Dos nuevas regresiones renderizan el JSX y los estilos reales con Babel,
sin Expo ni red: comprueban la nota inmediatamente posterior a Cuenta,
margen positivo 16, margen histórico -14 después de su sección y cabecera
con cero, uno y varios favoritos. Suite UI **20/20**; `git diff --check` limpio.
La compilación y el QA del nuevo APK se registran a continuación; las pruebas
del APK13 no se atribuyen al APK14.

## Estado

**Android 1.3.1/código14 está publicado y verificado** desde las 09:45:05 UTC:
<https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.3.1>.
Es la versión latest pública, no un borrador ni prerelease. Se completaron
la instalación/navegación del binario exacto, la revisión de sus capturas
y la descarga anónima desde el enlace permanente. La compilación y el
lanzamiento permanecieron dentro del alcance autorizado sin cargos adicionales.

Fuente guardada y revisada en `53d4c33b4308098226714f61b66ee2017789823e`.
La repetición completa de `npm test` terminó con **código 0**, web 501/móvil 182/
refuerzo SQL 196 y el resto de base/QR/herramientas. Expo Doctor **21/21** en
copia aislada. El auditor local dio «LISTO PARA CORTE FINAL», sin red/SQL/
despliegue; la huella web sigue idéntica a la aprobada. Gitleaks, sin secretos.

EAS Free preflight: Android 2/15, sin sobrecostes. Se inició la compilación
editorial con credenciales existentes congeladas, sin OTA y solo 44 archivos
(661 KB). El incremento remoto confirmado fue 13→14. Build
`54e43d4b-af24-40f1-8eb0-ab227564c7dc`, creado 09:29:05.933 UTC,
<https://expo.dev/accounts/trapis-team/projects/rwadar/builds/54e43d4b-af24-40f1-8eb0-ab227564c7dc>.
La compilación terminó correctamente a las **09:36:36.070 UTC**. Metadatos
verificados: versión 1.3.1/código 14 y commit exactamente `53d4c33…`.
Cuota posterior Free: Android 3/15, total 4/30, sin exceso, coste estimado
ni complementos. No se contrataron servicios de pago ni se rotaron credenciales.

## Binario exacto comprobado

APK de **85.622.508 bytes**, SHA-256
`6b137a5adcbcb0a9c4ced483846d612cef3f04fd5bb0865fa5ce36483a630d55`.
`apksigner` oficial: firma v2 válida, un firmante RSA 2048, certificado
`f506dea70ad644184161542d583455d2ad849c4dea3fffa0469c9ca400f58b72`,
idéntico al de las versiones anteriores. `aapt`: paquete `com.rwadar.app`,
1.3.1/código14, mínimo API24/objetivo API36; solo los cuatro permisos anteriores
de Internet, red, vibración y receptor privado. Backup y actualizaciones OTA
desactivados en el manifiesto real, no solo en la fuente.

El APK tiene 1.300 entradas ZIP y bundle Android de 2.635.492 bytes. El
inventario no detecta keystores, `.env`, SQL ni mapas JavaScript; el PEM de
Expo es el mismo certificado público anterior, no una clave privada. Este
inventario no es un análisis exhaustivo de todos los recursos o código binario.

## QA y publicación condicionada

Se inició el flujo público
<https://github.com/victorJorques/RWAdar-downloads/actions/runs/38129282799>,
fuente del workflow `8c4936888eab5f72856b46b89d2b871086dc0305`, a las
09:41:42 UTC. Instala el APK exacto ya firmado, sin recompilarlo. La release
está condicionada a identidad/firma/manifiesto, navegación y formularios,
persistencia del favorito local y **separación mínima de 40 píxeles** entre
la nota local y el botón de recuperación. Comprueba también «1 guardado».
La evidencia se registra en logs acotados y la release; no se usa almacenamiento
de artifacts de Actions ni runners de pago. Un fallo impide publicar.

El flujo terminó con **éxito**: QA `114440050549` y publicación `114440579448`,
todos los pasos aprobados. El resultado propio de APK14 mide **92 píxeles**
de separación, frente a 13 en APK13; `accountPanelNoteSeparated=true`.
También comprueba instalación, arranque, cuatro pestañas, 26 plataformas y
49 referencias V2 (24 principales/21 secundarias/4 en camino), detalle Spiko,
siete lecciones con apertura/cierre de la primera, favorito local persistente
tras reiniciar y formularios nativos de acceso/alta/recuperación/confirmación.
No se introdujeron credenciales ni aceptaron condiciones ni enviaron correos.

## Descarga pública y revisión visual final

Codex descargó sin autenticación el APK, las sumas y la evidencia desde la
release pública a `C:/Users/vcicr/Downloads/rwadar-android-131-publicado-20261011/`.
La huella y los **85.622.508 bytes** del APK coinciden exactamente con el
binario ensayado. `apksigner` volvió a verificar v2, un firmante y el
certificado previsto de RWAdar. La evidencia
`rwadar-android-131-evidence.zip`: **6.612.300 bytes**, SHA-256
`f9529e778479d0254f63e7acf79a46c3dfe8a1e95c5c927fe4ed10a32a48e5e8`,
coincide con las sumas y metadatos públicos. Se comprobaron rutas y tamaños
antes de extraer: 54 entradas autorizadas, 7.801.859 bytes sin comprimir;
el flujo validó además el CRC del ZIP antes de publicar.

`result.json` coincide con versión/código, APK/firma, commit y ejecución exactos.
Codex revisó las capturas propias de recuperación, confirmación, alta y perfil
reabierto: la nota ya queda fuera del borde y la cabecera singular es correcta.
La revisión no es una garantía de interfaz perfecta. Se conserva la evidencia
de la 1.3.0 como historial, sin atribuirla al APK nuevo.
Otro agente revisó independientemente las mismas cuatro capturas y no observó
otro bloqueo visual. Los círculos blancos presentes en algunas capturas son
indicadores transitorios de la interacción/actualización del emulador: el mayor
coincide con el `RefreshControl` tras los gestos de retorno al comienzo, no
con un elemento permanente del formulario. No se editaron las capturas.

El cierre documental/manifiesto volvió a pasar `git diff --check`, Gitleaks
8.30.1 (23,73 MB analizados, sin secretos), doce controles de cobro seguro
y 51 pruebas de la compuerta de relanzamiento. Esto no elimina los avisos
de dependencias que se documentan abajo ni sustituye Auth real.

El navegador anónimo mostró la release 1.3.1 y sus instrucciones. La ruta
web `/android` sigue llevando a la última release. El commit público
`2f44074` devolvió el lanzamiento automático a `PUBLICAR_RELEASE=NO`
con `[skip ci]`, sin iniciar otra publicación. El espejo privado también
queda en NO. Se retiró la plantilla visual auxiliar 1.3.1 que no llegó a
utilizarse; sigue recuperable en Git. No se borró evidencia fechada.

Esta es distribución directa de APK firmada, **no publicación en Google Play
ni App Store**. En iPhone se utiliza la web pública.

La evaluación de dependencias sigue siendo **no limpia** y queda documentada
en [`VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-11.md`](VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-11.md).
No se afirma recuperación real de contraseña, alta/inicio/baja real desde
Android ni prueba en un teléfono físico.
