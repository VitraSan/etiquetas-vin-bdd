'use strict';

const { normalizarVin, validarVin, fabricanteDoVin } = require('./vin');

const ETIQUETAS_POR_VEICULO = 4;
const ESTOQUE_MINIMO = 40; // 10 veículos
const LIMITE_REIMPRESSOES = 3;
const TAMANHO_MINIMO_MOTIVO = 10;

const TIPOS_ETIQUETA = ['VIDRO_DIANTEIRO', 'VIDRO_TRASEIRO', 'COLUNA_B', 'COMPARTIMENTO_MOTOR'];

// Cada fabricante tem um par de impressoras. Etiquetas 1 e 2 saem na primeira,
// 3 e 4 na segunda. A margem compensa a diferença física entre os modelos de impressora.
const IMPRESSORAS = {
  ALFA: { impressoras: ['IMP_ALFA_1', 'IMP_ALFA_2'], margem: 18 },
  BETA: { impressoras: ['IMP_BETA_1', 'IMP_BETA_2'], margem: 0 },
};

const PERFIS = ['OPERADOR', 'ADMIN', 'ESTOQUE'];

class ErroNegocio extends Error {
  constructor(codigo, mensagem, status) {
    super(mensagem);
    this.name = 'ErroNegocio';
    this.codigo = codigo;
    this.status = status;
  }
}

const erro = {
  vinInvalido: (motivo) => new ErroNegocio('VIN_INVALIDO', motivo, 400),
  naoAutenticado: () => new ErroNegocio('NAO_AUTENTICADO', 'Usuário não identificado', 401),
  semPermissao: (perfil) => new ErroNegocio('SEM_PERMISSAO', `Ação exige perfil ${perfil}`, 403),
  naoEncontrado: (vin) => new ErroNegocio('VEICULO_NAO_ENCONTRADO', `VIN ${vin} não encontrado no MES`, 404),
  jaImpresso: (vin) =>
    new ErroNegocio('JA_IMPRESSO', `VIN ${vin} já teve as etiquetas impressas. Use a reimpressão.`, 409),
  naoImpresso: (vin) => new ErroNegocio('NAO_IMPRESSO', `VIN ${vin} ainda não teve etiquetas impressas`, 409),
  estoqueInsuficiente: (saldo, necessario) =>
    new ErroNegocio('ESTOQUE_INSUFICIENTE', `Estoque insuficiente: saldo ${saldo}, necessário ${necessario}`, 409),
  limiteReimpressoes: () =>
    new ErroNegocio('LIMITE_REIMPRESSOES', `Limite de ${LIMITE_REIMPRESSOES} reimpressões por VIN atingido`, 409),
  motivoObrigatorio: () =>
    new ErroNegocio('MOTIVO_OBRIGATORIO', `Motivo obrigatório com pelo menos ${TAMANHO_MINIMO_MOTIVO} caracteres`, 400),
  dadoInvalido: (codigo, mensagem) => new ErroNegocio(codigo, mensagem, 400),
  duplicado: (vin) => new ErroNegocio('VEICULO_DUPLICADO', `VIN ${vin} já cadastrado`, 409),
};

const relogioDoSistema = { agora: () => new Date() };

class SistemaEtiquetas {
  constructor({ relogio = relogioDoSistema } = {}) {
    this.relogio = relogio;
    this.usuarios = new Map();
    this.veiculos = new Map();
    this.eventos = [];
    this.seq = 0;
    this.reset = { seq: 0, quantidade: 0, usuario: null, data: null };
  }

  // ---------- cadastros ----------

  cadastrarUsuario({ login, nome, perfil }) {
    if (!login || !PERFIS.includes(perfil)) {
      throw erro.dadoInvalido('USUARIO_INVALIDO', `Usuário inválido: perfil deve ser ${PERFIS.join(', ')}`);
    }
    const usuario = { login, nome: nome || login, perfil };
    this.usuarios.set(login, usuario);
    return usuario;
  }

