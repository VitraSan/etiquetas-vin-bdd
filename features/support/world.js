'use strict';

const { setWorldConstructor, World, setDefaultTimeout } = require('@cucumber/cucumber');
const assert = require('node:assert/strict');
const { SistemaEtiquetas } = require('../../src/sistema');
const { DriverDominio, DriverApi } = require('./drivers');

setDefaultTimeout(10_000);

// Relógio controlado pelos cenários: nenhuma regra depende da hora real da máquina.
class RelogioFalso {
  constructor(iso) {
    this.atual = new Date(iso);
  }
  agora() {
    return new Date(this.atual);
  }
  definir(iso) {
    this.atual = new Date(iso);
  }
}

class MundoEtiquetas extends World {
  constructor(opcoes) {
    super(opcoes);
    this.relogio = new RelogioFalso('2026-10-09T11:00:00.000Z');
    this.sistema = new SistemaEtiquetas({ relogio: this.relogio });
    const Driver = this.parameters.driver === 'api' ? DriverApi : DriverDominio;
    this.driver = new Driver(this.sistema);
    this.resposta = null;
  }

  /** Passos de preparação (Dado) não podem falhar em silêncio. */
  async preparar(promessa, descricao) {
    const r = await promessa;
    assert.ok(r.status < 300, `Falha ao preparar "${descricao}": ${r.status} ${JSON.stringify(r.body)}`);
    return r;
  }
}

setWorldConstructor(MundoEtiquetas);
