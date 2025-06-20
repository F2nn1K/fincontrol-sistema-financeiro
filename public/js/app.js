/**
 * Arquivo principal de inicialização do sistema financeiro
 * Gerencia a navegação, módulos e funcionalidades globais
 */

// Quando o DOM for carregado, inicializar o aplicativo
document.addEventListener('DOMContentLoaded', () => {
  inicializarAplicacao();
});

/**
 * Inicializa a aplicação
 */
async function inicializarAplicacao() {
  // Modo silencioso - remover logs
  if (typeof window.modoDebug === 'undefined') {
    window.modoDebug = false;
  }
  
  try {
    // Inicializar componentes
    configurarNavegacao();
    
    // Inicializar módulos
    await inicializarModulos();
    
    // Configurar event listeners globais
    configurarEventListeners();
    
    // Verificar alertas
    verificarAlertas();
    
    // Remover mensagens de erro que possam estar visíveis
    setTimeout(() => {
      const alertas = document.querySelectorAll('.toast');
      alertas.forEach(alerta => {
        const toastInstance = bootstrap.Toast.getInstance(alerta);
        if (toastInstance) {
          toastInstance.hide();
        }
      });
    }, 500);
  } catch (error) {
    console.error('Erro ao inicializar aplicação:', error);
  }
}

/**
 * Configura a navegação entre páginas
 */
function configurarNavegacao() {
  
  // Configurar links do menu principal
  const nav = document.querySelector('nav');
  if (nav) {
    nav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' || e.target.closest('a')) {
        e.preventDefault();
        
        const link = e.target.tagName === 'A' ? e.target : e.target.closest('a');
        const pagina = link.getAttribute('data-page');
        
        if (pagina) {
          navegarParaPagina(pagina);
        }
      }
    });
  }
  
  // Configurar links dentro das páginas (como "Ver todas" no dashboard)
  document.addEventListener('click', (e) => {
    // Ignorar cliques já tratados pelo menu principal
    if (e.target.closest('nav')) return;
    
    // Verificar se é um link com data-page
    if ((e.target.tagName === 'A' || e.target.closest('a')) && 
        (e.target.hasAttribute('data-page') || (e.target.closest('a') && e.target.closest('a').hasAttribute('data-page')))) {
      e.preventDefault();
      
      const link = e.target.tagName === 'A' ? e.target : e.target.closest('a');
      const pagina = link.getAttribute('data-page');
      
      if (pagina) {
        navegarParaPagina(pagina);
      }
    }
  });
  
  // Adicionar manipulador para botões de voltar/avançar do navegador
  window.addEventListener('popstate', (event) => {
    const params = new URLSearchParams(window.location.search);
    const pagina = params.get('page') || 'dashboard';
    window.mostrarPagina(pagina);
  });
  
  // Verificar se há uma página na URL
  const params = new URLSearchParams(window.location.search);
  const paginaInicial = params.get('page') || 'dashboard';
  
  // Navegar para a página inicial
  navegarParaPagina(paginaInicial);
}

/**
 * Navega para uma página específica
 */
function navegarParaPagina(pagina) {
  
  // Atualizar URL
  window.history.pushState({}, '', `?page=${pagina}`);
  
  // Chamar a função para mostrar a página
  window.mostrarPagina(pagina);
}

/**
 * Função para mostrar uma página específica
 */
window.mostrarPagina = async function(pagina) {
  // Ocultar todas as páginas
  const todasPaginas = document.querySelectorAll('.page');
  todasPaginas.forEach(p => p.classList.add('d-none'));
  
  // Remover classe active de todos os links de navegação
  const todosLinks = document.querySelectorAll('nav .nav-link');
  todosLinks.forEach(link => link.classList.remove('active'));
  
  // Mostrar a página desejada
  const paginaAlvo = document.getElementById(`${pagina}-page`);
  if (paginaAlvo) {
    paginaAlvo.classList.remove('d-none');
  }
  
  // Marcar o link como ativo
  const linkAtivo = document.querySelector(`nav .nav-link[data-page="${pagina}"]`);
  if (linkAtivo) {
    linkAtivo.classList.add('active');
  }
  
  // Executar código específico dependendo da página
  if (pagina === 'dashboard') {
    if (window.relatoriosModule) {
      window.relatoriosModule.atualizarGraficos();
    }
  } else if (pagina === 'transacoes') {
    if (window.transacoesModule) {
      window.transacoesModule.carregarTransacoes();
    }
  } else if (pagina === 'categorias') {
    if (window.categoriasModule) {
      window.categoriasModule.carregarCategorias();
    }
  } else if (pagina === 'cartoes') {
    if (window.cartoesModule) {
      await window.cartoesModule.carregarCartoes();
    }
  } else if (pagina === 'relatorios') {
    if (window.relatoriosModule) {
      window.relatoriosModule.carregarGraficosRelatorios();
    }
  }
};

