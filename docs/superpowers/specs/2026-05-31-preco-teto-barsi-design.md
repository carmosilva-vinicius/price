# Design: App Local de Preco-Teto Barsi/Bazin

## Contexto

O projeto transforma a planilha de precificacao baseada no metodo Bazin/Barsi em uma aplicacao web local. O objetivo e calcular o preco maximo que o usuario pode pagar por uma acao para buscar um retorno anual minimo de 6% em dividendos.

Formula principal:

```text
preco_teto = media_dividendos_anuais / 0.06
```

O app e para uso pessoal local, sem login e sem preparacao inicial para produto publico.

## Objetivos

- Cadastrar tickers da B3, como `TAEE11` e `BBSE3`.
- Buscar cotacao e proventos automaticamente usando a brapi como fonte primaria.
- Salvar os dados em SQLite local.
- Permitir edicao manual de cotacao e dividendos quando a API falhar ou o usuario quiser corrigir os dados.
- Calcular media anual de dividendos, preco-teto e status de margem de seguranca.
- Manter o frontend e o backend dentro de uma unica aplicacao fullstack.

## Fora de Escopo Inicial

- Login, usuarios e sincronizacao em nuvem.
- Produto publico, billing, termos comerciais ou controle de cotas por usuario.
- Fallback automatico com Yahoo Finance/yfinance.
- Alertas por email, push ou WhatsApp.
- Recomendacao automatica de compra.
- Analise fundamentalista completa, como divida, lucro, governanca ou recorrencia dos proventos.

## Arquitetura

A aplicacao sera um projeto Next.js local, com frontend e backend no mesmo app.

- Frontend: tela de radar de acoes, cadastro de tickers, tabela de resultados, acoes de atualizar e campos editaveis.
- Backend: rotas internas do Next.js para consultar a brapi, normalizar dados, persistir no SQLite e expor dados calculados ao frontend.
- Banco: SQLite local no diretorio do projeto.
- Fonte externa: brapi como fonte primaria para cotacoes e dividendos/proventos.

O app deve rodar localmente com um comando de desenvolvimento e abrir no navegador.

## Modelo de Dados

Tabelas previstas:

- `assets`: ticker, nome opcional, data de criacao e data da ultima atualizacao.
- `quotes`: ticker, preco atual, moeda, fonte, timestamp da cotacao e timestamp de captura.
- `annual_payouts`: ticker, ano, valor total por acao, fonte, indicador de edicao manual e timestamp de atualizacao.
- `settings`: configuracoes simples, como taxa-alvo padrao de 6%.

Os dados editados manualmente devem preservar origem `manual`. Dados vindos da brapi devem preservar origem `api`.

## Fluxo Principal

1. Usuario adiciona um ticker.
2. O app cria o ativo no SQLite.
3. Usuario clica em atualizar.
4. O backend consulta a brapi.
5. O backend salva cotacao atual, proventos disponiveis, fonte e timestamp.
6. O backend consolida proventos por ano.
7. O app calcula media anual, preco-teto e status.
8. Usuario pode corrigir cotacao ou dividendos manualmente.
9. A tabela recalcula automaticamente.

## Regras de Calculo

- A media de dividendos deve considerar ate os ultimos 5 anos disponiveis.
- Quando houver 5 anos completos, o resultado e considerado completo.
- Quando houver menos de 5 anos, o app ainda calcula com os anos disponiveis, mas marca o ativo como `Dados parciais`.
- Se nao houver cotacao ou nenhum provento valido, o ativo deve ser marcado como `Dados incompletos`.
- O preco-teto padrao e `media_dividendos_anuais / 0.06`.
- A taxa-alvo deve ser configuravel no codigo/modelo para permitir evolucao futura, mas o MVP usa 6%.

## Classificacao

- `Descontada`: cotacao atual abaixo do preco-teto.
- `Proxima`: cotacao atual ate 5% acima do preco-teto.
- `Cara`: cotacao atual mais de 5% acima do preco-teto.
- `Dados parciais`: calculo possivel, mas com menos de 5 anos de proventos.
- `Dados incompletos`: faltam dados minimos para calcular.

Quando um ativo for `Dados parciais`, o app deve mostrar tambem a classificacao economica calculada, se houver dados suficientes, mas deixar claro que a base historica esta incompleta.

## Interface

A tela inicial sera a propria ferramenta de trabalho:

- Campo para adicionar ticker.
- Botao para atualizar dados do ativo ou da lista.
- Tabela com ticker, cotacao, media de dividendos, preco-teto, diferenca percentual, status, data da ultima atualizacao e origem dos dados.
- Edicao manual de cotacao e dividendos anuais.
- Filtros simples por status.
- Mensagens discretas de erro ou dados parciais.

O visual deve ser operacional: denso, organizado, facil de escanear e sem aparencia de landing page.

## Tratamento de Erros

- Falha na brapi nao deve impedir uso do app.
- Se houver dado salvo, o app deve continuar mostrando o ultimo valor conhecido e avisar que a atualizacao falhou.
- Ticker inexistente ou sem dados deve ser marcado como `Dados incompletos`.
- Dados manuais devem continuar disponiveis mesmo quando a API falhar.

## Testes

Testes prioritarios:

- Calculo da media de dividendos.
- Calculo do preco-teto.
- Classificacao por cotacao versus preco-teto.
- Consolidacao de proventos por ano.
- Regra de dados parciais.
- Persistencia basica em SQLite.

A implementacao deve comecar pela logica de dominio e persistencia, com testes antes do codigo de producao para as regras financeiras principais.

## Decisoes Aprovadas

- Aplicacao para uso pessoal local.
- SQLite como persistencia local.
- brapi como fonte automatica primaria.
- Dados automaticos com edicao manual.
- Uma unica aplicacao fullstack com backend e frontend no mesmo projeto.
- Next.js e a arquitetura proposta foram aprovados como direcao de implementacao.
