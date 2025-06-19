const { db } = require('../server');

// Resumo financeiro
exports.obterResumo = (req, res) => {
  const { dataInicio, dataFim } = req.query;
  let where = '';
  const params = [];
  
  if (dataInicio && dataFim) {
    where = 'WHERE data >= ? AND data <= ?';
    params.push(dataInicio, dataFim);
  } else if (dataInicio) {
    where = 'WHERE data >= ?';
    params.push(dataInicio);
  } else if (dataFim) {
    where = 'WHERE data <= ?';
    params.push(dataFim);
  }
  
  const queries = [
    // Total de entradas
    `SELECT IFNULL(SUM(valor), 0) as total FROM transacoes WHERE tipo = 'entrada' ${where ? 'AND ' + where.substring(6) : ''}`,
    
    // Total de saídas
    `SELECT IFNULL(SUM(valor), 0) as total FROM transacoes WHERE tipo = 'saida' ${where ? 'AND ' + where.substring(6) : ''}`,
    
    // Saldo total (entradas - saídas)
    `SELECT IFNULL(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END), 0) as saldo FROM transacoes ${where}`
  ];
  
  Promise.all(queries.map(query => {
    return new Promise((resolve, reject) => {
      db.get(query, [...params], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }))
  .then(([entradas, saidas, saldo]) => {
    res.json({
      entradas: entradas.total,
      saidas: saidas.total,
      saldo: saldo.saldo
    });
  })
  .catch(err => {
    res.status(500).json({ erro: err.message });
  });
};

// Despesas por categoria
exports.despesasPorCategoria = (req, res) => {
  const { dataInicio, dataFim } = req.query;
  let where = "WHERE t.tipo = 'saida'";
  const params = [];
  
  if (dataInicio) {
    where += ' AND t.data >= ?';
    params.push(dataInicio);
  }
  
  if (dataFim) {
    where += ' AND t.data <= ?';
    params.push(dataFim);
  }
  
  const query = `
    SELECT c.nome, IFNULL(SUM(t.valor), 0) as total
    FROM categorias c
    LEFT JOIN transacoes t ON c.id = t.categoria ${where}
    WHERE c.tipo = 'saida'
    GROUP BY c.id
    ORDER BY total DESC
  `;
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }
    res.json(rows);
  });
};

// Receitas por categoria
exports.receitasPorCategoria = (req, res) => {
  const { dataInicio, dataFim } = req.query;
  let where = "WHERE t.tipo = 'entrada'";
  const params = [];
  
  if (dataInicio) {
    where += ' AND t.data >= ?';
    params.push(dataInicio);
  }
  
  if (dataFim) {
    where += ' AND t.data <= ?';
    params.push(dataFim);
  }
  
  const query = `
    SELECT c.nome, IFNULL(SUM(t.valor), 0) as total
    FROM categorias c
    LEFT JOIN transacoes t ON c.id = t.categoria ${where}
    WHERE c.tipo = 'entrada'
    GROUP BY c.id
    ORDER BY total DESC
  `;
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }
    res.json(rows);
  });
};

// Fluxo de caixa mensal
exports.fluxoCaixaMensal = (req, res) => {
  const { ano } = req.query;
  let where = '';
  const params = [];
  
  if (ano) {
    where = 'WHERE strftime("%Y", data) = ?';
    params.push(ano);
  }
  
  const query = `
    SELECT 
      strftime('%Y-%m', data) as mes,
      IFNULL(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0) as entradas,
      IFNULL(SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END), 0) as saidas,
      IFNULL(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END), 0) as saldo
    FROM transacoes
    ${where}
    GROUP BY strftime('%Y-%m', data)
    ORDER BY mes
  `;
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }
    res.json(rows);
  });
}; 