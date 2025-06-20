/**
 * Gerenciamento de categorias financeiras
 */
// Elementos do DOM
const categoriasContainer = document.querySelector('#categorias-page .row');
const categoriasForm = document.getElementById('categoria-form');
const categoriaModal = document.getElementById('categoriaModal') ? new bootstrap.Modal(document.getElementById('categoriaModal')) : null;
const categoriaId = document.getElementById('categoria-id');
const categoriaNome = document.getElementById('categoria-nome');
const categoriaTipo = document.getElementById('categoria-tipo');
const categoriaEntradaRadio = document.getElementById('categoria-tipo-entrada');
const categoriaSaidaRadio = document.getElementById('categoria-tipo-saida');
const salvarCategoriaBtn = document.getElementById('salvar-categoria');
// Variáveis globais
let categorias = [];
// Renomear para evitar duplicação
let categoriasEntradaList = [];
let categoriasSaidaList = [];
// Inicialização
function inicializarCategorias() {
  // Verificar se os elementos existem antes de configurar
  if (!categoriasContainer) {
    console.error('❌ Elementos de categorias não encontrados');
    return;
  }
  carregarCategorias();
  configurarEventListeners();
}
// Carrega as categorias da API
async function carregarCategorias() {
  try {
    categorias = await api.obterCategorias();
    // Separar por tipo
    categoriasEntradaList = categorias.filter(cat => cat.tipo === 'entrada');
    categoriasSaidaList = categorias.filter(cat => cat.tipo === 'saida');
    // Exportar para o escopo global para uso em outros módulos
    window.categoriasEntradaList = categoriasEntradaList;
    window.categoriasSaidaList = categoriasSaidaList;
    renderizarCategorias();
    return { entrada: categoriasEntradaList, saida: categoriasSaidaList };
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
    return { entrada: [], saida: [] };
  }
}
// Renderiza as listas de categorias
function renderizarCategorias() {
  // Usar os elementos que já existem no HTML
  const categoriasEntradaListEl = document.getElementById('lista-categorias-entrada');
  const categoriasSaidaListEl = document.getElementById('lista-categorias-saida');
  if (!categoriasEntradaListEl || !categoriasSaidaListEl) {
    console.error('Elementos de lista de categorias não encontrados');
    return;
  }
  // Lista de entradas
  if (categoriasEntradaList.length === 0) {
    categoriasEntradaListEl.innerHTML = `
      <li class="list-group-item text-center py-4">
        <div class="d-flex flex-column align-items-center text-muted">
          <i class="bi bi-inbox fs-2 mb-2"></i>
          <span>Nenhuma categoria de entrada cadastrada</span>
        </div>
      </li>
    `;
  } else {
    categoriasEntradaListEl.innerHTML = '';
    categoriasEntradaList.forEach(categoria => {
      renderizarItemCategoria(categoriasEntradaListEl, categoria);
    });
  }
  // Lista de saídas
  if (categoriasSaidaList.length === 0) {
    categoriasSaidaListEl.innerHTML = `
      <li class="list-group-item text-center py-4">
        <div class="d-flex flex-column align-items-center text-muted">
          <i class="bi bi-inbox fs-2 mb-2"></i>
          <span>Nenhuma categoria de saída cadastrada</span>
        </div>
      </li>
    `;
  } else {
    categoriasSaidaListEl.innerHTML = '';
    categoriasSaidaList.forEach(categoria => {
      renderizarItemCategoria(categoriasSaidaListEl, categoria);
    });
  }
}
// Renderiza um item de categoria na lista
function renderizarItemCategoria(container, categoria) {
  const item = document.createElement('li');
  item.className = 'list-group-item d-flex justify-content-between align-items-center';
  // Determinar ícone com base no tipo
  const icone = categoria.tipo === 'entrada' 
    ? '<i class="bi bi-arrow-down-circle text-success me-2"></i>'
    : '<i class="bi bi-arrow-up-circle text-danger me-2"></i>';
  item.innerHTML = `
    <div class="d-flex align-items-center">
      ${icone}
      <span>${categoria.nome}</span>
    </div>
    <div class="acoes">
      <button class="btn btn-sm btn-action btn-outline-primary me-1" data-action="editar" data-id="${categoria.id}" title="Editar">
        <i class="bi bi-pencil"></i>
      </button>
      <button class="btn btn-sm btn-action btn-outline-danger" data-action="excluir" data-id="${categoria.id}" title="Excluir">
        <i class="bi bi-trash"></i>
      </button>
    </div>
  `;
  // Adicionar event listeners para os botões de ação
  const editarBtn = item.querySelector('[data-action="editar"]');
  const excluirBtn = item.querySelector('[data-action="excluir"]');
  if (editarBtn) {
    editarBtn.addEventListener('click', () => editarCategoria(categoria.id));
  }
  if (excluirBtn) {
    excluirBtn.addEventListener('click', () => confirmarExclusaoCategoria(categoria.id));
  }
  container.appendChild(item);
}
// Prepara o modal para uma nova categoria
function novaCategoria(tipo = 'entrada') {
  limparFormulario();
  // Configurar o modal para nova categoria
  if (categoriaId) {
    categoriaId.value = '';
  }
  // Tipo padrão (radio)
  if (categoriaEntradaRadio && categoriaSaidaRadio) {
    if (tipo === 'entrada') {
      categoriaEntradaRadio.checked = true;
      categoriaSaidaRadio.checked = false;
    } else {
      categoriaEntradaRadio.checked = false;
      categoriaSaidaRadio.checked = true;
    }
  }
  // Campo hidden
  if (categoriaTipo) {
    categoriaTipo.value = tipo;
  }
  // Mostrar o modal
  if (categoriaModal) {
    categoriaModal.show();
  }
}
// Prepara o modal para editar uma categoria existente
function editarCategoria(id) {
  try {
    limparFormulario();
    // Buscar categoria
    const categoria = categorias.find(c => c.id == id);
    if (!categoria) {
      notificar('Erro', 'Categoria não encontrada', 'danger');
      return;
    }
    // Preencher formulário
    if (categoriaId) {
      categoriaId.value = categoria.id;
    }
    if (categoriaNome) {
      categoriaNome.value = categoria.nome;
    }
    // Definir o tipo (radio)
    if (categoriaEntradaRadio && categoriaSaidaRadio) {
      if (categoria.tipo === 'entrada') {
        categoriaEntradaRadio.checked = true;
        categoriaSaidaRadio.checked = false;
      } else {
        categoriaEntradaRadio.checked = false;
        categoriaSaidaRadio.checked = true;
      }
    }
    // Campo hidden
    if (categoriaTipo) {
      categoriaTipo.value = categoria.tipo;
    }
    // Mostrar o modal
    if (categoriaModal) {
      categoriaModal.show();
    }
  } catch (error) {
    console.error('Erro ao editar categoria:', error);
    notificar('Erro', `Falha ao editar categoria: ${error.message}`, 'danger');
  }
}
// Salva a categoria (nova ou editada)
async function salvarCategoria() {
  try {
    // Validação básica
    if (!categoriaNome || !categoriaNome.value.trim()) {
      notificar('Validação', 'Nome da categoria é obrigatório', 'warning');
      categoriaNome.focus();
      return;
    }
    // Construir objeto com os dados da categoria
    // Obter tipo (preferir radio buttons, fallback para o campo hidden)
    let tipo = 'entrada'; // valor padrão
    if (categoriaEntradaRadio && categoriaSaidaRadio) {
      tipo = categoriaEntradaRadio.checked ? 'entrada' : 'saida';
    } else if (categoriaTipo) {
      tipo = categoriaTipo.value;
    }
    const categoria = {
      nome: categoriaNome.value.trim(),
      tipo: tipo
    };
    let resultado;
    // Verificar se é uma edição ou nova categoria
    if (categoriaId && categoriaId.value) {
      // Atualizar categoria existente
      resultado = await api.atualizarCategoria(categoriaId.value, categoria);
      notificar('Sucesso', 'Categoria atualizada com sucesso', 'success');
    } else {
      // Criar nova categoria
      resultado = await api.criarCategoria(categoria);
      notificar('Sucesso', 'Categoria criada com sucesso', 'success');
    }
    // Fechar o modal
    if (categoriaModal) {
      categoriaModal.hide();
    }
    // Recarregar categorias
    await carregarCategorias();
    // Atualizar formulário de transações se o módulo estiver disponível
    if (window.transacoesModule && typeof window.transacoesModule.atualizarCategoriasVisiveisNoForm === 'function') {
      window.transacoesModule.atualizarCategoriasVisiveisNoForm();
    }
  } catch (error) {
    console.error('❌ Erro ao salvar categoria:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Detalhes do erro:', {
      message: error.message,
      name: error.name,
      response: error.response
    });
    notificar('Erro', `Falha ao salvar categoria: ${error.message}`, 'danger');
  }
}
// Confirma a exclusão de uma categoria
function confirmarExclusaoCategoria(id) {
  confirmDialog.show(
    'Tem certeza que deseja excluir esta categoria?',
    () => excluirCategoria(id)
  );
}
// Exclui uma categoria
async function excluirCategoria(id) {
  try {
    await api.excluirCategoria(id);
    notificar('Sucesso', 'Categoria excluída com sucesso', 'success');
    // Recarregar categorias
    await carregarCategorias();
    // Atualizar formulário de transações se o módulo estiver disponível
    if (window.transacoesModule && typeof window.transacoesModule.atualizarCategoriasVisiveisNoForm === 'function') {
      window.transacoesModule.atualizarCategoriasVisiveisNoForm();
    }
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    notificar('Erro', `Falha ao excluir categoria: ${error.message}`, 'danger');
  }
}
// Limpa o formulário de categoria
function limparFormulario() {
  if (categoriasForm) {
    categoriasForm.reset();
  }
  if (categoriaId) {
    categoriaId.value = '';
  }
  if (categoriaNome) {
    categoriaNome.value = '';
  }
  // Definir tipo padrão para entrada (radio e hidden)
  if (categoriaEntradaRadio && categoriaSaidaRadio) {
    categoriaEntradaRadio.checked = true;
    categoriaSaidaRadio.checked = false;
  }
  if (categoriaTipo) {
    categoriaTipo.value = 'entrada';
  }
}
// Configura os eventos de interação com o usuário
function configurarEventListeners() {
  // Validar se os elementos existem
  if (!salvarCategoriaBtn || !categoriasForm) {
    console.error('❌ Elementos de formulário não encontrados:', {
      salvarCategoriaBtn: !!salvarCategoriaBtn,
      categoriasForm: !!categoriasForm
    });
    return;
  }
  // Ao submeter o formulário
  categoriasForm.addEventListener('submit', (e) => {
    e.preventDefault();
    salvarCategoria();
  });
  // Ao clicar no botão de salvar
  salvarCategoriaBtn.addEventListener('click', (e) => {
    e.preventDefault();
    salvarCategoria();
  });
  // Event listener para quando o modal abrir
  if (categoriaModal) {
    categoriaModal.addEventListener('shown.bs.modal', function () {
      limparFormulario();
      categoriaNome.focus();
    });
  }
  // Eventos para os radio buttons de tipo
  if (categoriaEntradaRadio && categoriaSaidaRadio) {
    categoriaEntradaRadio.addEventListener('change', () => {
      if (categoriaEntradaRadio.checked && categoriaTipo) {
        categoriaTipo.value = 'entrada';
      }
    });
    categoriaSaidaRadio.addEventListener('change', () => {
      if (categoriaSaidaRadio.checked && categoriaTipo) {
        categoriaTipo.value = 'saida';
      }
    });
  }
  // Botão "Nova Categoria" na interface
  const btnNovaCategoria = document.querySelector('[data-bs-target="#categoriaModal"]');
  if (btnNovaCategoria) {
    btnNovaCategoria.addEventListener('click', () => novaCategoria());
  }
}
// Exportar funções para escopo global (necessário para event handlers)
window.salvarCategoria = salvarCategoria;
window.novaCategoria = novaCategoria;
window.editarCategoria = editarCategoria;
window.confirmarExclusaoCategoria = confirmarExclusaoCategoria;
// Inicializar e exportar o módulo
const categoriasModule = {
  inicializar: inicializarCategorias,
  carregarCategorias: carregarCategorias,
  obterCategoriasEntrada: () => categoriasEntradaList,
  obterCategoriasSaida: () => categoriasSaidaList,
  obterTodasCategorias: () => categorias,
  salvarCategoria: salvarCategoria,
  novaCategoria: novaCategoria,
  editarCategoria: editarCategoria
};
// Exportar o módulo
window.categoriasModule = categoriasModule; 