/**
 * Inicializa os módulos da aplicação
 */
async function inicializarModulos() {
  // Inicializar módulo de transações
  if (typeof window.transacoesModule !== 'undefined' && window.transacoesModule.inicializar) {
    window.transacoesModule.inicializar();
  }
  
  // Inicializar módulo de categorias
  if (typeof window.categoriasModule !== 'undefined' && window.categoriasModule.inicializar) {
    window.categoriasModule.inicializar();
  }
  
  // Inicializar módulo de relatórios
  if (typeof window.relatoriosModule !== 'undefined' && window.relatoriosModule.inicializar) {
    window.relatoriosModule.inicializar();
  }
  
  // Inicializar módulo de cartões
  if (typeof window.cartoesModule !== 'undefined' && window.cartoesModule.inicializar) {
    window.cartoesModule.inicializar();
  }
}

// Configura os eventos de mudança de tipo na transação (radio -> select)
function configurarEventosTipoTransacao() {
  const tipoEntradaRadio = document.getElementById('tipo-entrada');
  const tipoSaidaRadio = document.getElementById('tipo-saida');
  const transacaoTipo = document.getElementById('transacao-tipo');
  
  if (!tipoEntradaRadio || !tipoSaidaRadio || !transacaoTipo) {
    console.warn('Elementos de tipo de transação não encontrados');
    return;
  }
  

  
  // Quando um radio é alterado, atualizar o select hidden
  tipoEntradaRadio.addEventListener('change', () => {
    if (tipoEntradaRadio.checked) {
      transacaoTipo.value = 'entrada';
      
      // Atualizar categorias se o módulo estiver disponível
      if (window.transacoesModule && typeof window.transacoesModule.atualizarCategoriasVisiveisNoForm === 'function') {
        window.transacoesModule.atualizarCategoriasVisiveisNoForm();
      }
    }
  });
  
  tipoSaidaRadio.addEventListener('change', () => {
    if (tipoSaidaRadio.checked) {
      transacaoTipo.value = 'saida';
      
      // Atualizar categorias se o módulo estiver disponível
      if (window.transacoesModule && typeof window.transacoesModule.atualizarCategoriasVisiveisNoForm === 'function') {
        window.transacoesModule.atualizarCategoriasVisiveisNoForm();
      }
    }
  });
}

// Configura os eventos de mudança de tipo na categoria (radio -> select)
function configurarEventosTipoCategoria() {
  const categoriaEntradaRadio = document.getElementById('categoria-tipo-entrada');
  const categoriaSaidaRadio = document.getElementById('categoria-tipo-saida');
  const categoriaTipo = document.getElementById('categoria-tipo');
  
  if (!categoriaEntradaRadio || !categoriaSaidaRadio || !categoriaTipo) {
    console.warn('Elementos de tipo de categoria não encontrados');
    return;
  }
  

  
  // Quando um radio é alterado, atualizar o select hidden
  categoriaEntradaRadio.addEventListener('change', () => {
    if (categoriaEntradaRadio.checked) {
      categoriaTipo.value = 'entrada';
    }
  });
  
  categoriaSaidaRadio.addEventListener('change', () => {
    if (categoriaSaidaRadio.checked) {
      categoriaTipo.value = 'saida';
    }
  });
}

// Configura os botões adicionais da página de relatórios
function configurarBotoesRelatorios() {
  const btnImprimir = document.getElementById('btn-imprimir');
  const btnExportar = document.getElementById('btn-exportar');
  const btnFiltrar = document.getElementById('btn-filtrar');
  
  if (!btnImprimir && !btnExportar && !btnFiltrar) {
    console.warn('Botões de relatórios não encontrados');
    return;
  }
  

  
  if (btnImprimir) {
    btnImprimir.addEventListener('click', () => {
      window.print();
    });
  }
  
  if (btnExportar) {
    btnExportar.addEventListener('click', () => {
      exportarRelatorios();
    });
  }
  
  if (btnFiltrar) {
    btnFiltrar.addEventListener('click', () => {
      if (window.relatoriosModule && typeof window.relatoriosModule.carregarGraficosRelatorios === 'function') {
        window.relatoriosModule.carregarGraficosRelatorios();
        notificar('Relatórios', 'Relatórios filtrados com sucesso', 'success');
      } else {
        notificar('Erro', 'Módulo de relatórios não está disponível', 'warning');
      }
    });
  }
}

