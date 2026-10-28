# Sesión del tutorial · 27 de octubre de 2026

El tutorial adoptaba la sesión nativa en la web. La carga de perfil enviaba opciones nulas; el bridge lanzaba una excepción y el arranque web cerraba esa sesión. Se normalizan solo null/undefined, manteniendo la verificación y el rechazo401. No cambia el APK20.

Fuente 502eb880bcfd7457c9f0b1115c7a7d718c45504d. Revisión independiente y3 regresiones del código real aprobadas: consulta privada sin opciones, arranque de Cuenta sin cierre y401 conservado. Preview b6316693 y producción 19511368 verificadas. Después se añadió continuación explícita y aislamiento del perfil público (fbcc0d9): preview https://525d01c5.rwadar.pages.dev y producción https://d2ad2a83.rwadar.pages.dev, seis comprobaciones HTTPS en cada una. La QA nativa 40573949693 muestra el tutorial 3D real cargado; falló luego el capturador por timeout, sin acreditar sus cuatro pasos ni cartera/salida. No SQL, nuevos correos ni investigación.
