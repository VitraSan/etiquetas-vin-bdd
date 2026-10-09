# language: pt
@impressao
Funcionalidade: Impressão de etiquetas por VIN
  Como operador da linha de montagem
  Quero imprimir as 4 etiquetas autodestrutivas de cada veículo
  Para que todo veículo saia identificado e nenhum VIN seja etiquetado duas vezes

  Regras:
  - Cada veículo recebe 4 etiquetas, uma de cada tipo
  - O VIN precisa ter vindo do MES
  - A impressão normal acontece uma única vez por VIN; depois disso só por reimpressão
  - Cada fabricante tem um par de impressoras: etiquetas 1 e 2 na primeira, 3 e 4 na segunda

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

  @smoke
  Cenário: Primeira impressão gera as 4 etiquetas do veículo
    Quando o usuário "operador" imprimir as etiquetas do VIN "9ZZBA11A0T0000001"
    Então a operação é aceita
    E são geradas as etiquetas:
      | numero | tipo                | impressora |
      | 1      | VIDRO_DIANTEIRO     | IMP_ALFA_1 |
      | 2      | VIDRO_TRASEIRO      | IMP_ALFA_1 |
      | 3      | COLUNA_B            | IMP_ALFA_2 |
      | 4      | COMPARTIMENTO_MOTOR | IMP_ALFA_2 |
    E o VIN "9ZZBA11A0T0000001" fica com status "IMPRESSO"
    E o saldo do estoque é de 396 etiquetas

  Esquema do Cenário: Impressora e margem escolhidas pelo fabricante do VIN
    Quando o usuário "operador" imprimir as etiquetas do VIN "<vin>"
    Então as etiquetas saem nas impressoras "<impressora 1>" e "<impressora 2>" com margem de <margem> px

    Exemplos:
      | vin               | fabricante | impressora 1 | impressora 2 | margem |
      | 9ZZBA11A0T0000001 | ALFA       | IMP_ALFA_1   | IMP_ALFA_2   | 18     |
      | 9ZZCB22B0T0000002 | BETA       | IMP_BETA_1   | IMP_BETA_2   | 0      |

  @smoke
  Cenário: Segunda impressão do mesmo VIN é bloqueada
    Dado que o VIN "9ZZBA11A0T0000001" já teve as etiquetas impressas
    Quando o usuário "operador" imprimir as etiquetas do VIN "9ZZBA11A0T0000001"
    Então a operação é recusada com o código "JA_IMPRESSO"
    E a mensagem contém "Use a reimpressão"
    E o saldo do estoque é de 396 etiquetas

  Cenário: VIN que não veio do MES não pode ser impresso
    Quando o usuário "operador" imprimir as etiquetas do VIN "9ZZBA11A0T0009999"
    Então a operação é recusada com o código "VEICULO_NAO_ENCONTRADO"
    E o saldo do estoque é de 400 etiquetas

  Esquema do Cenário: VIN lido com formato inválido
    Quando o usuário "operador" imprimir as etiquetas do VIN "<vin>"
    Então a operação é recusada com o código "VIN_INVALIDO"
    E a mensagem contém "<mensagem>"

    Exemplos:
      | vin                | situação           | mensagem             |
      | 9ZZBA11A0T000001   | 16 caracteres      | 17 caracteres        |
      | 9ZZBA11A0T00000011 | 18 caracteres      | 17 caracteres        |
      | 9ZZBA11O0T0000001  | contém a letra O   | I, O ou Q            |
      | 9ZZBA11A0T00000-1  | caractere especial | caracteres inválidos |
      |                    | leitura vazia      | não informado        |

  Cenário: Estoque sem etiquetas suficientes para um veículo
    Dado que o estoque foi contado com 3 etiquetas
    Quando o usuário "operador" imprimir as etiquetas do VIN "9ZZBA11A0T0000001"
    Então a operação é recusada com o código "ESTOQUE_INSUFICIENTE"
    E o VIN "9ZZBA11A0T0000001" fica com status "PENDENTE"

  Cenário: Estoque com exatamente 4 etiquetas ainda atende um veículo
    Dado que o estoque foi contado com 4 etiquetas
    Quando o usuário "operador" imprimir as etiquetas do VIN "9ZZBA11A0T0000001"
    Então a operação é aceita
    E o saldo do estoque é de 0 etiquetas

  Cenário: Impressão sem usuário identificado
    Quando um usuário não identificado imprimir as etiquetas do VIN "9ZZBA11A0T0000001"
    Então a operação é recusada com o código "NAO_AUTENTICADO"

  @regressao @BUG-001
  Esquema do Cenário: VIN com espaços ou minúsculas não burla o bloqueio de impressão dupla
    Dado que o VIN "9ZZBA11A0T0000001" já teve as etiquetas impressas
    Quando o usuário "operador" imprimir as etiquetas do VIN "<vin lido>" com <espaços> espaços à direita
    Então a operação é recusada com o código "JA_IMPRESSO"
    E o saldo do estoque é de 396 etiquetas

    Exemplos:
      | vin lido          | espaços | origem da leitura                  |
      | 9ZZBA11A0T0000001 | 13      | coluna CHAR(30) completada com espaço |
      | 9ZZBA11A0T0000001 | 1       | leitor que envia espaço no fim     |
      | 9zzba11a0t0000001 | 0       | digitação manual em minúsculas     |
