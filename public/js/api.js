/**
 * API para comunicação com o backend
 */

// Configuração da API
const API_URL = window.location.origin;

// Debug mode
window.modoDebug = false;

// Funções de API para transações
const api = {
  // Método base para requisições fetch com tratamento de erro melhorado
  async fetchWithRetry(url, options = {}, retries = 2, backoff = 300) {
    try {
      const response = await fetch(url, options);
      
      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          erro: `Erro HTTP: ${response.status}` 
        }));
        throw new Error(errorData.erro || `Erro HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      if (retries > 0) {
        // Aguardar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, backoff));
        return this.fetchWithRetry(url, options, retries - 1, backoff * 2);
      }
      throw error;
    }
  },
  
  // GET
  async get(endpoint) {
    return this.fetchWithRetry(`${API_URL}/${endpoint}`);
  },
  
  // POST
  async post(endpoint, data) {
    return this.fetchWithRetry(`${API_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  },
  
  // PUT
  async put(endpoint, data) {
    return this.fetchWithRetry(`${API_URL}/${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  },
  
  // DELETE
  async delete(endpoint) {
    return this.fetchWithRetry(`${API_URL}/${endpoint}`, {
      method: 'DELETE'
    });
  },
  
  // TRANSAÇÕES
  
  // Obter todas as transações
  async obterTransacoes() {
    return this.get('transacoes');
  },
  
  // Obter uma transação específica
  async obterTransacao(id) {
    return this.get(`transacoes/${id}`);
  },
  
  // Criar transação
  async criarTransacao(dados) {
    return this.post('transacoes', dados);
  },
  
  // Atualizar transação
  async atualizarTransacao(id, dados) {
    return this.put(`transacoes/${id}`, dados);
  },
  
  // Excluir transação
  async excluirTransacao(id) {
    return this.delete(`transacoes/${id}`);
  },
  
  // CATEGORIAS
  
  // Obter todas as categorias
  async obterCategorias() {
    return this.get('categorias');
  },
  
  // Obter uma categoria específica
  async obterCategoria(id) {
    return this.get(`categorias/${id}`);
  },
  
  // Criar categoria
  async criarCategoria(dados) {
    return this.post('categorias', dados);
  },
  
  // Atualizar categoria
  async atualizarCategoria(id, dados) {
    return this.put(`categorias/${id}`, dados);
  },
  
  // Excluir categoria
  async excluirCategoria(id) {
    return this.delete(`categorias/${id}`);
  },
  
  // CARTÕES DE CRÉDITO
  
  // Obter todos os cartões
  async obterCartoes() {
    return this.get('cartoes');
  },
  
  // Obter um cartão específico
  async obterCartao(id) {
    return this.get(`cartoes/${id}`);
  },
  
  // Criar cartão
  async criarCartao(dados) {
    return this.post('cartoes', dados);
  },
  
  // Atualizar cartão
  async atualizarCartao(id, dados) {
    return this.put(`cartoes/${id}`, dados);
  },
  
  // Excluir cartão
  async excluirCartao(id) {
    return this.delete(`cartoes/${id}`);
  },
  
  // COMPRAS PARCELADAS
  
  // Obter compras de um cartão
  async obterComprasPorCartao(cartaoId) {
    return this.get(`cartoes/compras/${cartaoId}`);
  },
  
  // Criar compra
  async criarCompra(dados) {
    return this.post('cartoes/compras', dados);
  },
  
  // Atualizar compra
  async atualizarCompra(id, dados) {
    return this.put(`cartoes/compras/${id}`, dados);
  },
  
  // Excluir compra
  async excluirCompra(id) {
    return this.delete(`cartoes/compras/${id}`);
  },
  
  // PARCELAS
  
  // Obter parcelas de um cartão
  async obterParcelasPorCartao(cartaoId) {
    return this.get(`cartoes/parcelas/${cartaoId}`);
  },
  
  // Marcar parcela como paga
  async pagarParcela(id) {
    return this.put(`cartoes/parcelas/${id}/pagar`, {});
  },
  
  // RELATÓRIOS
  
  // Obter relatório por período
  async obterRelatorioPorPeriodo(dataInicio, dataFim) {
    return this.get(`relatorios?dataInicio=${dataInicio}&dataFim=${dataFim}`);
  }
};

// Exportar globalmente
window.api = api; 