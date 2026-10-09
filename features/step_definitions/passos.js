'use strict';

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('node:assert/strict');

const MOTIVO_PADRAO = 'Preparação do cenário de teste';

const listaEtiquetas = (texto) =>
  texto.trim() === '' ? [] : texto.split(',').map((n) => Number(n.trim()));

// ---------------------------------------------------------------- Dado (preparação)

Given('os usuários cadastrados:', function (tabela) {
  for (const { login, perfil } of tabela.hashes()) this.sistema.cadastrarUsuario({ login, perfil });
});

Given('que hoje é {string}', function (data) {
  this.relogio.definir(`${data}T11:00:00.000Z`);
});

Given('que o estoque foi contado com {int} etiquetas', function (quantidade) {
  return this.preparar(this.driver.resetarEstoque(quantidade, 'estoque'), `contagem de ${quantidade}`);
});

Given('que o MES enviou os veículos:', async function (tabela) {
  for (const { vin, modelo, ano } of tabela.hashes()) {
    await this.preparar(this.driver.cadastrarVeiculo({ vin, modelo, anoModelo: Number(ano) }), `veículo ${vin}`);
  }
});

Given('que o MES enviou o veículo {string} modelo {string} ano {int}', function (vin, modelo, ano) {
  return this.preparar(this.driver.cadastrarVeiculo({ vin, modelo, anoModelo: ano }), `veículo ${vin}`);
});

Given('que o VIN {string} já teve as etiquetas impressas', function (vin) {
  return this.preparar(this.driver.imprimir(vin, 'operador'), `impressão de ${vin}`);
});

Given('que os VINs já tiveram as etiquetas impressas:', async function (tabela) {
  for (const { vin } of tabela.hashes()) {
    await this.preparar(this.driver.imprimir(vin, 'operador'), `impressão de ${vin}`);
  }
});

Given('que o VIN {string} já foi reimpresso {int} vezes', async function (vin, vezes) {
  for (let i = 1; i <= vezes; i++) {
    await this.preparar(this.driver.reimprimir(vin, 'admin', { motivo: `${MOTIVO_PADRAO} ${i}` }), `reimpressão ${i}`);
  }
});

Given('que o usuário {string} reimprimiu as etiquetas {string} do VIN {string}', function (usuario, etiquetas, vin) {
  return this.preparar(
    this.driver.reimprimir(vin, usuario, { motivo: MOTIVO_PADRAO, etiquetas: listaEtiquetas(etiquetas) }),
    `reimpressão de ${vin}`
  );
});

Given('que o VIN {string} foi liberado', function (vin) {
  return this.preparar(this.driver.liberar(vin, 'estoque', MOTIVO_PADRAO), `liberação de ${vin}`);
});

// ---------------------------------------------------------------- Quando (ação)

When('o MES enviar o veículo {string} modelo {string} ano {int}', async function (vin, modelo, ano) {
  this.resposta = await this.driver.cadastrarVeiculo({ vin, modelo, anoModelo: ano });
});

When('o usuário {string} imprimir as etiquetas do VIN {string}', async function (usuario, vin) {
  this.resposta = await this.driver.imprimir(vin, usuario);
});

When(
  'o usuário {string} imprimir as etiquetas do VIN {string} com {int} espaços à direita',
  async function (usuario, vin, espacos) {
    this.resposta = await this.driver.imprimir(vin + ' '.repeat(espacos), usuario);
  }
);

When('um usuário não identificado imprimir as etiquetas do VIN {string}', async function (vin) {
  this.resposta = await this.driver.imprimir(vin, undefined);
});

When('o usuário {string} reimprimir o VIN {string} com o motivo {string}', async function (usuario, vin, motivo) {
  this.resposta = await this.driver.reimprimir(vin, usuario, { motivo });
});

When(
  'o usuário {string} reimprimir as etiquetas {string} do VIN {string} com o motivo {string}',
  async function (usuario, etiquetas, vin, motivo) {
    this.resposta = await this.driver.reimprimir(vin, usuario, { motivo, etiquetas: listaEtiquetas(etiquetas) });
  }
);

When('o usuário {string} liberar o VIN {string} com o motivo {string}', async function (usuario, vin, motivo) {
  this.resposta = await this.driver.liberar(vin, usuario, motivo);
});

When('o usuário {string} registrar uma contagem de {float} etiquetas', async function (usuario, quantidade) {
  this.resposta = await this.driver.resetarEstoque(quantidade, usuario);
});

