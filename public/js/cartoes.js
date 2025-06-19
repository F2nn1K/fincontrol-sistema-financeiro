/**
 * Gerenciamento de cartões de crédito e parcelas
 */

// Elementos do DOM - inicializados como null, serão definidos na inicialização
let cartoesContainer = null;
let semCartoes = null;
let cartaoForm = null;
let cartaoModal = null;
let cartaoId = null;
let cartaoNome = null;
let cartaoLimite = null;
let cartaoFechamento = null;
let cartaoVencimento = null;
let salvarCartaoBtn = null;
let filtroCartao = null;
let tabelaParcelas = null;

// Compras parceladas - inicializados como null, serão definidos na inicialização
let compraForm = null;
let compraModal = null;
let compraId = null;
let compraDescricao = null;
let compraValor = null;
let compraData = null;
let compraParcelas = null;
let compraCartao = null;
let compraCategoria = null;
let salvarCompraBtn = null;

// Variáveis globais
let cartoes = [];
let parcelas = [];
let cartoesMap = {};

// Função para formatar campos de valor em tempo real (formato brasileiro)
function formatarCampoValorCartao(e) {
  const el = e.target;
  
  console.log('🔥 Formatando valor do cartão:', el.value);
  
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

// Inicialização
function inicializarCartoes() {
  console.log('🚀 Inicializando módulo de cartões');
  
  // Inicializar elementos do DOM
  cartoesContainer = document.getElementById('cartoes-container');
  semCartoes = document.getElementById('sem-cartoes');
  cartaoForm = document.getElementById('cartao-form');
  cartaoId = document.getElementById('cartao-id');
  cartaoNome = document.getElementById('cartao-nome');
  cartaoLimite = document.getElementById('cartao-limite');
  cartaoFechamento = document.getElementById('cartao-fechamento');
  cartaoVencimento = document.getElementById('cartao-vencimento');
  salvarCartaoBtn = document.getElementById('salvar-cartao');
  filtroCartao = document.getElementById('filtro-cartao');
  tabelaParcelas = document.getElementById('tabela-parcelas');
  
  // Inicializar elementos de compra
  compraForm = document.getElementById('compra-form');
  compraId = document.getElementById('compra-id');
  compraDescricao = document.getElementById('compra-descricao');
  compraValor = document.getElementById('compra-valor');
  compraData = document.getElementById('compra-data');
  compraParcelas = document.getElementById('compra-parcelas');
  compraCartao = document.getElementById('compra-cartao');
  compraCategoria = document.getElementById('compra-categoria');
  salvarCompraBtn = document.getElementById('salvar-compra');
  
  console.log('🔍 Verificando elementos encontrados:');
  console.log('- compraForm:', !!compraForm);
  console.log('- salvarCompraBtn:', !!salvarCompraBtn);
  console.log('- compraDescricao:', !!compraDescricao);
  console.log('- compraValor:', !!compraValor);
  console.log('- compraCartao:', !!compraCartao);
  
  // Inicializar modais
  const cartaoModalElement = document.getElementById('cartaoModal');
  const compraModalElement = document.getElementById('compraParceladaModal');
  
  if (cartaoModalElement) {
    cartaoModal = new bootstrap.Modal(cartaoModalElement);
  }
  
  if (compraModalElement) {
    compraModal = new bootstrap.Modal(compraModalElement);
  }
  
  // Configurar event listeners
  configurarEventListeners();
  
  // Carregar dados (cartões e parcelas)
  carregarCartoes().then(() => {
    // Após carregar cartões, carregar parcelas se ainda não foram carregadas
    if (parcelas.length === 0) {
      carregarParcelas();
    }
  });
  
  // Adicionar evento para o botão de adicionar compra no card do cartão
  document.addEventListener('click', function(event) {
    if (event.target.matches('[data-action="adicionar-compra"]') || 
        event.target.closest('[data-action="adicionar-compra"]')) {
      
      const button = event.target.matches('[data-action="adicionar-compra"]') ? 
                    event.target : 
                    event.target.closest('[data-action="adicionar-compra"]');
      
      const cartaoId = button.getAttribute('data-cartao-id');
      novaCompra(cartaoId);
    }
  });
}

// Carrega os cartões da API
async function carregarCartoes() {
  try {
    console.log('🔄 Iniciando carregamento de cartões...');
    
    // Verificar se a função existe no objeto api
    if (typeof api.obterCartoes !== 'function') {
      console.error('❌ Função api.obterCartoes não está disponível');
      return [];
    }
    
    // Obter cartões da API
    const data = await api.obterCartoes();
    console.log('📋 Cartões recebidos da API:', data);
    
    // Atualizar variáveis globais
    cartoes = data;
    cartoesMap = {};
    
    // Criar mapa para acesso rápido
    cartoes.forEach(cartao => {
      cartoesMap[cartao.id] = cartao;
    });
    
    console.log('📊 Total de cartões:', cartoes.length);
    
    // Renderizar na interface
    renderizarCartoes();
    
    // Preencher selects
    preencherSelectCartoes();
    preencherFiltroCartoes();
    
    return cartoes;
  } catch (error) {
    console.error('❌ Erro ao carregar cartões:', error);
    return [];
  }
}

// Renderiza os cartões na interface
function renderizarCartoes() {
  console.log('🎨 Renderizando cartões...');
  
  const container = document.getElementById('cartoes-container');
  if (!container) {
    console.error('❌ Container cartoes-container não encontrado!');
    return;
  }
  
  console.log('📦 Container encontrado');
  
  // Limpar container
  container.innerHTML = '';
  
  // Se não há cartões, mostrar mensagem
  if (!cartoes || cartoes.length === 0) {
    console.log('⚠️ Nenhum cartão para renderizar');
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info text-center">
          <i class="bi bi-credit-card me-2"></i> Nenhum cartão cadastrado. Clique em "Novo Cartão" para adicionar.
        </div>
      </div>
    `;
    return;
  }
  
  console.log('✅ Renderizando', cartoes.length, 'cartões');
  
  // Renderizar cada cartão
  cartoes.forEach(cartao => {
    // Calcular limite usado
    const limiteUsado = calcularLimiteUsado(cartao.id);
    const limiteDisponivel = cartao.limite - limiteUsado;
    const percentUsado = (limiteUsado / cartao.limite) * 100;
    
    // Criar elemento do cartão
    const cardElement = document.createElement('div');
    cardElement.className = 'col-md-6 col-lg-4 mb-4';
    cardElement.innerHTML = `
      <div class="card h-100 cartao-card">
        <div class="card-header bg-${cartao.cor || 'primary'} text-white">
          <h5 class="mb-0">${cartao.nome}</h5>
          <div class="small">
            Fechamento: dia ${cartao.fechamento} • 
            Vencimento: dia ${cartao.vencimento}
          </div>
        </div>
        <div class="card-body">
          <div class="mb-3">
            <div class="d-flex justify-content-between mb-1">
              <span>Limite Total:</span>
              <span class="fw-bold">R$ ${formatarNumero(cartao.limite)}</span>
            </div>
            <div class="d-flex justify-content-between mb-1">
              <span>Usado:</span>
              <span>R$ ${formatarNumero(limiteUsado)}</span>
            </div>
            <div class="d-flex justify-content-between mb-1">
              <span>Disponível:</span>
              <span class="text-success">R$ ${formatarNumero(limiteDisponivel)}</span>
            </div>
          </div>
          
          <div class="progress mb-3" style="height: 10px;">
            <div class="progress-bar bg-${percentUsado > 80 ? 'danger' : percentUsado > 60 ? 'warning' : 'success'}" 
                 role="progressbar" 
                 style="width: ${percentUsado}%" 
                 aria-valuenow="${percentUsado}" 
                 aria-valuemin="0" 
                 aria-valuemax="100"></div>
          </div>
          
          <button class="btn btn-success w-100" data-action="adicionar-compra" data-cartao-id="${cartao.id}">
            <i class="bi bi-bag-plus me-1"></i> Adicionar Compra
          </button>
        </div>
        <div class="card-footer d-flex justify-content-between">
          <button class="btn btn-sm btn-outline-primary" data-action="editar-cartao" data-id="${cartao.id}">
            <i class="bi bi-pencil"></i> Editar
          </button>
          <button class="btn btn-sm btn-outline-danger" data-action="excluir-cartao" data-id="${cartao.id}">
            <i class="bi bi-trash"></i> Excluir
          </button>
        </div>
      </div>
    `;
    
    // Adicionar ao container
    container.appendChild(cardElement);
    
    // Adicionar event listeners aos botões
    const editarBtn = cardElement.querySelector('[data-action="editar-cartao"]');
    if (editarBtn) {
      editarBtn.addEventListener('click', () => editarCartao(cartao.id));
    }
    
    const excluirBtn = cardElement.querySelector('[data-action="excluir-cartao"]');
    if (excluirBtn) {
      excluirBtn.addEventListener('click', () => confirmarExclusaoCartao(cartao.id));
    }
    
    const adicionarCompraBtn = cardElement.querySelector('[data-action="adicionar-compra"]');
    if (adicionarCompraBtn) {
      adicionarCompraBtn.addEventListener('click', () => novaCompra(cartao.id));
    }
  });
}

// Calcula o limite usado de um cartão
function calcularLimiteUsado(cartaoId) {
  console.log(`💳 Calculando limite usado para cartão ${cartaoId}`);
  
  if (!parcelas || !Array.isArray(parcelas)) {
    console.log('⚠️ Nenhuma parcela encontrada');
    return 0;
  }
  
  // Somar todas as parcelas não pagas deste cartão
  let total = 0;
  let parcelasEncontradas = 0;
  let parcelasPagas = 0;
  
  if (parcelas.length > 0) {
    parcelas.forEach(parcela => {
      // Verificar se a parcela pertence ao cartão
      if (parcela.cartao_id == cartaoId) {
        parcelasEncontradas++;
        
        // Verificar se a parcela está paga (pode ser 0, false, null, undefined para não paga)
        const isPaga = parcela.pago === 1 || parcela.pago === true || parcela.pago === 'true';
        
        if (isPaga) {
          parcelasPagas++;
          console.log(`✅ Parcela ${parcela.id} está paga: R$ ${parcela.valor}`);
        } else {
          const valor = parseFloat(parcela.valor || 0);
          total += valor;
          console.log(`💰 Parcela ${parcela.id} não paga: R$ ${valor} (Total: R$ ${total.toFixed(2)})`);
        }
      }
    });
  }
  
  console.log(`📊 Cartão ${cartaoId}: ${parcelasEncontradas} parcelas, ${parcelasPagas} pagas, limite usado: R$ ${total.toFixed(2)}`);
  
  return total;
}

// Preenche os selects de cartões
function preencherSelectCartoes() {
  if (!compraCartao) return;
  
  // Limpar opções existentes
  compraCartao.innerHTML = '<option value="">Selecione um cartão</option>';
  
  cartoes.forEach(cartao => {
    const option = document.createElement('option');
    option.value = cartao.id;
    option.textContent = cartao.nome;
    compraCartao.appendChild(option);
  });
}

// Preenche o filtro de cartões na tabela de parcelas
function preencherFiltroCartoes() {
  if (!filtroCartao) return;
  
  // Manter apenas a primeira opção
  filtroCartao.innerHTML = '<option value="">Todos os cartões</option>';
  
  cartoes.forEach(cartao => {
    const option = document.createElement('option');
    option.value = cartao.id;
    option.textContent = cartao.nome;
    filtroCartao.appendChild(option);
  });
}

// Prepara o formulário para adicionar uma nova compra
function novaCompra(cartaoId = null) {
  console.log('🆕 Abrindo modal de nova compra, cartaoId:', cartaoId);
  
  // Limpar o formulário
  document.getElementById('compra-descricao').value = '';
  document.getElementById('compra-valor').value = '';
  document.getElementById('compra-parcelas').value = '1';
  document.getElementById('compra-id').value = '';
  
  // Ocultar seção de parcelas personalizadas
  const parcelasDiv = document.getElementById('parcelas-personalizadas');
  if (parcelasDiv) {
    parcelasDiv.style.display = 'none';
  }
  
  // Limpar campos de parcelas personalizadas
  const listaParcelasDiv = document.getElementById('lista-parcelas');
  if (listaParcelasDiv) {
    listaParcelasDiv.innerHTML = '';
  }
  
  // Definir data atual
  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('compra-data').value = hoje;
  
  // Selecionar cartão se informado
  if (cartaoId) {
    document.getElementById('compra-cartao').value = cartaoId;
  }
  
  // Atualizar título do modal
  document.getElementById('compraParceladaModalLabel').textContent = 'Nova Compra no Cartão';
  
  // Verificar se o botão de salvar existe
  const botaoSalvar = document.getElementById('salvar-compra');
  if (botaoSalvar) {
    console.log('✅ Botão salvar-compra encontrado no modal');
  } else {
    console.error('❌ Botão salvar-compra NÃO encontrado no modal');
  }
  
  // Abrir o modal
  const compraModal = new bootstrap.Modal(document.getElementById('compraParceladaModal'));
  compraModal.show();
  
  // Configurar event listeners após abrir o modal
  setTimeout(() => {
    const botaoSalvarModal = document.getElementById('salvar-compra');
    if (botaoSalvarModal) {
      console.log('🔧 Configurando listener do modal após abertura');
      
      // Remover qualquer listener anterior
      botaoSalvarModal.removeEventListener('click', salvarCompra);
      
      // Adicionar novo listener
      botaoSalvarModal.addEventListener('click', (e) => {
        console.log('🖱️ Botão clicado via listener do modal!');
        e.preventDefault();
        e.stopPropagation();
        salvarCompra();
      });
      
      botaoSalvarModal.setAttribute('data-listener-modal', 'true');
    }
    
    // Configurar event listeners para parcelas personalizadas
    const compraParcelas = document.getElementById('compra-parcelas');
    if (compraParcelas) {
      console.log('🔧 Configurando listeners de parcelas personalizadas');
      
      // Remover listeners existentes
      compraParcelas.removeEventListener('change', gerenciarParcelasPersonalizadas);
      compraParcelas.removeEventListener('input', gerenciarParcelasPersonalizadas);
      
      // Adicionar novos listeners
      compraParcelas.addEventListener('change', () => {
        console.log('📝 Campo parcelas mudou via change');
        gerenciarParcelasPersonalizadas();
      });
      compraParcelas.addEventListener('input', () => {
        console.log('📝 Campo parcelas mudou via input');
        gerenciarParcelasPersonalizadas();
      });
      
      // Verificar valor inicial
      gerenciarParcelasPersonalizadas();
    }
    
    // Configurar listener para valor da compra
    const compraValor = document.getElementById('compra-valor');
    if (compraValor) {
      compraValor.removeEventListener('input', atualizarValorOriginal);
      compraValor.addEventListener('input', atualizarValorOriginal);
    }
    
  }, 200);
}

// Prepara o formulário para editar um cartão existente
function editarCartao(id) {
  const cartao = cartoesMap[id];
  if (!cartao) {
    notificar('Cartão não encontrado', 'error');
    return;
  }
  
  // Preencher o formulário
  document.getElementById('cartao-id').value = cartao.id;
  document.getElementById('cartao-nome').value = cartao.nome;
  document.getElementById('cartao-limite').value = cartao.limite;
  document.getElementById('cartao-fechamento').value = cartao.fechamento;
  document.getElementById('cartao-vencimento').value = cartao.vencimento;
  
  // Selecionar a cor
  const corRadio = document.getElementById(`cartao-cor-${cartao.cor}`);
  if (corRadio) {
    corRadio.checked = true;
  }
  
  // Atualizar título do modal
  document.getElementById('cartaoModalLabel').textContent = 'Editar Cartão de Crédito';
  
  // Abrir o modal
  const modal = new bootstrap.Modal(document.getElementById('cartaoModal'));
  modal.show();
}

// Salva o cartão no backend
function salvarCartao() {
  console.log('💾 Salvando cartão...');
  
  try {
    // Buscar elementos de forma mais robusta
    const nome = document.querySelector('#cartao-nome, #nome-cartao');
    const limite = document.querySelector('#cartao-limite, #limite-cartao');
    const fechamento = document.querySelector('#cartao-fechamento, #fechamento-cartao');
    const vencimento = document.querySelector('#cartao-vencimento, #vencimento-cartao');
    const cor = document.querySelector('input[name="cartao-cor"]:checked, input[name="cor-cartao"]:checked');
    
    console.log('🔍 Elementos encontrados:');
    console.log('- nome:', nome?.id, nome?.value);
    console.log('- limite:', limite?.id, limite?.value);
    console.log('- fechamento:', fechamento?.id, fechamento?.value);
    console.log('- vencimento:', vencimento?.id, vencimento?.value);
    console.log('- cor:', cor?.id, cor?.value);
    
    if (!nome || !limite || !fechamento || !vencimento) {
      mostrarAlerta('Erro: Elementos do formulário não encontrados. Tente fechar e abrir o modal novamente.', 'danger');
      return;
    }
    
    // Validar campos
    if (!nome.value.trim()) {
      mostrarAlerta('Por favor, informe o nome do cartão.', 'warning');
      nome.focus();
      return;
    }
    
    if (!limite.value || parseFloat(limite.value) <= 0) {
      mostrarAlerta('Por favor, informe um limite válido.', 'warning');
      limite.focus();
      return;
    }
    
    if (!fechamento.value || parseInt(fechamento.value) < 1 || parseInt(fechamento.value) > 31) {
      mostrarAlerta('Por favor, informe um dia de fechamento válido (1-31).', 'warning');
      fechamento.focus();
      return;
    }
    
    if (!vencimento.value || parseInt(vencimento.value) < 1 || parseInt(vencimento.value) > 31) {
      mostrarAlerta('Por favor, informe um dia de vencimento válido (1-31).', 'warning');
      vencimento.focus();
      return;
    }
    
    // Coletar dados
    // Converter limite do formato brasileiro para número
    const limiteNumerico = limite.value.replace(/\./g, '').replace(',', '.');
    
    const dados = {
      nome: nome.value.trim(),
      limite: parseFloat(limiteNumerico),
      fechamento: parseInt(fechamento.value),
      vencimento: parseInt(vencimento.value),
      cor: cor?.value || 'primary'
    };
    
    console.log('📋 Dados:', dados);
    
    // Desabilitar botão
    const botaoSalvar = document.getElementById('salvar-cartao');
    if (botaoSalvar) {
      botaoSalvar.disabled = true;
      botaoSalvar.textContent = 'Salvando...';
    }
    
    // Fazer requisição
    fetch('http://localhost:3030/api/cartoes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dados)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then(resultado => {
      console.log('✅ Cartão criado:', resultado);
      
      // Mostrar alerta de sucesso personalizado
      const mensagem = `Cartão "${resultado.nome}" criado com limite de R$ ${resultado.limite.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
      mostrarAlerta(mensagem, 'success');
      
      // Fechar modal
      const modalElement = document.getElementById('cartaoModal');
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
      
      // Limpar formulário
      nome.value = '';
      limite.value = '';
      fechamento.value = '';
      vencimento.value = '';
      if (cor) cor.checked = false;
      
      // Recarregar cartões
      console.log('🔄 Recarregando cartões após criar...');
      carregarCartoes();
    })
    .catch(error => {
      console.error('❌ Erro:', error);
      mostrarAlerta(error.message, 'danger');
    })
    .finally(() => {
      // Restaurar botão
      if (botaoSalvar) {
        botaoSalvar.disabled = false;
        botaoSalvar.innerHTML = '<i class="bi bi-check-circle me-1"></i> Salvar';
      }
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    mostrarAlerta('Erro: ' + error.message, 'danger');
  }
}

// Função para mostrar alertas personalizados
function mostrarAlerta(mensagem, tipo = 'info') {
  const tiposConfig = {
    success: {
      classe: 'alert-success',
      icone: 'bi-check-circle-fill',
      corIcone: 'text-success',
      titulo: 'Sucesso!'
    },
    danger: {
      classe: 'alert-danger', 
      icone: 'bi-exclamation-triangle-fill',
      corIcone: 'text-danger',
      titulo: 'Erro!'
    },
    warning: {
      classe: 'alert-warning',
      icone: 'bi-exclamation-circle-fill', 
      corIcone: 'text-warning',
      titulo: 'Atenção!'
    },
    info: {
      classe: 'alert-info',
      icone: 'bi-info-circle-fill',
      corIcone: 'text-info', 
      titulo: 'Informação'
    }
  };
  
  const config = tiposConfig[tipo] || tiposConfig.info;
  
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert ${config.classe} alert-dismissible fade show position-fixed`;
  alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; max-width: 400px;';
  alertDiv.innerHTML = `
    <div class="d-flex align-items-center">
      <i class="bi ${config.icone} me-2 ${config.corIcone} fs-4"></i>
      <div>
        <strong>${config.titulo}</strong><br>
        <small>${mensagem}</small>
      </div>
      <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
    </div>
  `;
  
  document.body.appendChild(alertDiv);
  
  // Remover automaticamente (tempo varia por tipo)
  const tempos = { success: 4000, warning: 5000, danger: 7000, info: 5000 };
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, tempos[tipo] || 5000);
  }

// Gerencia a exibição das parcelas personalizadas
function gerenciarParcelasPersonalizadas() {
  console.log('🔧 Gerenciando parcelas personalizadas...');
  
  const compraParcelas = document.getElementById('compra-parcelas');
  const parcelasDiv = document.getElementById('parcelas-personalizadas');
  
  if (!compraParcelas || !parcelasDiv) {
    console.error('❌ Elementos não encontrados:', {
      compraParcelas: !!compraParcelas,
      parcelasDiv: !!parcelasDiv
    });
    return;
  }
  
  const numParcelas = parseInt(compraParcelas.value) || 1;
  console.log('📊 Número de parcelas:', numParcelas);
  
  if (numParcelas >= 2) {
    console.log('✅ Mostrando seção de parcelas personalizadas');
    // Mostrar seção de parcelas personalizadas
    parcelasDiv.style.display = 'block';
    
    // Configurar event listener para o campo de valor único
    const valorParcelaUnica = document.getElementById('valor-parcela-unica');
    if (valorParcelaUnica) {
      valorParcelaUnica.removeEventListener('input', calcularTotalParcelasUnicas);
      valorParcelaUnica.addEventListener('input', calcularTotalParcelasUnicas);
      
             // Calcular valor sugerido (apenas como referência)
       const valorTotal = parseFloat(document.getElementById('compra-valor').value) || 0;
       if (valorTotal > 0) {
         const valorSugerido = (valorTotal / numParcelas).toFixed(2);
         valorParcelaUnica.placeholder = `Sugestão sem juros: R$ ${valorSugerido}`;
         valorParcelaUnica.value = ''; // Deixar vazio para a pessoa digitar o valor real
       }
    }
    
  } else {
    console.log('🔒 Ocultando seção de parcelas personalizadas');
    // Ocultar seção de parcelas personalizadas
    parcelasDiv.style.display = 'none';
  }
  
  atualizarValorOriginal();
}

// Calcula a data de vencimento para cada parcela
function calcularDataVencimento(numeroParcela) {
  const cartaoId = document.getElementById('compra-cartao').value;
  if (!cartaoId) return 'Selecione um cartão';
  
  const cartao = cartoesMap[cartaoId];
  if (!cartao) return 'Cartão não encontrado';
  
  const dataCompra = new Date(document.getElementById('compra-data').value || new Date());
  const hoje = new Date();
  
  // Calcular o mês de vencimento baseado na data da compra e dia de fechamento
  let mesVencimento = new Date(dataCompra);
  
  // Se a compra foi após o fechamento, vai para o próximo mês
  if (dataCompra.getDate() > cartao.fechamento) {
    mesVencimento.setMonth(mesVencimento.getMonth() + 1);
  }
  
  // Adicionar os meses da parcela
  mesVencimento.setMonth(mesVencimento.getMonth() + (numeroParcela - 1));
  mesVencimento.setDate(cartao.vencimento);
  
  return mesVencimento.toLocaleDateString('pt-BR');
}

// Calcula o total das parcelas com valor único
function calcularTotalParcelasUnicas() {
  const valorParcela = parseFloat(document.getElementById('valor-parcela-unica').value) || 0;
  const numParcelas = parseInt(document.getElementById('compra-parcelas').value) || 1;
  const valorOriginal = parseFloat(document.getElementById('compra-valor').value) || 0;
  
  const totalCalculado = valorParcela * numParcelas;
  
  // Atualizar o total calculado
  const totalSpan = document.getElementById('total-parcelas-calculado');
  if (totalSpan) {
    totalSpan.textContent = `R$ ${totalCalculado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
  }
  
  // Mostrar status
  const statusDiv = document.getElementById('status-parcelas');
  const mensagemSpan = document.getElementById('mensagem-status');
  
  if (statusDiv && mensagemSpan) {
    // Ocultar status - usuário não precisa dessa informação
    statusDiv.style.display = 'none';
  }
}

// Atualiza o valor original exibido
function atualizarValorOriginal() {
  const valorOriginal = parseFloat(document.getElementById('compra-valor').value) || 0;
  const spanOriginal = document.getElementById('valor-original-compra');
  
  if (spanOriginal) {
    spanOriginal.textContent = `R$ ${valorOriginal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
  }
  
  calcularTotalParcelasUnicas();
}

  // Exclui o cartão após confirmação
async function excluirCartao(id) {
  console.log('🗑️ Excluindo cartão:', id);
  
  try {
    // Usar fetch direto como fallback se api não funcionar
    if (typeof api.excluirCartao === 'function') {
      await api.excluirCartao(id);
    } else {
      console.log('⚠️ api.excluirCartao não disponível, usando fetch direto');
      const response = await fetch(`/api/cartoes/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ erro: `Erro HTTP: ${response.status}` }));
        throw new Error(errorData.erro || `Erro HTTP: ${response.status}`);
      }
    }
    
    console.log('✅ Cartão excluído com sucesso');
    notificar('Sucesso', 'Cartão excluído com sucesso', 'success');
    await carregarCartoes();
    
  } catch (error) {
    console.error('❌ Erro ao excluir cartão:', error);
    
    // Verificar se o erro é devido a parcelas pendentes
    if (error.message && (error.message.includes('parcelas pendentes') || error.message.includes('parcelasPendentes'))) {
      notificar('Erro', 'Não é possível excluir o cartão pois existem parcelas pendentes', 'danger');
    } else {
      notificar('Erro', `Falha ao excluir cartão: ${error.message}`, 'danger');
    }
  }
}

