# Atualiza o indicador de emprego formal exibido na página Pesquisa.
#
# Lê producao-tecnica/dados/caged_saldo.csv, identifica no repositório do CAGED
# (Hugging Face) as competências ainda ausentes, agrega admissões,
# desligamentos e saldo (Novo CAGED, arquivo de movimentações no prazo)
# para Brasil, Rio Grande do Norte e Mossoró e acrescenta as linhas novas.
# Ao final, copia o CSV para docs/, de modo que o site publicado leia os
# dados atualizados sem precisar renderizar o Quarto novamente.
#
# Uso local:  Rscript scripts/atualiza_indicador_caged.R
# Uso automático: .github/workflows/indicador-caged.yml (mensal)

suppressPackageStartupMessages({
  library(datacaged)
  library(DBI)
  library(dplyr)
})

arq      <- "producao-tecnica/dados/caged_saldo.csv"
arq_site <- "docs/producao-tecnica/dados/caged_saldo.csv"

atual  <- read.csv(arq, colClasses = "character")
feitas <- unique(gsub("-", "", substr(atual$competencia, 1, 7)))

disp  <- caged_hf_files(n = 12, verbose = FALSE)
novas <- disp[!as.character(disp$competencia) %in% feitas, ]

if (nrow(novas) == 0) {
  message("Nenhuma competência nova no CAGED. Nada a atualizar.")
  quit(save = "no", status = 0)
}

message("Competências novas: ", paste(novas$competencia, collapse = ", "))

db <- file.path(tempdir(), "caged.duckdb")
for (i in seq_len(nrow(novas))) {
  caged_load(years = novas$ano[i], months = novas$mes[i], db_path = db)
}

con <- caged_connect(db)
on.exit(DBI::dbDisconnect(con, shutdown = TRUE), add = TRUE)

comps <- as.integer(novas$competencia)
mov   <- tbl(con, "caged_mov") |> filter(competenciamov %in% !!comps)

agrega <- function(df, rotulo) {
  df |>
    group_by(competenciamov) |>
    summarise(
      admissoes     = sum(if_else(saldomovimentacao == 1, 1L, 0L), na.rm = TRUE),
      desligamentos = sum(if_else(saldomovimentacao == -1, 1L, 0L), na.rm = TRUE),
      .groups = "drop"
    ) |>
    collect() |>
    mutate(recorte = rotulo)
}

novas_linhas <- bind_rows(
  agrega(mov, "Brasil"),
  agrega(filter(mov, uf == 24L), "Rio Grande do Norte"),
  agrega(filter(mov, municipio == 240800L), "Mossoró")
) |>
  mutate(
    competencia = sprintf("%s-%s-01",
                          substr(competenciamov, 1, 4),
                          substr(competenciamov, 5, 6)),
    saldo = admissoes - desligamentos
  ) |>
  select(competencia, recorte, admissoes, desligamentos, saldo)

saida <- bind_rows(
  mutate(atual, across(c(admissoes, desligamentos, saldo), as.integer)),
  novas_linhas
) |>
  distinct(competencia, recorte, .keep_all = TRUE) |>
  arrange(competencia, recorte)

write.csv(saida, arq, row.names = FALSE, fileEncoding = "UTF-8")
if (dir.exists(dirname(arq_site))) invisible(file.copy(arq, arq_site, overwrite = TRUE))

# ── Ocupações contábeis (CBO) ────────────────────────────────
# Contador 252210, Auditor 252205, Perito contábil 252215,
# Técnico de contabilidade 351105, Auxiliar de contabilidade 413110.
# Salário médio de admissão: admissões não intermitentes com salário
# entre R$ 500 e R$ 60.000 (soma e contagem, para médias exatas em
# qualquer período).
arq_cont      <- "producao-tecnica/dados/caged_contabil.csv"
arq_cont_site <- "docs/producao-tecnica/dados/caged_contabil.csv"

cbos <- c("252210" = "Contador", "252205" = "Auditor",
          "252215" = "Perito contábil", "351105" = "Técnico de contabilidade",
          "413110" = "Auxiliar de contabilidade")

mov_cont <- mov |> filter(cbo2002ocupacao %in% !!as.integer(names(cbos)))

agrega_cont <- function(df, rotulo) {
  df |>
    group_by(competenciamov, cbo2002ocupacao) |>
    summarise(
      admissoes     = sum(if_else(saldomovimentacao == 1, 1L, 0L), na.rm = TRUE),
      desligamentos = sum(if_else(saldomovimentacao == -1, 1L, 0L), na.rm = TRUE),
      salario_soma  = sum(if_else(saldomovimentacao == 1 & indtrabintermitente == 0 &
                                    salario >= 500 & salario <= 60000, salario, 0),
                          na.rm = TRUE),
      salario_n     = sum(if_else(saldomovimentacao == 1 & indtrabintermitente == 0 &
                                    salario >= 500 & salario <= 60000, 1L, 0L),
                          na.rm = TRUE),
      .groups = "drop"
    ) |>
    collect() |>
    mutate(recorte = rotulo)
}

novas_cont <- bind_rows(
  agrega_cont(mov_cont, "Brasil"),
  agrega_cont(filter(mov_cont, regiao == 2L), "Nordeste"),
  agrega_cont(filter(mov_cont, uf == 24L), "Rio Grande do Norte")
) |>
  mutate(
    competencia = sprintf("%s-%s-01",
                          substr(competenciamov, 1, 4),
                          substr(competenciamov, 5, 6)),
    ocupacao = unname(cbos[as.character(cbo2002ocupacao)]),
    saldo = admissoes - desligamentos,
    salario_soma = round(salario_soma, 2)
  ) |>
  select(competencia, recorte, ocupacao, admissoes, desligamentos, saldo,
         salario_soma, salario_n)

atual_cont <- read.csv(arq_cont, colClasses = "character", encoding = "UTF-8")
saida_cont <- bind_rows(
  mutate(atual_cont,
         across(c(admissoes, desligamentos, saldo, salario_n), as.integer),
         salario_soma = as.numeric(salario_soma)),
  novas_cont
) |>
  distinct(competencia, recorte, ocupacao, .keep_all = TRUE) |>
  arrange(competencia, recorte, ocupacao)

write.csv(saida_cont, arq_cont, row.names = FALSE, fileEncoding = "UTF-8")
if (dir.exists(dirname(arq_cont_site))) invisible(file.copy(arq_cont, arq_cont_site, overwrite = TRUE))

message("Indicadores atualizados até ", max(saida$competencia), ".")
