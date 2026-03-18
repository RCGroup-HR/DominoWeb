// ============================================
// RUTAS ADMIN - ScoreDomino
// Todas protegidas con JWT + rol administrador
// ============================================
const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/adminController');
const { verificarToken, esAdministrador } = require('../middleware/authJWT');

// Aplica JWT + admin a todas las rutas de este router
router.use(verificarToken, esAdministrador);

// ── Dashboard ──────────────────────────────
router.get('/dashboard',    ctrl.getDashboard);
router.get('/system-info',  ctrl.getSystemInfo);

// ── Configuración ──────────────────────────
router.get('/config',              ctrl.getConfig);
router.put('/config/:clave',       ctrl.updateConfig);
router.post('/config/bulk',        ctrl.bulkUpdateConfig);

// ── Usuarios ───────────────────────────────
router.get('/usuarios',                    ctrl.getUsuarios);
router.get('/usuarios/:id',                ctrl.getUsuario);
router.delete('/usuarios/:id/sesiones',    ctrl.revocarSesiones);

// ── Sesiones activas ───────────────────────
router.get('/sesiones',             ctrl.getSesionesActivas);
router.delete('/sesiones/todas',    ctrl.revocarTodasSesiones);
router.delete('/sesiones/:id',      ctrl.revocarSesion);

// ── Países ─────────────────────────────────
router.get('/paises',              ctrl.getPaises);
router.post('/paises',             ctrl.createPais);
router.put('/paises/:id',          ctrl.updatePais);
router.patch('/paises/:id/toggle', ctrl.togglePaisActivo);

// ── Auditoría ──────────────────────────────
router.get('/audit', ctrl.getAuditLogs);

module.exports = router;