// Limpa o formulário de cartão
function limparFormularioCartao() {
  cartaoForm.reset();
  cartaoId.value = '';
  
  // Limpar validações visuais
  cartaoForm.classList.remove('was-validated');
  
  // Selecionar a cor padrão
  const corRadioPrimary = document.getElementById('cartao-cor-primary');
  if (corRadioPrimary) {
    corRadioPrimary.checked = true;
  }
}

// Carrega as compras da API
// Função carregarCompras removida - não é necessária pois as informações
// das compras já vêm junto com as parcelas

// Carrega as parcelas da API
async function carregarParcelas() {
  console.log('🔄 Carregando parcelas... (Stack trace para debug)', new Error().stack);
  
  // Verificar se já está carregando para evitar execuções simultâneas
  if (carregandoParcelas) {
    console.log('⚠️ Já está carregando parcelas, ignorando chamada duplicada...');
    return parcelas;
  }
  
  carregandoParcelas = true;
  
  try {
    // Limpar array de parcelas completamente
    parcelas = [];
    console.log('🧹 Array de parcelas limpo');
    
    console.log('📋 Cartões disponíveis:', cartoes?.length || 0);
    
    // Se temos cartões, carregar parcelas para cada um
    if (cartoes && cartoes.length > 0) {
      // Usar um Set para evitar IDs duplicados
      const idsUnicos = new Set();
      
      for (const cartao of cartoes) {
        console.log(`📥 Carregando parcelas do cartão ${cartao.id} (${cartao.nome})`);
        
        try {
          // Usar fetch direto para garantir que funciona
          const response = await fetch(`/api/cartoes/parcelas/${cartao.id}`);
          console.log(`📡 Resposta da API para cartão ${cartao.id}:`, response.status);
          
          if (response.ok) {
            const parcelasDoCartao = await response.json();
            console.log(`📦 Parcelas recebidas do cartão ${cartao.id}:`, parcelasDoCartao?.length || 0);
            
            if (parcelasDoCartao && Array.isArray(parcelasDoCartao) && parcelasDoCartao.length > 0) {
              // Adicionar apenas parcelas que não foram adicionadas ainda
              parcelasDoCartao.forEach(parcela => {
                console.log(`🔍 Verificando parcela ${parcela.id} - Já existe: ${idsUnicos.has(parcela.id)}`);
                if (!idsUnicos.has(parcela.id)) {
                  idsUnicos.add(parcela.id);
                  parcelas.push(parcela);
                  console.log(`✅ Parcela ${parcela.id} adicionada. Total: ${parcelas.length}`);
                } else {
                  console.log(`⚠️ Parcela ${parcela.id} já existe, ignorando duplicata`);
                }
              });
            }
          }
        } catch (err) {
          console.error(`❌ Erro ao carregar parcelas do cartão ${cartao.id}:`, err);
        }
      }
    }
    
    console.log(`✅ Total de parcelas carregadas: ${parcelas.length}`);
    console.log('📊 IDs das parcelas:', parcelas.map(p => p.id));
    
    // Renderizar parcelas na interface
    renderizarParcelas();
    
    // Atualizar apenas os limites dos cartões
    atualizarLimitesCartoes();
    
    console.log('✅ Parcelas carregadas e limites atualizados');
    
    return parcelas;
  } catch (error) {
    console.error('❌ Erro ao carregar parcelas:', error);
    return [];
  } finally {
    // Liberar flag de carregamento
    carregandoParcelas = false;
    console.log('🔓 Flag de carregamento de parcelas liberada');
  }
}

