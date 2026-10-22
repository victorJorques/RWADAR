'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {resumenOferta} = require('../lib/ficha-editorial');
const AHORA = new Date('2026-10-22T12:00:00Z');
const URL_FUENTE = 'https://proveedor.example/documento';
const referencia = (etiqueta,valor,fechaConsulta='2026-10-21',extras={}) =>
  ({etiqueta,valor,fechaConsulta,fuente:URL_FUENTE,fechaDato:null,...extras});
const oferta = (referencias=[],extras={}) => ({slug:'referencia',verificadaEl:'2026-10-21',vigenciaDias:7,
  estadoRevision:'actual',coleccion:'principales',disponibleEs:null,
  documentacion:{revisadaEl:'2026-10-22',fuentes:[URL_FUENTE],referencias},...extras});

test('la última referencia de mínimo se selecciona por fecha real, sin depender del orden del array', () => {
  const refs = [referencia('Entrada mínima','99 EUR','2026-09-27'),
    referencia('Precio por token','8 EUR','2026-10-22'),
    referencia('Entrada mínima','1.000,50 EUR','2026-10-21')];
  for(const r of [refs,[...refs].reverse()]) {
    const s = resumenOferta(oferta(r),[],AHORA);
    assert.equal(s.minimo.euros,1000.5);
    assert.equal(s.minimo.consultadaEl,'2026-10-21');
    assert.equal(s.minimo.fuente,URL_FUENTE);
    assert.equal(s.fechas.revisadaEl,'2026-10-22');
    assert.equal(s.fechas.comprobadaEl,'2026-10-22');
  }
});

test('precio unitario, valor liquidativo y cifras sin fuente no se convierten en entrada mínima', () => {
  for(const ref of [referencia('Precio por participación','1 EUR'),
    referencia('Valor liquidativo mínimo observado','2 EUR'),
    referencia('Entrada mínima','1 EUR','2026-10-21',{fuente:'javascript:alert(1)'}),
    referencia('Entrada mínima','1 EUR','2026-10-21',{fuente:'https://secreto@proveedor.example'}),
    referencia('Entrada mínima','1 EUR','2026-10-21',{fuente:'https://otra.example/no-citada'})]) {
    assert.equal(resumenOferta(oferta([ref]),[],AHORA).minimo.euros,undefined);
  }
});

test('gramos y otras monedas conservan su unidad documental sin fabricar euros', () => {
  for(const valor of ['1 gramo','1.000 USD','5 CHF']) {
    const s = resumenOferta(oferta([referencia('Compra mínima',valor)]),[],AHORA);
    assert.equal(s.minimo.euros,undefined);
    assert.equal(s.minimo.unidadDocumentada,valor);
    assert.match(s.minimo.texto,/No documentado en euros/);
  }
});

test('las tres fechas se separan y se rechazan fechas imposibles o futuras', () => {
  const s = resumenOferta(oferta([
    referencia('Entrada mínima','100 EUR','2026-02-30'),
    referencia('Entrada mínima','300 EUR','2026-10-23'),
    referencia('Entrada mínima','4 EUR','2026-10-20',{fechaDato:'2026-10-19'})]),[],AHORA);
  assert.equal(s.minimo.euros,4);
  assert.deepEqual(s.fechas,{revisadaEl:'2026-10-22',comprobadaEl:'2026-10-20',fechaDato:'2026-10-19'});
  for (const fechaDato of ['2026-10-22','2026-02-30','']) {
    const invalida = oferta([referencia('Entrada mínima','100 EUR','2026-10-21',{fechaDato})]);
    assert.equal(resumenOferta(invalida,[],AHORA).minimo.euros,undefined);
  }
});

test('el país del activo y un booleano sin referencia de acceso España no confirman elegibilidad', () => {
  for(const disponibleEs of [true,false,null]) {
    const s = resumenOferta(oferta([referencia('País del inmueble','España')],{pais:'España',eu:true,disponibleEs}),[],AHORA);
    assert.equal(s.accesoEspana.estado,'sin_comprobar');
  }
  const ref = referencia('Disponibilidad desde España','Sí');
  assert.equal(resumenOferta(oferta([ref],{disponibleEs:true}),[],AHORA).accesoEspana.estado,'si');
  assert.equal(resumenOferta(oferta([{...ref,valor:'No disponible'}],{disponibleEs:false}),[],AHORA).accesoEspana.estado,'no');
  assert.equal(resumenOferta(oferta([{...ref,valor:'No acredita acceso desde España'}],{disponibleEs:true}),[],AHORA).accesoEspana.estado,'sin_comprobar');
});

