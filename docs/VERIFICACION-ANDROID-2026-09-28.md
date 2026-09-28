# Android público: verificación del binario

RWAdar 1.1.0, versionCode 8, paquete `com.rwadar.app`. Build EAS
`d6966f1f-b0b3-415d-b732-311c4b31f7a3`, finalizado el 28/09/2026.

- APK: 85.254.924 bytes; SHA256
  `593099b7c23d420da0aa361d74d4760b6e73368089849a57887489e7cfb1a255`.
- Firma V2 válida, certificado SHA256
  `f506dea70ad644184161542d583455d2ad849c4dea3fffa0469c9ca400f58b72`;
  coincide con la firma existente. Mínimo Android 7, target SDK 36.
- Manifiesto comprobado: Internet, estado de red, vibración y receptor interno;
  sin permisos de almacenamiento ni superposición. Backup y OTA desactivados.
- 58 pruebas nativas y Expo Doctor 21/21 aprobados. Auditoría sin hallazgos
  críticos o altos; 10 moderados de dependencias documentados.
- [Prueba real del APK instalado](https://github.com/victorJorques/RWAdar-downloads/actions/runs/36401384266):
  éxito en emulador Android API 35. Instalación limpia, apertura, catálogo remoto
  de 26 plataformas, 28 referencias, búsqueda Spiko y ficha superados. Capturas
  revisadas visualmente. No es una prueba en un teléfono físico.

El APK ensayado conserva su firma y bytes. El auxiliar de captura se compiló e
instaló por separado en el ejecutor efímero; no cambia la app distribuida.
Los primeros intentos de CI fallaron por configuración del emulador o captura
de una interfaz animada; la ejecución final anterior supera el recorrido.

Evidencia privada: `rwadar-entrega-android-20260928/verificacion-apk8.json` y
`rwadar-entrega-android-20260928/evidence-36401384266/` (result.json y capturas).
La descarga definitiva se ofrece en el repositorio público de distribución,
separado del código fuente privado. Esta entrega no acredita publicación en
Google Play ni App Store, anuncios activos o métricas de uso nativo.
