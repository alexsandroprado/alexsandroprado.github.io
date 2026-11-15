"""Procura no ORCID e no Crossref publicações que ainda não estão no site.

Compara os trabalhos do ORCID 0000-0002-7072-3621 (e os registros do Crossref
vinculados a esse ORCID) com publicacoes/publicacoes.yml, pelo DOI e, na falta
dele, pelo título. Para cada trabalho novo com DOI, monta um item já no
formato do arquivo (autores e veículo no padrão ABNT, a partir do Crossref).

Os itens não são incluídos automaticamente: o resultado vai para uma issue no
GitHub, para conferência (Qualis, nomes dos coautores, versões duplicadas).
DOIs ou títulos que não devem ser sugeridos de novo ficam em
publicacoes/orcid-ignorar.txt.

Uso local:      python3 scripts/verifica_publicacoes_orcid.py
Uso automático: .github/workflows/publicacoes-orcid.yml (mensal); grava o
                corpo da issue em orcid-novidades.md quando há novidades.
Só usa a biblioteca padrão do Python.
"""

import difflib
import html
import json
import re
import sys
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

ORCID = "0000-0002-7072-3621"
ARQ_PUBS = Path("publicacoes/publicacoes.yml")
ARQ_IGNORAR = Path("publicacoes/orcid-ignorar.txt")
SAIDA = Path("orcid-novidades.md")
UA = {"User-Agent": "alexsandroprado.site (https://alexsandroprado.site)",
      "Accept": "application/json"}
TIPOS = {
    "journal-article": "Artigo em periódico",
    "proceedings-article": "Trabalho em evento",
    "conference-paper": "Trabalho em evento",
    "book-chapter": "Capítulo de livro",
}


