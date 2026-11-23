// Recursos dos posts do blog: barra de progresso de leitura, compartilhamento,
// caixa de autoria e posts relacionados (a partir do feed RSS do blog).
(function () {
  if (!document.body.classList.contains("post")) return;

  const main = document.getElementById("quarto-document-content");
  if (!main) return;

  // ── Barra de progresso de leitura ──
  const barra = document.createElement("div");
  barra.className = "leitura-progresso";
  barra.setAttribute("aria-hidden", "true");
  document.body.appendChild(barra);
  const atualiza = () => {
    const r = main.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
    barra.style.transform = "scaleX(" + p + ")";
  };
  window.addEventListener("scroll", atualiza, {passive: true});
  window.addEventListener("resize", atualiza);
  atualiza();

  const url = location.origin + location.pathname;
  const titulo = (document.querySelector("h1.title") || {}).textContent || document.title;
  const aqui = location.pathname.replace(/index\.html$/, "");
  const apendice = document.getElementById("quarto-appendix");
  const insere = (el) => apendice ? apendice.parentNode.insertBefore(el, apendice) : main.appendChild(el);

  // ── Compartilhar e autoria ──
  const enc = encodeURIComponent;
  const bloco = document.createElement("section");
  bloco.className = "post-fim";
  bloco.innerHTML = `
    <div class="post-compartilhar">
      <span class="pc-rotulo">Compartilhe</span>
      <a class="pc-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}" target="_blank" rel="noopener" aria-label="Compartilhar no LinkedIn"><i class="bi bi-linkedin"></i> LinkedIn</a>
      <a class="pc-btn" href="https://wa.me/?text=${enc(titulo.trim() + " " + url)}" target="_blank" rel="noopener" aria-label="Compartilhar no WhatsApp"><i class="bi bi-whatsapp"></i> WhatsApp</a>
      <button type="button" class="pc-btn pc-copiar" aria-label="Copiar link do post"><i class="bi bi-link-45deg"></i> <span>Copiar link</span></button>
    </div>
    <div class="post-autor">
      <img src="/images/avatar.webp" alt="Foto de Alexsandro Prado" width="72" height="72" loading="lazy">
      <div>
        <p class="pa-nome">Alexsandro Prado</p>
        <p class="pa-bio">Professor Adjunto do curso de Ciências Contábeis da UFERSA e do PPGA/UFERSA. Doutor em Economia (UFPB), coordena o grupo GECOMT e desenvolve pacotes em R para dados públicos do mercado de trabalho.</p>
        <p class="pa-links"><a href="/index.html">Sobre</a> · <a href="/producao-tecnica/index.html">Produção técnica</a> · <a href="/parcerias/index.html">Parcerias</a> · <a href="https://www.linkedin.com/in/alexsandroprado/" target="_blank" rel="noopener">LinkedIn</a></p>
      </div>
    </div>`;
  insere(bloco);
  bloco.querySelector(".pc-copiar").addEventListener("click", (ev) => {
    const b = ev.currentTarget;
    navigator.clipboard.writeText(url).then(() => {
      b.querySelector("span").textContent = "Link copiado";
      setTimeout(() => { b.querySelector("span").textContent = "Copiar link"; }, 1800);
    });
  });

  // ── Posts relacionados (categorias em comum, depois os mais recentes) ──
  const minhas = new Set([...document.querySelectorAll(".quarto-category")].map((c) => c.textContent.trim()));
  fetch("/blog/index.xml").then((r) => r.ok ? r.text() : Promise.reject()).then((xml) => {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const posts = [...doc.querySelectorAll("item")].map((it, ordem) => {
      const link = it.querySelector("link").textContent.trim();
      const cats = [...it.querySelectorAll("category")].map((c) => c.textContent.trim());
      const img = it.getElementsByTagNameNS("http://search.yahoo.com/mrss/", "content")[0];
      return {
        link: new URL(link).pathname,
        titulo: it.querySelector("title").textContent,
        cats,
        img: img ? new URL(img.getAttribute("url")).pathname : null,
        data: new Date(it.querySelector("pubDate").textContent),
        comum: cats.filter((c) => minhas.has(c)).length,
        ordem
      };
    }).filter((p) => p.link !== aqui);
    const sel = posts.sort((a, b) => b.comum - a.comum || a.ordem - b.ordem).slice(0, 3);
    if (!sel.length) return;
    const fmt = new Intl.DateTimeFormat("pt-BR", {day: "numeric", month: "short", year: "numeric"});
    const sec = document.createElement("section");
    sec.className = "post-relacionados";
    sec.innerHTML = `<h2 class="pr-titulo">Leia também</h2><div class="pr-grade">` + sel.map((p) => `
      <a class="pr-card" href="${p.link}">
        ${p.img ? `<img src="${p.img}" alt="" loading="lazy">` : ""}
        <span class="pr-cat">${p.cats.slice(0, 2).join(" · ")}</span>
        <span class="pr-nome">${p.titulo}</span>
        <span class="pr-data">${fmt.format(p.data).replace(" de ", " ").replace(" de ", " ").replace(".", "")}</span>
      </a>`).join("") + `</div>`;
    insere(sec);
  }).catch(() => {});
})();
