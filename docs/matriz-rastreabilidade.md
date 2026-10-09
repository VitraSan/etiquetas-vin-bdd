# Matriz de rastreabilidade

Cada regra de negócio ligada aos cenários que a cobrem. Todos rodam nas camadas de domínio e API.

| ID | Regra | Cenários |
|---|---|---|
| RN-01 | Fabricante pelo 4º caractere do VIN (`B` = ALFA) | Recebimento: *Veículo recebido fica pendente de impressão* |
| RN-02 | VIN único no recebimento | Recebimento: *VIN repetido é rejeitado* |
| RN-03 | Ano modelo entre 2000 e o ano seguinte | Recebimento: *Ano modelo fora do intervalo aceito* |
| RN-04 | VIN com 17 caracteres, sem I, O, Q | Impressão: *VIN lido com formato inválido* |
| RN-05 | VIN normalizado (espaços e minúsculas) | Impressão: *VIN com espaços ou minúsculas...* `@BUG-001` |
| RN-06 | 4 etiquetas por veículo, uma de cada tipo | Impressão: *Primeira impressão gera as 4 etiquetas* |
| RN-07 | Impressora e margem por fabricante | Impressão: *Impressora e margem escolhidas pelo fabricante* |
| RN-08 | Impressão única por VIN | Impressão: *Segunda impressão do mesmo VIN é bloqueada* |
| RN-09 | VIN precisa existir no MES | Impressão: *VIN que não veio do MES* |
| RN-10 | Usuário identificado | Impressão: *Impressão sem usuário identificado* |
| RN-11 | Estoque suficiente para a operação | Impressão: *Estoque sem etiquetas suficientes*, *exatamente 4 etiquetas* |
| RN-12 | Reimpressão só por ADMIN | Reimpressão: *Somente o perfil ADMIN pode reimprimir* |
| RN-13 | Motivo com 10+ caracteres | Reimpressão: *Tamanho mínimo do motivo*; Liberação: *Liberação sem motivo* |
| RN-14 | Reimpressão só de VIN impresso | Reimpressão: *VIN que nunca foi impresso*; Liberação: *VIN liberado não pode ser reimpresso* |
| RN-15 | Reimpressão parcial (1 a 4, sem repetição) | Reimpressão: *só das etiquetas danificadas*, *Seleção de etiquetas inválida* |
| RN-16 | Limite de 3 reimpressões por VIN | Reimpressão: *Limite de reimpressões por VIN* |
| RN-17 | Liberação só por ESTOQUE | Liberação: *Somente o perfil ESTOQUE pode liberar* |
| RN-18 | Liberação só de VIN impresso | Liberação: *VIN pendente não pode ser liberado*, *não pode ser liberado de novo* |
| RN-19 | VIN liberado volta ao fluxo normal | Liberação: *VIN liberado volta a ser impresso* |
| RN-20 | Histórico de toda operação | Reimpressão e Liberação: passos *o histórico do VIN registra* |
| RN-21 | Saldo = contagem − consumo desde ela | Estoque: *Saldo considera impressões e reimpressões*, *Nova contagem* |
| RN-22 | Liberação não consome etiqueta | Estoque: *Saldo considera...*; Liberação: *volta a ser impresso* |
| RN-23 | Alerta abaixo de 40 etiquetas | Estoque: *Alerta de estoque baixo*, *Alerta dispara quando a impressão...* |
| RN-24 | Contagem só por ESTOQUE, inteiro ≥ 0 | Estoque: *Somente o perfil ESTOQUE registra contagem*, *Quantidade de contagem inválida* |
