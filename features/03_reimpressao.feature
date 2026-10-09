# language: pt
@reimpressao
Funcionalidade: Reimpressão de etiquetas
  Como supervisor (perfil ADMIN)
  Quero reimprimir etiquetas que saíram com defeito
  Para não parar a linha, mantendo registro de quem reimprimiu e por quê

  Regras:
  - Só o perfil ADMIN reimprime
  - O motivo é obrigatório e tem pelo menos 10 caracteres
  - Só VINs já impressos podem ser reimpressos
  - Pode reimprimir todas ou só algumas das 4 etiquetas; cada etiqueta consome estoque
  - Limite de 3 reimpressões por VIN

  Contexto:
    Dado os usuários cadastrados:
      | login    | perfil   |
      | operador | OPERADOR |
      | admin    | ADMIN    |
      | estoque  | ESTOQUE  |
    E que o estoque foi contado com 400 etiquetas
    E que o MES enviou os veículos:
      | vin               | modelo  | ano  |
      | 9ZZBA11A0T0000001 | SUV-M   | 2026 |
      | 9ZZCB22B0T0000002 | SEDAN-C | 2026 |
    E que o VIN "9ZZBA11A0T0000001" já teve as etiquetas impressas

  @smoke
  Cenário: Supervisor reimprime as 4 etiquetas informando o motivo
    Quando o usuário "admin" reimprimir o VIN "9ZZBA11A0T0000001" com o motivo "Impressora manchou as etiquetas"
    Então a operação é aceita
    E são reimpressas 4 etiquetas
    E o saldo do estoque é de 392 etiquetas
    E o histórico do VIN "9ZZBA11A0T0000001" registra:
      | tipo        | usuario  | quantidade | motivo                          |
      | IMPRESSAO   | operador | 4          |                                 |
      | REIMPRESSAO | admin    | 4          | Impressora manchou as etiquetas |

  Cenário: Reimpressão só das etiquetas danificadas
    Quando o usuário "admin" reimprimir as etiquetas "3,4" do VIN "9ZZBA11A0T0000001" com o motivo "Etiquetas 3 e 4 rasgaram"
    Então a operação é aceita
    E são geradas as etiquetas:
      | numero | tipo                | impressora |
      | 3      | COLUNA_B            | IMP_ALFA_2 |
      | 4      | COMPARTIMENTO_MOTOR | IMP_ALFA_2 |
    E o saldo do estoque é de 394 etiquetas

  Esquema do Cenário: Somente o perfil ADMIN pode reimprimir
    Quando o usuário "<usuario>" reimprimir o VIN "9ZZBA11A0T0000001" com o motivo "Impressora manchou as etiquetas"
    Então a operação é recusada com o código "SEM_PERMISSAO"
    E o saldo do estoque é de 396 etiquetas

    Exemplos:
      | usuario  |
      | operador |
      | estoque  |

  Esquema do Cenário: Tamanho mínimo do motivo
    Quando o usuário "admin" reimprimir o VIN "9ZZBA11A0T0000001" com o motivo "<motivo>"
    Então a operação é <resultado>

    Exemplos:
      | motivo      | tamanho | resultado                                     |
      |             | 0       | recusada com o código "MOTIVO_OBRIGATORIO"    |
      | Sem tinta   | 9       | recusada com o código "MOTIVO_OBRIGATORIO"    |
      | Sem tinta!  | 10      | aceita                                        |
      | Sem tinta!! | 11      | aceita                                        |

  Cenário: VIN que nunca foi impresso não pode ser reimpresso
    Quando o usuário "admin" reimprimir o VIN "9ZZCB22B0T0000002" com o motivo "Teste de reimpressão"
    Então a operação é recusada com o código "NAO_IMPRESSO"

  Cenário: Limite de reimpressões por VIN
    Dado que o VIN "9ZZBA11A0T0000001" já foi reimpresso 3 vezes
    Quando o usuário "admin" reimprimir o VIN "9ZZBA11A0T0000001" com o motivo "Quarta tentativa de reimpressão"
    Então a operação é recusada com o código "LIMITE_REIMPRESSOES"
    E o saldo do estoque é de 384 etiquetas

  Esquema do Cenário: Seleção de etiquetas inválida
    Quando o usuário "admin" reimprimir as etiquetas "<etiquetas>" do VIN "9ZZBA11A0T0000001" com o motivo "Etiqueta danificada"
    Então a operação é recusada com o código "ETIQUETAS_INVALIDAS"

    Exemplos:
      | etiquetas | situação          |
      | 0         | abaixo de 1       |
      | 5         | acima de 4        |
      | 1,1       | etiqueta repetida |
      |           | nenhuma etiqueta  |
