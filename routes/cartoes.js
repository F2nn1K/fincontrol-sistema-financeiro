const express = require('express');
const router = express.Router();
const cartoesController = require('../controllers/cartoesController');

// Rotas para cartões de crédito
router.get('/', cartoesController.obterCartoes);
router.get('/:id', cartoesController.obterCartao);
router.post('/', cartoesController.criarCartao);
router.put('/:id', cartoesController.atualizarCartao);
router.delete('/:id', cartoesController.excluirCartao);

// Rotas para compras parceladas
router.get('/compras/:cartaoId', cartoesController.obterComprasPorCartao);
router.post('/compras', cartoesController.criarCompra);
router.put('/compras/:id', cartoesController.atualizarCompra);
router.delete('/compras/:id', cartoesController.excluirCompra);

// Rotas para parcelas
router.get('/parcelas/:cartaoId', cartoesController.obterParcelasPorCartao);
router.put('/parcelas/:id/pagar', cartoesController.pagarParcela);

module.exports = router; 