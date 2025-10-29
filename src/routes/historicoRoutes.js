const express = require('express');
const router = express.Router();
const historicoController = require('../controllers/historicoController');

// Ruta para obtener el histórico completo
//router.get('/', historicoController.getHistorico);

// NUEVA RUTA: Obtener histórico por carnet (en todos los torneos)
//router.get('/historico/:carnet', historicoController.getHistoricoByCarnet);

// Ruta para obtener histórico por torneo
router.get('/Resumen/:Carnet', historicoController.getHistoricoByTorneo);

// Ruta para obtener jugador por ID
//router.get('/historico/:id', historicoController.getJugadorById);

module.exports = router;