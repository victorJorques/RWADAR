// Arneses del service worker para probar-web.mjs (extraídos por responsabilidad,
// 04/11/2026, para que probar-web.mjs no pase de su presupuesto de 5S).
// Ejecutan sw.js y el registro de la página en un contexto aislado, sin red.
import vm from 'node:vm';

async function pruebaActivacionCache(codigo) {
  const escuchas = {};
  const version = (codigo.match(/const VERSION\s*=\s*'([^']+)'/) || [])[1];
  const borradas = [];
  const navegadas = [];
  const consultas = [];
  let reclamos = 0;
  const clienteAnterior = {
    id:'documento-antiguo', url:'https://rwadar.example/',
    async navigate(url){ navegadas.push(url); },
  };
  const contexto = {
    self: {
      location:{ origin:'https://rwadar.example' },
      clients:{
        async claim(){ reclamos++; },
        async matchAll(opciones){ consultas.push(opciones); return [clienteAnterior]; },
      },
      addEventListener(tipo, fn){ escuchas[tipo] = fn; },
      async skipWaiting(){},
    },
    caches: {
      async open(){ return { async addAll(){}, async match(){}, async put(){} }; },
      async keys(){ return [version, 'rwadar-v-antigua', 'otra-cache-antigua']; },
      async delete(nombre){ borradas.push(nombre); return true; },
    },
    URL, Response, fetch, Set,
    setTimeout(fn){ fn(); },
  };
  vm.createContext(contexto);
  vm.runInContext(codigo, contexto);
  let activacion;
  escuchas.activate({ waitUntil(promesa){ activacion = promesa; } });
  await activacion;
  return version && reclamos === 1 && !borradas.includes(version) &&
    borradas.length === 2 && borradas.includes('rwadar-v-antigua') && borradas.includes('otra-cache-antigua') &&
    consultas.length === 2 && consultas.every(x => x.type === 'window' && x.includeUncontrolled === true) &&
    navegadas.length === 1 && navegadas[0] === clienteAnterior.url;
}

async function pruebaActivacionSinMigracion(codigo, clienteYaRecargado) {
  const escuchas = {};
  const version = (codigo.match(/const VERSION\s*=\s*'([^']+)'/) || [])[1];
  let consultas = 0;
  let navegaciones = 0;
  const contexto = {
    self: {
      location:{ origin:'https://rwadar.example' },
      clients:{
        async claim(){},
        async matchAll(){
          consultas++;
          const id = clienteYaRecargado && consultas > 1 ? 'documento-nuevo' : 'documento-antiguo';
          return [{ id, url:'https://rwadar.example/', async navigate(){ navegaciones++; } }];
        },
      },
      addEventListener(tipo, fn){ escuchas[tipo] = fn; },
      async skipWaiting(){},
    },
    caches: {
      async open(){ return { async addAll(){}, async match(){}, async put(){} }; },
      async keys(){ return clienteYaRecargado ? [version, 'rwadar-v-anterior'] : [version, 'otra-cache']; },
      async delete(){ return true; },
    },
    URL, Response, fetch, Set,
    setTimeout(fn){ fn(); },
  };
  vm.createContext(contexto);
  vm.runInContext(codigo, contexto);
  let activacion;
  escuchas.activate({ waitUntil(promesa){ activacion = promesa; } });
  await activacion;
  return { consultas, navegaciones };
}

async function pruebaRedConCacheRota(codigo) {
  const escuchas = {};
  const respuestasRed = new Map();
  let escrituras = 0;
  const contexto = {
    self: {
      location:{ origin:'https://rwadar.example' },
      clients:{ async claim(){} },
      addEventListener(tipo, fn){ escuchas[tipo] = fn; },
      async skipWaiting(){},
    },
    caches: {
      async open(){ return {
        async addAll(){}, async match(){ return null; },
        async put(){ escrituras++; throw new Error('cuota de caché agotada'); },
      }; },
      async keys(){ return []; }, async delete(){ return true; },
    },
    async fetch(peticion){ return respuestasRed.get(peticion.url); },
    URL, Response,
  };
  vm.createContext(contexto);
  vm.runInContext(codigo, contexto);
  try {
    for (const peticion of [
      { method:'GET', mode:'navigate', url:'https://rwadar.example/radar' },
      { method:'GET', mode:'same-origin', url:'https://rwadar.example/assets/interfaz.css' },
    ]) {
      const recibida = { status:200, type:'basic', clone(){ return this; } };
      respuestasRed.set(peticion.url, recibida);
      let respuesta;
      escuchas.fetch({ request:peticion, respondWith(promesa){ respuesta = promesa; } });
      if (await respuesta !== recibida) return false;
    }
    return escrituras === 2;
  }
  catch { return false; }
}

async function pruebaActualizacionPWACliente(codigo, controlada) {
  const marca = '/* El trabajador solo se registra en HTTP(S)';
  const inicio = codigo.indexOf(marca);
  if (inicio < 0) throw new Error('no se encuentra el registro del service worker');
  const bloque = codigo.slice(inicio);
  const escuchasVentana = {};
  const escuchasDocumento = {};
  const escuchasTrabajador = {};
  let recargas = 0;
  let actualizaciones = 0;
  let registro = null;
  const registroSW = {
    async update(){ actualizaciones++; },
  };
  const contexto = {
    navigator: {
      serviceWorker: {
        controller: controlada ? {} : null,
        addEventListener(tipo, fn){ escuchasTrabajador[tipo] = fn; },
        async register(ruta, opciones){ registro = { ruta, opciones }; return registroSW; },
      },
    },
    location: { protocol:'https:', reload(){ recargas++; } },
    window: { addEventListener(tipo, fn){ escuchasVentana[tipo] = fn; } },
    document: {
      visibilityState:'visible',
      addEventListener(tipo, fn){ escuchasDocumento[tipo] = fn; },
    },
  };
  vm.createContext(contexto);
  vm.runInContext(bloque, contexto);
  await escuchasVentana.load();
  escuchasVentana.pageshow({ persisted:true });
  escuchasDocumento.visibilitychange();
  escuchasTrabajador.controllerchange();
  escuchasTrabajador.controllerchange();
  await Promise.resolve();
  return {
    registro,
    actualizaciones,
    recargas,
    escuchaCambio:typeof escuchasTrabajador.controllerchange === 'function',
  };
}

export { pruebaActivacionCache, pruebaActivacionSinMigracion, pruebaRedConCacheRota, pruebaActualizacionPWACliente };
