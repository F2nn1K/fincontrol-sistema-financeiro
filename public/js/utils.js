/**
 * Utilitários gerais para o sistema
 */

// Configurações globais
const modoDebug = false;

// Formatação de moeda
function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

// Formatação de número
function formatarNumero(valor) {
  return new Intl.NumberFormat('pt-BR').format(valor);
}

// Formatação de data
function formatarData(data) {
  if (!data) return '';
  
  const dataObj = new Date(data);
  if (isNaN(dataObj.getTime())) return data;
  
  return dataObj.toLocaleDateString('pt-BR');
}

// Sistema de notificações
function notificar(titulo, mensagem, tipo = 'info') {
  // Criar o elemento de notificação
  const notificacao = document.createElement('div');
  notificacao.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
  notificacao.style.cssText = `
    top: 20px;
    right: 20px;
    z-index: 9999;
    min-width: 300px;
    max-width: 500px;
  `;
  
  // Definir ícones por tipo
  const icones = {
    success: 'bi-check-circle-fill',
    danger: 'bi-exclamation-triangle-fill',
    warning: 'bi-exclamation-triangle-fill',
    info: 'bi-info-circle-fill'
  };
  
  const icone = icones[tipo] || icones.info;
  
  notificacao.innerHTML = `
    <div class="d-flex align-items-center">
      <i class="bi ${icone} me-2"></i>
      <div class="flex-grow-1">
        <strong>${titulo}</strong>
        <div>${mensagem}</div>
      </div>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
  
  // Adicionar ao DOM
  document.body.appendChild(notificacao);
  
  // Remover automaticamente após 5 segundos
  setTimeout(() => {
    if (notificacao.parentNode) {
      notificacao.remove();
    }
  }, 5000);
}

// Dialog de confirmação
class ConfirmDialog {
  constructor() {
    this.modal = null;
    this.currentCallback = null;
    this.currentData = null;
    this.initialize();
  }

  initialize() {
    // Verificar se o modal já existe
    let existingModal = document.getElementById('confirmModal');
    if (existingModal) {
      this.modal = new bootstrap.Modal(existingModal);
      this.setupEventListeners();
      return;
    }

    // Criar o modal de confirmação se não existir
    const modalHTML = `
      <div class="modal fade" id="confirmModal" tabindex="-1" data-bs-backdrop="static" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Confirmação</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <div class="modal-body">
              <p id="confirm-message"></p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="cancel-button" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-danger" id="confirm-button">Confirmar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = new bootstrap.Modal(document.getElementById('confirmModal'));
    this.setupEventListeners();
  }

  setupEventListeners() {
    const confirmButton = document.getElementById('confirm-button');
    const cancelButton = document.getElementById('cancel-button');

    if (confirmButton) {
      confirmButton.addEventListener('click', () => {
        if (this.currentCallback) {
          this.currentCallback(this.currentData);
        }
        this.modal.hide();
        this.reset();
      });
    }

    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        this.reset();
      });
    }
  }

  show(message, callback, data = null) {
    const messageElement = document.getElementById('confirm-message');
    if (messageElement) {
      messageElement.textContent = message;
    }

    this.currentCallback = callback;
    this.currentData = data;
    this.modal.show();
  }

  reset() {
    this.currentCallback = null;
    this.currentData = null;
  }
}

// Instância global do dialog de confirmação
const confirmDialog = new ConfirmDialog();

// Função de debounce para otimizar performance
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Dados de demonstração para cartões
function obterCartoesDemostracao() {
  return [
    { id: 1, nome: 'Nubank', limite: 5000, fechamento: 10, vencimento: 17, cor: 'purple' },
    { id: 2, nome: 'Itaú', limite: 8000, fechamento: 15, vencimento: 22, cor: 'primary' }
  ];
}

// Dados de demonstração para transações
function obterTransacoesDemonstracaoPorTipo(tipo) {
  const todasTransacoes = [
    { id: 1, descricao: 'Salário', valor: 5000, tipo: 'entrada', categoria: 'Trabalho', data: '2024-01-15' },
    { id: 2, descricao: 'Aluguel', valor: 1200, tipo: 'saida', categoria: 'Moradia', data: '2024-01-05' },
    { id: 3, descricao: 'Freelance', valor: 800, tipo: 'entrada', categoria: 'Trabalho', data: '2024-01-20' },
    { id: 4, descricao: 'Supermercado', valor: 350, tipo: 'saida', categoria: 'Alimentação', data: '2024-01-10' }
  ];

  if (tipo === 'todos') {
    return todasTransacoes;
  }

  return todasTransacoes.filter(t => t.tipo === tipo);
} 