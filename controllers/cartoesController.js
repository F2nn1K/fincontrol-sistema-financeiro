const { db } = require('../server');

// Obter todos os cartões
exports.obterCartoes = (req, res) => {
  const query = `SELECT * FROM cartoes ORDER BY nome`;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }
    res.json(rows);
  });
};

// Obter um cartão específico
exports.obterCartao = (req, res) => {
  const { id } = req.params;
  
  db.get(`SELECT * FROM cartoes WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }
    if (!row) {
      return res.status(404).json({ mensagem: "Cartão não encontrado" });
    }
    res.json(row);
  });
};

// Criar novo cartão
exports.criarCartao = (req, res) => {
  const { nome, limite, fechamento, vencimento, cor } = req.body;
  
  if (!nome || !limite || !fechamento || !vencimento) {
    return res.status(400).json({ erro: "Nome, limite, fechamento e vencimento são obrigatórios" });
  }
  
  const corCartao = cor || 'primary';
  
  db.run(
    `INSERT INTO cartoes (nome, limite, fechamento, vencimento, cor)
     VALUES (?, ?, ?, ?, ?)`,
    [nome, limite, fechamento, vencimento, corCartao],
    function (err) {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }
      
      db.get(`SELECT * FROM cartoes WHERE id = ?`, [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ erro: err.message });
        }
        res.status(201).json(row);
      });
    }
  );
};

// Atualizar cartão existente
exports.atualizarCartao = (req, res) => {
  const { id } = req.params;
  const { nome, limite, fechamento, vencimento, cor } = req.body;
  
  if (!nome || !limite || !fechamento || !vencimento) {
    return res.status(400).json({ erro: "Nome, limite, fechamento e vencimento são obrigatórios" });
  }
  
  db.run(
    `UPDATE cartoes 
     SET nome = ?, limite = ?, fechamento = ?, vencimento = ?, cor = ?
     WHERE id = ?`,
    [nome, limite, fechamento, vencimento, cor, id],
    function (err) {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ mensagem: "Cartão não encontrado" });
      }
      
      db.get(`SELECT * FROM cartoes WHERE id = ?`, [id], (err, row) => {
        if (err) {
          return res.status(500).json({ erro: err.message });
        }
        res.json(row);
      });
    }
  );
};

// Excluir cartão
exports.excluirCartao = (req, res) => {
  const { id } = req.params;
  
  // Verificar se há parcelas pendentes
  db.get(
    `SELECT COUNT(*) as total FROM parcelas 
     WHERE cartao_id = ? AND pago = 0`,
    [id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }
      
      if (row.total > 0) {
        return res.status(400).json({ 
          erro: "Não é possível excluir o cartão pois há parcelas pendentes",
          parcelasPendentes: row.total
        });
      }
      
      // Se não houver parcelas pendentes, excluir o cartão
      db.run(`DELETE FROM cartoes WHERE id = ?`, [id], function (err) {
        if (err) {
          return res.status(500).json({ erro: err.message });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ mensagem: "Cartão não encontrado" });
        }
        
        res.json({ mensagem: "Cartão excluído com sucesso" });
      });
    }
  );
};

// Obter compras por cartão
exports.obterComprasPorCartao = (req, res) => {
  const { cartaoId } = req.params;
  
  const query = `
    SELECT c.*, cat.nome as categoria_nome 
    FROM compras c
    LEFT JOIN categorias cat ON c.categoria_id = cat.id
    WHERE c.cartao_id = ?
    ORDER BY c.data DESC
  `;
  
  db.all(query, [cartaoId], (err, rows) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }
    res.json(rows);
  });
};

// Criar nova compra
exports.criarCompra = (req, res) => {
  const { descricao, valor, data, parcelas, cartao_id, categoria_id, valores_personalizados } = req.body;
  
  if (!descricao || !valor || !data || !parcelas || !cartao_id) {
    return res.status(400).json({ 
      erro: "Descrição, valor, data, parcelas e cartão são obrigatórios" 
    });
  }
  
  // Iniciar transação
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Inserir a compra
    db.run(
      `INSERT INTO compras (descricao, valor, data, parcelas, cartao_id, categoria_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [descricao, valor, data, parcelas, cartao_id, categoria_id],
      function (err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ erro: err.message });
        }
        
        const compraId = this.lastID;
        
        // Usar valores personalizados se fornecidos, senão distribuir igualmente
        let valoresParcelas;
        if (valores_personalizados && Array.isArray(valores_personalizados) && valores_personalizados.length === parseInt(parcelas)) {
          valoresParcelas = valores_personalizados;
          console.log('💰 Usando valores personalizados das parcelas');
        } else {
          const valorParcela = parseFloat((valor / parcelas).toFixed(2));
          valoresParcelas = new Array(parseInt(parcelas)).fill(valorParcela);
          console.log('💰 Distribuindo valor igualmente entre as parcelas');
        }
        
        let dataCompra = new Date(data);
        
        // Obter informações do cartão para calcular vencimentos
        db.get(
          `SELECT fechamento, vencimento FROM cartoes WHERE id = ?`,
          [cartao_id],
          (err, cartao) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ erro: err.message });
            }
            
            if (!cartao) {
              db.run('ROLLBACK');
              return res.status(404).json({ mensagem: "Cartão não encontrado" });
            }
            
            // Criar as parcelas
            const stmtParcela = db.prepare(
              `INSERT INTO parcelas (compra_id, cartao_id, numero, valor, data_vencimento, pago)
               VALUES (?, ?, ?, ?, ?, 0)`
            );
            
            let parcelasInseridas = 0;
            
            for (let i = 1; i <= parcelas; i++) {
              // Usar o valor específico desta parcela
              const valorDestaParcela = valoresParcelas[i - 1];
              
              // Calcular data de vencimento
              let dataVencimento = new Date(dataCompra);
              
              // Avançar para o mês da parcela
              dataVencimento.setMonth(dataVencimento.getMonth() + i - 1);
              
              // Ajustar para o dia de fechamento
              if (dataVencimento.getDate() > cartao.fechamento) {
                dataVencimento.setMonth(dataVencimento.getMonth() + 1);
              }
              
              // Definir o dia de vencimento
              dataVencimento.setDate(cartao.vencimento);
              
              // Formatar a data para o formato ISO
              const dataFormatada = dataVencimento.toISOString().split('T')[0];
              
              stmtParcela.run(
                [compraId, cartao_id, i, valorDestaParcela, dataFormatada],
                function (err) {
                  if (err) {
                    console.error(`Erro ao inserir parcela ${i}:`, err.message);
                    return;
                  }
                  
                  parcelasInseridas++;
                  
                  // Se todas as parcelas foram inseridas, finalizar
                  if (parcelasInseridas === parseInt(parcelas)) {
                    stmtParcela.finalize();
                    db.run('COMMIT');
                    
                    // Retornar a compra com suas parcelas
                    db.get(
                      `SELECT c.*, cat.nome as categoria_nome 
                       FROM compras c
                       LEFT JOIN categorias cat ON c.categoria_id = cat.id
                       WHERE c.id = ?`,
                      [compraId],
                      (err, compra) => {
                        if (err) {
                          return res.status(500).json({ erro: err.message });
                        }
                        
                        db.all(
                          `SELECT * FROM parcelas WHERE compra_id = ? ORDER BY numero`,
                          [compraId],
                          (err, parcelas) => {
                            if (err) {
                              return res.status(500).json({ erro: err.message });
                            }
                            
                            res.status(201).json({
                              compra,
                              parcelas
                            });
                          }
                        );
                      }
                    );
                  }
                }
              );
            }
          }
        );
      }
    );
  });
};

