# Plano de testes · Etiquetas VIN

## 1. Objetivo

Garantir que cada veículo receba exatamente as 4 etiquetas autodestrutivas, na impressora certa, sem impressão duplicada e com o estoque de etiquetas sempre conferível.

## 2. Abordagem

As regras foram escritas primeiro como cenários em Gherkin (BDD), em linguagem que o usuário da linha e o supervisor conseguem ler e validar. Os cenários são a especificação e o teste ao mesmo tempo.

Cada cenário roda em duas camadas:

| Camada | Objetivo |
|---|---|
| Domínio | validar a regra de negócio isolada, de forma rápida |
| API HTTP | validar que a API expõe a regra com o status HTTP e o JSON corretos |

## 3. Escopo

**Dentro:** recebimento de veículos do MES, impressão, reimpressão, liberação, controle de estoque, perfis de acesso.

**Fora:** geração física do PDF e comunicação com a impressora (simuladas pelo objeto de etiqueta), integração real com o MES, interface web.

## 4. Técnicas de teste

| Técnica | Onde |
|---|---|
| Partição de equivalência | VIN válido / inválido; perfis com e sem permissão |
| Valor-limite | motivo com 9/10/11 caracteres; estoque com 3/4 etiquetas; alerta com 39/40/41; ano 1999/2028 |
| Transição de estado | PENDENTE → IMPRESSO → LIBERADO → IMPRESSO, e as transições proibidas |
| Tabela de decisão | fabricante × impressora × margem |
| Regressão | cenários marcados com o ID do bug |

## 5. Estados do veículo

```
PENDENTE ──imprimir──▶ IMPRESSO ──liberar──▶ LIBERADO
                         │  ▲                    │
                reimprimir  └──────imprimir──────┘
```

Transições proibidas cobertas: imprimir IMPRESSO, reimprimir PENDENTE ou LIBERADO, liberar PENDENTE ou LIBERADO.

## 6. Critérios

**Entrada:** regras revisadas e cenários aprovados.

**Saída:** 100% dos cenários passando nas duas camadas, nenhum bug crítico aberto, regressões de bugs corrigidos marcadas com tag.

## 7. Execução

| Gatilho | O que roda |
|---|---|
| Cada push e pull request | `@smoke` e depois a suíte completa, em paralelo nas duas camadas |
| Depois disso | cobertura de código |

Relatórios HTML e JUnit são guardados como artefato no GitHub Actions.

## 8. Riscos

| Risco | Mitigação |
|---|---|
| VIN chegando com espaços ou minúsculas (leitor, coluna CHAR) | normalização + cenários `@BUG-001` |
| Etiqueta impressa duas vezes no mesmo veículo | bloqueio por status + cenário `@smoke` |
| Estoque divergindo da contagem física | saldo calculado por eventos desde a contagem |
| Reimpressão sem controle | perfil ADMIN, motivo obrigatório, limite e histórico |
