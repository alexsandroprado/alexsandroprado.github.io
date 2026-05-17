# Alexsandro Prado — Blog Pessoal

> Econometria, Data Science e Contabilidade — análises aplicadas com R.

Site pessoal e blog acadêmico construído com [Quarto](https://quarto.org/) e publicado via GitHub Pages.

🌐 **[alexsandroprado.github.io](https://alexsandroprado.github.io/)**

---

## Sobre

Blog de Alexsandro Prado, professor do magistério superior há 12 anos nas áreas de Ciências Contábeis, Administração e TIC. Doutor em Economia Aplicada (UFPB). Conteúdo focado em análise de dados com R, econometria aplicada e contabilidade.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | [Quarto](https://quarto.org/) |
| Tema base | United (light) / Cyborg (dark) |
| Tipografia | Space Grotesk + JetBrains Mono |
| Estilo | SCSS customizado (`styles.scss` + `styles-dark.scss`) |
| Hospedagem | GitHub Pages |
| Analytics | Google Tag Manager |
| Comentários | Giscus (a configurar) |

---

## Estrutura

```
.
├── _quarto.yml              # Configuração principal do site
├── styles.scss              # Tema light (SCSS — Posit/Quarto best practices)
├── styles-dark.scss         # Overrides para dark mode
├── header.html              # GTM + Academicons + Font Awesome
├── index.qmd                # Página inicial (about / trestles)
├── 404.qmd                  # Página de erro
├── blog/
│   ├── index.qmd            # Listing do blog (grid 3 colunas)
│   └── posts/
│       ├── _metadata.yml    # Metadados padrão dos posts
│       ├── contabdata/
│       ├── cpcVersusReceita/
│       ├── heterocedasticidade/
│       ├── preditiva/
│       └── sobrevivencia/
├── images/                  # Logo e fotos
├── artigos/                 # Seção futura (excluída do render)
├── ensino/                  # Seção futura (excluída do render)
├── palestras/               # Seção futura (excluída do render)
└── software/                # Seção futura (excluída do render)
```

---

## Como rodar localmente

**Pré-requisitos:** [Quarto CLI](https://quarto.org/docs/get-started/) instalado.

```bash
# Clonar o repositório
git clone https://github.com/alexsandroprado/alexsandroprado.github.io.git
cd alexsandroprado.github.io

# Pré-visualizar com hot-reload
quarto preview

# Renderizar para produção
quarto render
```

O site renderizado fica em `docs/` e é servido pelo GitHub Pages.

---

## Como publicar um novo post

1. Crie uma pasta em `blog/posts/nome-do-post/`
2. Adicione o arquivo `nome-do-post.qmd` com o front matter:

```yaml
---
title: "Título do Post"
date: "YYYY-MM-DD"
author: "Alexsandro Prado"
categories:
  - econometria   # ou: contabilidade, datascience, R
image: nome-do-post.png
---
```

3. Escreva o conteúdo em Markdown/R abaixo do `---`
4. Rode `quarto render` e faça push

---

## Configurações pendentes

### Giscus (comentários)
Para ativar os comentários nos posts:

1. Acesse [giscus.app](https://giscus.app/)
2. Habilite **GitHub Discussions** no repositório (Settings → Features → Discussions)
3. Configure o repositório em giscus.app e copie o `repo-id` e `category-id`
4. Descomente e preencha o bloco no `_quarto.yml`:

```yaml
comments:
  giscus:
    repo: alexsandroprado/alexsandroprado.github.io
    repo-id: "SEU_REPO_ID"
    category: "Announcements"
    category-id: "SEU_CATEGORY_ID"
    mapping: "pathname"
    reactions-enabled: true
    loading: lazy
```

### Google Analytics (GA4)
O GTM (`GTM-T9KC9QL7`) já está configurado em `header.html`. Para adicionar GA4, configure uma tag dentro do GTM.

---

## Licença

O conteúdo dos posts é de autoria de Alexsandro Prado. O código do tema e configurações é de uso livre.
