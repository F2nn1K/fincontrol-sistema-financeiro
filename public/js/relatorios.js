/**
 * Gerenciamento de relatórios financeiros
 */
// Elementos do DOM
const resumoEntradas = document.getElementById('resumo-entradas');
const resumoSaidas = document.getElementById('resumo-saidas');
const resumoSaldo = document.getElementById('resumo-saldo');
const graficoTabs = document.getElementById('grafico-tabs');
const graficoCategorias = document.getElementById('grafico-categorias');
const graficoFluxoCaixa = document.getElementById('grafico-fluxo-caixa');
const graficoDespesas = document.getElementById('grafico-despesas');
const graficoReceitas = document.getElementById('grafico-receitas');
const dataInicio = document.getElementById('data-inicio');
const dataFim = document.getElementById('data-fim');
// Instâncias de gráficos
let chartCategorias = null;
let chartFluxoCaixa = null;
let chartDespesas = null;
let chartReceitas = null;
// Variáveis globais
const cores = [
  'rgba(54, 162, 235, 0.7)',
  'rgba(255, 99, 132, 0.7)',
  'rgba(255, 206, 86, 0.7)',
  'rgba(75, 192, 192, 0.7)',
  'rgba(153, 102, 255, 0.7)',
  'rgba(255, 159, 64, 0.7)',
  'rgba(199, 199, 199, 0.7)',
  'rgba(83, 102, 255, 0.7)',
  'rgba(40, 159, 64, 0.7)',
  'rgba(210, 199, 199, 0.7)',
];
// Transações filtradas para uso em relatórios
let transacoesFiltradas = [];
// Modo silencioso - remover logs
if (typeof window.modoDebug === 'undefined') {
  window.modoDebug = false;
}
// Inicialização
function inicializarRelatorios() {
  carregarResumo();
  configurarEventListeners();
  // Se estivermos na página de dashboard, carregamos os gráficos
  if (document.getElementById('dashboard-page') && !document.getElementById('dashboard-page').classList.contains('d-none')) {
    atualizarGraficos();
    verificarAlertasContas();
  }
  // Se estivermos na página de relatórios, carregamos os gráficos detalhados
  if (document.getElementById('relatorios-page') && !document.getElementById('relatorios-page').classList.contains('d-none')) {
    carregarGraficosRelatorios();
  }
}
// Atualiza todos os gráficos com os dados mais recentes
function atualizarGraficos() {
  try {
    // Carregar gráfico de categorias
    carregarGraficoCategorias('despesas'); // Começa mostrando despesas
  } catch (error) {
    console.error('Erro ao atualizar gráficos:', error);
    // Não exibir notificação para o usuário, apenas logar no console
  }
}
// Carrega o resumo financeiro
async function carregarResumo() {
  if (!resumoEntradas || !resumoSaidas || !resumoSaldo) return;
  try {
    // Usar dados de demonstração se a API falhar
    let resumo = { entradas: 0, saidas: 0, saldo: 0 };
    // Tentar obter dados reais
    try {
      if (typeof api !== 'undefined' && typeof api.obterResumo === 'function') {
        const dadosResumo = await api.obterResumo();
        if (dadosResumo) {
          resumo = dadosResumo;
        }
      } else {
        // Se a API não existir, calcular com base nas transações
        if (window.transacoes && Array.isArray(window.transacoes)) {
          const entradas = window.transacoes
            .filter(t => t.tipo === 'entrada')
            .reduce((sum, t) => sum + Number(t.valor), 0);
          const saidas = window.transacoes
            .filter(t => t.tipo === 'saida')
            .reduce((sum, t) => sum + Number(t.valor), 0);
          resumo = {
            entradas,
            saidas,
            saldo: entradas - saidas
          };
        } else {
          // Valores padrão se não houver dados
          resumo = {
            entradas: 4500,
            saidas: 3200,
            saldo: 1300
          };
        }
      }
    } catch (error) {
      console.error('Erro ao obter resumo da API:', error);
      // Manter valores padrão
    }
    // Atualizar elementos na tela
    resumoEntradas.textContent = formatarMoeda(resumo.entradas);
    resumoSaidas.textContent = formatarMoeda(resumo.saidas);
    resumoSaldo.textContent = formatarMoeda(resumo.saldo);
    // Alterar cor do saldo de acordo com valor positivo ou negativo
    if (resumo.saldo < 0) {
      resumoSaldo.classList.remove('text-primary');
      resumoSaldo.classList.add('text-danger');
    } else {
      resumoSaldo.classList.remove('text-danger');
      resumoSaldo.classList.add('text-primary');
    }
  } catch (error) {
    console.error('Erro ao carregar resumo:', error);
    // Valores padrão em caso de falha
    if (resumoEntradas) resumoEntradas.textContent = formatarMoeda(4500);
    if (resumoSaidas) resumoSaidas.textContent = formatarMoeda(3200);
    if (resumoSaldo) {
      resumoSaldo.textContent = formatarMoeda(1300);
      resumoSaldo.classList.remove('text-danger');
      resumoSaldo.classList.add('text-primary');
    }
  }
}
/**
 * Carrega o gráfico de categorias para o tipo especificado
 * @param {string} tipo - Tipo de transação (despesas ou receitas)
 */
