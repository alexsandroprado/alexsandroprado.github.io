// Destaca o menu pai (Ensino, Pesquisa, Extensão) da página atual,
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
});
