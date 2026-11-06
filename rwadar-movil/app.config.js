// Configuración dinámica: lo único que añade a app.json es el archivo de
// Firebase, que llega como variable de EAS de tipo archivo (GOOGLE_SERVICES_JSON).
// google-services.json nunca va en Git.
module.exports = ({ config }) => {
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON;
  // En las máquinas de compilación de EAS (EAS_BUILD=true) sin el archivo, el
  // APK saldría sin FCM y las notificaciones no llegarían: mejor no compilar.
  if (process.env.EAS_BUILD === 'true' && !googleServicesFile) {
    throw new Error('Falta GOOGLE_SERVICES_JSON (variable de EAS de tipo archivo, entorno production).');
  }
  return googleServicesFile
    ? { ...config, android: { ...config.android, googleServicesFile } }
    : config;
};