async function carregarGraficoCategorias(tipo) {
  try {
    // Dicionário de tipo interno para tipo de API
    const tipoInterno = tipo === 'despesas' ? 'saida' : 'entrada';
    // Buscar transações na tabela do DOM
    const tabela = document.getElementById('ultimas-transacoes');
    let dados = [];
    if (tabela) {
      const linhas = tabela.querySelectorAll('tbody tr');
      if (linhas.length > 0) {
        // Extrair dados da tabela
        const transacoes = Array.from(linhas).map(linha => {
          const colunas = linha.querySelectorAll('td');
          if (colunas.length >= 4) {
            const tipoClass = colunas[3].querySelector('span.badge')?.classList.contains('bg-success') ? 'entrada' : 'saida';
            return {
              data: colunas[0].textContent,
              descricao: colunas[1].textContent,
              categoria_nome: colunas[2].textContent,
              valor: parseFloat(colunas[3].textContent.replace(/[^\d,-]/g, '').replace(',', '.')),
              tipo: tipoClass
            };
          }
          return null;
        }).filter(t => t !== null);
        if (transacoes.length > 0) {
          dados = processarDadosParaGrafico(transacoes, tipoInterno);
          if (dados.length > 0) {
            const dadosLimitados = prepararDadosGrafico(dados);
            criarGrafico(dadosLimitados, tipo);
            return; // Retornar após criar o gráfico com dados da tabela
          }
        }
      }
    }
    // Se não encontrou dados na tabela, verificar se temos dados em window.transacoes
    if (window.transacoes && window.transacoes.length > 0) {
      dados = processarDadosParaGrafico(window.transacoes, tipoInterno);
      if (dados.length > 0) {
        const dadosLimitados = prepararDadosGrafico(dados);
        criarGrafico(dadosLimitados, tipo);
        return;
      }
    }
    // Se não encontrou dados, mostrar mensagem vazia
    criarGrafico([], tipo);
  } catch (error) {
    console.error('Erro ao carregar gráfico de categorias:', error);
    // Criar gráfico vazio com mensagem de erro
    criarGrafico([], tipo);
  }
}
/**
 * Processa dados de transações para o formato usado pelo gráfico
 * @param {Array} transacoes - Array de transações
 * @param {string} tipo - Tipo de transação (entrada ou saida)
 * @returns {Array} Dados processados para o gráfico
 */