  /** Simula o MES enviando um veículo produzido. */
  cadastrarVeiculo({ vin, modelo, anoModelo }) {
    const v = this._vinValido(vin);
    if (this.veiculos.has(v)) throw erro.duplicado(v);
    if (!modelo || typeof modelo !== 'string') throw erro.dadoInvalido('MODELO_INVALIDO', 'Modelo obrigatório');
    const anoAtual = this.relogio.agora().getFullYear();
    const ano = Number(anoModelo);
    if (!Number.isInteger(ano) || ano < 2000 || ano > anoAtual + 1) {
      throw erro.dadoInvalido('ANO_INVALIDO', `Ano modelo deve estar entre 2000 e ${anoAtual + 1}`);
    }
    const veiculo = {
      vin: v,
      modelo: modelo.trim(),
      anoModelo: ano,
      fabricante: fabricanteDoVin(v),
      status: 'PENDENTE',
      reimpressoes: 0,
    };
    this.veiculos.set(v, veiculo);
    return { ...veiculo };
  }

  // ---------- operações ----------

  imprimir({ vin, usuario }) {
    const user = this._autenticar(usuario);
    const veiculo = this._veiculo(vin);
    if (veiculo.status === 'IMPRESSO') throw erro.jaImpresso(veiculo.vin);
    this._garantirEstoque(ETIQUETAS_POR_VEICULO);

    const etiquetas = this._gerarEtiquetas(veiculo, [1, 2, 3, 4]);
    veiculo.status = 'IMPRESSO';
    const evento = this._registrar({
      tipo: 'IMPRESSAO',
      veiculo,
      usuario: user.login,
      quantidade: etiquetas.length,
    });
    return { vin: veiculo.vin, fabricante: veiculo.fabricante, status: veiculo.status, etiquetas, evento: evento.seq };
  }

  reimprimir({ vin, usuario, motivo, etiquetas: numeros = [1, 2, 3, 4] }) {
    const user = this._autenticar(usuario);
    if (user.perfil !== 'ADMIN') throw erro.semPermissao('ADMIN');
    this._validarMotivo(motivo);
    const veiculo = this._veiculo(vin);
    if (veiculo.status !== 'IMPRESSO') throw erro.naoImpresso(veiculo.vin);
    if (veiculo.reimpressoes >= LIMITE_REIMPRESSOES) throw erro.limiteReimpressoes();
    const lista = this._validarNumeros(numeros);
    this._garantirEstoque(lista.length);

    const etiquetas = this._gerarEtiquetas(veiculo, lista);
    veiculo.reimpressoes += 1;
    const evento = this._registrar({
      tipo: 'REIMPRESSAO',
      veiculo,
      usuario: user.login,
      quantidade: etiquetas.length,
      motivo: motivo.trim(),
    });
    return {
      vin: veiculo.vin,
      reimpressoes: veiculo.reimpressoes,
      restantes: LIMITE_REIMPRESSOES - veiculo.reimpressoes,
      etiquetas,
      evento: evento.seq,
    };
  }

  /** Libera o VIN para ser impresso de novo pelo fluxo normal (ex.: etiqueta danificada na linha). */
  liberar({ vin, usuario, motivo }) {
    const user = this._autenticar(usuario);
    if (user.perfil !== 'ESTOQUE') throw erro.semPermissao('ESTOQUE');
    this._validarMotivo(motivo);
    const veiculo = this._veiculo(vin);
    if (veiculo.status !== 'IMPRESSO') throw erro.naoImpresso(veiculo.vin);

    veiculo.status = 'LIBERADO';
    const evento = this._registrar({
      tipo: 'LIBERACAO',
      veiculo,
      usuario: user.login,
      quantidade: 0,
      motivo: motivo.trim(),
    });
    return { vin: veiculo.vin, status: veiculo.status, evento: evento.seq };
  }

  /** Contagem física: define o novo saldo inicial. O consumo passa a contar a partir daqui. */
  resetarEstoque({ quantidade, usuario }) {
    const user = this._autenticar(usuario);
    if (user.perfil !== 'ESTOQUE') throw erro.semPermissao('ESTOQUE');
    const qtd = Number(quantidade);
    if (!Number.isInteger(qtd) || qtd < 0) {
      throw erro.dadoInvalido('QUANTIDADE_INVALIDA', 'Quantidade deve ser um inteiro maior ou igual a zero');
    }
    this.seq += 1;
    this.reset = { seq: this.seq, quantidade: qtd, usuario: user.login, data: this.relogio.agora().toISOString() };
    return this.estoque();
  }

