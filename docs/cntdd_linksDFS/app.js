/* ============================================================
 * app.js
 * REPOSITÓRIO DE DOCUMENTOS DE COMPANHIAS — CVM
 *
 * Versão estática do app.R (Shiny) para o GitHub Pages.
 * Os dados vêm de docs/dados/*.json, gerados pelo exportarSite.R.
 *
 * Empresa e ano permanecem selecionados ao trocar a categoria.
 * O filtro de empresa utiliza DENOM_CIA.
 * ============================================================ */

(function () {
  'use strict';

  var PASTA_DADOS = 'dados/';

  var CABECALHOS = [
    'CNPJ',
    'Data de\nReferência',
    'Versão',
    'Razão Social',
    'Código\nCVM',
    'Data de\nRecebimento',
    'Baixar\nDocs',
    'Abrir\nDocs'
  ];

  var meta = null;          // meta.json
  var cache = {};           // categoria -> dados colunares
  var tabela = null;        // instância do DataTables
  var tsEmpresas = null;    // Tom Select de empresas
  var tsAnos = null;        // Tom Select de anos
  var silencioso = false;   // evita atualizações durante "Limpar filtros"
  var requisicao = 0;       // descarta respostas antigas ao trocar rápido

  var $ = function (id) { return document.getElementById(id); };


  /* ---------- Funções auxiliares ---------- */

  function escapar(texto) {
    return String(texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // "2024-12-31" -> "31/12/2024"
  function formatarData(iso) {
    if (!iso) return '';
    return iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4);
  }

  function formatarNumero(n) {
    return n.toLocaleString('pt-BR');
  }

  function montarUrls(id, categoria) {
    var baixar =
      'http://www.rad.cvm.gov.br/ENETCONSULTA/' +
      'frmDownloadDocumento.aspx?' +
      'CodigoInstituicao=1&NumeroSequencialDocumento=' + id;

    // Governança utiliza um visualizador específico.
    var abrir = categoria === 'GOVERNANCA'
      ? 'https://www.rad.cvm.gov.br/ENETWEB/' +
        'frmExibirCodigoGovernancaExt.aspx?' +
        'NumeroSequencialDocumento=' + id + '&CodigoInstituicao=1'
      : 'https://www.rad.cvm.gov.br/ENETWEB/' +
        'frmGerenciaPaginaFRE.aspx?' +
        'NumeroSequencialDocumento=' + id + '&CodigoTipoInstituicao=1';

    return { baixar: baixar, abrir: abrir };
  }

  function criarLink(url, texto) {
    return '<a href="' + escapar(url) +
      '" target="_blank" rel="noopener noreferrer">' +
      escapar(texto) + '</a>';
  }

  function renderLink(tipo) {
    // tipo: "baixar" ou "abrir"
    return function (id, modo, linha) {
      var categoria = linha[7];
      var url = montarUrls(id, categoria)[tipo];
      var texto = (tipo === 'baixar' ? 'Baixar ' : 'Abrir ') + categoria;
      if (modo === 'display') return criarLink(url, texto);
      // Busca: considera o texto e o endereço (como no DT).
      return texto + ' ' + url;
    };
  }

  function carregarJSON(arquivo) {
    return fetch(PASTA_DADOS + arquivo, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' ao ler ' + arquivo);
        return r.json();
      });
  }

  function carregarCategoria(categoria) {
    if (cache[categoria]) return Promise.resolve(cache[categoria]);
    return carregarJSON(categoria.toLowerCase() + '.json').then(function (d) {
      // Ano de referência pré-calculado para o filtro.
      d.ano = d.refer.map(function (x) { return +x.slice(0, 4); });
      cache[categoria] = d;
      return d;
    });
  }


  /* ---------- Filtragem ---------- */

  function filtrar(d, categoria) {
    var apenasAtual = $('atual').checked;

    var empresasSel = tsEmpresas.getValue();
    var anosSel = tsAnos.getValue();

    var filtroEmpresas = null;
    if (empresasSel.length) {
      filtroEmpresas = {};
      empresasSel.forEach(function (nome) {
        var i = meta.indiceEmpresa[nome];
        if (i !== undefined) filtroEmpresas[i] = true;
      });
    }

    var filtroAnos = null;
    if (anosSel.length) {
      filtroAnos = {};
      anosSel.forEach(function (a) { filtroAnos[+a] = true; });
    }

    var linhas = [];
    var cnpjs = {};
    var anos = {};

    for (var i = 0; i < d.n; i++) {
      if (apenasAtual && !d.atual[i]) continue;
      if (filtroEmpresas && !filtroEmpresas[d.e[i]]) continue;
      if (filtroAnos && !filtroAnos[d.ano[i]]) continue;

      cnpjs[d.cnpj[i]] = true;
      anos[d.ano[i]] = true;

      linhas.push([
        d.cnpj[i],
        formatarData(d.refer[i]),
        d.versao[i],
        meta.empresas[d.e[i]],
        d.cvm[i],
        formatarData(d.receb[i]),
        d.id[i],
        categoria
      ]);
    }

    return {
      linhas: linhas,
      nEmpresas: Object.keys(cnpjs).length,
      nAnos: Object.keys(anos).length
    };
  }


  /* ---------- Atualização da tela ---------- */

  function atualizar() {
    if (silencioso || !meta) return;

    var categoria = $('categoria').value;
    var minhaRequisicao = ++requisicao;

    $('titulo_tabela').textContent = 'Documentos disponíveis — ' + categoria;

    if (!cache[categoria]) {
      $('resumo').textContent = 'Carregando documentos de ' + categoria + '…';
    }

    carregarCategoria(categoria).then(function (d) {
      if (minhaRequisicao !== requisicao) return;

      var r = filtrar(d, categoria);

      if (!r.linhas.length) {
        $('resumo').textContent =
          'Nenhum documento de ' + categoria +
          ' para os filtros selecionados. ' +
          'As seleções de empresa e ano foram mantidas.';
      } else {
        $('resumo').textContent =
          formatarNumero(r.linhas.length) + ' documentos | ' +
          formatarNumero(r.nEmpresas) + ' empresas | ' +
          r.nAnos + ' anos de referência';
      }

      tabela.clear();
      tabela.rows.add(r.linhas);
      tabela.page('first').draw(false);
    }).catch(function (erro) {
      if (minhaRequisicao !== requisicao) return;
      console.error(erro);
      $('resumo').textContent =
        'Não foi possível carregar os documentos de ' + categoria +
        '. Recarregue a página. (' + erro.message + ')';
      tabela.clear().draw();
    });
  }


  /* ---------- Inicialização ---------- */

  function criarTabela() {
    tabela = new DataTable('#tabela', {
      data: [],
      deferRender: true,
      columns: [
        { title: CABECALHOS[0], render: DataTable.render.text() },
        { title: CABECALHOS[1], render: DataTable.render.text() },
        { title: CABECALHOS[2], render: DataTable.render.text() },
        { title: CABECALHOS[3], render: DataTable.render.text() },
        { title: CABECALHOS[4], render: DataTable.render.text(), type: 'string' },
        { title: CABECALHOS[5], render: DataTable.render.text() },
        { title: CABECALHOS[6], data: 6, render: renderLink('baixar') },
        { title: CABECALHOS[7], data: 6, render: renderLink('abrir') }
      ],
      columnDefs: [
        { targets: [6, 7], className: 'dt-center', width: '110px' },
        { targets: [0, 1, 5], className: 'dt-nowrap' }
      ],
      pageLength: 10,
      lengthMenu: [10, 15, 25, 50, 100],
      pagingType: 'simple_numbers',
      scrollX: true,
      ordering: false,
      autoWidth: true,
      language: {
        search: 'Buscar na tabela:',
        lengthMenu: 'Mostrar _MENU_ registros',
        info: 'Exibindo _START_ a _END_ de _TOTAL_ documentos',
        infoEmpty: 'Nenhum documento disponível',
        zeroRecords: 'Nenhum documento encontrado',
        emptyTable: 'Nenhum documento para a categoria, empresa e ano selecionados.',
        infoFiltered: '(filtrados de _MAX_ documentos)',
        processing: 'Processando...',
        loadingRecords: 'Carregando...',
        thousands: '.',
        decimal: ',',
        paginate: {
          first: 'Primeira',
          last: 'Última',
          previous: 'Anterior',
          next: 'Próxima'
        },
        aria: {
          paginate: {
            first: 'Primeira',
            last: 'Última',
            previous: 'Anterior',
            next: 'Próxima'
          }
        }
      }
    });
  }

  function criarFiltros() {
    // Categoria
    var sel = $('categoria');
    meta.categorias.forEach(function (c) {
      var op = document.createElement('option');
      op.value = c;
      op.textContent = c;
      sel.appendChild(op);
    });
    sel.value = meta.categorias[0];

    // Empresa (DENOM_CIA)
    tsEmpresas = new TomSelect('#empresas', {
      options: meta.empresas.map(function (n) { return { value: n, text: n }; }),
      maxOptions: null,
      plugins: ['remove_button'],
      hidePlaceholder: false,
      closeAfterSelect: false,
      onChange: atualizar,
      render: {
        no_results: function () {
          return '<div class="no-results">Nenhuma empresa encontrada</div>';
        }
      }
    });

    // Ano de referência
    tsAnos = new TomSelect('#anos', {
      options: meta.anos.map(function (a) { return { value: String(a), text: String(a) }; }),
      maxOptions: null,
      plugins: ['remove_button'],
      hidePlaceholder: false,
      sortField: [{ field: 'value', direction: 'desc' }],
      onChange: atualizar
    });

    sel.addEventListener('change', atualizar);
    $('atual').addEventListener('change', atualizar);

    // Limpa empresa e ano, mantém a categoria e restaura a última versão.
    $('limpar_filtros').addEventListener('click', function () {
      silencioso = true;
      tsEmpresas.clear(true);
      tsAnos.clear(true);
      $('atual').checked = true;
      silencioso = false;
      atualizar();
    });

    $('atualizado').textContent = 'Atualizado em ' + meta.atualizado + '.';
  }

  function iniciar() {
    criarTabela();

    carregarJSON('meta.json').then(function (m) {
      meta = m;
      meta.indiceEmpresa = {};
      meta.empresas.forEach(function (n, i) { meta.indiceEmpresa[n] = i; });
      criarFiltros();
      atualizar();
    }).catch(function (erro) {
      console.error(erro);
      $('resumo').textContent =
        'Não foi possível carregar a base. Recarregue a página. (' + erro.message + ')';
    });
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
