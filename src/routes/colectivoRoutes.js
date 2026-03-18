const express = require('express');
const router = express.Router();
const colectivoController = require('../controllers/colectivoController');

// Rutas para ranking colectivo
router.get('/', colectivoController.getNombreTorneo);
router.get('/torneo', colectivoController.getRankingByTorneo);
router.get('/equipo/:nombre', colectivoController.getIntegrantesByEquipo);

module.exports = router;