test('una ficha que vence ya abierta oculta mínimos, costes y elegibilidad sin borrar la documentación', () => {
  const o = oferta([referencia('Entrada mínima','100 EUR'),referencia('Comisión','0,25 %'),
    referencia('Reembolso','2 días'),referencia('Acceso desde España','Sí')],{disponibleEs:true,vigenciaDias:1});
  const antes = structuredClone(o);
  const s = resumenOferta(o,[],new Date('2026-10-23T00:00:00Z'));
  assert.equal(s.vencida,true);
  assert.equal(s.minimo.euros,undefined);
  assert.equal(s.accesoEspana.estado,'sin_comprobar');
  assert.doesNotMatch(s.costes.texto,/0,25/);
  assert.doesNotMatch(s.salida.texto,/2 días/);
  assert.deepEqual(o,antes);
  assert.equal(s.fechas.comprobadaEl,'2026-10-21');
});

test('apertura no comprobada no hereda importes vigentes de referencias documentales', () => {
  const s = resumenOferta(oferta([referencia('Entrada mínima','2000 EUR')],{estadoRevision:'no_verificable'}),[],AHORA);
  assert.equal(s.cifrasVigentes,false);
  assert.equal(s.minimo.euros,undefined);
  assert.match(s.estado.texto,/No se pudo confirmar/);
});

test('el plazo de una emisión no se presenta como salida o devolución', () => {
  const s = resumenOferta(oferta([referencia('Plazo de la emisión','hasta el 31/10')]),[],AHORA);
  assert.equal(s.salida.texto,'Salida no documentada');
  const r = resumenOferta(oferta([referencia('Plazo de devolución','12 meses')]),[],AHORA);
  assert.equal(r.salida.texto,'Plazo de devolución: 12 meses');
});

test('reventa documental depende de compradores y nunca promete liquidez inmediata', () => {
  const s = resumenOferta(oferta([referencia('Mercado','Reventa entre inversores')],{coleccion:'secundario'}),[],AHORA);
  assert.match(s.salida.texto,/depende de que haya compradores/);
  assert.equal(s.minimo.euros,undefined);
  assert.equal(resumenOferta(oferta([],{coleccion:'secundario'}),[],AHORA).salida.texto,'Salida no documentada');
});

test('éxito 0 % nunca oculta gestión 0,6 % y cada coste conserva su fecha y fuente sin sumar',()=>{
  const refs=[referencia('Comisión de éxito · 22/10/2026','0 %','2026-10-22'),
    referencia('Comisión publicada · Gestión','0,60 % anual sobre AUM','2026-10-20'),
    referencia('Comisión de gestión · 22/10/2026','0,6 % anual sobre AUM','2026-10-22')];
  const s=resumenOferta(oferta(refs),[],AHORA);
  assert.match(s.costes.texto,/Comisión de éxito: 0 %/);
  assert.match(s.costes.texto,/Comisión de gestión: 0,6 % anual sobre AUM/);
  assert.doesNotMatch(s.costes.texto,/total|0,60 %/);
  assert.equal(s.costes.referencias.length,2);
  assert.ok(s.costes.referencias.every(r=>r.fechaConsulta==='2026-10-22' && r.fuente===URL_FUENTE));
  assert.equal(s.costes.fuente,URL_FUENTE);
  const otra=referencia('Comisión de custodia','1 EUR','2026-10-21',{fuente:'https://otra.example/custodia'});
  const o=oferta([...refs,otra]);o.documentacion.fuentes.push(otra.fuente);
  const mezcla=resumenOferta(o,[],AHORA).costes;
  assert.equal(mezcla.referencias.length,3);
  assert.equal(mezcla.fuente,undefined,'no atribuye tres conceptos de dos fuentes a una sola URL');
  assert.equal(mezcla.consultadaEl,undefined,'la consulta más reciente no rejuvenece las otras');
  assert.equal(mezcla.referencias.find(r=>r.etiqueta==='Comisión de custodia').fechaConsulta,'2026-10-21');
});

test('el mismo helper funciona en navegador sin imports, Node ni acceso de red', () => {
  const contexto = {URL,Intl,Date};
  vm.createContext(contexto);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../lib/ficha-editorial.js'),'utf8'),contexto);
  assert.equal(typeof contexto.RWAdarFichaEditorial.resumenOferta,'function');
  const o = oferta([referencia('Suscripción inicial mínima','1 EUR')]);
  assert.deepEqual(JSON.parse(JSON.stringify(contexto.RWAdarFichaEditorial.resumenOferta(o,[],AHORA))),resumenOferta(o,[],AHORA));
});
