'use strict';

const request = require('supertest');
const { criarApp } = require('../../src/app');
const { ErroNegocio } = require('../../src/sistema');

/**
 * Os passos falam só com um "driver". Cada driver devolve { status, body } no mesmo formato,
 * então um cenário não sabe (nem precisa saber) se está testando o domínio ou a API.
 */
class DriverDominio {
  constructor(sistema) {
    this.sistema = sistema;
    this.nome = 'dominio';
  }

  _executar(fn, statusSucesso = 200) {
    try {
      return { status: statusSucesso, body: JSON.parse(JSON.stringify(fn())) };
    } catch (e) {
      if (e instanceof ErroNegocio) return { status: e.status, body: { codigo: e.codigo, mensagem: e.message } };
      throw e;
    }
  }

  cadastrarVeiculo(dados) {
    return this._executar(() => this.sistema.cadastrarVeiculo(dados), 201);
  }
  consultarVeiculo(vin) {
    return this._executar(() => this.sistema.consultarVeiculo(vin));
  }
  historico(vin) {
    return this._executar(() => this.sistema.historico(vin));
  }
  imprimir(vin, usuario) {
    return this._executar(() => this.sistema.imprimir({ vin, usuario }), 201);
  }
  reimprimir(vin, usuario, dados) {
    return this._executar(() => this.sistema.reimprimir({ vin, usuario, ...dados }), 201);
  }
  liberar(vin, usuario, motivo) {
    return this._executar(() => this.sistema.liberar({ vin, usuario, motivo }), 201);
  }
  resetarEstoque(quantidade, usuario) {
    return this._executar(() => this.sistema.resetarEstoque({ quantidade, usuario }));
  }
  estoque() {
    return this._executar(() => this.sistema.estoque());
  }
}

class DriverApi {
  constructor(sistema) {
    this.http = request(criarApp(sistema));
    this.nome = 'api';
  }

  async _req(metodo, url, { usuario, body } = {}) {
    let r = this.http[metodo](url);
    if (usuario) r = r.set('x-usuario', usuario);
    if (body !== undefined) r = r.send(body);
    const res = await r;
    if (!/application\/json/.test(res.headers['content-type'] || '')) {
      throw new Error(`Resposta sem JSON em ${metodo.toUpperCase()} ${url}: ${res.headers['content-type']}`);
    }
    return { status: res.status, body: res.body };
  }

  _url(vin) {
    // VIN vazio vira um segmento que a API ainda reconhece como VIN (e recusa como inválido)
    return encodeURIComponent(vin === '' ? ' ' : vin);
  }

  cadastrarVeiculo(dados) {
    return this._req('post', '/api/veiculos', { body: dados });
  }
  consultarVeiculo(vin) {
    return this._req('get', `/api/veiculos/${this._url(vin)}`);
  }
  historico(vin) {
    return this._req('get', `/api/veiculos/${this._url(vin)}/historico`);
  }
  imprimir(vin, usuario) {
    return this._req('post', '/api/impressoes', { usuario, body: { vin } });
  }
  reimprimir(vin, usuario, dados) {
    return this._req('post', '/api/reimpressoes', { usuario, body: { vin, ...dados } });
  }
  liberar(vin, usuario, motivo) {
    return this._req('post', '/api/liberacoes', { usuario, body: { vin, motivo } });
  }
  resetarEstoque(quantidade, usuario) {
    return this._req('post', '/api/estoque/reset', { usuario, body: { quantidade } });
  }
  estoque() {
    return this._req('get', '/api/estoque');
  }
}

module.exports = { DriverDominio, DriverApi };
