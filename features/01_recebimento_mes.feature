# language: pt
@mes
Funcionalidade: Recebimento de veículos do MES
  Como sistema de etiquetas
  Quero receber do MES os veículos produzidos
  Para só imprimir etiquetas de VINs que existem de verdade na produção

  Regras:
  - O fabricante é identificado pelo 4º caractere do VIN: "B" é ALFA, qualquer outro é BETA
  - O mesmo VIN não pode ser recebido duas vezes
  - O ano modelo vai de 2000 até o ano seguinte ao atual

  @smoke
  Esquema do Cenário: Veículo recebido fica pendente de impressão
    Quando o MES enviar o veículo "<vin>" modelo "<modelo>" ano <ano>
    Então a operação é aceita
    E o VIN "<vin>" fica com status "PENDENTE"
    E o VIN "<vin>" é do fabricante "<fabricante>"

    Exemplos:
      | vin               | modelo  | ano  | fabricante |
      | 9ZZBA11A0T0000001 | SUV-M   | 2026 | ALFA       |
      | 9ZZCB22B0T0000002 | SEDAN-C | 2027 | BETA       |

  Cenário: VIN repetido é rejeitado
    Dado que o MES enviou o veículo "9ZZBA11A0T0000001" modelo "SUV-M" ano 2026
    Quando o MES enviar o veículo "9ZZBA11A0T0000001" modelo "SUV-M" ano 2026
    Então a operação é recusada com o código "VEICULO_DUPLICADO"

  Esquema do Cenário: Ano modelo fora do intervalo aceito
    Dado que hoje é "2026-10-09"
    Quando o MES enviar o veículo "9ZZBA11A0T0000001" modelo "SUV-M" ano <ano>
    Então a operação é recusada com o código "ANO_INVALIDO"

    Exemplos:
      | ano  | situação                       |
      | 1999 | antes do início do intervalo   |
      | 2028 | dois anos à frente do atual    |
      | 0    | ano zerado vindo do integrador |
