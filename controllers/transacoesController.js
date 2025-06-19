const { db } = require('../server');

// Obter todas as transações
exports.obterTransacoes = (req, res) => {
  const query = `
    SELECT t.*, c.nome as categoria_nome 
    FROM transacoes t
    LEFT JOIN categorias c ON t.categoria = c.id
    ORDER BY t.data DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }
    res.json(rows);
  });
};

// Obter uma transação específica
exports.obterTransacao = (req, res) => {
  const { id } = req.params;
  
  db.get(
    `SELECT t.*, c.nome as categoria_nome 
     FROM transacoes t
     LEFT JOIN categorias c ON t.categoria = c.id
     WHERE t.id = ?`, 
    [id], 
    (err, row) => {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }
      if (!row) {
        return res.status(404).json({ mensagem: "Transação não encontrada" });
      }
      res.json(row);
    }
  );
};

// Criar nova transação
exports.criarTransacao = (req, res) => {
  const { descricao, valor, tipo, categoria, data } = req.body;
  
  if (!descricao || !valor || !tipo) {
    return res.status(400).json({ erro: "Descrição, valor e tipo são obrigatórios" });
  }
  
  const dataTransacao = data || new Date().toISOString().split('T')[0];
  
  db.run(
    `INSERT INTO transacoes (descricao, valor, tipo, categoria, data)
     VALUES (?, ?, ?, ?, ?)`,
    [descricao, valor, tipo, categoria, dataTransacao],
    function (err) {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }
      
      db.get(
        `SELECT t.*, c.nome as categoria_nome 
         FROM transacoes t
         LEFT JOIN categorias c ON t.categoria = c.id
         WHERE t.id = ?`, 
        [this.lastID], 
        (err, row) => {
          if (err) {
            return res.status(500).json({ erro: err.message });
          }
          res.status(201).json(row);
        }
      );
    }
  );
};

// Atualizar transação existente
exports.atualizarTransacao = (req, res) => {
  const { id } = req.params;
  const { descricao, valor, tipo, categoria, data } = req.body;
  
  if (!descricao || !valor || !tipo) {
    return res.status(400).json({ erro: "Descrição, valor e tipo são obrigatórios" });
  }
  
  db.run(
    `UPDATE transacoes 
     SET descricao = ?, valor = ?, tipo = ?, categoria = ?, data = ?
     WHERE id = ?`,
    [descricao, valor, tipo, categoria, data, id],
    function (err) {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ mensagem: "Transação não encontrada" });
      }
      
      db.get(
        `SELECT t.*, c.nome as categoria_nome 
         FROM transacoes t
         LEFT JOIN categorias c ON t.categoria = c.id
         WHERE t.id = ?`, 
        [id], 
        (err, row) => {
          if (err) {
            return res.status(500).json({ erro: err.message });
          }
          res.json(row);
        }
      );
    }
  );
};

// Excluir transação
exports.excluirTransacao = (req, res) => {
  const { id } = req.params;
  
  db.run(`DELETE FROM transacoes WHERE id = ?`, [id], function (err) {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ mensagem: "Transação não encontrada" });
    }
    
    res.json({ mensagem: "Transação excluída com sucesso" });
  });
}; 