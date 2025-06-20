const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Inicialização do banco de dados
const dbPath = path.resolve(__dirname, 'database', 'financas.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    // Criar tabela de transações se não existir
    db.run(`CREATE TABLE IF NOT EXISTS transacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao TEXT NOT NULL,
      valor REAL NOT NULL,
      tipo TEXT NOT NULL,
      categoria TEXT,
      data TEXT DEFAULT CURRENT_TIMESTAMP,
      cartao_id INTEGER,
      compra_id INTEGER
    )`, (err) => {
      if (err) {
        console.error('Erro ao criar tabela:', err.message);
      }
    });
    
    // Criar tabela de categorias se não existir
    db.run(`CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      tipo TEXT NOT NULL
    )`, (err) => {
      if (err) {
        console.error('Erro ao criar tabela:', err.message);
      } else {
        // Inserir categorias padrão se não existirem
        const categoriasPadrao = [
          { nome: 'Salário', tipo: 'entrada' },
          { nome: 'Vendas', tipo: 'entrada' },
          { nome: 'Investimentos', tipo: 'entrada' },
          { nome: 'Outros', tipo: 'entrada' },
          { nome: 'Alimentação', tipo: 'saida' },
          { nome: 'Moradia', tipo: 'saida' },
          { nome: 'Transporte', tipo: 'saida' },
          { nome: 'Saúde', tipo: 'saida' },
          { nome: 'Educação', tipo: 'saida' },
          { nome: 'Lazer', tipo: 'saida' },
          { nome: 'Outros', tipo: 'saida' }
        ];
        
        const stmt = db.prepare('INSERT OR IGNORE INTO categorias (nome, tipo) VALUES (?, ?)');
        categoriasPadrao.forEach(categoria => {
          stmt.run(categoria.nome, categoria.tipo);
        });
        stmt.finalize();
      }
    });
    
    // Criar tabela de cartões de crédito se não existir
    db.run(`CREATE TABLE IF NOT EXISTS cartoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      limite REAL NOT NULL,
      fechamento INTEGER NOT NULL,
      vencimento INTEGER NOT NULL,
      cor TEXT DEFAULT 'primary'
    )`, (err) => {
      if (err) {
        console.error('Erro ao criar tabela de cartões:', err.message);
      }
    });
    
    // Criar tabela de compras parceladas se não existir
    db.run(`CREATE TABLE IF NOT EXISTS compras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao TEXT NOT NULL,
      valor REAL NOT NULL,
      data TEXT NOT NULL,
      parcelas INTEGER NOT NULL,
      cartao_id INTEGER NOT NULL,
      categoria_id INTEGER,
      FOREIGN KEY (cartao_id) REFERENCES cartoes(id) ON DELETE CASCADE,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    )`, (err) => {
      if (err) {
        console.error('Erro ao criar tabela de compras:', err.message);
      }
    });
    
    // Criar tabela de parcelas se não existir
    db.run(`CREATE TABLE IF NOT EXISTS parcelas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      compra_id INTEGER NOT NULL,
      cartao_id INTEGER NOT NULL,
      numero INTEGER NOT NULL,
      valor REAL NOT NULL,
      data_vencimento TEXT NOT NULL,
      pago BOOLEAN DEFAULT 0,
      FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
      FOREIGN KEY (cartao_id) REFERENCES cartoes(id) ON DELETE CASCADE
    )`, (err) => {
      if (err) {
        console.error('Erro ao criar tabela de parcelas:', err.message);
      }
    });
  }
});

// Exportar a conexão para uso em outros arquivos
module.exports = { db };

// Configuração do Express
const app = express();
const PORT = process.env.PORT || 3030;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rotas API
const transacoesRoutes = require('./routes/transacoes');
const categoriasRoutes = require('./routes/categorias');
const relatoriosRoutes = require('./routes/relatorios');
const cartoesRoutes = require('./routes/cartoes');

app.use('/api/transacoes', transacoesRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/cartoes', cartoesRoutes);

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware para tratar erros 404
app.use((req, res, next) => {
  res.status(404).json({ 
    erro: 'Recurso não encontrado',
    path: req.path
  });
});

// Middleware para tratar erros gerais
app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err);
  res.status(500).json({ 
    erro: 'Erro interno no servidor',
    message: err.message
  });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  // ... existing code ...
});

// Tratamento de erros do servidor
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Porta ${PORT} já está em uso! Tente uma porta diferente.`);
    process.exit(1);
  } else {
    console.error('Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}); 