// Renderiza as parcelas na tabela
function renderizarParcelas() {
  console.log('🎨 Renderizando parcelas na tabela...');
  
  const tabela = document.getElementById('tabela-parcelas');
  const filtro = document.getElementById('filtro-cartao');
  
  if (!tabela) {
    console.error('❌ Tabela de parcelas não encontrada');
    return;
  }
  
  // Limpar corpo da tabela
  const tbody = tabela.querySelector('tbody');
  if (!tbody) {
    console.error('❌ Tbody da tabela não encontrado');
    return;
  }
  
  tbody.innerHTML = '';
  
  console.log('📊 Parcelas para renderizar:', parcelas?.length || 0);
  
  // Verificar se há parcelas
  if (!parcelas || !Array.isArray(parcelas) || parcelas.length === 0) {
    console.log('⚠️ Nenhuma parcela encontrada');
    // Adicionar linha indicando que não há parcelas
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="7" class="text-center py-4 text-muted">Nenhuma parcela encontrada.</td>';
    tbody.appendChild(tr);
    return;
  }
  
  // Obter cartão selecionado no filtro
  const cartaoSelecionado = filtro ? filtro.value : '';
  
  // Filtrar parcelas pelo cartão selecionado
  let parcelasFiltradas = parcelas;
  if (cartaoSelecionado) {
    parcelasFiltradas = parcelas.filter(parcela => parcela.cartao_id == cartaoSelecionado);
  }
  
  // Ordenar por data de vencimento
  parcelasFiltradas.sort((a, b) => {
    return new Date(a.data_vencimento) - new Date(b.data_vencimento);
  });
  
  // Montar tabela de parcelas
  parcelasFiltradas.forEach(parcela => {
    const tr = document.createElement('tr');
    
    // Encontrar o cartão desta parcela
    const cartao = cartoes.find(c => c.id == parcela.cartao_id);
    const nomeCartao = cartao ? cartao.nome : 'Cartão Não Encontrado';
    const corCartao = cartao ? cartao.cor : 'primary';
    
    // Determinar o status da parcela
    const hoje = new Date();
    const dataVencimento = new Date(parcela.data_vencimento);
    const estaVencida = dataVencimento < hoje;
    
    // Verificar se a parcela está paga
    const estaPaga = parcela.pago === 1 || parcela.pago === true;
    
    // Determinar classe e ícone conforme status
    let statusClass, statusIcon, statusText;
    
    if (estaPaga) {
      statusClass = 'bg-success text-white';
      statusIcon = 'bi-check-circle-fill';
      statusText = 'Paga';
    } else if (estaVencida) {
      statusClass = 'bg-danger text-white';
      statusIcon = 'bi-exclamation-circle-fill';
      statusText = 'Vencida';
    } else if (dataVencimento.getTime() - hoje.getTime() <= 3 * 24 * 60 * 60 * 1000) {
      statusClass = 'bg-warning text-dark';
      statusIcon = 'bi-exclamation-triangle-fill';
      statusText = 'Próxima';
    } else {
      statusClass = 'bg-light text-dark';
      statusIcon = 'bi-clock';
      statusText = 'Pendente';
    }
    
    tr.innerHTML = `
      <td>${parcela.compra_descricao || 'Sem descrição'}</td>
      <td><span class="badge bg-${corCartao}">${nomeCartao}</span></td>
      <td>${formatarMoeda(parcela.valor)}</td>
      <td>${parcela.numero}</td>
      <td>${formatarData(parcela.data_vencimento)}</td>
      <td><span class="badge ${statusClass}"><i class="bi ${statusIcon} me-1"></i> ${statusText}</span></td>
      <td class="text-end">
        ${!estaPaga ? `<button class="btn btn-sm btn-success me-1" data-action="pagar-parcela" data-id="${parcela.id}">
                        <i class="bi bi-check-circle"></i>
                      </button>` : ''}
        <button class="btn btn-sm btn-danger" data-action="excluir-parcela" data-id="${parcela.id}">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    
    // Adicionar eventos aos botões
    tbody.appendChild(tr);
    
    // Adicionar event listeners aos botões
    const pagarBtn = tr.querySelector('[data-action="pagar-parcela"]');
    if (pagarBtn) {
      pagarBtn.addEventListener('click', () => pagarParcela(parcela.id));
    }
    
    const excluirBtn = tr.querySelector('[data-action="excluir-parcela"]');
    if (excluirBtn) {
      excluirBtn.addEventListener('click', () => confirmarExclusaoParcela(parcela.id));
    }
  });
}

// Marca uma parcela como paga
async function pagarParcela(id) {
  try {
    await api.pagarParcela(id);
    notificar('Sucesso', 'Parcela marcada como paga', 'success');
    
    // Recarregar parcelas e cartões
    await carregarParcelas();
    await carregarCartoes();
    
    // Atualizar alertas
    verificarContasPendentes();
  } catch (error) {
    console.error('Erro ao pagar parcela:', error);
    notificar('Erro', `Falha ao pagar parcela: ${error.message}`, 'danger');
  }
}

// Confirma a exclusão de uma parcela
function confirmarExclusaoParcela(id) {
  console.log('🗑️ Solicitação de exclusão da parcela:', id);
  
  try {
    // Encontrar a parcela para mostrar informações na confirmação
    const parcela = parcelas.find(p => p.id == id);
    const descricao = parcela ? parcela.compra_descricao : 'parcela';
    
    const mensagem = `Deseja realmente excluir a compra "${descricao}" e todas as suas parcelas?\n\nEsta ação não pode ser desfeita.`;
    
    // Usar confirm nativo como fallback se confirmDialog não funcionar
    if (typeof confirmDialog === 'undefined' || !confirmDialog) {
      if (confirm(mensagem)) {
        excluirParcela(id);
      }
      return;
    }
    
    confirmDialog.show(mensagem, () => excluirParcela(id));
  } catch (error) {
    console.error('❌ Erro ao mostrar confirmação:', error);
    // Fallback para confirm do navegador
    if (confirm('Deseja realmente excluir esta compra e todas as suas parcelas? Esta ação não pode ser desfeita.')) {
      excluirParcela(id);
    }
  }
}

// Exclui uma parcela após confirmação
async function excluirParcela(id) {
  console.log('🗑️ Iniciando exclusão da parcela:', id);
  
  try {
    // Encontrar a compra associada à parcela
    const parcela = parcelas.find(p => p.id == id);
    if (!parcela) {
      console.error('❌ Parcela não encontrada:', id);
      if (typeof notificar === 'function') {
        notificar('Erro', 'Parcela não encontrada', 'danger');
      } else {
        alert('Erro: Parcela não encontrada');
      }
      return;
    }
    
    console.log('📋 Parcela encontrada:', parcela);
    console.log('🗑️ Excluindo compra com ID:', parcela.compra_id);
    
    // Excluir a compra inteira (todas as parcelas) usando fetch direto
    const response = await fetch(`/api/cartoes/compras/${parcela.compra_id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ erro: `Erro HTTP: ${response.status}` }));
      throw new Error(errorData.erro || `Erro HTTP: ${response.status}`);
    }
    
    console.log('✅ Compra excluída com sucesso');
    
    if (typeof notificar === 'function') {
      notificar('Sucesso', 'Compra e parcelas excluídas com sucesso', 'success');
    } else {
      alert('Compra e parcelas excluídas com sucesso!');
    }
    
    console.log('🔄 Recarregando dados...');
    
    // Recarregar dados
    await carregarParcelas();
    await carregarCartoes();
    
    // Atualizar alertas
    verificarContasPendentes();
    
    console.log('✅ Dados recarregados com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao excluir parcela:', error);
    
    if (typeof notificar === 'function') {
      notificar('Erro', `Falha ao excluir parcela: ${error.message}`, 'danger');
    } else {
      alert(`Erro ao excluir parcela: ${error.message}`);
    }
  }
}

