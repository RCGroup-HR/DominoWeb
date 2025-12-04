const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken, esAdministrador } = require('../middleware/authJWT');

// Rutas públicas (sin autenticación)
router.post('/registro', authController.registro);
router.post('/login', authController.login);

// Rutas protegidas (requieren autenticación)
router.post('/logout', verificarToken, authController.logout);
router.get('/perfil', verificarToken, authController.perfilActual);
router.put('/cambiar-password', verificarToken, authController.cambiarPassword);

// Rutas de administración (solo administradores)
router.get('/usuarios', verificarToken, esAdministrador, authController.listarUsuarios);
router.put('/usuarios/:userId/rol', verificarToken, esAdministrador, authController.actualizarRol);
router.put('/usuarios/:userId/activo', verificarToken, esAdministrador, authController.toggleActivoUsuario);

module.exports = router;
