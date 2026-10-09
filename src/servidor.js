'use strict';

const { criarApp } = require('./app');
const { SistemaEtiquetas } = require('./sistema');

// Dados fictícios para explorar a API localmente.
const sistema = new SistemaEtiquetas();
sistema.cadastrarUsuario({ login: 'operador', nome: 'Operador da Linha', perfil: 'OPERADOR' });
sistema.cadastrarUsuario({ login: 'admin', nome: 'Supervisor', perfil: 'ADMIN' });
sistema.cadastrarUsuario({ login: 'estoque', nome: 'Almoxarifado', perfil: 'ESTOQUE' });
sistema.resetarEstoque({ quantidade: 400, usuario: 'estoque' });
sistema.cadastrarVeiculo({ vin: '9ZZBA11A0T0000001', modelo: 'SUV-M', anoModelo: 2026 });
sistema.cadastrarVeiculo({ vin: '9ZZCB22B0T0000002', modelo: 'SEDAN-C', anoModelo: 2026 });

const porta = Number(process.env.PORT) || 3000;
criarApp(sistema).listen(porta, () => console.log(`API de etiquetas em http://localhost:${porta}`));
