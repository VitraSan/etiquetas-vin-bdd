# Etiquetas VIN · BDD com Gherkin

[![BDD](https://github.com/VitraSan/etiquetas-vin-bdd/actions/workflows/bdd.yml/badge.svg)](https://github.com/VitraSan/etiquetas-vin-bdd/actions/workflows/bdd.yml)

Sistema de impressão de etiquetas veiculares por VIN especificado com **BDD**: as regras de negócio estão escritas em **Gherkin em português** e são executadas com **Cucumber**.

O diferencial é que **os mesmos 55 cenários rodam em duas camadas**:

| Camada | O que os passos fazem | Comando |
|---|---|---|
| `dominio` | chamam as regras de negócio direto, em memória | `npm run bdd` |
| `api` | fazem requisições HTTP reais na API Express | `npm run bdd:api` |

Os cenários não sabem qual camada estão testando: os passos falam com um *driver* (`features/support/drivers.js`) e cada driver devolve `{ status, body }` no mesmo formato. Se a regra estiver certa no domínio e a API devolver o status errado ou esquecer um campo, só o modo `api` quebra.

> **Origem:** inspirado em um sistema real de etiquetas autodestrutivas que mantenho no trabalho, originalmente em ColdFusion com Oracle. Aqui ele foi reescrito do zero em Node.js, com fabricantes, impressoras e dados fictícios, sem nenhum código ou informação da empresa.

## Exemplo de cenário

```gherkin
# language: pt
Funcionalidade: Impressão de etiquetas por VIN

  @smoke
  Cenário: Segunda impressão do mesmo VIN é bloqueada
    Dado que o VIN "9ZZBA11A0T0000001" já teve as etiquetas impressas
    Quando o usuário "operador" imprimir as etiquetas do VIN "9ZZBA11A0T0000001"
    Então a operação é recusada com o código "JA_IMPRESSO"
    E a mensagem contém "Use a reimpressão"
    E o saldo do estoque é de 396 etiquetas
```

## Regras de negócio

| Funcionalidade | Regras | Cenários |
|---|---|---|
| [Recebimento do MES](features/01_recebimento_mes.feature) | fabricante pelo 4º caractere do VIN, VIN único, ano modelo válido | 6 |
| [Impressão](features/02_impressao.feature) | 4 etiquetas por VIN, impressão única, impressora e margem por fabricante, validação do VIN | 16 |
| [Reimpressão](features/03_reimpressao.feature) | só ADMIN, motivo com 10+ caracteres, reimpressão parcial, limite de 3 por VIN | 14 |
| [Liberação](features/04_liberacao.feature) | só ESTOQUE, libera VIN impresso para nova impressão, não consome etiqueta | 7 |
| [Estoque](features/05_estoque.feature) | saldo desde a última contagem, consumo por fabricante, alerta abaixo de 40 | 12 |

## Recursos de Gherkin usados

- **Contexto** (`Background`) para preparar usuários, estoque e veículos
- **Esquema do Cenário + Exemplos** para valores-limite (motivo com 9, 10 e 11 caracteres; estoque com 41, 40 e 39 etiquetas)
- **Tabelas de dados** para entrada (veículos do MES) e saída (etiquetas geradas, histórico, painel do estoque)
- **Tags** para fatiar a suíte: `@smoke` (7 cenários), `@regressao` e `@BUG-001`
- Relógio falso controlado pelo cenário (`Dado que hoje é "2026-10-09"`), sem depender da hora da máquina
- Passos de preparação (`Dado`) que falham com mensagem clara se o próprio setup der errado

## Documentação de QA

- [Plano de testes](docs/plano-de-testes.md)
- [Matriz de rastreabilidade](docs/matriz-rastreabilidade.md): cada regra ligada aos cenários que a cobrem
- [BUG-001](docs/bugs/BUG-001.md): VIN com espaços ou minúsculas burlando o bloqueio de impressão dupla

## Como rodar

Requer Node.js 22+.

```bash
npm install
npm test                 # os 55 cenários nas duas camadas
npm run bdd              # só domínio
npm run bdd:api          # só API
npm run bdd:smoke        # só @smoke
npm run bdd:regressao    # só @regressao
npm run test:coverage    # com cobertura (c8)
npm start                # API em http://localhost:3000 com dados de exemplo
```

Relatórios HTML e JUnit ficam em `reports/`. No CI, eles são publicados como artefato de cada execução.

## API

| Método | Rota | Perfil |
|---|---|---|
| POST | `/api/veiculos` | MES |
| GET | `/api/veiculos/:vin` · `/api/veiculos/:vin/historico` | livre |
| POST | `/api/impressoes` | qualquer usuário |
| POST | `/api/reimpressoes` | ADMIN |
| POST | `/api/liberacoes` | ESTOQUE |
| GET | `/api/estoque` | livre |
| POST | `/api/estoque/reset` | ESTOQUE |

O usuário vai no header `x-usuario`. Erros sempre voltam como `{ "codigo": "...", "mensagem": "..." }`.

```bash
curl -X POST http://localhost:3000/api/impressoes \
  -H "Content-Type: application/json" -H "x-usuario: operador" \
  -d '{"vin":"9ZZBA11A0T0000001"}'
```

## Estrutura

```
features/
  *.feature               cenários em Gherkin (português)
  step_definitions/       passos
  support/world.js        estado de cada cenário e relógio falso
  support/drivers.js      driver de domínio e driver HTTP
src/
  vin.js                  validação e normalização do VIN
  sistema.js              regras de negócio
  app.js                  API Express
docs/                     plano de testes, rastreabilidade e bug
```

## Stack

Node.js 22 · Express 5 · Cucumber.js · Gherkin (pt) · Supertest · c8 · GitHub Actions

---

Feito por **Marcelo Rodrigues** · veja também [controle-quimicos-qa](https://github.com/VitraSan/controle-quimicos-qa) e [monitor-integracao-qa](https://github.com/VitraSan/monitor-integracao-qa)