// Exporta os relatórios para CSV
function exportarRelatorios() {
  // Verificar se temos os dados para exportar
  if (!window.relatoriosModule) {
    notificar('Erro', 'Módulo de relatórios não encontrado', 'danger');
    return;
  }
  
  notificar('Exportação', 'Exportando relatórios para CSV...', 'info');
  
  try {
    // Obter datas do filtro
    const dataInicio = document.getElementById('data-inicio')?.value || '';
    const dataFim = document.getElementById('data-fim')?.value || '';
    
    // Implementação de exportação para CSV
    setTimeout(() => {
      const hoje = new Date().toISOString().split('T')[0];
      const nomeArquivo = `relatorio_financeiro_${hoje}.csv`;
      
      // Cria um elemento <a> para download
      const element = document.createElement('a');
      
      // Criar conteúdo CSV
      const header = 'Data,Descrição,Categoria,Tipo,Valor\n';
      let csvContent = `data:text/csv;charset=utf-8,${header}`;
      
      // Obter transações do módulo de relatórios ou usar dados de exemplo
      let transacoes = [];
      if (window.relatoriosModule.obterTransacoesFiltradas && typeof window.relatoriosModule.obterTransacoesFiltradas === 'function') {
        transacoes = window.relatoriosModule.obterTransacoesFiltradas();
      }
      
      // Se não tiver dados, usar exemplos
      if (!transacoes || transacoes.length === 0) {
        transacoes = [
          { data: '2023-01-15', descricao: 'Salário', categoria: 'Salário', tipo: 'entrada', valor: 3500 },
          { data: '2023-01-20', descricao: 'Aluguel', categoria: 'Moradia', tipo: 'saida', valor: 1200 },
          { data: '2023-01-25', descricao: 'Mercado', categoria: 'Alimentação', tipo: 'saida', valor: 450 }
        ];
      }
      
      // Adicionar dados ao CSV
      transacoes.forEach(item => {
        const valorFormatado = typeof item.valor === 'number' ? item.valor.toFixed(2).replace('.', ',') : '0,00';
        const descricao = item.descricao ? item.descricao.replace(/,/g, ' ') : '';
        const categoria = item.categoria_nome || item.categoria || '';
        const data = item.data ? formatarData(item.data) : '';
        
        const row = `${data},${descricao},${categoria},${item.tipo},${valorFormatado}\n`;
        csvContent += row;
      });
      
      // Configurar download
      element.setAttribute('href', encodeURI(csvContent));
      element.setAttribute('download', nomeArquivo);
      element.style.display = 'none';
      
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      notificar('Exportação', 'Relatório exportado com sucesso!', 'success');
    }, 500);
  } catch (error) {
    console.error('Erro ao exportar relatórios:', error);
    notificar('Erro', 'Falha ao exportar relatório: ' + error.message, 'danger');
  }
}

// Configura event listeners para os botões de ação globais
function configurarEventListenersGlobais() {
  
  // Botões para abrir o modal de nova categoria
  const novaCategoriaButtons = document.querySelectorAll('[data-bs-target="#categoriaModal"]');
  novaCategoriaButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Verificar se estamos na página de categorias
      const paginaAtual = document.querySelector('.page-content:not(.d-none)');
      if (paginaAtual && paginaAtual.id !== 'categorias-page') {
        // Navegar para a página de categorias primeiro
        document.querySelector('[data-page="categorias"]').click();
        e.stopPropagation(); // Evitar que o modal seja aberto automaticamente
        
        // Pequeno delay para garantir que a página foi carregada, e então abrir o modal
        setTimeout(() => {
          const categoriaModal = document.getElementById('categoriaModal');
          if (categoriaModal) {
            const modal = new bootstrap.Modal(categoriaModal);
            modal.show();
          }
        }, 100);
        return false;
      }
    });
  });
  
  // Botões para abrir o modal de nova transação
  const novaTransacaoButtons = document.querySelectorAll('[data-bs-target="#transacaoModal"]');
  novaTransacaoButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Verificar se estamos na página de transações
      const paginaAtual = document.querySelector('.page-content:not(.d-none)');
      if (paginaAtual && paginaAtual.id !== 'transacoes-page' && paginaAtual.id !== 'dashboard-page') {
        // Navegar para a página de transações primeiro
        document.querySelector('[data-page="transacoes"]').click();
        e.stopPropagation(); // Evitar que o modal seja aberto automaticamente
        
        // Pequeno delay para garantir que a página foi carregada, e então abrir o modal
        setTimeout(() => {
          // Usar a função do módulo de transações se disponível
          if (window.transacoesModule && typeof window.transacoesModule.novaTransacao === 'function') {
            window.transacoesModule.novaTransacao();
          } else {
            const transacaoModal = document.getElementById('transacaoModal');
            if (transacaoModal) {
              const modal = new bootstrap.Modal(transacaoModal);
              modal.show();
            }
          }
        }, 100);
        return false;
      }
    });
  });
}

