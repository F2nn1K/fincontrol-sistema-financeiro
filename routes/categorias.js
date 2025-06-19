const express = require('express');
const router = express.Router();
const categoriasController = require('../controllers/categoriasController');

// Rotas para categorias
router.get('/', categoriasController.obterCategorias);
router.get('/:id', categoriasController.obterCategoria);
router.post('/', categoriasController.criarCategoria);
router.put('/:id', categoriasController.atualizarCategoria);
router.delete('/:id', categoriasController.excluirCategoria);

module.exports = router; 