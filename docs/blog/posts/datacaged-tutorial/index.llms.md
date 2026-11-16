O Cadastro Geral de Empregados e Desempregados (CAGED), mantido pelo Ministério do Trabalho e Emprego (MTE), registra mensalmente cada admissão e cada desligamento de trabalhadores com carteira assinada no Brasil. Trata-se, portanto, de uma das principais fontes para o acompanhamento do mercado de trabalho formal, com informações sobre ocupação, setor de atividade, município, salário e perfil do trabalhador. No entanto, o uso direto dos microdados impõe custos consideráveis ao pesquisador, tendo em vista o volume dos arquivos (cerca de dois milhões de registros por mês), a compressão em formato 7z e as mudanças de leiaute ao longo do tempo.

Nesse sentido, o pacote [datacaged](../../../producao-tecnica/index.llms.md#datacaged), disponível no repositório oficial do R (CRAN), reduz essas etapas a poucos comandos: (i) baixa os arquivos de um espelho público no Hugging Face; (ii) extrai e padroniza as colunas; e (iii) grava os dados em um banco local DuckDB, que permite consultas rápidas sem carregar tudo na memória. Este texto apresenta um roteiro mínimo de uso, do download à primeira tabela.

## Instalação

``` downlit
install.packages("datacaged")
```

O Novo CAGED (2020 em diante) funciona sem configuração adicional no Windows, no macOS e no Linux. Para a série antiga (até 2019), que utiliza compressão PPMd, é necessário ter o 7-Zip instalado no computador.

## Carregamento dos dados

A função [`caged_load()`](https://rdrr.io/pkg/datacaged/man/caged_load.html) executa todo o processo em um único comando: baixa os arquivos das competências solicitadas, extrai, padroniza e grava no banco indicado em `db_path`.

``` downlit
library(datacaged)

caged_load(
  years   = 2026,
  months  = 1:9,
  db_path = "caged.duckdb"
)
```

Ressalta-se que o Novo CAGED é distribuído em arquivos nacionais, de modo que cada competência traz todas as unidades da federação; o recorte geográfico é feito depois, na consulta. Quando novas competências forem divulgadas, a função [`caged_update()`](https://rdrr.io/pkg/datacaged/man/caged_update.html) acrescenta ao banco apenas os meses que ainda não foram carregados.

## Consulta com dplyr

Com o banco populado, a conexão é feita por [`caged_connect()`](https://rdrr.io/pkg/datacaged/man/caged_connect.html), e as tabelas podem ser consultadas com `dplyr` como se fossem *data frames*. A tabela `caged_mov` contém as movimentações do mês, em que a variável `saldomovimentacao` assume o valor 1 para admissões e -1 para desligamentos.

``` downlit
library(dplyr)

con <- caged_connect("caged.duckdb")

saldo_rn <- tbl(con, "caged_mov") |>
  filter(uf == 24) |>                       # Rio Grande do Norte
  group_by(competenciamov) |>
  summarise(
    admissoes     = sum(if_else(saldomovimentacao == 1, 1L, 0L), na.rm = TRUE),
    desligamentos = sum(if_else(saldomovimentacao == -1, 1L, 0L), na.rm = TRUE),
    saldo         = sum(saldomovimentacao, na.rm = TRUE)
  ) |>
  arrange(competenciamov) |>
  collect()

saldo_rn
```

Observa-se que apenas o resultado final é trazido para a memória, por meio de [`collect()`](https://dplyr.tidyverse.org/reference/compute.html); o agrupamento e a soma são executados pelo DuckDB. O mesmo raciocínio vale para recortes por município (`municipio`), por ocupação da Classificação Brasileira de Ocupações (`cbo2002ocupacao`) ou por setor (`secao` e `subclasse` da CNAE). Ao final, recomenda-se encerrar a conexão:

``` downlit
DBI::dbDisconnect(con, shutdown = TRUE)
```

## Um exemplo de resultado

A [Figura 1](#fig-saldo-rn) apresenta o saldo mensal de empregos formais no Rio Grande do Norte calculado exatamente com esse procedimento. Os mesmos dados alimentam os [indicadores do emprego formal](../../../producao-tecnica/index.llms.md#indicadores) publicados neste site, atualizados automaticamente a cada nova divulgação do MTE.

![Gráfico de barras do saldo mensal de empregos formais no Rio Grande do Norte de janeiro de 2024 a setembro de 2026, com saldos positivos na maior parte dos meses, picos entre julho e setembro e saldos negativos em dezembro e em alguns meses do início do ano.](index_files/figure-html/fig-saldo-rn-1.png)

Figura 1 - Saldo mensal de empregos formais no Rio Grande do Norte, janeiro de 2024 a setembro de 2026

Fonte: elaborado pelo autor com dados do Novo CAGED/MTE (2026).

## Considerações

Em linhas gerais, o `datacaged` desloca o esforço da preparação dos dados para a análise propriamente dita, além de favorecer a reprodutibilidade, uma vez que todo o caminho, do arquivo oficial à tabela final, fica registrado em código. A documentação completa, com casos de uso adicionais, encontra-se no [repositório do pacote no GitHub](https://github.com/gecomt/datacaged). Para citar o pacote em trabalhos acadêmicos, utiliza-se o DOI [10.32614/CRAN.package.datacaged](https://doi.org/10.32614/CRAN.package.datacaged).

> **NOTE:**
>
> Os exemplos deste blog utilizam ferramentas abertas desenvolvidas no grupo GECOMT, como o pacote [datacaged](../../../producao-tecnica/index.llms.md#datacaged), que dá acesso aos microdados do emprego formal. Para análises aplicadas à realidade de uma organização, como diagnósticos do mercado de trabalho, referências salariais ou previsões, veja a página de [Consultoria e parcerias](../../../parcerias/index.llms.md).

De volta ao topo

## Citação

Por favor, cite este trabalho como:

PRADO, Alexsandro. **Microdados do CAGED no R com o pacote datacaged**. **Blog de Alexsandro Prado**, 16 nov. 2026. Disponível em: \<<https://alexsandroprado.site/blog/posts/datacaged-tutorial/>\>
