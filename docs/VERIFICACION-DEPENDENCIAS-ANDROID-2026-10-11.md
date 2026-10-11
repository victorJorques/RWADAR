# Dependencias de Android 1.3.0 · 11 de octubre de 2026

**Conclusión:** no se ha demostrado un camino vulnerable alcanzable en el
APK actual 1.3.0/código 13 para los tres advisories analizados. Son avisos
residuales documentables de herramientas de compilación. Esto no garantiza
ausencia de otros fallos ni permite afirmar «auditoría limpia».

## Auditoría y candidato exacto

`npm audit --omit=dev --audit-level=high` **NO pasa**: 23 avisos de paquetes,
16 high, 7 moderate y cero critical. Son tres advisories base y su
propagación por Expo/Metro/React Native, no 23 exploits independientes
demostrados en el cliente.

Candidato: build EAS `7523ec9a-79d9-4775-893e-50c00022f494`, commit
`3a0d9536d01c3613e8d79939cce9d9b40072f108`. APK SHA-256
`0bc76f885a4dde467e428e0abb9eddb773092d36f9bc474227e487ce96dbda32`,
85.622.388 bytes. No se modificó, refirmó ni recompiló durante esta revisión.

Dependencias finales comprobadas: Expo 57.0.27, constants 57.0.21,
notifications 57.0.22, updates 57.0.25, modules-core 57.0.21,
React Native 0.86.3 y Supabase JS fijado en 2.112.1. No se cambiaron paquetes
ni lock en esta auditoría ni se ejecutó `audit fix --force`: las propuestas
de npm rebajan incompatiblemente Expo, React Native y expo-updates.

## Evidencia y alcance

Exportación JS Android local en copia aislada, con `EXPO_OFFLINE=1`,
`EXPO_NO_NETWORK=1`, telemetría desactivada, `--source-maps external`
y `--no-bytecode`. Los 44 archivos de fuente coinciden byte a byte con
el archivo inspeccionado del build13. Metro informó 920 módulos; el mapa
contiene 927 fuentes.

Cero fuentes de braces, micromatch, node-forge, uuid npm, xcode,
@expo/code-signing-certificates, metro-file-map o expo-updates JS en ese
inventario. De @expo/cli solo aparece `build/metro-require/require.js`,
el cargador del runtime; no se afirma que todo código de CLI esté ausente.

El mapa permanece únicamente en
`C:/Users/vcicr/Downloads/rwadar-runtime-android-130-auditoria-20261011/_expo/static/js/android/index-47e05d0d5328cd6900d8ec81169477c0.js.map`;
SHA-256 `3163623c63cd954723777532b5bb2abad52cf54c1aee5a7007f7228251125386`.
**Es evidencia estática del runtime exportado, no el mapa ni una
descompilación del Hermes incorporado al APK firmado.** No se incorpora
el mapa, fuentes crudas ni secretos a Git.

- **braces 3.0.3:** agotamiento de pila con un patrón de llaves anidado.
  Se alcanza en tooling por micromatch 4.0.8 y metro-file-map 0.84.5,
  que procesa globs del proyecto; no recibe búsquedas ni datos del usuario
  de RWAdar. [Advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
- **node-forge 1.4.0:** verificación RSA PKCS#1 v1.5 defectuosa con
  exponentes bajos. Lo importan CLI Expo y code-signing-certificates, no
  App/lib/componentes. La firma Android y la identidad Supabase no usan
  esta biblioteca. [Advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv).
- **uuid 7.0.3/3.4.0:** el fallo requiere v3/v5/v6 con buffer/offset
  externo inválido. xcode y ngrok llaman v4 sin buffer, no afectado;
  RWAdar usa `Crypto.randomUUID`. El parche Swift iOS de 20→16 bytes es
  otro defecto: NO corrige este advisory npm.
  [Advisory del mantenedor](https://github.com/uuidjs/uuid/security/advisories/GHSA-w5hq-g745-h8pq).

OTA permanece desactivado, comprobado también por la prueba del manifiesto
del APK. La implementación nativa Android verifica mediante
`java.security.Signature`, no node-forge.
[Código oficial SDK57](https://raw.githubusercontent.com/expo/expo/sdk-57/packages/expo-updates/android/src/main/java/expo/modules/updates/codesigning/CodeSigningConfiguration.kt),
[documentación de Updates](https://docs.expo.dev/versions/v57.0.0/sdk/updates/).

## Contención y pendiente

La compilación usa fuente revisada, una lista de 44 archivos y tooling
aislado; no se expone Metro públicamente ni se aceptan globs/certificados
no confiables. Mantener visibles estos avisos y actualizar tooling compatible
cuando exista una solución validable: braces y node-forge no anuncian aún
versión corregida en los advisories consultados. No usar excepciones globales
silenciosas. Revaluar antes de otra compilación o de activar OTA/cambiar
el árbol runtime. La conclusión no sustituye al QA del binario ni al Auth E2E.

## Revisión de acabado 1.3.1

La fuente `53d4c33b4308098226714f61b66ee2017789823e` solo cambia App.js y
app.json en la lista de 44 archivos móviles: margen de una nota, cabecera
singular y versión. Package/lock, imports, controlador, transporte y OTA
permanecen intactos. El export Android aislado/offline se repitió para esa
fuente: **920 módulos, 927 fuentes/927 contenidos** y los mismos ocho grupos
afectados ausentes del inventario; @expo/cli solo aporta metro-require/require.js.
Mapa local SHA-256
`89bd9c7f6916cee0d9e344fc3b2c05e86e5133de4731372e66082df2ee78f5e3`,
evidencia en `C:/Users/vcicr/Downloads/rwadar-runtime-android-131-auditoria-20261011/ALCANCE-RUNTIME-131.md`.
El mapa y las fuentes siguen únicamente en local. Esto extiende la evaluación
estática al cambio de acabado, **no demuestra por sí solo identidad, firma ni
ejecución del nuevo APK**. Se mantienen los 23 avisos sin una corrección
compatible disponible y los límites anteriores. Pruebas del binario nuevo:
[`VERIFICACION-ANDROID-1.3.1-2026-10-11.md`](VERIFICACION-ANDROID-1.3.1-2026-10-11.md).
