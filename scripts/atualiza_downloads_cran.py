"""Atualiza os downloads dos pacotes no CRAN exibidos na página Produção técnica.

Consulta a API pública do cranlogs (RStudio/Posit CRAN mirror) e grava:

- producao-tecnica/dados/cran_downloads.csv: total e últimos 30 dias por pacote;
- producao-tecnica/dados/cran_downloads_mensal.csv: downloads por mês.

Os arquivos também são copiados para docs/, de modo que o site publicado leia
os dados novos sem renderizar o Quarto. Usa só a biblioteca padrão do Python.

Uso local:      python3 scripts/atualiza_downloads_cran.py
Uso automático: .github/workflows/downloads-cran.yml (semanal)
"""

import csv
import datetime as dt
import json
import shutil
import urllib.request
from collections import OrderedDict
from pathlib import Path

PACOTES = ["datacaged"]
INICIO = "2020-01-01"
API = "https://cranlogs.r-pkg.org/downloads"
DESTINO = Path("producao-tecnica/dados")
SITE = Path("docs/producao-tecnica/dados")


def consulta(caminho):
    req = urllib.request.Request(f"{API}/{caminho}", headers={"User-Agent": "alexsandroprado.site"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.load(resp)


def main():
    hoje = dt.date.today()
    fim = (hoje - dt.timedelta(days=1)).isoformat()
    resumo, mensal = [], []

    for pacote in PACOTES:
        diario = consulta(f"daily/{INICIO}:{fim}/{pacote}")[0]["downloads"]
        por_mes = OrderedDict()
        for d in diario:
            mes = d["day"][:7]
            por_mes[mes] = por_mes.get(mes, 0) + int(d["downloads"])
        # descarta os meses iniciais sem downloads (antes da publicação)
        while por_mes and next(iter(por_mes.values())) == 0:
            por_mes.popitem(last=False)

        ultimo_mes = consulta(f"total/last-month/{pacote}")[0]["downloads"]
        resumo.append({
            "pacote": pacote,
            "total": sum(por_mes.values()),
            "ultimos_30_dias": ultimo_mes,
            "primeiro_mes": next(iter(por_mes), ""),
            "atualizado_em": hoje.isoformat(),
        })
        mensal += [{"pacote": pacote, "mes": m, "downloads": n} for m, n in por_mes.items()]

    DESTINO.mkdir(parents=True, exist_ok=True)
    for nome, linhas in [("cran_downloads.csv", resumo), ("cran_downloads_mensal.csv", mensal)]:
        arq = DESTINO / nome
        with arq.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=list(linhas[0].keys()))
            w.writeheader()
            w.writerows(linhas)
        if SITE.parent.exists():
            SITE.mkdir(parents=True, exist_ok=True)
            shutil.copy(arq, SITE / nome)
        print(f"{arq}: {len(linhas)} linha(s)")


if __name__ == "__main__":
    main()