  // ---------- consultas ----------

  estoque() {
    const consumoPorFabricante = { ALFA: 0, BETA: 0 };
    for (const e of this.eventos) {
      if (e.seq > this.reset.seq && e.quantidade > 0) consumoPorFabricante[e.fabricante] += e.quantidade;
    }
    const consumido = consumoPorFabricante.ALFA + consumoPorFabricante.BETA;
    const saldo = this.reset.quantidade - consumido;
    return {
      saldoInicial: this.reset.quantidade,
      consumido,
      saldo,
      minimo: ESTOQUE_MINIMO,
      alerta: saldo < ESTOQUE_MINIMO,
      veiculosRestantes: Math.floor(saldo / ETIQUETAS_POR_VEICULO),
      consumoPorFabricante,
      ultimoReset: this.reset.usuario ? { data: this.reset.data, usuario: this.reset.usuario } : null,
    };
  }

  consultarVeiculo(vin) {
    return { ...this._veiculo(vin) };
  }

  historico(vin) {
    const veiculo = this._veiculo(vin);
    return this.eventos.filter((e) => e.vin === veiculo.vin).map((e) => ({ ...e }));
  }

  // ---------- internos ----------

  _vinValido(vin) {
    const r = validarVin(vin);
    if (!r.valido) throw erro.vinInvalido(r.motivo);
    return r.vin;
  }

  _veiculo(vin) {
    const v = this._vinValido(vin);
    const veiculo = this.veiculos.get(v);
    if (!veiculo) throw erro.naoEncontrado(normalizarVin(vin));
    return veiculo;
  }

  _autenticar(login) {
    const user = login ? this.usuarios.get(login) : undefined;
    if (!user) throw erro.naoAutenticado();
    return user;
  }

  _validarMotivo(motivo) {
    if (typeof motivo !== 'string' || motivo.trim().length < TAMANHO_MINIMO_MOTIVO) throw erro.motivoObrigatorio();
  }

  _validarNumeros(numeros) {
    if (!Array.isArray(numeros) || numeros.length === 0) {
      throw erro.dadoInvalido('ETIQUETAS_INVALIDAS', 'Informe ao menos uma etiqueta (1 a 4)');
    }
    const lista = numeros.map(Number);
    const unicos = new Set(lista);
    if (unicos.size !== lista.length || lista.some((n) => !Number.isInteger(n) || n < 1 || n > 4)) {
      throw erro.dadoInvalido('ETIQUETAS_INVALIDAS', 'Etiquetas devem ser números de 1 a 4, sem repetição');
    }
    return [...unicos].sort((a, b) => a - b);
  }

  _garantirEstoque(necessario) {
    const { saldo } = this.estoque();
    if (saldo < necessario) throw erro.estoqueInsuficiente(saldo, necessario);
  }

  _gerarEtiquetas(veiculo, numeros) {
    const cfg = IMPRESSORAS[veiculo.fabricante];
    return numeros.map((n) => ({
      numero: n,
      tipo: TIPOS_ETIQUETA[n - 1],
      impressora: cfg.impressoras[n <= 2 ? 0 : 1],
      margem: cfg.margem,
      conteudo: { vin: veiculo.vin, modelo: veiculo.modelo, anoModelo: veiculo.anoModelo },
    }));
  }

  _registrar({ tipo, veiculo, usuario, quantidade, motivo = null }) {
    this.seq += 1;
    const evento = {
      seq: this.seq,
      tipo,
      vin: veiculo.vin,
      fabricante: veiculo.fabricante,
      usuario,
      quantidade,
      motivo,
      data: this.relogio.agora().toISOString(),
    };
    this.eventos.push(evento);
    return evento;
  }
}

module.exports = {
  SistemaEtiquetas,
  ErroNegocio,
  ETIQUETAS_POR_VEICULO,
  ESTOQUE_MINIMO,
  LIMITE_REIMPRESSOES,
  TIPOS_ETIQUETA,
  IMPRESSORAS,
};