// Verificar contas a pagar próximas ao vencimento e gerar alertas
function verificarContasPendentes() {
  const alertasContainer = document.getElementById('alertas-container');
  const listaAlertas = document.getElementById('lista-alertas');
  const semAlertas = document.getElementById('sem-alertas');
  const contadorAlertas = document.getElementById('contador-alertas');
  
  if (!listaAlertas || !parcelas.length) return;
  
  // Obter data atual
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  // Data limite para alertas (7 dias)
  const dataLimite = new Date(hoje);
  dataLimite.setDate(dataLimite.getDate() + 7);
  
  // Filtrar parcelas próximas ao vencimento ou vencidas
  const parcelasAlerta = parcelas.filter(parcela => {
    if (parcela.pago) return false;
    
    const dataVencimento = new Date(parcela.data_vencimento);
    return dataVencimento <= dataLimite;
  });
  
  // Ordenar parcelas por data de vencimento
  parcelasAlerta.sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento));
  
  // Limpar alertas atuais, exceto o item semAlertas
  const alertasAtuais = listaAlertas.querySelectorAll('li:not(#sem-alertas)');
  alertasAtuais.forEach(alerta => alerta.remove());
  
  // Atualizar contador
  if (contadorAlertas) {
    contadorAlertas.textContent = parcelasAlerta.length;
    
    if (parcelasAlerta.length > 0) {
      contadorAlertas.classList.remove('d-none');
    } else {
      contadorAlertas.classList.add('d-none');
    }
  }
  
  // Mostrar ou esconder o item semAlertas
  if (semAlertas) {
    if (parcelasAlerta.length === 0) {
      semAlertas.classList.remove('d-none');
    } else {
      semAlertas.classList.add('d-none');
    }
  }
  
  // Adicionar alertas à lista
  parcelasAlerta.forEach(parcela => {
    const cartao = cartoes.find(c => c.id == parcela.cartao_id);
    
    if (!cartao) return;
    
    const dataVencimento = new Date(parcela.data_vencimento);
    const estaVencida = dataVencimento < hoje;
    
    // Calcular quantos dias até o vencimento
    const diffTime = Math.abs(dataVencimento - hoje);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let statusClass = '';
    let statusIcon = '';
    let statusText = '';
    
    if (estaVencida) {
      statusClass = 'list-group-item-danger';
      statusIcon = 'bi-exclamation-triangle-fill text-danger';
      statusText = `Vencida há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
    } else if (diffDays <= 3) {
      statusClass = 'list-group-item-warning';
      statusIcon = 'bi-exclamation-circle-fill text-warning';
      statusText = diffDays === 0 ? 'Vence hoje' : `Vence em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
    } else {
      statusClass = 'list-group-item-info';
      statusIcon = 'bi-info-circle-fill text-info';
      statusText = `Vence em ${diffDays} dias`;
    }
    
    const alertaItem = document.createElement('li');
    alertaItem.className = `list-group-item ${statusClass}`;
    
    alertaItem.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <div class="d-flex align-items-center">
            <i class="bi ${statusIcon} me-2 fs-5"></i>
            <div>
              <p class="mb-0 fw-bold">${parcela.compra_descricao || 'Compra'}</p>
              <div class="d-flex align-items-center">
                <span class="badge bg-${cartao.cor || 'primary'} me-2">${cartao.nome}</span>
                <small>${formatarMoeda(parcela.valor)} - Parcela ${parcela.numero}</small>
              </div>
            </div>
          </div>
        </div>
        <div class="text-end">
          <p class="mb-0">${statusText}</p>
          <small>${formatarData(parcela.data_vencimento)}</small>
        </div>
      </div>
      <div class="mt-2 d-flex justify-content-end">
        <button class="btn btn-sm btn-outline-success" data-action="pagar-alerta" data-id="${parcela.id}">
          <i class="bi bi-check-circle me-1"></i> Marcar como pago
        </button>
      </div>
    `;
    
    // Adicionar event listener para o botão de pagar
    const pagarBtn = alertaItem.querySelector('[data-action="pagar-alerta"]');
    pagarBtn.addEventListener('click', () => pagarParcela(parcela.id));
    
    listaAlertas.appendChild(alertaItem);
  });
  
  return parcelasAlerta.length;
}

// Configura os event listeners
function configurarEventListeners() {
  console.log('🔧 Configurando event listeners de cartões...');
  
  // Botão de salvar cartão - usando onclick no HTML
  const salvarCartaoBtn = document.getElementById('salvar-cartao');
  if (salvarCartaoBtn) {
    console.log('✅ Botão salvar cartão encontrado (usando onclick no HTML)');
  } else {
    console.warn('⚠️ Botão salvar-cartao não encontrado');
  }
  
  // Botão de salvar compra
  const salvarCompraBtn = document.getElementById('salvar-compra');
  if (salvarCompraBtn) {
    console.log('✅ Botão salvar-compra encontrado, adicionando listener');
    
    // Remover listeners existentes para evitar duplicação
    salvarCompraBtn.removeEventListener('click', salvarCompra);
    
    salvarCompraBtn.addEventListener('click', (e) => {
      console.log('🖱️ Botão Salvar Compra clicado!');
      e.preventDefault();
      salvarCompra();
    });
  } else {
    console.warn('⚠️ Botão salvar-compra não encontrado');
  }
  
  // Botões de adicionar compra
  const adicionarCompraBtns = document.querySelectorAll('[data-action="adicionar-compra"]');
  adicionarCompraBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const cartaoId = btn.getAttribute('data-cartao-id');
      novaCompra(cartaoId);
    });
  });
  
  // Botão de novo cartão
  const novoCartaoBtnList = document.querySelectorAll('[data-bs-target="#cartaoModal"]');
  console.log(`🔍 Encontrados ${novoCartaoBtnList.length} botões de novo cartão`);
  
  novoCartaoBtnList.forEach((btn, index) => {
    console.log(`✅ Configurando listener no botão ${index + 1}:`, btn);
    btn.addEventListener('click', (e) => {
      console.log('🖱️ Botão Novo Cartão clicado!');
      e.preventDefault();
      novoCartao();
    });
  });
  
  // Também configurar via delegação de eventos como fallback
  document.addEventListener('click', function(event) {
    if (event.target.matches('[data-bs-target="#cartaoModal"]') || 
        event.target.closest('[data-bs-target="#cartaoModal"]')) {
      console.log('🖱️ Botão Novo Cartão clicado via delegação!');
      event.preventDefault();
      novoCartao();
    }
  });
  
  // Filtro de cartões na tabela de parcelas
  const filtroCartao = document.getElementById('filtro-cartao');
  if (filtroCartao) {
    filtroCartao.addEventListener('change', renderizarParcelas);
  }
  
  // Event listener para número de parcelas
  const compraParcelas = document.getElementById('compra-parcelas');
  if (compraParcelas) {
    compraParcelas.addEventListener('change', gerenciarParcelasPersonalizadas);
    compraParcelas.addEventListener('input', gerenciarParcelasPersonalizadas);
  }
  
  // Event listener para valor da compra
  const compraValor = document.getElementById('compra-valor');
  if (compraValor) {
    compraValor.addEventListener('input', atualizarValorOriginal);
    
    // Adicionar formatação automática para o campo valor da compra
    console.log('🎯 Configurando formatação para campo valor da compra');
    compraValor.addEventListener('input', formatarCampoValorCartao);
    compraValor.addEventListener('keyup', formatarCampoValorCartao);
    compraValor.addEventListener('paste', (e) => {
      setTimeout(() => formatarCampoValorCartao(e), 10);
    });
  }
  
  // Event listener para limite do cartão
  const cartaoLimite = document.getElementById('cartao-limite');
  if (cartaoLimite) {
    console.log('🎯 Configurando formatação para campo limite do cartão');
    cartaoLimite.addEventListener('input', formatarCampoValorCartao);
    cartaoLimite.addEventListener('keyup', formatarCampoValorCartao);
    cartaoLimite.addEventListener('paste', (e) => {
      setTimeout(() => formatarCampoValorCartao(e), 10);
    });
  }
  
  // Event listener para quando o modal de compra abrir
  const compraModalElement = document.getElementById('compraParceladaModal');
  if (compraModalElement) {
    compraModalElement.addEventListener('shown.bs.modal', function () {
      // Verificar se deve mostrar seção de parcelas personalizadas
      setTimeout(() => {
        gerenciarParcelasPersonalizadas();
      }, 100);
    });
  }
}

// Prepara o formulário para adicionar um novo cartão
function novoCartao() {
  console.log('🆕 Função novoCartao() chamada');
  
  try {
    limparFormularioCartao();
    
    const modalLabel = document.getElementById('cartaoModalLabel');
    if (modalLabel) {
      modalLabel.textContent = 'Novo Cartão de Crédito';
      console.log('✅ Título do modal atualizado');
    } else {
      console.warn('⚠️ Elemento cartaoModalLabel não encontrado');
    }
    
    // Definir valores padrão
    if (cartaoFechamento) {
      cartaoFechamento.value = '15';
      console.log('✅ Dia de fechamento definido como 15');
    }
    
    if (cartaoVencimento) {
      cartaoVencimento.value = '22';
      console.log('✅ Dia de vencimento definido como 22');
    }
    
    // Verificar se o modal foi inicializado
    if (cartaoModal) {
      console.log('✅ Abrindo modal do cartão...');
      cartaoModal.show();
      
      // Focar no primeiro campo após o modal abrir
      setTimeout(() => {
        const nomeInput = document.getElementById('cartao-nome');
        if (nomeInput) {
          nomeInput.focus();
          console.log('✅ Foco definido no campo nome');
        }
      }, 300);
      
    } else {
      console.error('❌ Modal do cartão não foi inicializado');
      // Fallback: tentar inicializar o modal agora
      const modalElement = document.getElementById('cartaoModal');
      if (modalElement) {
        console.log('🔧 Tentando inicializar modal como fallback...');
        cartaoModal = new bootstrap.Modal(modalElement);
        cartaoModal.show();
        
        // Focar no primeiro campo após o modal abrir
        setTimeout(() => {
          const nomeInput = document.getElementById('cartao-nome');
          if (nomeInput) {
            nomeInput.focus();
            console.log('✅ Foco definido no campo nome (fallback)');
          }
        }, 300);
        
      } else {
        console.error('❌ Elemento cartaoModal não encontrado no DOM');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na função novoCartao():', error);
  }
}

// Confirma a exclusão de um cartão
function confirmarExclusaoCartao(id) {
  const cartao = cartoesMap[id];
  if (!cartao) {
    notificar('Erro', 'Cartão não encontrado', 'danger');
    return;
  }
  
  // Usar o diálogo de confirmação
  confirmDialog.show(
    `Tem certeza que deseja excluir o cartão "${cartao.nome}"?`,
    () => excluirCartao(id)
  );
}

// Variáveis globais para evitar execuções duplas
let salvandoCompra = false;
let carregandoParcelas = false;

// Função para garantir que a interface não está bloqueada
function desbloquearInterface() {
  console.log('🔓 Desbloqueando interface...');
  
  // Remover qualquer modal backdrop
  const backdrops = document.querySelectorAll('.modal-backdrop');
  backdrops.forEach(backdrop => backdrop.remove());
  
  // Remover qualquer overlay de loading
  const overlays = document.querySelectorAll('.loading-overlay, .spinner-overlay');
  overlays.forEach(overlay => overlay.remove());
  
  // Restaurar body
  document.body.classList.remove('modal-open');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  
  // Garantir que todos os modais estão fechados
  const modals = document.querySelectorAll('.modal.show');
  modals.forEach(modal => {
    modal.classList.remove('show');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    modal.removeAttribute('aria-modal');
    modal.removeAttribute('role');
  });
  
  console.log('✅ Interface desbloqueada');
}

// Atualiza apenas os limites dos cartões sem re-renderizar tudo
function atualizarLimitesCartoes() {
  console.log('💳 Atualizando limites dos cartões...');
  
  cartoes.forEach(cartao => {
    const limiteUsado = calcularLimiteUsado(cartao.id);
    const limiteDisponivel = cartao.limite - limiteUsado;
    const percentUsado = (limiteUsado / cartao.limite) * 100;
    
    // Encontrar o card do cartão no DOM
    const cartaoCards = document.querySelectorAll('.cartao-card');
    cartaoCards.forEach(card => {
      const cardHeader = card.querySelector('.card-header h5');
      if (cardHeader && cardHeader.textContent === cartao.nome) {
        // Atualizar valores no card
        const cardBody = card.querySelector('.card-body');
        if (cardBody) {
          const usadoSpan = cardBody.querySelector('.d-flex:nth-child(2) span:last-child');
          const disponivelSpan = cardBody.querySelector('.d-flex:nth-child(3) span:last-child');
          const progressBar = cardBody.querySelector('.progress-bar');
          
          if (usadoSpan) usadoSpan.textContent = `R$ ${formatarNumero(limiteUsado)}`;
          if (disponivelSpan) disponivelSpan.textContent = `R$ ${formatarNumero(limiteDisponivel)}`;
          
          if (progressBar) {
            progressBar.style.width = `${percentUsado}%`;
            progressBar.setAttribute('aria-valuenow', percentUsado);
            
            // Atualizar cor da barra
            progressBar.className = `progress-bar bg-${percentUsado > 80 ? 'danger' : percentUsado > 60 ? 'warning' : 'success'}`;
          }
        }
      }
    });
  });
  
  console.log('✅ Limites dos cartões atualizados');
}

// Salva a compra parcelada
async function salvarCompra() {
  console.log('🚀 Função salvarCompra chamada');
  
  // Verificar se já está salvando para evitar duplicação
  if (salvandoCompra) {
    console.log('⚠️ Já está salvando uma compra, ignorando...');
    return;
  }
  
  salvandoCompra = true;
  
  try {
    // Verificar se o formulário é válido
    const form = document.getElementById('compra-form');
    if (!form) {
      console.error('❌ Formulário compra-form não encontrado');
      alert('Erro: Formulário não encontrado');
      return;
    }
    
    if (!form.checkValidity()) {
      console.log('❌ Formulário inválido');
      form.reportValidity();
      return;
    }

    console.log('✅ Formulário válido, prosseguindo...');

    // Desabilitar o botão para evitar cliques duplos
    const botaoSalvar = document.getElementById('salvar-compra');
    if (botaoSalvar) {
      botaoSalvar.disabled = true;
      botaoSalvar.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Salvando...';
    }

    // Coletar dados do formulário
    const descricao = document.getElementById('compra-descricao').value.trim();
    
    // Converter valor do formato brasileiro para número
    const valorFormatado = document.getElementById('compra-valor').value;
    const valorNumerico = valorFormatado.replace(/\./g, '').replace(',', '.');
    const valor = parseFloat(valorNumerico);
    
    const data = document.getElementById('compra-data').value;
    const parcelas = parseInt(document.getElementById('compra-parcelas').value);
    const cartao_id = parseInt(document.getElementById('compra-cartao').value);

    console.log('📋 Dados coletados:', { descricao, valor, data, parcelas, cartao_id });

    // Verificar se há valor personalizado para as parcelas
    let valoresPersonalizados = null;
    if (parcelas >= 2) {
      const parcelasDiv = document.getElementById('parcelas-personalizadas');
      const valorParcelaUnica = document.getElementById('valor-parcela-unica');
      
      if (parcelasDiv && parcelasDiv.style.display !== 'none' && valorParcelaUnica && valorParcelaUnica.value) {
        const valorParcela = parseFloat(valorParcelaUnica.value);
        
        if (valorParcela > 0) {
          // Criar array com o mesmo valor para todas as parcelas
          valoresPersonalizados = new Array(parcelas).fill(valorParcela);
          const totalPersonalizado = valorParcela * parcelas;
          
          // Log para acompanhar o parcelamento (juros são normais)
          const diferenca = Math.abs(totalPersonalizado - valor);
          if (diferenca > 0.01) {
            console.log('📊 Parcelamento com diferença (normal com juros):', {
              valorCompra: valor,
              totalParcelas: totalPersonalizado,
              valorParcela: valorParcela,
              numParcelas: parcelas,
              diferenca: diferenca
            });
          }
          
          console.log('💰 Valor personalizado aplicado a todas as parcelas:', valorParcela);
        }
      }
    }

    // Validar dados
    if (!descricao) {
      throw new Error('Descrição é obrigatória');
    }
    if (!valor || valor <= 0) {
      throw new Error('Valor deve ser maior que zero');
    }
    if (!data) {
      throw new Error('Data é obrigatória');
    }
    if (!parcelas || parcelas <= 0) {
      throw new Error('Número de parcelas deve ser maior que zero');
    }
    if (!cartao_id) {
      throw new Error('Cartão é obrigatório');
    }

    const dados = {
      descricao,
      valor,
      data,
      parcelas,
      cartao_id,
      categoria_id: null,
      valores_personalizados: valoresPersonalizados // Adicionar valores personalizados se existirem
    };

    console.log('📤 Enviando dados da compra:', dados);

    // Usar fetch direto para garantir que funciona
    const response = await fetch('/api/cartoes/compras', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dados)
    });

    console.log('📥 Resposta recebida:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ erro: `Erro HTTP: ${response.status}` }));
      throw new Error(errorData.erro || `Erro HTTP: ${response.status}`);
    }

    const resultado = await response.json();
    console.log('✅ Compra criada com sucesso:', resultado);

    // Fechar o modal IMEDIATAMENTE
    console.log('🚪 Fechando modal...');
    const modalElement = document.getElementById('compraParceladaModal');
    
    // Método 1: Tentar fechar via instância do Bootstrap
    const compraModal = bootstrap.Modal.getInstance(modalElement);
    if (compraModal) {
      compraModal.hide();
      console.log('✅ Modal fechado via instância');
    }
    
    // Método 2: Forçar fechamento removendo classes e backdrop
    setTimeout(() => {
      if (modalElement) {
        modalElement.classList.remove('show');
        modalElement.style.display = 'none';
        modalElement.setAttribute('aria-hidden', 'true');
        modalElement.removeAttribute('aria-modal');
        modalElement.removeAttribute('role');
        
        // Remover backdrop se existir
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
        
        // Restaurar scroll do body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        console.log('✅ Modal forçadamente fechado');
      }
    }, 100);

    // Mostrar mensagem de sucesso
    if (typeof notificar === 'function') {
      notificar('Sucesso', 'Compra registrada com sucesso', 'success');
    } else {
      alert('Compra registrada com sucesso!');
    }

    console.log('🔄 Recarregando dados em background...');

    // Recarregar dados em background sem bloquear a interface
    setTimeout(async () => {
      try {
        // Apenas recarregar parcelas (que já atualiza os limites)
        await carregarParcelas();
        console.log('✅ Parcelas recarregadas e limites atualizados');
        
        console.log('✅ Recarregamento completo');
      } catch (reloadError) {
        console.error('❌ Erro ao recarregar dados:', reloadError);
        // Não propagar o erro para não afetar a interface
      }
    }, 200);

  } catch (error) {
    console.error('❌ Erro ao salvar compra:', error);
    
    // Desbloquear interface em caso de erro também
    desbloquearInterface();
    
    if (typeof notificar === 'function') {
      notificar('Erro', `Falha ao salvar compra: ${error.message}`, 'danger');
    } else {
      alert(`Erro ao salvar compra: ${error.message}`);
    }
  } finally {
    // Restaurar o botão IMEDIATAMENTE
    const botaoSalvar = document.getElementById('salvar-compra');
    if (botaoSalvar) {
      botaoSalvar.disabled = false;
      botaoSalvar.innerHTML = '<i class="bi bi-check-circle me-1"></i> Salvar Compra';
    }
    console.log('🔧 Botão restaurado');
    
    // Liberar o flag de salvamento IMEDIATAMENTE
    salvandoCompra = false;
    
    // Garantir que a interface não está bloqueada
    setTimeout(() => {
      desbloquearInterface();
    }, 50);
  }
}

// Exporta funções para uso global
window.cartoesModule = {
  inicializar: inicializarCartoes,
  carregarCartoes,
  carregarParcelas,
  verificarContasPendentes
};
