# RWAdar

Registro curado de plataformas de tokenización de activos reales. La versión
pública muestra **26 plataformas en el radar y 4 descartadas con fuente**:
[rwadar.netlify.app](https://rwadar.netlify.app).

## Estado real · 20 de agosto de 2026

RWAdar **no se considera terminado**. Conviven dos estados que no deben
confundirse:

| Pieza | Estado |
|---|---|
| Web pública | En línea, pre-renderizada e instalable como PWA; 26 fichas y 4 descartadas. Sigue en la versión antigua con `unsafe-inline`, privacidad 09-08 y service worker v1 |
| Sección pública de emisiones | No está publicada; producción muestra 0 emisiones y no enseña esa sección |
| Web remediada de este repositorio | 121/121 pruebas locales y QR 6/6; 26/4/0; todavía no desplegada |
| Base de producción | No se tocó en esta reconciliación; la migración 22 solo está validada localmente y sigue pendiente de aplicar y verificar |
| Registro de cuentas | Producción devuelve `mailer_autoconfirm=true`: no verifica que la dirección exista y bloquea cualquier despliegue remoto del publicador seguro |
| Avisos por correo | No operativos |
| Avisos push | Deshabilitados: `pushDeliveryEnabled=false`; el contrato local fresh/22 deja flag backend `false` y 0 cron `rwadar-push`. El opt-in no se ejecutó |

La base de esta reconciliación es el commit `42018de` y, por indicación de los
responsables, los archivos de traspaso del 17–20 de agosto tienen prioridad
sobre documentación anterior.

La suite de base local cerró con **278 controles verdes**: 270 aserciones y 8
gates SQL. Esto no cambia el estado de producción.

Los dos smokes remotos —base pública y contrato móvil— no contienen destino ni
clave predeterminados y son de solo lectura por defecto. Mutar exige variables
y confirmación ligadas al proyecto; su `finally` verifica la limpieza. El
contrato se probó localmente, con fallos inyectados y sin red, **21/21**.

## Dependencias pendientes

- Backend: `npm audit` informa 0 vulnerabilidades.
- Móvil: `npm audit --omit=dev` sobre el árbol normal informa **46 paquetes
  afectados** (29 high, 17 moderate, 0 critical). El reporte visible deriva de
  tres avisos fuente de build/toolchain —dos `image-size` high y uno `uuid`
  moderate— propagados por Expo/Metro/xcode. No hay corrección compatible en
  el árbol actual; `--force` propone Expo 46 y no debe aplicarse.
- La app pasa Expo install check, Doctor 21/21 y pruebas 7/7. Eso no elimina el
  riesgo anterior ni autoriza a ocultar la cifra 46.

## Qué contiene

- Un radar con 26 plataformas y cuatro criterios editoriales uniformes.
- Un explicador 3D de qué significa tokenizar un activo.
- Una calculadora educativa.
- Un registro de descartes que exige una fuente citable.
- Cuentas y opiniones moderadas, separadas del criterio editorial.
- Descarga del registro en CSV.
- Una PWA que reutiliza la misma dirección pública.
- Una sección de emisiones construida localmente, aún sin publicar.

## Arquitectura actual

| Capa | Implementación |
|---|---|
| Web | HTML estático, CSS y JavaScript propios en archivos externos versionados; sin proceso de compilación |
| 3D | WebGL escrito para el proyecto |
| Datos | Supabase/PostgreSQL con seguridad por fila y operaciones sensibles mediante RPC |
| App móvil | React Native/Expo; comparte la base de datos |
| Publicación | Pre-renderizado para buscadores y tres modos explícitos: local, preview y producción |

En la versión local, la política CSP no permite JavaScript ejecutable ni estilos inline. Netlify RUM
está desactivado y una inyección de `netlify-rum-container` se considera una
discrepancia. Las sesiones web no se persisten en `localStorage`: los tokens se
mantienen en memoria.

## Publicar de forma segura

```bash
node rwadar-publicar.js --local
node rwadar-publicar.js --preview
node rwadar-publicar.js --produccion
```

Exactamente uno de esos modos es obligatorio. El publicador no cambia de modo,
no crea un borrador alternativo y no promociona un preview si Netlify rechaza
la operación. No uses `netlify deploy` directamente.

Ahora mismo el marcador `data-deploy-blocker` permite construir solo con
`--local`: bloquea `--preview` y `--produccion` antes de Auth, sincronización o
Netlify. Tras cerrar el acuerdo y los plazos de conservación y retirar ese
marcador de forma deliberada, cualquier modo remoto comprueba
`/auth/v1/settings` en solo lectura y exige `mailer_autoconfirm=false` exacto.
Un error, un campo ausente o el valor actual `true` detienen el proceso. Después
del cambio habrá que probar un alta y la confirmación real de extremo a extremo;
no se promete hoy que el correo de confirmación llegue.

## Rigor editorial y regulatorio

Una plataforma descartada necesita una fuente citable. Una aparición en un
registro oficial se describe con el alcance exacto de ese registro; no se
convierte en «aval», «aprobación» ni promesa de seguridad.

El registro ERIR de la CNMV consultado el 20 de agosto de 2026 recoge una
emisión de **REENTAL TOURIST HOMES, S.A.U.** y varias emisiones de sociedades
**HAUSERA PROPERTY MANAGER SPV**. La propia CNMV advierte que esa inscripción
no implica que haya validado las condiciones de la emisión ni la información
del emisor. Fuente: [registro ERIR de la CNMV](https://www.cnmv.es/portal/consultas/esi/erir_esi?lang=es&nif=A86796182).

Eso prueba el registro de esas emisiones concretas y de la entidad responsable
de su inscripción; **no prueba que la CNMV avale a Reental, Hausera, sus
plataformas o una inversión**.

## Responsabilidad y contacto

RWAdar está gestionado conjuntamente, sin sociedad constituida, por:

- Eric Almiñana
- Samuel Rodriguez
- Victor Jorques

Contacto: `RWAdar@protonmail.com`.

Los reportes de vulnerabilidades se coordinan de forma privada por ese correo;
consulta [SECURITY.md](SECURITY.md) para el alcance y las reglas de prueba.

El acuerdo entre los tres y los plazos de conservación propuestos siguen
pendientes de revisión y aprobación. Hasta entonces no deben presentarse como
acordados.

## No es asesoramiento financiero

RWAdar es un registro informativo independiente. La inclusión de una
plataforma o de una emisión no es una recomendación de inversión. Estar sujeto
a un registro o supervisión tampoco elimina el riesgo ni garantiza
rentabilidad, liquidez o recuperación del capital.
