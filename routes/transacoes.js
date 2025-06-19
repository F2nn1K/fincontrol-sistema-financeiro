const express = require('express');
const router = express.Router();
const transacoesController = require('../controllers/transacoesController');

// Rotas para transações
router.get('/', transacoesController.obterTransacoes);
router.get('/:id', transacoesController.obterTransacao);
router.post('/', transacoesController.criarTransacao);
router.put('/:id', transacoesController.atualizarTransacao);
router.delete('/:id', transacoesController.excluirTransacao);

module.exports = router; 