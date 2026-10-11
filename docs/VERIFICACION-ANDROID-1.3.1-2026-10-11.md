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
La compilación y el QA de un nuevo APK se registrarán aparte; las pruebas
del APK13 no se atribuyen al APK14.

## Estado

Preparación local. Android 1.3.0 continúa publicado y verificado. La 1.3.1
no se dará por publicada hasta instalar/probar el binario exacto, revisar
su separación visual y descargarlo desde su enlace público permanente.
La compilación y el lanzamiento están autorizados solo sin cargos adicionales.

La evaluación de dependencias sigue siendo **no limpia** y queda documentada
en [`VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-11.md`](VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-11.md).
No se afirma recuperación real de contraseña, alta/inicio/baja real desde
Android ni prueba en un teléfono físico.