When('eu consultar o estoque', async function () {
  this.resposta = await this.driver.estoque();
});

// ---------------------------------------------------------------- Então (verificação)

Then('a operação é aceita', function () {
  const { status, body } = this.resposta;
  assert.ok(status >= 200 && status < 300, `Esperava sucesso, veio ${status}: ${JSON.stringify(body)}`);
});

Then('a operação é recusada com o código {string}', function (codigo) {
  const { status, body } = this.resposta;
  assert.ok(status >= 400, `Esperava recusa ${codigo}, mas a operação foi aceita (${status})`);
  assert.equal(body.codigo, codigo, `Código de erro: ${JSON.stringify(body)}`);
});

Then('a mensagem contém {string}', function (trecho) {
  assert.match(this.resposta.body.mensagem, new RegExp(trecho.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

Then('são geradas as etiquetas:', function (tabela) {
  const esperado = tabela.hashes().map((l) => ({ numero: Number(l.numero), tipo: l.tipo, impressora: l.impressora }));
  const obtido = this.resposta.body.etiquetas.map(({ numero, tipo, impressora }) => ({ numero, tipo, impressora }));
  assert.deepEqual(obtido, esperado);
});

Then('são reimpressas {int} etiquetas', function (quantidade) {
  assert.equal(this.resposta.body.etiquetas.length, quantidade);
});

Then(
  'as etiquetas saem nas impressoras {string} e {string} com margem de {int} px',
  function (impressora1, impressora2, margem) {
    const etiquetas = this.resposta.body.etiquetas;
    assert.deepEqual(
      etiquetas.map((e) => e.impressora),
      [impressora1, impressora1, impressora2, impressora2]
    );
    assert.ok(etiquetas.every((e) => e.margem === margem), `Margens: ${etiquetas.map((e) => e.margem)}`);
  }
);

Then('o VIN {string} fica com status {string}', async function (vin, status) {
  const r = await this.driver.consultarVeiculo(vin);
  assert.equal(r.status, 200);
  assert.equal(r.body.status, status);
});

Then('o VIN {string} é do fabricante {string}', async function (vin, fabricante) {
  const r = await this.driver.consultarVeiculo(vin);
  assert.equal(r.body.fabricante, fabricante);
});

Then('o saldo do estoque é de {int} etiquetas', async function (saldo) {
  const r = await this.driver.estoque();
  assert.equal(r.body.saldo, saldo);
});

Then('o histórico do VIN {string} registra:', async function (vin, tabela) {
  const r = await this.driver.historico(vin);
  assert.equal(r.status, 200);
  const obtido = r.body.map((e) => ({
    tipo: e.tipo,
    usuario: e.usuario,
    quantidade: String(e.quantidade),
    motivo: e.motivo || '',
  }));
  assert.deepEqual(obtido, tabela.hashes());
});

const CAMPOS_ESTOQUE = {
  'saldo inicial': (e) => e.saldoInicial,
  consumido: (e) => e.consumido,
  saldo: (e) => e.saldo,
  'veículos restantes': (e) => e.veiculosRestantes,
  'consumo ALFA': (e) => e.consumoPorFabricante.ALFA,
  'consumo BETA': (e) => e.consumoPorFabricante.BETA,
};

Then('o estoque mostra:', async function (tabela) {
  const estoque = (await this.driver.estoque()).body;
  for (const [campo, valor] of Object.entries(tabela.rowsHash())) {
    const ler = CAMPOS_ESTOQUE[campo];
    assert.ok(ler, `Campo de estoque desconhecido no cenário: "${campo}"`);
    assert.equal(ler(estoque), Number(valor), `Campo "${campo}"`);
  }
});

Then('o alerta de estoque baixo está {word}', async function (estado) {
  assert.ok(['ativo', 'inativo'].includes(estado), `Estado deve ser ativo ou inativo, veio "${estado}"`);
  const estoque = (await this.driver.estoque()).body;
  assert.equal(estoque.alerta, estado === 'ativo', `Saldo ${estoque.saldo}, mínimo ${estoque.minimo}`);
});

Then('a última contagem foi feita por {string} em {string}', async function (usuario, data) {
  const { ultimoReset } = (await this.driver.estoque()).body;
  assert.equal(ultimoReset.usuario, usuario);
  assert.equal(ultimoReset.data.slice(0, 10), data);
});