function processarDadosParaGrafico(transacoes, tipo) {
  try {
    // Filtrar por tipo
    const transacoesFiltradas = transacoes.filter(t => {
      return t.tipo === tipo || 
             (tipo === 'saida' && t.tipo === 'despesas') || 
             (tipo === 'entrada' && t.tipo === 'receitas');
    });
    if (transacoesFiltradas.length === 0) {
      return [];
    }
    // Agrupar por categoria
    const categorias = {};
    transacoesFiltradas.forEach(transacao => {
      // Obter nome da categoria
      let nomeCategoria = transacao.categoria_nome || 'Sem categoria';
      // Se a transação tem apenas ID da categoria, tentar obter o nome
      if (!nomeCategoria && transacao.categoria && window.categoriaModule) {
        const categoria = window.categoriaModule.obterCategoriaPorId(transacao.categoria);
        if (categoria) {
          nomeCategoria = categoria.nome;
        }
      }
      // Converter valor para número
      let valor = 0;
      if (typeof transacao.valor === 'number') {
        valor = transacao.valor;
      } else if (typeof transacao.valor === 'string') {
        valor = parseFloat(transacao.valor.replace(/[^\d,-]/g, '').replace(',', '.'));
      }
      if (!isNaN(valor) && valor > 0) {
        // Adicionar ou somar ao total da categoria
        if (!categorias[nomeCategoria]) {
          categorias[nomeCategoria] = 0;
        }
        categorias[nomeCategoria] += valor;
      }
    });
    // Converter para array de objetos com nome e total
    const dadosProcessados = Object.entries(categorias).map(([categoria, valor]) => {
      return {
        nome: categoria,
        total: valor
      };
    });
    return dadosProcessados;
  } catch (error) {
    console.error('Erro ao processar dados para gráfico:', error);
    return [];
  }
}
/**
 * Prepara os dados para o gráfico, limitando o número de categorias
 * @param {Array} dados - Dados processados
 * @param {number} limite - Número máximo de categorias a exibir
 * @returns {Array} Dados limitados para o gráfico
 */
function prepararDadosGrafico(dados, limite = 5) {
  try {
    if (!dados || !Array.isArray(dados) || dados.length === 0) {
      return [];
    }
    // Ordenar os dados por valor (decrescente)
    const dadosOrdenados = [...dados].sort((a, b) => b.total - a.total);
    // Se houver mais categorias que o limite, agrupar as menores em "Outros"
    if (dadosOrdenados.length > limite) {
      const principaisCategorias = dadosOrdenados.slice(0, limite - 1);
      const outrosCategorias = dadosOrdenados.slice(limite - 1);
      // Calcular o total das outras categorias
      const totalOutros = outrosCategorias.reduce((soma, item) => soma + item.total, 0);
      // Adicionar a categoria "Outros" se tiver valor
      if (totalOutros > 0) {
        principaisCategorias.push({
          nome: 'Outros',
          total: totalOutros
        });
      }
      return principaisCategorias;
    }
    return dadosOrdenados;
  } catch (error) {
    console.error('Erro ao preparar dados para gráfico:', error);
    return dados || []; // Retornar os dados originais em caso de erro
  }
}
/**
 * Cria um gráfico de categorias com os dados fornecidos
 * @param {Array} dados - Array de objetos com nome da categoria e valor
 * @param {string} tipo - Tipo de transação (despesas ou receitas)
 */
