# language: pt
@estoque
Funcionalidade: Controle do estoque de etiquetas
  Como responsável pelo estoque
  Quero acompanhar o saldo de etiquetas a partir da última contagem física
  Para repor antes que a linha pare por falta de etiqueta

  Regras:
  - Saldo = quantidade da última contagem - etiquetas consumidas depois dela
  - Impressões e reimpressões consomem etiquetas; liberações não
  - O alerta de estoque baixo dispara abaixo de 40 etiquetas (10 veículos)
  - Só o perfil ESTOQUE registra contagem

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
      | 9ZZBA11A0T0000003 | SUV-M   | 2026 |
      | 9ZZCB22B0T0000002 | SEDAN-C | 2026 |

  @smoke
  Cenário: Saldo considera impressões e reimpressões desde a contagem
    Dado que os VINs já tiveram as etiquetas impressas:
      | vin               |
      | 9ZZBA11A0T0000001 |
      | 9ZZBA11A0T0000003 |
      | 9ZZCB22B0T0000002 |
    E que o usuário "admin" reimprimiu as etiquetas "1,2" do VIN "9ZZCB22B0T0000002"
    E que o VIN "9ZZBA11A0T0000001" foi liberado
    Quando eu consultar o estoque
    Então o estoque mostra:
      | saldo inicial      | 400 |
      | consumido          | 14  |
      | saldo              | 386 |
      | veículos restantes | 96  |
      | consumo ALFA       | 8   |
      | consumo BETA       | 6   |

  Cenário: Nova contagem passa a ser a base do saldo
    Dado que os VINs já tiveram as etiquetas impressas:
      | vin               |
      | 9ZZBA11A0T0000001 |
      | 9ZZCB22B0T0000002 |
    E que hoje é "2026-10-10"
    Quando o usuário "estoque" registrar uma contagem de 250 etiquetas
    Então a operação é aceita
    E o estoque mostra:
      | saldo inicial | 250 |
      | consumido     | 0   |
      | saldo         | 250 |
    E a última contagem foi feita por "estoque" em "2026-10-10"

  Esquema do Cenário: Alerta de estoque baixo
    Dado que o estoque foi contado com <contagem> etiquetas
    Quando eu consultar o estoque
    Então o alerta de estoque baixo está <alerta>
    E o estoque mostra:
      | veículos restantes | <veículos> |

    Exemplos:
      | contagem | alerta  | veículos |
      | 41       | inativo | 10       |
      | 40       | inativo | 10       |
      | 39       | ativo   | 9        |
      | 3        | ativo   | 0        |
      | 0        | ativo   | 0        |

  Cenário: Alerta dispara quando a impressão leva o saldo abaixo do mínimo
    Dado que o estoque foi contado com 43 etiquetas
    Quando o usuário "operador" imprimir as etiquetas do VIN "9ZZBA11A0T0000001"
    E eu consultar o estoque
    Então o alerta de estoque baixo está ativo

  Esquema do Cenário: Somente o perfil ESTOQUE registra contagem
    Quando o usuário "<usuario>" registrar uma contagem de 500 etiquetas
    Então a operação é recusada com o código "SEM_PERMISSAO"

    Exemplos:
      | usuario  |
      | operador |
      | admin    |

  Esquema do Cenário: Quantidade de contagem inválida
    Quando o usuário "estoque" registrar uma contagem de <quantidade> etiquetas
    Então a operação é recusada com o código "QUANTIDADE_INVALIDA"

    Exemplos:
      | quantidade |
      | -1         |
      | 10.5       |