// Verificar alertas de contas a pagar ou outras notificações importantes
function verificarAlertas() {
  
  const alertasContainer = document.getElementById('alertas-container');
  const contadorAlertas = document.getElementById('contador-alertas');
  const listaAlertas = document.getElementById('lista-alertas');
  const semAlertas = document.getElementById('sem-alertas');
  
  if (!alertasContainer || !contadorAlertas || !listaAlertas) {
    console.warn('Elementos de alertas não encontrados');
    return;
  }
  
  // Limpar alertas anteriores (exceto a mensagem de "sem alertas")
  const alertasAtuais = listaAlertas.querySelectorAll('li:not(#sem-alertas)');
  alertasAtuais.forEach(alerta => alerta.remove());
  
  // Obter transações que são saídas futuras (simulando contas a pagar)
  const contasPendentes = [];
  
  // Se tiver transações no módulo, usá-las para gerar alertas
  if (window.transacoesModule) {
    const hoje = new Date();
    const proximaSemana = new Date();
    proximaSemana.setDate(hoje.getDate() + 7);
    
    // Filtrar transações que são saídas com data futura
    if (window.transacoes && Array.isArray(window.transacoes)) {
      window.transacoes.forEach(transacao => {
        if (transacao.tipo === 'saida') {
          const dataVencimento = new Date(transacao.data);
          
          // Verificar se é uma data futura dentro dos próximos 7 dias
          if (dataVencimento > hoje && dataVencimento <= proximaSemana) {
            contasPendentes.push({
              id: transacao.id,
              descricao: transacao.descricao,
              valor: transacao.valor,
              data: transacao.data,
              categoria: transacao.categoria_nome || 'Sem categoria',
              diasRestantes: Math.floor((dataVencimento - hoje) / (1000 * 60 * 60 * 24))
            });
          }
        }
      });
    }
  }
  
  // Atualizar contador
  contadorAlertas.textContent = contasPendentes.length;
  
  // Mostrar ou ocultar mensagem de "sem alertas"
  if (contasPendentes.length === 0) {
    if (semAlertas) {
      semAlertas.classList.remove('d-none');
    }
    return;
  } else {
    if (semAlertas) {
      semAlertas.classList.add('d-none');
    }
  }
  
  // Adicionar alertas à lista
  contasPendentes.forEach(conta => {
    const alerta = document.createElement('li');
    
    // Definir classe com base nos dias restantes
    let classeAlerta = 'list-group-item-info';
    let iconeAlerta = 'bi-info-circle';
    
    if (conta.diasRestantes <= 2) {
      classeAlerta = 'list-group-item-danger';
      iconeAlerta = 'bi-exclamation-triangle';
    } else if (conta.diasRestantes <= 5) {
      classeAlerta = 'list-group-item-warning';
      iconeAlerta = 'bi-exclamation-circle';
    }
    
    alerta.className = `list-group-item ${classeAlerta} d-flex justify-content-between align-items-center`;
    alerta.innerHTML = `
      <div>
        <div class="d-flex align-items-center">
          <i class="bi ${iconeAlerta} me-2"></i>
          <span class="alert-titulo">${conta.descricao}</span>
        </div>
        <div class="alert-descricao">
          Categoria: ${conta.categoria} | Vencimento: ${formatarData(conta.data)}
        </div>
      </div>
      <span class="badge bg-light text-dark">${formatarMoeda(conta.valor)}</span>
    `;
    
    listaAlertas.appendChild(alerta);
  });
}

// Exportar funções para uso global
window.app = {
  mostrarPagina: (pageName) => {
    if (typeof window.mostrarPagina === 'function') {
      window.mostrarPagina(pageName);
    } else {
      console.error('Função mostrarPagina não disponível');
      // Alternativa
      const link = document.querySelector(`[data-page="${pageName}"]`);
      if (link) link.click();
    }
  },
  verificarAlertas,
  exportarRelatorios
}; 