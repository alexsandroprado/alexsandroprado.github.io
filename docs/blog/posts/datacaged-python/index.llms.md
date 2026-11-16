O pacote [datacaged](../../../producao-tecnica/index.llms.md#datacaged), escrito em R, grava os microdados do Cadastro Geral de Empregados e Desempregados (CAGED) em um arquivo DuckDB, por padrão chamado `caged.duckdb`. No entanto, esse arquivo não pertence ao R: o DuckDB é um banco de dados analítico embutido, com bibliotecas para diversas linguagens, de modo que a mesma base pode ser lida em Python sem qualquer conversão. Dessa forma, uma equipe pode utilizar o R apenas para baixar e atualizar os dados e realizar as análises em Python, ou alternar entre as duas linguagens conforme a tarefa.

Este texto apresenta como abrir o `caged.duckdb` em Python e consultá-lo com SQL, com `pandas` e com `Polars`. Os exemplos utilizam um banco com as competências de julho a setembro de 2026 do Novo CAGED, carregadas previamente no R, conforme descrito no [tutorial do datacaged](../../../blog/posts/datacaged-tutorial/index.llms.md):

``` r
datacaged::caged_load(years = 2026, months = 7:9, db_path = "caged.duckdb")
```

## Instalação

Em Python, basta a biblioteca `duckdb`; o `pandas` e o `Polars` são opcionais, para quem prefere trabalhar com *data frames*.

``` bash
pip install duckdb pandas polars
```

Ressalta-se que, a partir da versão 0.10, as versões mais novas do DuckDB leem arquivos criados por versões anteriores, mas o contrário nem sempre ocorre. Assim, recomenda-se que a versão do `duckdb` em Python seja igual ou superior à do pacote `duckdb` instalado no R que criou o banco.

## Conexão e estrutura do banco

A conexão é aberta com `duckdb.connect()`. O argumento `read_only=True` é recomendável, tendo em vista que o DuckDB admite apenas um processo com permissão de escrita por vez: em modo de leitura, o banco pode ser consultado em Python ao mesmo tempo em que está aberto em outra sessão.

``` python
import duckdb

con = duckdb.connect("caged.duckdb", read_only=True)
con.sql("SHOW TABLES")
```

[TABLE]

As movimentações declaradas no prazo ficam na tabela `caged_mov` (as declarações fora do prazo e as exclusões, quando carregadas, ficam em `caged_for` e `caged_exc`). Os nomes das colunas já chegam padronizados pelo `datacaged`, em letras minúsculas e sem acentos:

``` python
con.sql("DESCRIBE caged_mov").df()[["column_name", "column_type"]].head(12)
```

|     | column_name       | column_type |
|-----|-------------------|-------------|
| 0   | competenciamov    | DOUBLE      |
| 1   | regiao            | DOUBLE      |
| 2   | uf                | DOUBLE      |
| 3   | municipio         | DOUBLE      |
| 4   | secao             | VARCHAR     |
| 5   | subclasse         | DOUBLE      |
| 6   | saldomovimentacao | DOUBLE      |
| 7   | cbo2002ocupacao   | DOUBLE      |
| 8   | categoria         | DOUBLE      |
| 9   | graudeinstrucao   | DOUBLE      |
| 10  | idade             | DOUBLE      |
| 11  | horascontratuais  | DOUBLE      |

## Consultas com SQL

A forma mais direta de consulta é o SQL do próprio DuckDB, executado sobre o arquivo sem carregar a tabela inteira na memória. A variável `saldomovimentacao` assume o valor 1 para admissões e -1 para desligamentos, de modo que sua soma corresponde ao saldo de empregos formais:

``` python
saldo = con.sql("""
    SELECT
        competenciamov::INT                           AS competencia,
        SUM(CASE WHEN saldomovimentacao =  1 THEN 1 ELSE 0 END)::INT AS admissoes,
        SUM(CASE WHEN saldomovimentacao = -1 THEN 1 ELSE 0 END)::INT AS desligamentos,
        SUM(saldomovimentacao)::INT                    AS saldo
    FROM caged_mov
    GROUP BY competencia
    ORDER BY competencia
""").df()
saldo
```

|     | competencia | admissoes | desligamentos | saldo  |
|-----|-------------|-----------|---------------|--------|
| 0   | 202607      | 2262888   | 2204320       | 58568  |
| 1   | 202608      | 2294563   | 2128736       | 165827 |
| 2   | 202609      | 2214437   | 2093132       | 121305 |

Os valores coincidem com o saldo divulgado mensalmente pelo Ministério do Trabalho e Emprego (MTE) e são os mesmos dos [indicadores do emprego formal](../../../producao-tecnica/index.llms.md#indicadores) publicados neste site.

## Um recorte por ocupação

Os recortes seguem a mesma lógica. A consulta a seguir calcula o salário de admissão de contadores (código 252210 da Classificação Brasileira de Ocupações, CBO) por sexo, considerando apenas vínculos não intermitentes com salário entre R\$ 500 e R\$ 60.000, critério que reduz a influência de valores registrados com erro. No Novo CAGED, a variável `sexo` assume o valor 1 para homens e 3 para mulheres.

``` python
con.sql("""
    SELECT
        CASE sexo WHEN 1 THEN 'Homens' WHEN 3 THEN 'Mulheres' END AS sexo,
        COUNT(*)                      AS admissoes,
        ROUND(MEDIAN(salario))        AS salario_mediano,
        ROUND(AVG(salario))           AS salario_medio
    FROM caged_mov
    WHERE cbo2002ocupacao = 252210
      AND saldomovimentacao = 1
      AND indtrabintermitente = 0
      AND salario BETWEEN 500 AND 60000
    GROUP BY 1
    ORDER BY 1
""").df()
```

|     | sexo     | admissoes | salario_mediano | salario_medio |
|-----|----------|-----------|-----------------|---------------|
| 0   | Homens   | 4173      | 4680.0          | 6100.0        |
| 1   | Mulheres | 6344      | 4500.0          | 5269.0        |

Nota-se que as mulheres responderam pela maior parte das admissões de contadores no período, porém com salário de admissão inferior ao dos homens, tanto na mediana quanto na média. A diferença entre as duas medidas, por sua vez, indica que a distribuição dos salários masculinos é mais assimétrica, com maior presença de remunerações elevadas.

## pandas e Polars

O método `.df()` devolve o resultado como um *data frame* do `pandas`, e o método `.pl()`, como um *data frame* do `Polars`. Dessa forma, a filtragem e a agregação pesadas ficam a cargo do DuckDB, e apenas o resultado, já reduzido, é trazido para a memória:

``` python
import polars as pl

regioes = {1: "Norte", 2: "Nordeste", 3: "Sudeste", 4: "Sul", 5: "Centro-Oeste"}

por_regiao = (
    con.sql("""
        SELECT regiao::INT AS regiao, SUM(saldomovimentacao)::INT AS saldo
        FROM caged_mov
        WHERE regiao BETWEEN 1 AND 5
        GROUP BY regiao
    """)
    .pl()
    .with_columns(pl.col("regiao").replace_strict(regioes).alias("regiao"))
    .sort("saldo", descending=True)
)
por_regiao
```

shape: (5, 2)

| regiao         | saldo  |
|----------------|--------|
| str            | i32    |
| "Sudeste"      | 134239 |
| "Nordeste"     | 127471 |
| "Norte"        | 36726  |
| "Centro-Oeste" | 26536  |
| "Sul"          | 20171  |

A partir daí, a visualização segue o fluxo habitual do Python, como na [Figura 1](#fig-regioes).

``` python
import matplotlib.pyplot as plt

dados = por_regiao.sort("saldo")
fig, ax = plt.subplots(figsize=(7, 3.2))
ax.barh(dados["regiao"], dados["saldo"], color="#0e7490")
ax.xaxis.set_major_formatter(lambda x, p: f"{x / 1000:.0f} mil")
ax.spines[["top", "right"]].set_visible(False)
ax.set_xlabel("Saldo (admissões menos desligamentos)")
plt.tight_layout()
plt.show()
```

![Gráfico de barras horizontais do saldo de empregos formais de julho a setembro de 2026: Sudeste e Nordeste com os maiores saldos, cerca de 134 mil e 127 mil vínculos, seguidos de Norte, Centro-Oeste e Sul, entre 20 mil e 37 mil.](index_files/figure-html/fig-regioes-output-1.png)

Figura 1 - Saldo de empregos formais por região, julho a setembro de 2026

Fonte: elaborado pelo autor com dados do Novo CAGED/MTE (2026).

## Exportação para outros formatos

Por fim, o DuckDB permite exportar qualquer consulta diretamente para Parquet ou CSV, o que facilita o compartilhamento de recortes com quem não utiliza o banco:

``` python
con.sql("""
    COPY (SELECT * FROM caged_mov WHERE uf = 24)
    TO 'caged_rn_2026t3.parquet' (FORMAT parquet)
""")
```

``` python
con.close()
```

Em suma, o `caged.duckdb` funciona como um ponto de encontro entre linguagens: o `datacaged` cuida do download, da padronização e da atualização dos microdados, e o Python, ou qualquer outra ferramenta compatível com DuckDB, realiza a análise sobre o mesmo arquivo, sem duplicação de dados.

> **NOTE:**
>
> Os exemplos deste blog utilizam ferramentas abertas desenvolvidas no grupo GECOMT, como o pacote [datacaged](../../../producao-tecnica/index.llms.md#datacaged), que dá acesso aos microdados do emprego formal. Para análises aplicadas à realidade de uma organização, como diagnósticos do mercado de trabalho, referências salariais ou previsões, veja a página de [Consultoria e parcerias](../../../parcerias/index.llms.md).

De volta ao topo

## Citação

Por favor, cite este trabalho como:

PRADO, Alexsandro. **Dados do datacaged em Python: consultando o caged.duckdb**. **Blog de Alexsandro Prado**, 16 nov. 2026. Disponível em: \<<https://alexsandroprado.site/blog/posts/datacaged-python/>\>
