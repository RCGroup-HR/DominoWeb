const express = require('express');
const router = express.Router();
const rankingsController = require('../controllers/rankingsController');

// Rutas para ranking
router.get('/', rankingsController.getNombreTorneo);
router.get('/torneo', rankingsController.getRankingByTorneo);
module.exports = router;