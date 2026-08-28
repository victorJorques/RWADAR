# RWAdar · valor técnico y límites actuales

> **ARCHIVO HISTÓRICO.** No representa el estado actual. Consulta
> `../../INTERNO.md` antes de usar cualquier cifra, despliegue o prioridad.

> Documento explicativo para clientes, socios o colaboradores. Reconciliado el
> 22 de agosto de 2026 sobre la entrega publicada en Cloudflare Pages.
> Para trabajar usa `RWADAR-TRASPASO.md`, `RWADAR-MANANA.md` y
> `RWADAR-MAPA.md`.

## En una frase

RWAdar es un registro curado de plataformas de tokenización de activos reales.
La web pública enseña 26 fichas y 4 descartadas con fuente. La versión endurecida
está desplegada y verificada en `https://rwadar.pages.dev`, pero **el proyecto no
está terminado**: correo y push no son operativos. Sin SMTP propio probado, las
altas y la recuperación públicas están pausadas fail-closed; el login existente
y el radar sin cuenta siguen disponibles. La migración 22 sí está aplicada y
verificada en producción.

## 1 · Una web estática, explícita y auditable

La web no necesita un framework ni una compilación para ejecutarse. La versión
reconciliada separa responsabilidades:

- `rwadar-site/index.html`: estructura, metadatos y contenedores
  pre-renderizados;
- `rwadar-site/assets/rwadar-20260820.css`: diseño y tipografías locales;
- `rwadar-site/assets/rwadar-20260820.js`: interacción, datos generados y 3D;
- hojas separadas para privacidad y 404.

La separación no añade una cadena de build: permite una Content Security
Policy estricta sin `unsafe-inline` ni `unsafe-eval`. No hay JavaScript
ejecutable inline, manejadores `on*`, `<style>` ni atributos `style`.

Las tipografías están incrustadas en el CSS propio, por lo que no se consulta
Google Fonts ni se entrega la IP del visitante a ese servicio. Netlify RUM está
desactivado; si reaparece un `netlify-rum-container`, la validación lo trata
como discrepancia.

**Estado publicado:** Cloudflare Pages sirve la arquitectura endurecida, CSP sin
`unsafe-inline`/`unsafe-eval`, política actual y service worker versionado. El
deployment vigente es `d7f7e611-15a3-4e89-9a39-72bbe371b054`
(`https://d7f7e611.rwadar.pages.dev`) y la caché PWA es
`rwadar-v-3688f59d62fd0079`. Netlify conserva una versión anterior:
sus despliegues de producción están pausados porque solo quedan créditos
operativos y la CLI responde `Forbidden`; no es el canonical.

En móvil, la ficha usa cabecera y acciones persistentes, safe-area, contenido
agrupado y scroll interior; conserva todos los datos, opiniones y el acceso al
3D, y puede cerrarse arriba, abajo o con Atrás. Privacidad exige 18 años.

## 2 · Pre-renderizado y publicación con intención

La aplicación puede actualizar datos desde Supabase al cargar, pero el
publicador escribe 26 fichas, 4 descartadas y, hoy, 0 emisiones en el artefacto
HTML para que un buscador no dependa de ejecutar JavaScript.

La publicación exige exactamente un modo:

```bash
node rwadar-publicar.js --local
node rwadar-publicar.js --preview
node rwadar-publicar.js --produccion
```

El publicador no interpreta un error como permiso para cambiar de destino. El
artefacto es `rwadar-publicado/`, nunca la fuente directamente. El publicador
remoto apunta exclusivamente a Cloudflare mediante Wrangler 4.125.0, proyecto
Pages `rwadar`, rama `main`, y
solo con ese directorio generado. CALIX es otro proyecto y no se toca.

Cada asset del artefacto recibe una huella de contenido; el HTML y el service
worker apuntan a esos nombres. La `VERSION` del worker se deriva del conjunto
desplegable completo y el precaché crítico es atómico, así que una pieza ausente
impide instalar como válida una entrega parcial.

La fuente declara
`data-deploy-legal-status="acuerdo-pendiente-de-documentar"`; ese estado permite
la versión completa y conserva visible que el acuerdo y los plazos no están
cerrados. Un `data-deploy-blocker`, un estado ausente o uno desconocido cortan
cualquier remoto antes de Auth o sincronización. El preflight remoto
hace un GET de solo lectura a `/auth/v1/settings` y exige
`mailer_autoconfirm=false` exacto. Producción ya devuelve `false` y Confirm email
está activo; un error o campo ausente detienen la operación. Como no hay SMTP
propio probado, la web no envía altas ni recuperaciones públicas: las pausa de
forma fail-closed. El login de cuentas existentes permanece disponible y el
radar completo no requiere cuenta.

