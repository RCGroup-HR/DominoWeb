const express = require('express');
const router = express.Router();
const carnetsController = require('../controllers/carnetsController');
const { verificarToken, esAdministrador } = require('../middleware/authJWT');
const { upload, handleMulterError } = require('../middleware/upload');

// Rutas públicas
router.get('/paises', carnetsController.listarPaises);

// Rutas protegidas (requieren autenticación)
router.post(
    '/',
    verificarToken,
    upload.single('foto'),
    handleMulterError,
    carnetsController.crearSolicitudCarnet
);

// Ruta para solicitudes con foto en base64
router.post(
    '/solicitudes',
    verificarToken,
    carnetsController.crearSolicitudCarnetBase64
);

router.get('/', verificarToken, carnetsController.listarCarnets);
router.get('/:id', verificarToken, carnetsController.obtenerCarnet);

router.put(
    '/:id',
    verificarToken,
    upload.single('foto'),
    handleMulterError,
    carnetsController.actualizarCarnet
);

// Rutas de administración (solo administradores)
router.post('/:id/aprobar', verificarToken, esAdministrador, carnetsController.aprobarCarnet);
router.post('/:id/rechazar', verificarToken, esAdministrador, carnetsController.rechazarCarnet);
router.delete('/:id', verificarToken, esAdministrador, carnetsController.eliminarCarnet);
router.get('/admin/estadisticas', verificarToken, esAdministrador, carnetsController.obtenerEstadisticas);

module.exports = router;