function criarGrafico(dados, tipo) {
  try {
    // Preparar dados para o gráfico
    const labels = dados.map(item => item.nome);
    const values = dados.map(item => item.total);
    // Cores para o gráfico
    const coresFundo = [
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 99, 132, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)',
      'rgba(199, 199, 199, 0.8)',
      'rgba(83, 102, 255, 0.8)',
      'rgba(40, 159, 64, 0.8)',
      'rgba(210, 199, 199, 0.8)'
    ];
    const coresBorda = [
      'rgba(54, 162, 235, 1)',
      'rgba(255, 99, 132, 1)',
      'rgba(255, 206, 86, 1)',
      'rgba(75, 192, 192, 1)',
      'rgba(153, 102, 255, 1)',
      'rgba(255, 159, 64, 1)',
      'rgba(199, 199, 199, 1)',
      'rgba(83, 102, 255, 1)',
      'rgba(40, 159, 64, 1)',
      'rgba(210, 199, 199, 1)'
    ];
    // Verificar se dados estão vazios
    if (dados.length === 0) {
      const elemento = document.getElementById('grafico-categorias');
      if (elemento) {
        elemento.innerHTML = `
          <div class="text-center py-5 text-muted">
            <i class="bi bi-bar-chart-line fs-1 mb-3"></i>
            <p>Não há dados de ${tipo === 'despesas' ? 'despesas' : 'receitas'} para exibir.</p>
          </div>
        `;
      }
      return;
    }
    // Obter o contexto do canvas
    const ctx = document.getElementById('grafico-categorias');
    if (!ctx) {
      console.error('Elemento "grafico-categorias" não encontrado');
      return; // Sair da função se o elemento não existir
    }
    // Destruir o gráfico existente, se houver
    if (window.graficosCategorias) {
      window.graficosCategorias.destroy();
    }
    // Criar novo gráfico
    window.graficosCategorias = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: coresFundo.slice(0, labels.length),
          borderColor: coresBorda.slice(0, labels.length),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${formatarMoeda(value)} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Erro ao renderizar gráfico:', error);
    // Tentar mostrar uma mensagem de erro
    const elemento = document.getElementById('grafico-categorias');
    if (elemento) {
      elemento.innerHTML = `
        <div class="text-center py-5 text-danger">
          <i class="bi bi-exclamation-triangle fs-1 mb-3"></i>
          <p>Ocorreu um erro ao gerar o gráfico.</p>
        </div>
      `;
    }
  }
}
// Carrega os gráficos na página de relatórios
function carregarGraficosRelatorios() {
  const inicio = dataInicio ? dataInicio.value : null;
  const fim = dataFim ? dataFim.value : null;
  carregarGraficoFluxoCaixa();
  carregarGraficoDespesas(inicio, fim);
  carregarGraficoReceitas(inicio, fim);
}
// Carrega o gráfico de fluxo de caixa mensal
async function carregarGraficoFluxoCaixa() {
  if (!graficoFluxoCaixa) return;
  try {
    // Gerar dados de demonstração para o gráfico
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth() + 1;
    // Gerar 6 meses para trás
    const dados = [];
    for (let i = 0; i < 6; i++) {
      let m = mes - i;
      let a = ano;
      if (m <= 0) {
        m += 12;
        a -= 1;
      }
      const mesStr = m.toString().padStart(2, '0');
      // Valores simulados
      const entradas = 3500 + Math.floor(Math.random() * 1000);
      const saidas = 2500 + Math.floor(Math.random() * 800);
      const saldo = entradas - saidas;
      dados.unshift({
        mes: `${a}-${mesStr}`,
        entradas,
        saidas,
        saldo
      });
    }
    // Preparar dados para o gráfico
    const labels = dados.map(item => {
      const [ano, mes] = item.mes.split('-');
      return `${mes}/${ano}`;
    });
    const entradas = dados.map(item => item.entradas);
    const saidas = dados.map(item => item.saidas);
    const saldo = dados.map(item => item.saldo);
    // Destruir gráfico existente se houver
    if (chartFluxoCaixa) {
      chartFluxoCaixa.destroy();
    }
    // Criar novo gráfico
    const ctx = graficoFluxoCaixa.getContext('2d');
    chartFluxoCaixa = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Entradas',
            data: entradas,
            backgroundColor: 'rgba(40, 167, 69, 0.5)',
            borderColor: 'rgba(40, 167, 69, 1)',
            borderWidth: 1
          },
          {
            label: 'Saídas',
            data: saidas,
            backgroundColor: 'rgba(220, 53, 69, 0.5)',
            borderColor: 'rgba(220, 53, 69, 1)',
            borderWidth: 1
          },
          {
            label: 'Saldo',
            data: saldo,
            type: 'line',
            fill: false,
            borderColor: 'rgba(0, 123, 255, 1)',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                let value = context.raw || 0;
                return `${label}: ${formatarMoeda(value)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return formatarMoeda(value);
              }
            }
          }
        }
      }
    });
  } catch (error) {
    // Silenciar erro - o gráfico simplesmente não será exibido
  }
}
// Carrega o gráfico de despesas por categoria
async function carregarGraficoDespesas(dataInicio, dataFim) {
  if (!graficoDespesas) return;
  try {
    // Obter dados
    const dados = await api.obterDespesasPorCategoria(dataInicio, dataFim);
    // Ordenar dados pelo valor
    dados.sort((a, b) => b.total - a.total);
    // Preparar dados para o gráfico
    const labels = dados.map(item => item.nome);
    const values = dados.map(item => item.total);
    // Destruir gráfico existente se houver
    if (chartDespesas) {
      chartDespesas.destroy();
    }
    // Criar novo gráfico
    const ctx = graficoDespesas.getContext('2d');
    chartDespesas = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: cores.slice(0, dados.length),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                let value = context.raw || 0;
                let total = context.dataset.data.reduce((a, b) => a + b, 0);
                let percentage = ((value * 100) / total).toFixed(1);
                return `${label}: ${formatarMoeda(value)} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  } catch (error) {
    // Silenciar erro - o gráfico simplesmente não será exibido
  }
}
// Carrega o gráfico de receitas por categoria
async function carregarGraficoReceitas(dataInicio, dataFim) {
  if (!graficoReceitas) return;
  try {
    // Obter dados
    const dados = await api.obterReceitasPorCategoria(dataInicio, dataFim);
    // Ordenar dados pelo valor
    dados.sort((a, b) => b.total - a.total);
    // Preparar dados para o gráfico
    const labels = dados.map(item => item.nome);
    const values = dados.map(item => item.total);
    // Destruir gráfico existente se houver
    if (chartReceitas) {
      chartReceitas.destroy();
    }
    // Criar novo gráfico
    const ctx = graficoReceitas.getContext('2d');
    chartReceitas = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: cores.slice(0, dados.length),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                let value = context.raw || 0;
                let total = context.dataset.data.reduce((a, b) => a + b, 0);
                let percentage = ((value * 100) / total).toFixed(1);
                return `${label}: ${formatarMoeda(value)} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  } catch (error) {
    // Silenciar erro - o gráfico simplesmente não será exibido
  }
}
// Configura event listeners
function configurarEventListeners() {
  // Alternar entre gráficos de despesas e receitas no dashboard
  if (graficoTabs) {
    const tabs = graficoTabs.querySelectorAll('.nav-link');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        // Remover classe active de todas as tabs
        tabs.forEach(t => t.classList.remove('active'));
        // Adicionar classe active à tab clicada
        tab.classList.add('active');
        // Carregar o gráfico correspondente
        carregarGraficoCategorias(tab.dataset.tipo);
      });
    });
  }
  // Filtrar relatórios por data
  if (dataInicio && dataFim) {
    const atualizarRelatorios = () => {
      const inicio = dataInicio.value;
      const fim = dataFim.value;
      carregarResumo(inicio, fim);
      carregarGraficoDespesas(inicio, fim);
      carregarGraficoReceitas(inicio, fim);
    };
    dataInicio.addEventListener('change', atualizarRelatorios);
    dataFim.addEventListener('change', atualizarRelatorios);
  }
}
// Verifica se há contas a pagar próximas ao vencimento
function verificarAlertasContas() {
  if (window.cartoesModule && typeof window.cartoesModule.verificarContasPendentes === 'function') {
    window.cartoesModule.verificarContasPendentes();
  }
}
// Exportar módulo
const relatoriosModule = {
  inicializar: inicializarRelatorios,
  atualizarGraficos: atualizarGraficos,
  carregarGraficoCategorias: carregarGraficoCategorias,
  carregarGraficoFluxoCaixa: carregarGraficoFluxoCaixa,
  carregarGraficoDespesas: carregarGraficoDespesas,
  carregarGraficoReceitas: carregarGraficoReceitas,
  verificarAlertasContas: verificarAlertasContas,
  obterTransacoesFiltradas: () => transacoesFiltradas
};
// Exportar o módulo globalmente
window.relatoriosModule = relatoriosModule; 
