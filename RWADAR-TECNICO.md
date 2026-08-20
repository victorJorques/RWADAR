# RWAdar · valor técnico y límites actuales

> Documento explicativo para clientes, socios o colaboradores. Reconciliado el
> 20 de agosto de 2026 sobre `42018de` y el traspaso del 17–20 de agosto.
> Para trabajar usa `RWADAR-TRASPASO.md`, `RWADAR-MANANA.md` y
> `RWADAR-MAPA.md`.

## En una frase

RWAdar es un registro curado de plataformas de tokenización de activos reales.
La web pública enseña 26 fichas y 4 descartadas con fuente. La ingeniería local
ha sido endurecida, pero **el proyecto no está terminado**: esa web no se ha
desplegado, la migración 22 sigue pendiente en producción y correo/push no son
operativos.

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

**Límite:** la producción visible sigue en la versión antigua con
`unsafe-inline`, política de privacidad fechada 09-08 y service worker v1. La
arquitectura endurecida es local hasta que se despliegue y verifique.

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

El publicador no interpreta un error como permiso para cambiar de destino. Si
Netlify rechaza la operación, termina: no crea un preview alternativo ni lo
promociona. El artefacto es `rwadar-publicado/`, nunca la fuente directamente.

Cada asset del artefacto recibe una huella de contenido; el HTML y el service
worker apuntan a esos nombres. La `VERSION` del worker se deriva del conjunto
desplegable completo y el precaché crítico es atómico, así que una pieza ausente
impide instalar como válida una entrega parcial.

El marcador `data-deploy-blocker` presente en la fuente corta cualquier modo
remoto antes de Auth, sincronización o Netlify; hoy solo `--local` puede
construir. Después de cerrar el acuerdo y los plazos y retirar el marcador, el
preflight remoto hace un GET de solo lectura a `/auth/v1/settings` y exige
`mailer_autoconfirm=false` exacto. Producción devuelve actualmente `true`; un
error o campo ausente también detienen la operación. Esta comprobación evita
publicar con autoconfirmación, pero no demuestra entrega de correo: hace falta
una prueba de alta y confirmación de extremo a extremo.

Robots y sitemap públicos responden, pero esta reconciliación no demostró la
indexación. Debe confirmarse en Search Console y volver a medirse tras cada
despliegue importante.

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
22 pasa en local pero está pendiente de aplicar y verificar en producción.**

## 5 · Privacidad con estado honesto

RWAdar no tiene sociedad constituida. Sus corresponsables actuales son Eric
Almiñana, Samuel Rodriguez y Victor Jorques. Contacto:
`RWAdar@protonmail.com`.

Existe un borrador de acuerdo, no un acuerdo firmado. Los plazos propuestos de
12 meses y 3 años no están aprobados. La política pública debe actualizarse
solo cuando los tres decidan el texto y los tratamientos reales lo cumplan.

Producción devuelve `mailer_autoconfirm=true`: el alta no verifica que una
dirección de correo sea real y el publicador remoto seguro queda bloqueado. El
preflight exige `false` exacto, pero aun después del cambio deberá probarse la
confirmación real de extremo a extremo. El correo de avisos no es operativo y
la migración 13 se mantiene separada de la instalación general.

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

## 8 · Evidencia de calidad

Al 20 de agosto, la batería web local pasa **121/121**, la comprobación del QR
**6/6**, el artefacto local contiene **26/4/0** y la base local cierra con
**270 aserciones + 8 gates SQL = 278 controles verdes**. Producción no se tocó.

Los dos smokes remotos son de solo lectura por defecto y no llevan destino ni
clave embebidos. Su modo mutante requiere variables y frase ligadas al proyecto
y siempre entra en un `finally` que verifica la limpieza: cuenta/login/contenido
en el smoke de producción y dispositivo/seguimiento en el móvil, sin tokens Expo
ficticios. Este contrato pasa **21/21** con fallos locales inyectados y sin red.

Las pruebas locales demuestran coherencia del código y de las migraciones en un
entorno controlado. No demuestran por sí solas:

- que la migración 22 esté aplicada en Supabase;
- que el sitio endurecido sea el servido por Netlify;
- que correo o push entreguen mensajes;
- que Google haya indexado la URL;
- que una afirmación financiera siga vigente.

Por eso el traspaso exige verificar producción después de cada cambio.

## Resumen

| Área | Fortaleza | Pendiente |
|---|---|---|
| Web | Estática, pre-renderizada, CSS/JS externos, CSP estricta local | Desplegar y verificar la remediación |
| Datos | PostgreSQL, RLS, RPC y verificadores | Aplicar/verificar 22 en producción |
| Privacidad | Sin RUM local, tokens web en memoria, responsables identificados | Firmar acuerdo y decidir plazos |
| Editorial | Fuentes obligatorias y controles automáticos | Revisión humana y actualización periódica |
| PWA | Producción instalable | Actualizar privacidad y SW con el nuevo deploy |
| Correo | Instalación separada y opt-in | Proveedor, consentimiento y prueba E2E |
| Push | Preparación con fallo cerrado | Sigue deshabilitado; emisor y recibos E2E |
| SEO | Pre-render, robots, sitemap y canonical | Confirmar indexación en Search Console |

Dependencias: backend tiene 0 hallazgos de `npm audit`. El árbol móvil normal
reporta 46 paquetes afectados (29 high, 17 moderate, 0 critical) propagados
desde tres avisos de build/toolchain —dos `image-size` high y uno `uuid`
moderate— sin arreglo compatible. `npm audit --force` propone Expo 46 y no es
una remediación aceptable. Expo install check, Doctor 21/21 y tests 7/7 pasan,
pero no cancelan ese riesgo pendiente.

RWAdar informa; no asesora ni recomienda inversiones. Una inscripción o
supervisión no elimina el riesgo ni garantiza resultados.
