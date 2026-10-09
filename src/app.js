'use strict';

const express = require('express');
const { ErroNegocio } = require('./sistema');

/**
 * API HTTP sobre o SistemaEtiquetas.
 * O usuário é identificado pelo header x-usuario (login), como faria um proxy de SSO.
 */
function criarApp(sistema) {
  const app = express();
  app.use(express.json());

  const usuario = (req) => req.get('x-usuario');
  const rota = (fn, status = 200) => (req, res, next) => {
    try {
      res.status(status).json(fn(req));
    } catch (e) {
      next(e);
    }
  };

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  // Entrada do MES
  app.post('/api/veiculos', rota((req) => sistema.cadastrarVeiculo(req.body || {}), 201));
  app.get('/api/veiculos/:vin', rota((req) => sistema.consultarVeiculo(req.params.vin)));
  app.get('/api/veiculos/:vin/historico', rota((req) => sistema.historico(req.params.vin)));

  // Operações
  app.post('/api/impressoes', rota((req) => sistema.imprimir({ ...req.body, usuario: usuario(req) }), 201));
  app.post('/api/reimpressoes', rota((req) => sistema.reimprimir({ ...req.body, usuario: usuario(req) }), 201));
  app.post('/api/liberacoes', rota((req) => sistema.liberar({ ...req.body, usuario: usuario(req) }), 201));

  // Estoque
  app.get('/api/estoque', rota(() => sistema.estoque()));
  app.post('/api/estoque/reset', rota((req) => sistema.resetarEstoque({ ...req.body, usuario: usuario(req) })));

  app.use((req, res) => res.status(404).json({ codigo: 'ROTA_NAO_ENCONTRADA', mensagem: 'Rota não encontrada' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof ErroNegocio) return res.status(err.status).json({ codigo: err.codigo, mensagem: err.message });
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ codigo: 'JSON_INVALIDO', mensagem: 'Corpo da requisição não é um JSON válido' });
    }
    return res.status(500).json({ codigo: 'ERRO_INTERNO', mensagem: 'Erro interno' });
  });

  return app;
}

module.exports = { criarApp };
