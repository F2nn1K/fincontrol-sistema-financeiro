/**
 * Gerenciamento de transações financeiras
 */

// Elementos do DOM
const transacoesTable = document.getElementById('tabela-transacoes');
const ultimasTransacoesTable = document.getElementById('ultimas-transacoes');
const transacaoForm = document.getElementById('transacao-form');
const transacaoModal = document.getElementById('transacaoModal') ? new bootstrap.Modal(document.getElementById('transacaoModal')) : null;
const transacaoId = document.getElementById('transacao-id');
const transacaoDescricao = document.getElementById('transacao-descricao');
const transacaoValor = document.getElementById('transacao-valor');
const transacaoTipo = document.getElementById('transacao-tipo');
const tipoEntradaRadio = document.getElementById('tipo-entrada');
const tipoSaidaRadio = document.getElementById('tipo-saida');
const transacaoCategoria = document.getElementById('transacao-categoria');
const transacaoData = document.getElementById('transacao-data');
const salvarTransacaoBtn = document.getElementById('salvar-transacao');
const filtroTipo = document.getElementById('filtro-tipo');
const filtroCategoria = document.getElementById('filtro-categoria');
const filtroDescricao = document.getElementById('filtro-descricao');

// Variáveis globais
let transacoes = [];
let categoriasEntrada = [];
let categoriasSaida = [];

// Inicialização
function inicializarTransacoes() {
  console.log('Inicializando módulo de transações');
  
  // Verificar se os elementos existem antes de configurar
  if (!transacoesTable && !ultimasTransacoesTable) {
    console.error('Elementos de tabela de transações não encontrados');
    return;
  }
  
  carregarTransacoes();
  carregarCategorias();
  
  if (filtroTipo || filtroCategoria || filtroDescricao) {
    configurarFiltros();
  }
  
  configurarEventListeners();
  
  // Data padrão para novas transações (hoje)
  if (transacaoData) {
    const hoje = new Date().toISOString().split('T')[0];
    transacaoData.value = hoje;
  }
}

// Carrega as transações da API
async function carregarTransacoes() {
  try {
    // Remover notificações de carregamento
    // notificar('Transações', 'Carregando transações...', 'info');
    transacoes = await api.obterTransacoes();
    renderizarTransacoes();
    renderizarUltimasTransacoes();
    atualizarResumo();
    // notificar('Transações', 'Transações carregadas com sucesso', 'success');
    
    // Atualizar gráficos se o módulo de relatórios estiver disponível
    if (window.relatoriosModule && typeof window.relatoriosModule.atualizarGraficos === 'function') {
      window.relatoriosModule.atualizarGraficos();
    }
  } catch (error) {
    console.error('Erro ao carregar transações:', error);
    notificar('Erro', `Falha ao carregar transações: ${error.message}`, 'danger');
  }
}

// Carrega as categorias da API
async function carregarCategorias() {
  try {
    console.log('🔄 Carregando categorias da API...');
    const todasCategorias = await api.obterCategorias();
    
    console.log('📋 Total de categorias recebidas:', todasCategorias.length);
    console.log('📊 Categorias completas:', todasCategorias);
    
    // Separar por tipo
    categoriasEntrada = todasCategorias.filter(cat => cat.tipo === 'entrada');
    categoriasSaida = todasCategorias.filter(cat => cat.tipo === 'saida');
    
    console.log('✅ Categorias carregadas - Entrada:', categoriasEntrada.length, 'Saída:', categoriasSaida.length);
    console.log('📊 Categorias de Entrada:', categoriasEntrada);
    console.log('📊 Categorias de Saída:', categoriasSaida);
    
    // Disponibilizando globalmente
    window.categoriasEntrada = categoriasEntrada;
    window.categoriasSaida = categoriasSaida;
    
    // Atualizar os selects após carregar as categorias
    preencherFiltroCategoria();
    atualizarCategoriasVisiveisNoForm();
  } catch (error) {
    console.error('❌ Erro ao carregar categorias:', error);
    notificar('Erro', `Falha ao carregar categorias: ${error.message}`, 'danger');
  }
}