// Atualizar compra
exports.atualizarCompra = (req, res) => {
  const { id } = req.params;
  const { descricao, categoria_id } = req.body;
  
  if (!descricao) {
    return res.status(400).json({ erro: "Descrição é obrigatória" });
  }
  
  // Apenas permitir atualizar descrição e categoria
  db.run(
    `UPDATE compras SET descricao = ?, categoria_id = ? WHERE id = ?`,
    [descricao, categoria_id, id],
    function (err) {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ mensagem: "Compra não encontrada" });
      }
      
      // Atualizar também a descrição das transações relacionadas
      db.run(
        `UPDATE transacoes SET descricao = ?, categoria = ? WHERE compra_id = ?`,
        [`[Cartão] ${descricao}`, categoria_id, id],
        (err) => {
          if (err) {
            console.error('Erro ao atualizar transações relacionadas:', err.message);
          }
        }
      );
      
      db.get(
        `SELECT c.*, cat.nome as categoria_nome 
         FROM compras c
         LEFT JOIN categorias cat ON c.categoria_id = cat.id
         WHERE c.id = ?`,
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

// Excluir compra
exports.excluirCompra = (req, res) => {
  const { id } = req.params;
  
  console.log(`🗑️ Excluindo compra com ID: ${id}`);
  
  // Iniciar transação
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Excluir parcelas primeiro (devido à chave estrangeira)
    db.run(`DELETE FROM parcelas WHERE compra_id = ?`, [id], (err) => {
      if (err) {
        console.error('❌ Erro ao excluir parcelas:', err);
        db.run('ROLLBACK');
        return res.status(500).json({ erro: err.message });
      }
      
      console.log('✅ Parcelas excluídas com sucesso');
      
      // Excluir a compra
      db.run(`DELETE FROM compras WHERE id = ?`, [id], function (err) {
        if (err) {
          console.error('❌ Erro ao excluir compra:', err);
          db.run('ROLLBACK');
          return res.status(500).json({ erro: err.message });
        }
        
        if (this.changes === 0) {
          console.log('⚠️ Compra não encontrada');
          db.run('ROLLBACK');
          return res.status(404).json({ mensagem: "Compra não encontrada" });
        }
        
        console.log('✅ Compra excluída com sucesso');
        db.run('COMMIT');
        res.json({ mensagem: "Compra excluída com sucesso" });
      });
    });
  });
};

// Obter parcelas por cartão
exports.obterParcelasPorCartao = (req, res) => {
  const { cartaoId } = req.params;
  
  const query = `
    SELECT p.*, c.descricao as compra_descricao, c.categoria_id,
           cat.nome as categoria_nome
    FROM parcelas p
    JOIN compras c ON p.compra_id = c.id
    LEFT JOIN categorias cat ON c.categoria_id = cat.id
    WHERE p.cartao_id = ?
    ORDER BY p.data_vencimento
  `;
  
  db.all(query, [cartaoId], (err, rows) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }
    res.json(rows);
  });
};

// Marcar parcela como paga
exports.pagarParcela = (req, res) => {
  const { id } = req.params;
  
  db.run(
    `UPDATE parcelas SET pago = 1 WHERE id = ?`,
    [id],
    function (err) {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ mensagem: "Parcela não encontrada" });
      }
      
      db.get(
        `SELECT p.*, c.descricao, c.categoria_id
         FROM parcelas p
         JOIN compras c ON p.compra_id = c.id
         WHERE p.id = ?`,
        [id],
        (err, parcela) => {
          if (err) {
            return res.status(500).json({ erro: err.message });
          }
          
          res.json({ mensagem: "Parcela marcada como paga" });
        }
      );
    }
  );
};