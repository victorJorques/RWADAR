// Config plugin local (Expo 57): Firebase no arranca solo en Android.
// FCM no genera el registro al abrir la app y Analytics no recoge nada; el
// token solo se pide al pulsar «Notificaciones en este móvil».
const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

const META = {
  firebase_messaging_auto_init_enabled: 'false',
  firebase_analytics_collection_enabled: 'false',
};

module.exports = function withFirebaseSinAutoarranque(config) {
  return withAndroidManifest(config, (config) => {
    const aplicacion = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    for (const [nombre, valor] of Object.entries(META)) {
      AndroidConfig.Manifest.addMetaDataItemToMainApplication(aplicacion, nombre, valor, 'value');
    }
    return config;
  });
};
