const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware para verificar el token JWT
const verificarToken = async (req, res, next) => {
    try {
        // Obtener token del header Authorization
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        // Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verificar si el token existe en la base de datos (opcional, para sistema de revocación)
        const [sesiones] = await db.query(
            'SELECT * FROM Sesiones WHERE Token = ? AND FechaExpiracion > NOW()',
            [token]
        );

        if (sesiones.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }

        // Obtener información del usuario
        const [usuarios] = await db.query(
            'SELECT Id, Email, Rol, Pais, Activo FROM Usuarios WHERE Id = ?',
            [decoded.userId]
        );

        if (usuarios.length === 0 || !usuarios[0].Activo) {
            return res.status(403).json({
                success: false,
                message: 'Usuario no encontrado o inactivo'
            });
        }

        // Agregar información del usuario a la request
        req.usuario = usuarios[0];
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({
                success: false,
                message: 'Token inválido'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({
                success: false,
                message: 'Token expirado'
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Error al verificar token',
            error: error.message
        });
    }
};

// Middleware para verificar roles
const verificarRol = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado'
            });
        }

        if (!rolesPermitidos.includes(req.usuario.Rol)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para realizar esta acción'
            });
        }

        next();
    };
};

// Middleware específico para administradores
const esAdministrador = verificarRol('administrador');

// Middleware para verificar si es administrador o el mismo usuario
const esAdministradorOPropietario = (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({
            success: false,
            message: 'No autenticado'
        });
    }

    const userId = parseInt(req.params.id || req.params.userId);

    if (req.usuario.Rol === 'administrador' || req.usuario.Id === userId) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'No tienes permisos para realizar esta acción'
        });
    }
};

module.exports = {
    verificarToken,
    verificarRol,
    esAdministrador,
    esAdministradorOPropietario
};
