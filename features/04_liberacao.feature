# language: pt
@liberacao
Funcionalidade: Liberação de VIN para nova impressão
  Como responsável pelo estoque de etiquetas
  Quero liberar um VIN já impresso
  Para que a linha possa imprimir de novo pelo fluxo normal quando o veículo volta para retrabalho

  Regras:
  - Só o perfil ESTOQUE libera
  - O motivo é obrigatório
  - Só VINs com status IMPRESSO podem ser liberados
  - A liberação não consome etiquetas; a nova impressão sim

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
  Cenário: VIN liberado volta a ser impresso pelo fluxo normal
    Quando o usuário "estoque" liberar o VIN "9ZZBA11A0T0000001" com o motivo "Veículo voltou para retrabalho"
    Então a operação é aceita
    E o VIN "9ZZBA11A0T0000001" fica com status "LIBERADO"
    E o saldo do estoque é de 396 etiquetas
    Quando o usuário "operador" imprimir as etiquetas do VIN "9ZZBA11A0T0000001"
    Então a operação é aceita
    E o saldo do estoque é de 392 etiquetas
    E o histórico do VIN "9ZZBA11A0T0000001" registra:
      | tipo      | usuario  | quantidade | motivo                         |
      | IMPRESSAO | operador | 4          |                                |
      | LIBERACAO | estoque  | 0          | Veículo voltou para retrabalho |
      | IMPRESSAO | operador | 4          |                                |

  Esquema do Cenário: Somente o perfil ESTOQUE pode liberar
    Quando o usuário "<usuario>" liberar o VIN "9ZZBA11A0T0000001" com o motivo "Veículo voltou para retrabalho"
    Então a operação é recusada com o código "SEM_PERMISSAO"
    E o VIN "9ZZBA11A0T0000001" fica com status "IMPRESSO"

    Exemplos:
      | usuario  |
      | operador |
      | admin    |

  Cenário: Liberação sem motivo
    Quando o usuário "estoque" liberar o VIN "9ZZBA11A0T0000001" com o motivo ""
    Então a operação é recusada com o código "MOTIVO_OBRIGATORIO"

  Cenário: VIN pendente não pode ser liberado
    Quando o usuário "estoque" liberar o VIN "9ZZCB22B0T0000002" com o motivo "Veículo voltou para retrabalho"
    Então a operação é recusada com o código "NAO_IMPRESSO"

  Cenário: VIN liberado não pode ser liberado de novo antes de imprimir
    Dado que o VIN "9ZZBA11A0T0000001" foi liberado
    Quando o usuário "estoque" liberar o VIN "9ZZBA11A0T0000001" com o motivo "Segunda liberação seguida"
    Então a operação é recusada com o código "NAO_IMPRESSO"

  Cenário: VIN liberado não pode ser reimpresso, só impresso
    Dado que o VIN "9ZZBA11A0T0000001" foi liberado
    Quando o usuário "admin" reimprimir o VIN "9ZZBA11A0T0000001" com o motivo "Tentativa de reimpressão"
    Então a operação é recusada com o código "NAO_IMPRESSO"
