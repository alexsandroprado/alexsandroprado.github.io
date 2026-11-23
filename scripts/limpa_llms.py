"""Limpa os arquivos .llms.md gerados pelo Quarto (opção llms-txt).

Executado automaticamente após cada renderização (post-render em _quarto.yml):

- remove blocos de código OJS (```js), que só fazem sentido no navegador;
- remove rótulos de botões da interface ("Copiar referência" e a busca no
  Google Acadêmico de cada publicação);
- em Publicações, remove a lista de autores em texto simples que precede cada
  referência (ela existe no HTML apenas para a busca da página);
- apaga 404.llms.md, que não tem conteúdo útil.

Só usa a biblioteca padrão do Python.
"""

import os
import re
from pathlib import Path

SAIDA = Path(os.environ.get("QUARTO_PROJECT_OUTPUT_DIR", "docs"))
PUBS = Path("publicacoes/publicacoes.yml")

BLOCO_JS = re.compile(r"\n``` ?js\n.*?\n```\n", re.S)
ROTULOS = re.compile(
    r"^\s*(?:Copiar referência|\[ ?Google Acadêmico\]\(https://scholar\.google\.com/scholar\?q=.*)$\n?",
    re.M)


def autores_simples():
    if not PUBS.exists():
        return []
    texto = PUBS.read_text(encoding="utf-8")
    valores = []
    for m in re.finditer(r"^  author:\s*(.+?)\s*$", texto, re.M):
        v = m.group(1)
        if len(v) > 1 and v[0] == v[-1] and v[0] in "'\"":
            v = v[1:-1].replace("''", "'")
        valores.append(v)
    # os mais longos primeiro, para não cortar um nome que contém outro
    return sorted(set(valores), key=len, reverse=True)


def main():
    if not SAIDA.exists():
        return
    (SAIDA / "404.llms.md").unlink(missing_ok=True)
    autores = autores_simples()
    for arq in SAIDA.rglob("*.llms.md"):
        txt = arq.read_text(encoding="utf-8")
        novo = BLOCO_JS.sub("\n", txt)
        novo = ROTULOS.sub("", novo)
        if arq.parent.name == "publicacoes":
            # Painel interativo (gráfico SVG e botões de filtro) não interessa a LLMs
            novo = re.sub(r"!\[\]\(data:image/svg\+xml;base64,[^)]*\)\n.*?\n\d+ publicações\n", "", novo, flags=re.S)
            linhas = []
            for linha in novo.split("\n"):
                for a in autores:
                    if linha.startswith(a + " "):
                        linha = linha[len(a) + 1:]
                        break
                linhas.append(linha)
            novo = "\n".join(linhas)
        novo = re.sub(r"\n{3,}", "\n\n", novo)
        if novo != txt:
            arq.write_text(novo, encoding="utf-8")


if __name__ == "__main__":
    main()
