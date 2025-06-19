const { db } = require('../server');

// Obter todas as categorias
exports.obterCategorias = (req, res) => {
  const tipo = req.query.tipo;
  let query = 'SELECT * FROM categorias';
  const params = [];
  
  if (tipo) {
    query += ' WHERE tipo = ?';
    params.push(tipo);
  }
  
  query += ' ORDER BY nome';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }
    res.json(rows);
  });
};

// Obter uma categoria específica
exports.obterCategoria = (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM categorias WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }
    if (!row) {
      return res.status(404).json({ mensagem: "Categoria não encontrada" });
    }
    res.json(row);
  });
};

// Criar nova categoria
exports.criarCategoria = (req, res) => {
  const { nome, tipo } = req.body;
  
  if (!nome || !tipo) {
    return res.status(400).json({ erro: "Nome e tipo são obrigatórios" });
  }
  
  if (tipo !== 'entrada' && tipo !== 'saida') {
    return res.status(400).json({ erro: "Tipo deve ser 'entrada' ou 'saida'" });
  }
  
  db.run(
    'INSERT INTO categorias (nome, tipo) VALUES (?, ?)',
    [nome, tipo],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ erro: "Uma categoria com este nome já existe" });
        }
        return res.status(500).json({ erro: err.message });
      }
      
      db.get('SELECT * FROM categorias WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ erro: err.message });
        }
        res.status(201).json(row);
      });
    }
  );
};

// Atualizar categoria existente
exports.atualizarCategoria = (req, res) => {
  const { id } = req.params;
  const { nome, tipo } = req.body;
  
  if (!nome || !tipo) {
    return res.status(400).json({ erro: "Nome e tipo são obrigatórios" });
  }
  
  if (tipo !== 'entrada' && tipo !== 'saida') {
    return res.status(400).json({ erro: "Tipo deve ser 'entrada' ou 'saida'" });
  }
  
  db.run(
    'UPDATE categorias SET nome = ?, tipo = ? WHERE id = ?',
    [nome, tipo, id],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ erro: "Uma categoria com este nome já existe" });
        }
        return res.status(500).json({ erro: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ mensagem: "Categoria não encontrada" });
      }
      
      db.get('SELECT * FROM categorias WHERE id = ?', [id], (err, row) => {
        if (err) {
          return res.status(500).json({ erro: err.message });
        }
        res.json(row);
      });
    }
  );
};

// Excluir categoria
exports.excluirCategoria = (req, res) => {
  const { id } = req.params;
  
  // Verificar se existem transações usando esta categoria
  db.get('SELECT COUNT(*) as count FROM transacoes WHERE categoria = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }
    
    if (row.count > 0) {
      return res.status(409).json({ 
        erro: "Não é possível excluir esta categoria pois existem transações vinculadas a ela" 
      });
    }
    
    db.run('DELETE FROM categorias WHERE id = ?', [id], function (err) {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ mensagem: "Categoria não encontrada" });
      }
      
      res.json({ mensagem: "Categoria excluída com sucesso" });
    });
  });
}; 