Robots y sitemap públicos responden. Search Console tiene verificada la propiedad
Pages y la portada está en la cola de indexación; el dominio nuevo aún no debe
describirse como indexado. Debe volver a medirse tras cada despliegue importante.

## 3 · El gráfico 3D

El explicador usa WebGL escrito para el proyecto. El edificio se compone de
885 paneles y usa dibujo instanciado para reducir órdenes a la GPU. La
animación, el reflejo y la sombra comparten una arquitectura documentada por
símbolos en `RWADAR-MAPA.md`.

El valor no es solo visual: existe una receta para avanzar fotogramas de forma
determinista y extraer capturas. El servidor local no acepta escrituras por
defecto; `--capturas` las habilita de forma expresa, con límite de tamaño,
validación PNG, nombre saneado y confinamiento de ruta.

## 4 · Seguridad en profundidad

La clave publicable de Supabase identifica el proyecto; no es una credencial
administrativa. La protección real vive en la base:

- RLS y permisos de tabla;
- operaciones sensibles mediante RPC;
- identidad y destino resueltos por el servidor;
- prevención de autoasignación de privilegios;
- opiniones públicas sin UUID de usuario;
- vistas con el contrato de invocador apropiado;
- helpers internos no ejecutables por roles públicos;
- `search_path` fijado en funciones sensibles.

La web reconciliada no persiste tokens de sesión en `localStorage`; los
mantiene en memoria. Tampoco reintroduce un fallback de escritura directa si
una RPC falla.

Las migraciones 14 y 15 representan el endurecimiento ya conocido. La 22 añade
un cierre de regresiones, un verificador y un rollback de fallo cerrado. **La
22 está aplicada y verificada en producción.** El SQL (`02F2...0666`) terminó
en `COMMIT` y mostró `schedule=19`; el verificador (`4182...2C3`) devolvió
`Success. No rows returned` y `RWAdar 22 OK`. El smoke público posterior dio
26/4 y confirmó las denegaciones ACL/RPC esperadas: 401 para lecturas sensibles
y moderación directa, 404/PGRST202 para la firma antigua y 401/42501 para la
firma nueva anónima.

Security Advisor quedó en 0 Critical y 0 Security Definer View.

## 5 · Privacidad con estado honesto

RWAdar no tiene sociedad constituida. Sus corresponsables actuales son Eric
Almiñana, Samuel Rodriguez y Victor Jorques. Contacto:
`RWAdar@protonmail.com`.

Existe un borrador de acuerdo, no un acuerdo firmado. Los plazos propuestos de
12 meses y 3 años no están aprobados. La política pública debe actualizarse
solo cuando los tres decidan el texto y los tratamientos reales lo cumplan.

Confirm email está activo y producción devuelve `mailer_autoconfirm=false`; el
preflight Auth ya pasa. Eso no convierte el correo en operativo: no hay SMTP
propio probado. Por ello, las altas y la recuperación públicas están pausadas
fail-closed y no generan solicitudes; el login de cuentas existentes y la
consulta completa del radar siguen disponibles. El correo de avisos tampoco es
operativo y su activación se mantiene separada de la instalación general.

En móvil, registrar un token o preparar una cola no equivale a entregar una
notificación. `pushDeliveryEnabled=false`; no hay emisor ni recibos de extremo
a extremo verificados y no se promete entrega. Fresh-install, 17, 22, rollback
y recuperación dejan además el interruptor backend en `false` y 0 cron
`rwadar-push`. La retención diaria a las 03:17 es una tarea independiente.
La 22 también termina colas heredadas y elimina de ellas la copia del token y
la petición pendiente.

El único opt-in es `activar-push.cmd <REF>`, fuera de fresh/22 y protegido por
PAT, aprobación E2E, confirmación ligada al proyecto y verificador propio. No se
ha ejecutado contra producción.

## 6 · Rigor editorial como control técnico

Una descartada necesita una fuente citable. Los verificadores buscan que la
consulta `descartadas_sin_fuente` quede vacía. Esa condición reduce el riesgo,
pero no reemplaza la revisión humana de actualidad, contexto y redacción.