// Renderiza a tabela de transações
function renderizarTransacoes() {
  if (!transacoesTable) return;
  
  const tbody = transacoesTable.querySelector('tbody');
  if (!tbody) {
    console.error('Tabela de transações não possui tbody');
    return;
  }
  
  tbody.innerHTML = '';
  
  const transacoesFiltradas = filtrarTransacoes();
  
  if (transacoesFiltradas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-4">
          <div class="d-flex flex-column align-items-center">
            <i class="bi bi-search fs-1 text-muted mb-2"></i>
            <span>Nenhuma transação encontrada</span>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  transacoesFiltradas.forEach(transacao => {
    const row = document.createElement('tr');
    
    // Formatação do valor com classe de estilo baseada no tipo
    const valorClass = transacao.tipo === 'entrada' ? 'valor-entrada' : 'valor-saida';
    const valorFormatado = `<span class="${valorClass}">${formatarMoeda(transacao.valor)}</span>`;
    
    // Ícone para o tipo da transação
    const icone = transacao.tipo === 'entrada' 
      ? '<i class="bi bi-arrow-down-circle text-success me-1"></i>'
      : '<i class="bi bi-arrow-up-circle text-danger me-1"></i>';
    
    row.innerHTML = `
      <td>${formatarData(transacao.data)}</td>
      <td>
        <div class="d-flex align-items-center">
          ${icone}
          <span class="ms-1">${transacao.descricao}</span>
        </div>
      </td>
      <td>
        <span class="badge bg-light text-dark">
          ${transacao.categoria_nome || 'Sem categoria'}
        </span>
      </td>
      <td>${valorFormatado}</td>
      <td>
        <div class="d-flex">
          <button class="btn btn-sm btn-action btn-outline-primary me-2" data-action="editar" data-id="${transacao.id}" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-action btn-outline-danger" data-action="excluir" data-id="${transacao.id}" title="Excluir">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;
    
    // Adicionar event listeners para os botões de ação
    const editarBtn = row.querySelector('[data-action="editar"]');
    const excluirBtn = row.querySelector('[data-action="excluir"]');
    
    if (editarBtn) {
      editarBtn.addEventListener('click', () => editarTransacao(transacao.id));
    }
    
    if (excluirBtn) {
      excluirBtn.addEventListener('click', () => confirmarExclusaoTransacao(transacao.id));
    }
    
    tbody.appendChild(row);
  });
}

// Renderiza as últimas transações no dashboard
function renderizarUltimasTransacoes() {
  if (!ultimasTransacoesTable) return;
  
  const tbody = ultimasTransacoesTable.querySelector('tbody');
  if (!tbody) {
    console.error('Tabela de últimas transações não possui tbody');
    return;
  }
  
  tbody.innerHTML = '';
  
  // Exibir apenas as 5 transações mais recentes
  const ultimasTransacoes = [...transacoes].sort((a, b) => {
    return new Date(b.data) - new Date(a.data);
  }).slice(0, 5);
  
  if (ultimasTransacoes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-4">
          <div class="d-flex flex-column align-items-center">
            <i class="bi bi-clipboard-x fs-1 text-muted mb-2"></i>
            <span>Nenhuma transação registrada</span>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  ultimasTransacoes.forEach(transacao => {
    const row = document.createElement('tr');
    
    // Formatação do valor com classe de estilo baseada no tipo
    const valorClass = transacao.tipo === 'entrada' ? 'valor-entrada' : 'valor-saida';
    const valorFormatado = `<span class="${valorClass}">${formatarMoeda(transacao.valor)}</span>`;
    
    // Ícone para o tipo da transação
    const icone = transacao.tipo === 'entrada' 
      ? '<i class="bi bi-arrow-down-circle text-success me-1"></i>'
      : '<i class="bi bi-arrow-up-circle text-danger me-1"></i>';
    
    row.innerHTML = `
      <td>${formatarData(transacao.data)}</td>
      <td>
        <div class="d-flex align-items-center">
          ${icone}
          <span class="ms-1">${transacao.descricao}</span>
        </div>
      </td>
      <td>
        <span class="badge bg-light text-dark">
          ${transacao.categoria_nome || 'Sem categoria'}
        </span>
      </td>
      <td>${valorFormatado}</td>
    `;
    
    tbody.appendChild(row);
  });
}

// Atualiza os valores de resumo no dashboard
function atualizarResumo() {
  const resumoEntradas = document.getElementById('resumo-entradas');
  const resumoSaidas = document.getElementById('resumo-saidas');
  const resumoSaldo = document.getElementById('resumo-saldo');
  
  if (!resumoEntradas || !resumoSaidas || !resumoSaldo) return;
  
  // Calcular totais
  const entradas = transacoes
    .filter(t => t.tipo === 'entrada')
    .reduce((total, t) => total + parseFloat(t.valor), 0);
    
  const saidas = transacoes
    .filter(t => t.tipo === 'saida')
    .reduce((total, t) => total + parseFloat(t.valor), 0);
    
  const saldo = entradas - saidas;
  
  // Atualizar elementos
  resumoEntradas.textContent = formatarMoeda(entradas);
  resumoSaidas.textContent = formatarMoeda(saidas);
  resumoSaldo.textContent = formatarMoeda(saldo);
  
  // Adicionar classe para saldo negativo
  if (saldo < 0) {
    resumoSaldo.classList.add('text-danger');
  } else {
    resumoSaldo.classList.remove('text-danger');
  }
}

// Filtra as transações com base nos filtros aplicados
function filtrarTransacoes() {
  if (!filtroTipo && !filtroCategoria && !filtroDescricao) {
    return transacoes;
  }
  
  return transacoes.filter(transacao => {
    // Filtro por tipo
    if (filtroTipo && filtroTipo.value && transacao.tipo !== filtroTipo.value) {
      return false;
    }
    
    // Filtro por categoria
    if (filtroCategoria && filtroCategoria.value && transacao.categoria != filtroCategoria.value) {
      return false;
    }
    
    // Filtro por descrição
    if (filtroDescricao && filtroDescricao.value) {
      const termo = filtroDescricao.value.toLowerCase();
      const descricao = transacao.descricao.toLowerCase();
      
      if (!descricao.includes(termo)) {
        return false;
      }
    }
    
    return true;
  });
}

// Preenche o filtro de categorias com base no tipo selecionado
function preencherFiltroCategoria() {
  if (!filtroCategoria) return;
  
  // Salvar a categoria atualmente selecionada
  const categoriaAtual = filtroCategoria.value;
  
  // Limpar o select
  filtroCategoria.innerHTML = '<option value="">Todas as categorias</option>';
  
  // Obter categorias com base no tipo selecionado
  let categorias = [];
  
  if (filtroTipo && filtroTipo.value === 'entrada') {
    categorias = categoriasEntrada;
  } else if (filtroTipo && filtroTipo.value === 'saida') {
    categorias = categoriasSaida;
  } else {
    categorias = [...categoriasEntrada, ...categoriasSaida];
  }
  
  // Adicionar opções
  categorias.forEach(categoria => {
    const option = document.createElement('option');
    option.value = categoria.id;
    option.textContent = categoria.nome;
    filtroCategoria.appendChild(option);
  });
  
  // Restaurar categoria selecionada se ainda for válida
  if (categoriaAtual) {
    filtroCategoria.value = categoriaAtual;
  }
}

// Atualiza as categorias visíveis no formulário baseado no tipo selecionado
async function atualizarCategoriasVisiveisNoForm() {
  console.log('🔄 Atualizando categorias no formulário de transação');
  
  if (!transacaoCategoria) {
    console.log('❌ Elemento transacaoCategoria não encontrado');
    return;
  }
  
  // Verificar se as categorias foram carregadas
  if ((!categoriasEntrada || categoriasEntrada.length === 0) && 
      (!categoriasSaida || categoriasSaida.length === 0)) {
    console.log('⏳ Categorias não carregadas ainda, carregando...');
    await carregarCategorias();
  }
  
  // Limpar o select
  transacaoCategoria.innerHTML = '<option value="">Selecione uma categoria</option>';
  
  // Determinar quais categorias mostrar com base no tipo selecionado (radio button)
  let categorias = [];
  let tipoSelecionado = '';
  
  if (tipoEntradaRadio && tipoEntradaRadio.checked) {
    categorias = categoriasEntrada || [];
    tipoSelecionado = 'entrada';
  } else if (tipoSaidaRadio && tipoSaidaRadio.checked) {
    categorias = categoriasSaida || [];
    tipoSelecionado = 'saida';
  } else if (transacaoTipo) {
    // Fallback para o campo hidden
    tipoSelecionado = transacaoTipo.value;
    categorias = transacaoTipo.value === 'entrada' ? (categoriasEntrada || []) : (categoriasSaida || []);
  } else {
    console.error('❌ Não foi possível determinar o tipo de transação');
    return;
  }
  
  console.log(`📋 Tipo selecionado: ${tipoSelecionado}, Categorias disponíveis: ${categorias.length}`);
  console.log('📊 Categorias:', categorias);
  
  // Adicionar opções
  categorias.forEach(categoria => {
    const option = document.createElement('option');
    option.value = categoria.id;
    option.textContent = categoria.nome;
    transacaoCategoria.appendChild(option);
  });
  
  console.log(`✅ ${categorias.length} categorias adicionadas ao select`);
  console.log('🔍 HTML final do select:', transacaoCategoria.outerHTML);
}

// Configura os filtros de transações
function configurarFiltros() {
  if (filtroTipo) {
    filtroTipo.addEventListener('change', () => {
      preencherFiltroCategoria();
      renderizarTransacoes();
    });
  }
  
  if (filtroCategoria) {
    filtroCategoria.addEventListener('change', () => {
      renderizarTransacoes();
    });
  }
  
  if (filtroDescricao) {
    // Usar debounce para não disparar a cada tecla
    filtroDescricao.addEventListener('input', debounce(() => {
      renderizarTransacoes();
    }, 300));
  }
}

// Prepara o modal para uma nova transação
async function novaTransacao() {
  console.log('🚀 Iniciando nova transação - limpando formulário');
  
  // Resetar completamente o formulário
  limparFormularioCompleto();
  
  // Configurar o modal para nova transação
  if (transacaoId) {
    transacaoId.value = '';
  }
  
  // Data padrão para hoje
  if (transacaoData) {
    const hoje = new Date().toISOString().split('T')[0];
    transacaoData.value = hoje;
  }
  
  // Tipo padrão para entrada (radio)
  if (tipoEntradaRadio && tipoSaidaRadio) {
    tipoEntradaRadio.checked = true;
    tipoSaidaRadio.checked = false;
    console.log('✅ Tipo definido como entrada');
  }
  
  // Atualizar o select de tipos
  if (transacaoTipo) {
    transacaoTipo.value = 'entrada';
  }
  
  // Carregar e preencher categorias
  console.log('🔥 Carregando categorias para nova transação...');
  await carregarEPreencherCategorias();
  
  // Mostrar o modal
  if (transacaoModal) {
    console.log('📂 Abrindo modal de transação');
    transacaoModal.show();
  }
}

// Prepara o modal para editar uma transação existente
async function editarTransacao(id) {
  try {
    limparFormulario();
    
    // Buscar transação
    const transacao = transacoes.find(t => t.id == id);
    
    if (!transacao) {
      notificar('Erro', 'Transação não encontrada', 'danger');
      return;
    }
    
    // Preencher formulário
    if (transacaoId) {
      transacaoId.value = transacao.id;
    }
    
    if (transacaoDescricao) {
      transacaoDescricao.value = transacao.descricao;
    }
    
    if (transacaoValor) {
      // Remover formatação
      const valorNumerico = parseFloat(transacao.valor);
      transacaoValor.value = valorNumerico.toFixed(2).replace('.', ',');
    }
    
    // Definir o tipo (radio)
    if (tipoEntradaRadio && tipoSaidaRadio) {
      if (transacao.tipo === 'entrada') {
        tipoEntradaRadio.checked = true;
        tipoSaidaRadio.checked = false;
      } else {
        tipoEntradaRadio.checked = false;
        tipoSaidaRadio.checked = true;
      }
    }
    
    // Campo hidden
    if (transacaoTipo) {
      transacaoTipo.value = transacao.tipo;
    }
    
    // Atualizar categorias visíveis com base no tipo
    await atualizarCategoriasVisiveisNoForm();
    
    // Definir categoria
    if (transacaoCategoria && transacao.categoria) {
      transacaoCategoria.value = transacao.categoria;
    }
    
    // Data
    if (transacaoData && transacao.data) {
      // Converter para formato de input date (YYYY-MM-DD)
      const data = new Date(transacao.data);
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const dia = String(data.getDate()).padStart(2, '0');
      transacaoData.value = `${ano}-${mes}-${dia}`;
    }
    
    // Mostrar o modal
    if (transacaoModal) {
      transacaoModal.show();
    }
  } catch (error) {
    console.error('Erro ao editar transação:', error);
    notificar('Erro', `Falha ao editar transação: ${error.message}`, 'danger');
  }
}

// Função direta para salvar transação quando o botão é clicado
function salvarTransacaoAgora() {
  // Chamada direta para salvar
  console.log('Função salvarTransacaoAgora chamada diretamente');
  salvarTransacao();
}

// Salva a transação (nova ou editada)
async function salvarTransacao() {
  try {
    console.log('Iniciando salvamento de transação');
    
    // Validação básica
    if (!transacaoDescricao || !transacaoDescricao.value.trim()) {
      notificar('Validação', 'Descrição é obrigatória', 'warning');
      if (transacaoDescricao) transacaoDescricao.focus();
      return;
    }
    
    if (!transacaoValor || !transacaoValor.value.trim()) {
      notificar('Validação', 'Valor é obrigatório', 'warning');
      if (transacaoValor) transacaoValor.focus();
      return;
    }
    
    // Validação de data
    if (!transacaoData || !transacaoData.value) {
      notificar('Validação', 'Data é obrigatória', 'warning');
      if (transacaoData) transacaoData.focus();
      return;
    }
    
    // Construir objeto com os dados da transação
    const valor = transacaoValor.value.replace(/\./g, '').replace(',', '.');
    
    // Obter tipo (preferir radio buttons, fallback para o campo hidden)
    let tipo = 'entrada'; // valor padrão
    if (tipoEntradaRadio && tipoSaidaRadio) {
      tipo = tipoEntradaRadio.checked ? 'entrada' : 'saida';
    } else if (transacaoTipo) {
      tipo = transacaoTipo.value;
    }
    
    const transacao = {
      descricao: transacaoDescricao.value.trim(),
      valor: parseFloat(valor),
      tipo: tipo,
      categoria: transacaoCategoria ? transacaoCategoria.value : null,
      data: transacaoData ? transacaoData.value : null
    };
    
    console.log('Dados da transação preparados:', transacao);
    
    // Desabilitar o botão de salvar para evitar cliques duplicados
    if (salvarTransacaoBtn) {
      salvarTransacaoBtn.disabled = true;
      salvarTransacaoBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
    }
    
    // Mostrar overlay de carregamento
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center';
    loadingOverlay.style.backgroundColor = 'rgba(0,0,0,0.3)';
    loadingOverlay.style.zIndex = '9999';
    loadingOverlay.innerHTML = `
      <div class="spinner-border text-light" role="status" style="width: 3rem; height: 3rem;">
        <span class="visually-hidden">Salvando...</span>
      </div>
    `;
    document.body.appendChild(loadingOverlay);
    
    try {
      // Verificar se é uma edição ou nova transação
      let resultado = null;
      let mensagem = '';
      
      if (transacaoId && transacaoId.value) {
        console.log('Atualizando transação existente ID:', transacaoId.value);
        // Atualizar transação existente
        resultado = await api.atualizarTransacao(transacaoId.value, transacao);
        mensagem = 'Transação atualizada com sucesso';
      } else {
        console.log('Criando nova transação');
        // Criar nova transação
        resultado = await api.criarTransacao(transacao);
        mensagem = 'Transação criada com sucesso';
      }
      
      console.log('Resposta da API:', resultado);
      
      // Se chegou aqui, o salvamento foi bem-sucedido
              // Usar APENAS o alerta bonito
        if (window.mostrarAlertaSucesso) {
          window.mostrarAlertaSucesso(`Transação salva com sucesso! Valor: ${formatarMoeda(transacao.valor)}`);
        }
      
      // Fechar o modal
      if (transacaoModal) {
        try {
          transacaoModal.hide();
          // Garantir que o formulário seja limpo após salvar
          setTimeout(() => limparFormularioCompleto(), 100);
        } catch (error) {
          console.error('Erro ao fechar modal:', error);
          // Tentar fechar o modal via Bootstrap
          const modalEl = document.getElementById('transacaoModal');
          if (modalEl) {
            modalEl.classList.remove('show');
            modalEl.style.display = 'none';
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
            
            // Garantir que o formulário seja limpo
            limparFormularioCompleto();
          }
        }
      }
      
      // Remover overlay de carregamento
      if (document.body.contains(loadingOverlay)) {
        document.body.removeChild(loadingOverlay);
      }
      
      // Reativar o botão
      if (salvarTransacaoBtn) {
        salvarTransacaoBtn.disabled = false;
        salvarTransacaoBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Salvar';
      }
      
      // Mostrar notificação de sucesso garantindo que seja visível
      notificar('Sucesso', mensagem, 'success');
      
      // Recarregar os dados
      await carregarTransacoes();
      
      // Atualizar gráficos se o módulo de relatórios estiver disponível
      if (window.relatoriosModule && typeof window.relatoriosModule.atualizarGraficos === 'function') {
        console.log('Atualizando gráficos após salvar transação');
        window.relatoriosModule.atualizarGraficos();
      } else {
        console.log('Módulo de relatórios não disponível para atualizar gráficos');
      }
      
      // Navegar para o dashboard após salvar
      setTimeout(() => {
        // Tentar várias abordagens para navegar para o dashboard
        try {
          if (window.app && typeof window.app.mostrarPagina === 'function') {
            window.app.mostrarPagina('dashboard');
          } else if (typeof window.mostrarPagina === 'function') {
            window.mostrarPagina('dashboard');
          } else {
            // Fallback
            const dashboardLink = document.querySelector('[data-page="dashboard"]');
            if (dashboardLink) dashboardLink.click();
          }
        } catch (error) {
          console.error('Erro ao navegar para dashboard:', error);
          // Último recurso: reload da página
          window.location.hash = '#dashboard';
        }
      }, 500);
    } catch (error) {
      // Remover overlay de carregamento em caso de erro
      if (document.body.contains(loadingOverlay)) {
        document.body.removeChild(loadingOverlay);
      }
      
      console.error('Erro na comunicação com API:', error);
                      // Usar APENAS o alerta bonito de erro
        if (window.mostrarAlertaErro) {
          window.mostrarAlertaErro(`Erro ao salvar transação: ${error.message}`);
        }
      
      // Reativar o botão em caso de erro
      if (salvarTransacaoBtn) {
        salvarTransacaoBtn.disabled = false;
        salvarTransacaoBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Salvar';
      }
    }
  } catch (error) {
    console.error('Erro ao processar dados da transação:', error);
                    // Usar APENAS o alerta bonito de erro
        if (window.mostrarAlertaErro) {
          window.mostrarAlertaErro(`Erro ao salvar: ${error.message}`);
        }
    
    // Garantir que o botão seja reativado em qualquer cenário de erro
    if (salvarTransacaoBtn) {
      salvarTransacaoBtn.disabled = false;
      salvarTransacaoBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Salvar';
    }
    
    // Remover overlay de carregamento se existir
    const overlay = document.querySelector('.position-fixed.top-0.start-0.w-100.h-100');
    if (overlay && document.body.contains(overlay)) {
      document.body.removeChild(overlay);
    }
  }
}

// Confirma a exclusão de uma transação
function confirmarExclusaoTransacao(id) {
  confirmDialog.show(
    'Tem certeza que deseja excluir esta transação?',
    () => excluirTransacao(id)
  );
}

// Exclui uma transação
async function excluirTransacao(id) {
  try {
    await api.excluirTransacao(id);
    notificar('Sucesso', 'Transação excluída com sucesso', 'success');
    
    // Recarregar transações
    await carregarTransacoes();
  } catch (error) {
    console.error('Erro ao excluir transação:', error);
    notificar('Erro', `Falha ao excluir transação: ${error.message}`, 'danger');
  }
}

// Limpa o formulário de transação
function limparFormulario() {
  console.log('Limpando formulário de transação');
  
  if (transacaoForm) {
    transacaoForm.reset();
  }
  
  if (transacaoId) {
    transacaoId.value = '';
  }
  
  if (transacaoDescricao) {
    transacaoDescricao.value = '';
  }
  
  if (transacaoValor) {
    transacaoValor.value = '';
  }
  
  // Definir tipo padrão para entrada (radio e hidden)
  if (tipoEntradaRadio && tipoSaidaRadio) {
    tipoEntradaRadio.checked = true;
    tipoSaidaRadio.checked = false;
  }
  
  if (transacaoTipo) {
    transacaoTipo.value = 'entrada';
  }
  
  // Data padrão para hoje
  if (transacaoData) {
    const hoje = new Date().toISOString().split('T')[0];
    transacaoData.value = hoje;
  }
}

// Limpa o formulário completamente, incluindo elementos do DOM
function limparFormularioCompleto() {
  console.log('Limpando formulário de transação (completo)');
  
  // Primeiro usar o reset do próprio HTML
  if (transacaoForm) {
    transacaoForm.reset();
  }
  
  // Limpeza forçada dos elementos individualmente
  if (transacaoId) {
    transacaoId.value = '';
  }
  
  if (transacaoDescricao) {
    transacaoDescricao.value = '';
    // Forçar limpeza via DOM
    transacaoDescricao.setAttribute('value', '');
  }
  
  if (transacaoValor) {
    transacaoValor.value = '';
    // Forçar limpeza via DOM
    transacaoValor.setAttribute('value', '');
  }
  
  // Resetar categorias para o valor padrão
  if (transacaoCategoria) {
    transacaoCategoria.selectedIndex = 0;
    transacaoCategoria.value = '';
  }
  
  // Definir tipo padrão para entrada (radio e hidden)
  if (tipoEntradaRadio && tipoSaidaRadio) {
    tipoEntradaRadio.checked = true;
    tipoSaidaRadio.checked = false;
  }
  
  if (transacaoTipo) {
    transacaoTipo.value = 'entrada';
  }
  
  // Data padrão para hoje
  if (transacaoData) {
    const hoje = new Date().toISOString().split('T')[0];
    transacaoData.value = hoje;
  }
}

// Configura os eventos de interação com o usuário
function configurarEventListeners() {
  console.log('Configurando event listeners para transações');
  
  // Ao submeter o formulário
  if (transacaoForm) {
    transacaoForm.addEventListener('submit', (e) => {
      console.log('Form submit interceptado');
      e.preventDefault();
      salvarTransacao();
    });
  } else {
    console.warn('Formulário de transação não encontrado no DOM');
  }
  
  // Ao clicar no botão de salvar
  if (salvarTransacaoBtn) {
    salvarTransacaoBtn.addEventListener('click', (e) => {
      console.log('Botão Salvar clicado');
      e.preventDefault();
      salvarTransacao();
    });
  } else {
    console.warn('Botão de salvar transação não encontrado no DOM');
  }
  
  // Eventos para o campo de valor (formatação)
  if (transacaoValor) {
    console.log('🎯 Configurando event listeners para campo valor');
    
    // Múltiplos eventos para garantir formatação em tempo real
    transacaoValor.addEventListener('input', (e) => {
      console.log('📝 Evento INPUT disparado');
      formatarCampoValor(e);
    });
    
    transacaoValor.addEventListener('keyup', (e) => {
      console.log('⌨️ Evento KEYUP disparado');
      formatarCampoValor(e);
    });
    
    transacaoValor.addEventListener('paste', (e) => {
      console.log('📋 Evento PASTE disparado');
      setTimeout(() => formatarCampoValor(e), 10);
    });
    
    console.log('✅ Event listeners configurados com sucesso');
  } else {
    console.error('❌ Campo transacao-valor não encontrado!');
  }
  
  // Eventos para os radio buttons de tipo
  if (tipoEntradaRadio && tipoSaidaRadio) {
    tipoEntradaRadio.addEventListener('change', () => {
      if (tipoEntradaRadio.checked) {
        if (transacaoTipo) transacaoTipo.value = 'entrada';
        
        // Preencher dropdown com categorias de entrada
        const select = document.getElementById('transacao-categoria');
        if (select && window.categoriasEntrada) {
          select.innerHTML = '<option value="">Selecione uma categoria</option>';
          window.categoriasEntrada.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.id;
            option.textContent = categoria.nome;
            select.appendChild(option);
          });
          console.log('🔄 Dropdown atualizado para ENTRADA -', window.categoriasEntrada.length, 'categorias');
        }
      }
    });
    
    tipoSaidaRadio.addEventListener('change', () => {
      if (tipoSaidaRadio.checked) {
        if (transacaoTipo) transacaoTipo.value = 'saida';
        
        // Preencher dropdown com categorias de saída
        const select = document.getElementById('transacao-categoria');
        if (select && window.categoriasSaida) {
          select.innerHTML = '<option value="">Selecione uma categoria</option>';
          window.categoriasSaida.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.id;
            option.textContent = categoria.nome;
            select.appendChild(option);
          });
          console.log('🔄 Dropdown atualizado para SAÍDA -', window.categoriasSaida.length, 'categorias');
        }
      }
    });
  }
  
  // Botões "Nova Transação" na interface
  const botoesNovaTransacao = document.querySelectorAll('[data-bs-target="#transacaoModal"]');
  botoesNovaTransacao.forEach(btn => {
    btn.addEventListener('click', () => {
      console.log('Botão Nova Transação clicado');
      novaTransacao();
    });
  });
  
  // Verificar se o modal tem eventos adequados
  const modalEl = document.getElementById('transacaoModal');
  if (modalEl) {
    modalEl.addEventListener('show.bs.modal', () => {
      console.log('🔄 Modal de transação abrindo - verificando se é nova transação');
      // Se não tiver ID, é uma nova transação - limpar formulário
      if (!transacaoId || !transacaoId.value) {
        console.log('📂 Abrindo modal para nova transação');
        limparFormularioCompleto();
      }
    });
    
    modalEl.addEventListener('shown.bs.modal', async () => {
      console.log('✅ Modal de transação aberto');
      
      // FORÇAR CARREGAMENTO DAS CATEGORIAS SEMPRE QUE O MODAL ABRIR
      console.log('🚨 FORÇANDO carregamento das categorias...');
      
      try {
        // Buscar categorias direto da API
        const response = await fetch('/api/categorias');
        const categorias = await response.json();
        
        console.log('📊 Categorias da API:', categorias);
        
        // Separar por tipo
        const categoriasEntrada = categorias.filter(c => c.tipo === 'entrada');
        const categoriasSaida = categorias.filter(c => c.tipo === 'saida');
        
        // Salvar globalmente
        window.categoriasEntrada = categoriasEntrada;
        window.categoriasSaida = categoriasSaida;
        
        console.log('✅ Separadas - Entrada:', categoriasEntrada.length, 'Saída:', categoriasSaida.length);
        
        // Preencher dropdown
        const select = document.getElementById('transacao-categoria');
        if (select) {
          select.innerHTML = '<option value="">Selecione uma categoria</option>';
          
          // Verificar qual tipo está selecionado
          const tipoEntrada = document.getElementById('tipo-entrada');
          const tipoSaida = document.getElementById('tipo-saida');
          
          let categoriasParaUsar = categoriasEntrada; // padrão
          
          if (tipoSaida && tipoSaida.checked) {
            categoriasParaUsar = categoriasSaida;
            console.log('🎯 Usando categorias de SAÍDA');
          } else {
            console.log('🎯 Usando categorias de ENTRADA');
          }
          
          // Adicionar opções
          categoriasParaUsar.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.id;
            option.textContent = categoria.nome;
            select.appendChild(option);
            console.log('➕ Categoria adicionada:', categoria.nome);
          });
          
          console.log('🎉 DROPDOWN PREENCHIDO COM', categoriasParaUsar.length, 'CATEGORIAS!');
        }
      } catch (error) {
        console.error('💥 Erro ao carregar categorias:', error);
      }
      
      // Focar no primeiro campo ao abrir o modal
      if (transacaoDescricao) transacaoDescricao.focus();
    });
    
    modalEl.addEventListener('hidden.bs.modal', () => {
      console.log('❌ Modal de transação fechado');
      // Limpar o formulário quando o modal fechar
      limparFormularioCompleto();
    });
  }
}

// Formata o campo de valor para exibir como moeda brasileira em tempo real
function formatarCampoValor(e) {
  const el = e.target;
  
  console.log('🔥 Formatando valor:', el.value);
  
  // Remover tudo que não é dígito
  let apenasNumeros = el.value.replace(/\D/g, '');
  
  console.log('📋 Apenas números:', apenasNumeros);
  
  // Se não houver números, limpar campo
  if (!apenasNumeros || apenasNumeros === '') {
    el.value = '';
    return;
  }
  
  // Converter para número (em centavos)
  let valorEmCentavos = parseInt(apenasNumeros);
  
  // Converter centavos para reais
  let valorEmReais = valorEmCentavos / 100;
  
  console.log('💰 Valor em reais:', valorEmReais);
  
  // Formatar manualmente no padrão brasileiro
  let valorFormatado = valorEmReais.toFixed(2).replace('.', ',');
  
  // Adicionar separadores de milhares
  let partes = valorFormatado.split(',');
  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  valorFormatado = partes.join(',');
  
  console.log('✅ Valor formatado:', valorFormatado);
  
  // Aplicar valor formatado
  el.value = valorFormatado;
  
  // Colocar cursor no final
  setTimeout(() => {
    if (el.setSelectionRange) {
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, 10);
}

// SOLUÇÃO DEFINITIVA - Carrega e preenche as categorias na força bruta
async function carregarEPreencherCategorias() {
  console.log('🔥 CARREGANDO CATEGORIAS NA FORÇA BRUTA!');
  
  try {
    // Carregar categorias diretamente da API
    const response = await fetch('/api/categorias');
    const categorias = await response.json();
    
    console.log('📊 Categorias recebidas da API:', categorias);
    
    // Separar por tipo
    const categoriasEntrada = categorias.filter(c => c.tipo === 'entrada');
    const categoriasSaida = categorias.filter(c => c.tipo === 'saida');
    
    console.log('✅ Entrada:', categoriasEntrada.length, 'Saída:', categoriasSaida.length);
    
    // Salvar globalmente
    window.categoriasEntrada = categoriasEntrada;
    window.categoriasSaida = categoriasSaida;
    
    // Preencher dropdown AGORA
    const select = document.getElementById('transacao-categoria');
    if (!select) {
      console.error('❌ SELECT NÃO ENCONTRADO!');
      return;
    }
    
    // Limpar
    select.innerHTML = '<option value="">Selecione uma categoria</option>';
    
    // Verificar qual tipo está selecionado
    const tipoEntrada = document.getElementById('tipo-entrada');
    const tipoSaida = document.getElementById('tipo-saida');
    
    let categoriasParaUsar = categoriasEntrada; // padrão
    
    if (tipoSaida && tipoSaida.checked) {
      categoriasParaUsar = categoriasSaida;
      console.log('🎯 USANDO CATEGORIAS DE SAÍDA');
    } else {
      console.log('🎯 USANDO CATEGORIAS DE ENTRADA');
    }
    
    // Adicionar todas as opções
    categoriasParaUsar.forEach(categoria => {
      const option = document.createElement('option');
      option.value = categoria.id;
      option.textContent = categoria.nome;
      select.appendChild(option);
      console.log('➕ Adicionada:', categoria.nome);
    });
    
    console.log('🎉 DROPDOWN PREENCHIDO COM', categoriasParaUsar.length, 'CATEGORIAS!');
    
    return true;
  } catch (error) {
    console.error('💥 ERRO:', error);
    return false;
  }
}

// Preenche o dropdown de categorias baseado no tipo selecionado
function preencherDropdownCategorias() {
  console.log('📋 Preenchendo dropdown de categorias...');
  
  const select = document.getElementById('transacao-categoria');
  if (!select) {
    console.error('❌ Select de categorias não encontrado!');
    return;
  }
  
  // Limpar dropdown
  select.innerHTML = '<option value="">Selecione uma categoria</option>';
  
  // Determinar tipo selecionado
  let tipoSelecionado = 'entrada'; // padrão
  
  if (tipoSaidaRadio && tipoSaidaRadio.checked) {
    tipoSelecionado = 'saida';
  } else if (tipoEntradaRadio && tipoEntradaRadio.checked) {
    tipoSelecionado = 'entrada';
  }
  
  console.log('🎯 Tipo selecionado:', tipoSelecionado);
  
  // Selecionar categorias corretas
  const categorias = tipoSelecionado === 'entrada' ? categoriasEntrada : categoriasSaida;
  
  console.log('📊 Categorias para preencher:', categorias);
  
  if (!categorias || categorias.length === 0) {
    console.warn('⚠️ Nenhuma categoria encontrada para o tipo:', tipoSelecionado);
    return;
  }
  
  // Adicionar opções
  categorias.forEach(categoria => {
    const option = document.createElement('option');
    option.value = categoria.id;
    option.textContent = categoria.nome;
    select.appendChild(option);
    console.log('➕ Adicionada categoria:', categoria.nome);
  });
  
  console.log('✅ Dropdown preenchido com', categorias.length, 'categorias');
}

// Exportar o módulo
window.transacoesModule = {
  inicializar: inicializarTransacoes,
  carregarTransacoes,
  carregarCategorias,
  novaTransacao,
  editarTransacao,
  atualizarCategoriasVisiveisNoForm,
  carregarEPreencherCategorias,
  preencherDropdownCategorias,
  salvarTransacaoAgora
}; 