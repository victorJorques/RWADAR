# Tiendas y anuncios: preparación de RWAdar

Corte actualizado: 30/09/2026. La publicación web y la distribución Android
directa se registran en `INTERNO.md`. Esta página no acredita aprobación de
RWAdar en una tienda o red publicitaria.

## Cuentas comprobadas

- Google Play Console, cuenta `victorjorquesgranero@gmail.com`: la visita del 28/09 llevó
  a **Crear una cuenta de desarrollador**. No hay un panel de desarrollador
  operativo acreditado en esta cuenta. No se aceptaron contratos ni se pagó
  la inscripción.
- AdMob: la lectura del 30/09, entre las 12:02 y 12:05 UTC, realizada por el chat coordinado en el Chrome
  existente mostró una cuenta ya creada, saldo 0 EUR y «Configuración de pagos
  incompleta». La vista Todas las aplicaciones mostraba «Añadir mi primera
  aplicación»: RWAdar todavía no está registrada. No se creó una cuenta duplicada
  ni se rellenaron datos, aceptaron contratos o activaron anuncios en esta lectura.
  El corte del 28/09, con pantalla de alta y casilla contractual pendiente,
  es evidencia histórica; no describe el estado actual de la cuenta. La
  existencia del panel no acredita aprobación publicitaria, perfil completo
  ni ingresos. Lectura del chat «Actualiza ofertas de RWAdar local», conservada
  en `rwadar-contactos-2026-09-27/estado-admob-2026-09-30.md`. Es un registro
  minimizado del resultado DOM, sin captura ni AX bruto con identificadores.
  El intento de abrir «Solucionarlo» quedó en «Configurando facturación»;
  no se obtuvo un formulario utilizable ni se atribuye una causa al aviso.

Evidencia histórica de alta: `rwadar-contactos-2026-09-27/admob-alta-pendiente.png`.
No hay ID de editor/app publicitario inventado, SDK de anuncios ni cobros activos.

## Perfil y método de cobro

El perfil de pagos inicial y el método bancario para recibir ingresos son
pasos distintos. La [guía oficial de AdMob](https://support.google.com/admob/answer/15948559?hl=en),
consultada el 30/09, exige completar la información de pagos antes de que la
cuenta pueda monetizar y la app sea revisada para ello. La
[tabla oficial de umbrales](https://support.google.com/admob/answer/2772208?hl=en)
indica para EUR selección de método de pago a 10 EUR y pago a 70 EUR.
Estos umbrales no sustituyen el perfil inicial ni garantizan ingresos; no se
afirma que sea necesario introducir un banco antes de toda preparación técnica.

La base local aislada en `rwadar-monetizacion/` prueba el control de activación
y sus límites. No está importada por la app ni contiene una integración real
del SDK. Sus pruebas no equivalen a consentimiento real, revisión de AdMob,
anuncios servidos o ingresos.

## Ficha de tienda preparada

**Nombre:** RWAdar

**Descripción corta:** Explora activos tokenizados con fuentes, fechas y riesgos.

**Descripción:**

RWAdar reúne plataformas y referencias de activos tokenizados para que puedas
consultar su información en un solo lugar. Explora inmuebles, crédito, fondos,
acciones, materias primas e infraestructura. Cada ficha separa la actividad
observada, los registros comprobados y las condiciones de acceso conocidas.

Busca ofertas y empresas, consulta sus fuentes y guarda tus favoritos en tu
dispositivo. La consulta y la inclusión editorial son gratuitas. No necesitas
crear una cuenta. El catálogo requiere conexión y muestra su fecha de revisión.

RWAdar es un radar informativo: no emite activos, tramita inversiones, recibe
fondos ni ofrece asesoramiento financiero. Consulta condiciones y elegibilidad
con cada proveedor. Un activo tokenizado conserva sus riesgos.

**Soporte:** RWAdar@protonmail.com

**Web:** https://rwadar.pages.dev

**Privacidad:** https://rwadar.pages.dev/privacidad

## Trabajo técnico y pasos personales

La integración publicitaria, consentimiento, pruebas, nueva compilación,
app-ads.txt real, ficha y envío a revisión corresponden al trabajo técnico de
RWAdar. El acceso a una tienda no acredita aprobación automática de la app.
Las declaraciones de datos deben describir el comportamiento efectivo de la
compilación que se envíe, incluidas conexiones técnicas y cualquier SDK añadido.

Los contratos, verificaciones de identidad y la configuración de cobro exigen
la intervención o confirmación concreta del titular. No se presume residencia
fiscal o situación de alta por tener domicilio español, ni se inventa un banco.
La activación de anuncios sigue el recorrido y la investigación documentados
en `comercial/INVESTIGACION-MONETIZACION-2026-09-27.md`.