La misma precisión se aplica a los reguladores. El
[registro ERIR de la CNMV](https://www.cnmv.es/portal/consultas/esi/erir_esi?lang=es&nif=A86796182)
lista una emisión de REENTAL TOURIST HOMES, S.A.U. y varias de sociedades
HAUSERA PROPERTY MANAGER SPV. La propia página aclara que la inscripción no
implica validación de las condiciones ni de la información del emisor.

Eso permite afirmar que esas emisiones concretas figuran en el registro; no
permite decir que Reental, Hausera, sus plataformas o una inversión estén
«avaladas por la CNMV». Tampoco demuestra rentabilidad, liquidez o seguridad.

## 7 · Móvil: capacidades preparadas y límites

La app usa React Native/Expo, una caché local y almacenamiento seguro para su
identificador. Las escrituras remotas deben confirmar éxito y los permisos de
notificaciones se piden en contexto.

Hay soporte técnico para seguimiento y push, pero no una cadena de entrega
operativa. Esa distinción es deliberada: ante un fallo, se conserva trabajo
pendiente o se informa del error; no se presenta un éxito falso.

La versión móvil local está GO y pasa 15/15. El preview EAS terminó `FINISHED`:
Android 1.0.0 build 4, ID `c7bb915b-da3b-46d4-9bd6-811a432b4cb3`, fingerprint
`af69452933f988f2d48d45861802f09d3df06e8b`. El APK local mide 84.783.140 bytes
y tiene SHA-256
`5E505F18C26FF91A8FC12899DEE39D9757C5D2E7FFC665DF0D7AFF090CFC4DB7`;
su estructura y firma v2 están presentes. La OTA Android `preview`, grupo
`4f9d7e19...`, entrega el rediseño y la apertura segura de avisos al build 4
compatible. Falta instalación/prueba en dispositivo y no está en tienda. Push
sigue OFF.

## 8 · Evidencia de calidad

Al 22 de agosto, la batería web pasa **203/203**, la comprobación del QR
**6/6**, el artefacto contiene **26/4/0** y la suite raíz completa termina con
código 0 e incluye DB, web, QR, móvil **15/15** y tools. La migración 22 se
verificó además contra producción como se describe arriba.

Los dos smokes remotos son de solo lectura por defecto y no llevan destino ni
clave embebidos. Su modo mutante requiere variables y frase ligadas al proyecto
y siempre entra en un `finally` que verifica la limpieza: cuenta/login/contenido
en el smoke de producción y dispositivo/seguimiento en el móvil, sin tokens Expo
ficticios. Este contrato pasa **21/21** con fallos locales inyectados y sin red.

Las pruebas locales demuestran coherencia del código y de las migraciones en un
entorno controlado. La comprobación de producción ya demostró la 22, pero las
pruebas locales no demuestran por sí solas:

- que correo o push entreguen mensajes;
- que una afirmación financiera siga vigente.

Por eso el traspaso exige verificar producción después de cada cambio.

## Resumen

| Área | Fortaleza | Pendiente |
|---|---|---|
| Web | Estática, pre-renderizada, CSS/JS externos y CSP estricta, desplegada y verificada en Pages | Repetir smoke tras cada entrega |
| Datos | PostgreSQL, RLS, RPC; 22 aplicada y verificada en producción | Repetir verificación tras cambios de esquema |
| Privacidad | Sin RUM local, tokens web en memoria, responsables identificados | Firmar acuerdo y decidir plazos |
| Cuentas | Radar sin cuenta y login existente; altas/recuperación públicas cerradas sin SMTP | SMTP propio y E2E antes de reabrir altas o recuperación |
| Editorial | Fuentes obligatorias y controles automáticos | Revisión humana y actualización periódica |
| PWA | Producción instalable en iOS y Android; cuatro pestañas (`Radar`, `Siguiendo`, `Avisos`, `Más`) y migración automática desde service worker v1 | Abrir desde Pages; Netlify mantiene la versión anterior mientras producción siga pausada por créditos |
| Correo | Instalación separada y opt-in | Proveedor, consentimiento y prueba E2E |
| Push | Preparación con fallo cerrado | Sigue deshabilitado; emisor y recibos E2E |
| SEO | Pre-render, robots, sitemap y canonical en Pages | Confirmar cobertura real en Search Console |

Dependencias: backend tiene 0 hallazgos de `npm audit`. El árbol móvil normal
reporta 46 paquetes afectados (29 high, 17 moderate, 0 critical) propagados
desde tres avisos de build/toolchain —dos `image-size` high y uno `uuid`
moderate— sin arreglo compatible. `npm audit --force` propone Expo 46 y no es
una remediación aceptable. Expo install check, Doctor 21/21 y tests 15/15 pasan,
pero no cancelan ese riesgo pendiente.

RWAdar informa; no asesora ni recomienda inversiones. Una inscripción o
supervisión no elimina el riesgo ni garantiza resultados.
