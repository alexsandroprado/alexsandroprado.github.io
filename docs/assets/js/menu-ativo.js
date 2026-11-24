// Destaca o menu pai (Pesquisa, Ensino) da página atual,
// inclusive em subpáginas como os posts do blog e as notas de Novidades
document.addEventListener("DOMContentLoaded", function () {
  var atual = window.location.pathname.replace(/index\.html$/, "");
  document.querySelectorAll(".navbar .dropdown-menu a.dropdown-item").forEach(function (a) {
    var alvo = new URL(a.href, window.location.href).pathname.replace(/index\.html$/, "");
    if (alvo !== "/" && atual.indexOf(alvo) === 0) {
      var pai = a.closest(".dropdown");
      if (pai) {
        var link = pai.querySelector(".nav-link.dropdown-toggle");
        if (link) { link.classList.add("active"); link.setAttribute("aria-current", "page"); }
      }
    }
  });

  // Itens de primeiro nível (Blog): mantém o destaque também nos posts
  document.querySelectorAll(".navbar .navbar-nav > .nav-item > a.nav-link:not(.dropdown-toggle)").forEach(function (a) {
    var alvo = new URL(a.href, window.location.href).pathname.replace(/index\.html$/, "");
    if (alvo !== "/" && atual.indexOf(alvo) === 0) {
      a.classList.add("active");
      a.setAttribute("aria-current", "page");
    }
  });

  // Descrições curtas nos itens dos menus suspensos
  var descricoes = {
    "/pesquisa/": "Temas, projetos e o grupo GECOMT",
    "/publicacoes/": "Artigos, capítulos e eventos com Qualis",
    "gecomt.github.io/dashboard/": "PNAD Contínua, CAGED e RAIS, com atualização semanal",
    "/ensino/": "Graduação, pós-graduação e materiais de aula",
    "/ensino/#orientacao": "TCCs e dissertações orientados",
    "/extensao/": "Projetos, cursos e eventos"
  };
  document.querySelectorAll(".navbar .dropdown-menu a.dropdown-item").forEach(function (a) {
    var u = new URL(a.href, window.location.href);
    var chave = u.host === window.location.host
      ? u.pathname.replace(/index\.html$/, "") + u.hash
      : u.host + u.pathname;
    var txt = a.querySelector(".dropdown-text");
    if (descricoes[chave] && txt && !txt.querySelector(".dd-desc")) {
      var d = document.createElement("small");
      d.className = "dd-desc";
      d.textContent = descricoes[chave];
      txt.appendChild(d);
    }
    if (u.host !== window.location.host) {
      a.target = "_blank";
      a.rel = "noopener";
      a.classList.add("dd-externo");
    }
  });

  // Barra mais compacta e translúcida ao rolar a página
  var cab = document.getElementById("quarto-header");
  if (cab) {
    var marca = function () { cab.classList.toggle("cab-rolado", window.scrollY > 12); };
    window.addEventListener("scroll", marca, { passive: true });
    marca();
  }

  // Item Parcerias com contorno (estilo em styles.scss)
  document.querySelectorAll(".navbar .navbar-nav > .nav-item > a.nav-link:not(.dropdown-toggle)").forEach(function (a) {
    if (new URL(a.href, window.location.href).pathname.indexOf("/parcerias/") !== -1) {
      a.classList.add("nav-destaque");
    }
  });
});
