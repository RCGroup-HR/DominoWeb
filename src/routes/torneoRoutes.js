const express = require('express');
const router = express.Router();
const torneoController = require('../controllers/torneoController');

// Rutas para torneos
router.get('/', torneoController.getAllTorneos);
router.get('/:id', torneoController.getTorneoById);

module.exports = router;