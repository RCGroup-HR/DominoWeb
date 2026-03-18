const express = require('express');
const router  = express.Router();
const authController = require('../controllers/authController');
const { verificarToken, esAdministrador } = require('../middleware/authJWT');
const { loginRateLimiter, rateLimiter }   = require('../middleware/security');

// Rutas públicas (sin autenticación)
// - Registro: máx 20 solicitudes / 15 min por IP
// - Login: máx 10 intentos / 15 min, con bloqueo por intentos fallidos
router.post('/registro', rateLimiter(20, 15 * 60 * 1000), authController.registro);
router.post('/login',    loginRateLimiter(10, 15),         authController.login);

// Rutas protegidas (requieren JWT)
router.post('/logout',           verificarToken, authController.logout);
router.get('/perfil',            verificarToken, authController.perfilActual);
router.put('/cambiar-password',  verificarToken, authController.cambiarPassword);

// Rutas de administración (JWT + rol administrador)
router.get('/usuarios',                    verificarToken, esAdministrador, authController.listarUsuarios);
router.put('/usuarios/:userId/rol',        verificarToken, esAdministrador, authController.actualizarRol);
router.put('/usuarios/:userId/activo',     verificarToken, esAdministrador, authController.toggleActivoUsuario);

module.exports = router;
