const express = require('express');
const router = express.Router();
const relatoriosController = require('../controllers/relatoriosController');

// Rotas para relatórios
router.get('/resumo', relatoriosController.obterResumo);
router.get('/despesas-por-categoria', relatoriosController.despesasPorCategoria);
router.get('/receitas-por-categoria', relatoriosController.receitasPorCategoria);
router.get('/fluxo-caixa-mensal', relatoriosController.fluxoCaixaMensal);

module.exports = router; 