def get_json(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def norm(texto):
    t = unicodedata.normalize("NFKD", texto or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", t).strip()


def doi_norm(d):
    return re.sub(r"^https?://(dx\.)?doi\.org/", "", (d or "").strip().lower())


def existentes():
    texto = ARQ_PUBS.read_text(encoding="utf-8")
    dois = {doi_norm(m) for m in re.findall(r"^\s*doi:\s*(\S+)", texto, re.M)}
    titulos = {norm(m.strip("'\"")) for m in re.findall(r"^- title:\s*(.+)$", texto, re.M)}
    ignorar = set()
    if ARQ_IGNORAR.exists():
        for linha in ARQ_IGNORAR.read_text(encoding="utf-8").splitlines():
            linha = linha.split("  #")[0].strip()
            if not linha or linha.startswith("#"):
                continue
            if linha.lower().startswith("titulo:"):
                ignorar.add(norm(linha.split(":", 1)[1]))
            else:
                ignorar.add(doi_norm(linha))
    return dois, titulos, ignorar


def ja_tem_titulo(titulo, titulos):
    """Compara títulos tolerando pequenas diferenças (acentos mal codificados)."""
    t = norm(titulo)
    if t in titulos:
        return True
    return any(difflib.SequenceMatcher(None, t, x).ratio() >= 0.9 for x in titulos)


def trabalhos_orcid():
    dados = get_json(f"https://pub.orcid.org/v3.0/{ORCID}/works")
    saida = []
    for g in dados.get("group", []):
        s = g["work-summary"][0]
        dois = [e["external-id-value"] for e in g["external-ids"]["external-id"]
                if e["external-id-type"] == "doi"]
        ano = ((s.get("publication-date") or {}).get("year") or {}).get("value")
        saida.append({"doi": doi_norm(dois[0]) if dois else "",
                      "titulo": s["title"]["title"]["value"],
                      "ano": ano, "tipo": s.get("type", "")})
    return saida


def trabalhos_crossref():
    url = ("https://api.crossref.org/works?rows=200&filter=orcid:" + ORCID +
           "&select=DOI,title,type,issued")
    try:
        itens = get_json(url)["message"]["items"]
    except Exception as e:  # o Crossref é complementar; falha não interrompe
        print(f"Aviso: Crossref indisponível ({e})", file=sys.stderr)
        return []
    return [{"doi": doi_norm(i["DOI"]), "titulo": (i.get("title") or [""])[0],
             "ano": str((i.get("issued", {}).get("date-parts") or [[None]])[0][0] or ""),
             "tipo": i.get("type", "")} for i in itens]


def abnt_autor(a):
    fam = (a.get("family") or "").strip()
    dado = (a.get("given") or "").strip()
    iniciais = " ".join(p[0].upper() + "." for p in re.split(r"[\s\-]+", dado)
                        if p and p.lower() not in {"da", "de", "do", "das", "dos", "e"})
    nome = f"{fam.upper()}, {iniciais}".strip(", ")
    eu = norm(fam) == "prado" and "alex" in norm(dado)
    return nome, eu


def item_yaml(doi, tipo_orcid):
    m = get_json("https://api.crossref.org/works/" + urllib.parse.quote(doi))["message"]
    titulo = re.sub(r"<[^>]+>", "", " ".join((m.get("title") or [""])[0].split()))
    ano = str((m.get("issued", {}).get("date-parts") or [[""]])[0][0])
    nomes, abnt = [], []
    for a in m.get("author", []):
        nome, eu = abnt_autor(a)
        nomes.append(nome)
        abnt.append(f"<strong>{nome}</strong>" if eu else nome)
    revista = html.escape((m.get("container-title") or [""])[0])
    partes = [f"<strong><em>{revista}</em></strong>"] if revista else []
    if m.get("volume"):
        partes.append(f"v. {m['volume']}")
    if m.get("issue"):
        partes.append(f"n. {m['issue']}")
    if m.get("page"):
        partes.append(f"p. {m['page']}")
    partes.append(ano)
    categoria = TIPOS.get(m.get("type"), TIPOS.get(tipo_orcid, "Artigo em periódico"))
    q = lambda s: "'" + s.replace("'", "''") + "'"
    return "\n".join([
        f"- title: {q(titulo)}",
        f"  date: '{ano}-01-01'",
        f"  author: {q('; '.join(nomes))}",
        f"  autores: {q('; '.join(abnt))}",
        f"  veiculo: {q(', '.join(partes))}",
        "  categories:",
        f"  - {categoria}",
        f"  doi: {doi}",
        f"  path: https://doi.org/{doi}",
        "  # qualis: (conferir o estrato)",
    ])


def main():
    dois, titulos, ignorar = existentes()
    vistos, novos = set(), []
    for t in trabalhos_orcid() + trabalhos_crossref():
        chave = t["doi"] or norm(t["titulo"])
        if not chave or chave in vistos:
            continue
        vistos.add(chave)
        if t["doi"] and (t["doi"] in dois or t["doi"] in ignorar):
            continue
        if norm(t["titulo"]) in ignorar or ja_tem_titulo(t["titulo"], titulos):
            continue
        if t["tipo"] not in TIPOS:  # pacotes, bases de dados etc.: Produção técnica
            continue
        novos.append(t)

    if not novos:
        print("Nenhuma publicação nova no ORCID.")
        SAIDA.unlink(missing_ok=True)
        return

    linhas = [
        "Trabalhos encontrados no ORCID ou no Crossref que ainda não estão em "
        "`publicacoes/publicacoes.yml`.",
        "",
        "Para incluir: confira os dados (nomes dos coautores, Qualis, versões "
        "duplicadas do mesmo artigo) e copie o item para o início do arquivo. "
        "Para não ver um DOI de novo, acrescente-o em `publicacoes/orcid-ignorar.txt`.",
        "",
    ]
    for t in novos:
        linhas.append(f"### {t['titulo']} ({t['ano'] or 's.d.'})")
        if t["doi"]:
            try:
                linhas += ["", "```yaml", item_yaml(t["doi"], t["tipo"]), "```", ""]
            except Exception as e:
                linhas += ["", f"DOI {t['doi']} (não foi possível ler o Crossref: {e})", ""]
        else:
            linhas += ["", "Sem DOI no ORCID; incluir manualmente se for o caso.", ""]
    SAIDA.write_text("\n".join(linhas), encoding="utf-8")
    print(f"{len(novos)} trabalho(s) novo(s); detalhes em {SAIDA}")


if __name__ == "__main__":
    main()
