const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Función auxiliar para registrar auditoría
const registrarAuditoria = async (usuarioId, accion, entidad, entidadId, detalles, ipAddress) => {
    try {
        await db.query(
            'INSERT INTO AuditLog (UsuarioId, Accion, Entidad, EntidadId, Detalles, IPAddress) VALUES (?, ?, ?, ?, ?, ?)',
            [usuarioId, accion, entidad, entidadId, JSON.stringify(detalles), ipAddress]
        );
    } catch (error) {
        console.error('Error al registrar auditoría:', error);
    }
};

// Registro de nuevo usuario
exports.registro = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { email, password, pais } = req.body;

        // Validaciones
        if (!email || !password || !pais) {
            return res.status(400).json({
                success: false,
                message: 'Email, contraseña y país son requeridos'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de email inválido'
            });
        }

        // Validar longitud de contraseña
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Verificar si el email ya existe
        const [usuariosExistentes] = await connection.query(
            'SELECT Id FROM Usuarios WHERE Email = ?',
            [email]
        );

        if (usuariosExistentes.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insertar usuario (por defecto rol 'usuario')
        const [resultado] = await connection.query(
            'INSERT INTO Usuarios (Email, Password, Rol, Pais) VALUES (?, ?, ?, ?)',
            [email, passwordHash, 'usuario', pais]
        );

        const usuarioId = resultado.insertId;

        // Registrar auditoría
        await registrarAuditoria(
            usuarioId,
            'REGISTRO',
            'Usuarios',
            usuarioId,
            { email, pais },
            req.ip
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                id: usuarioId,
                email,
                rol: 'usuario',
                pais
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar usuario',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validaciones
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        // Buscar usuario
        const [usuarios] = await db.query(
            'SELECT Id, Email, Password, Rol, Pais, Activo FROM Usuarios WHERE Email = ?',
            [email]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const usuario = usuarios[0];

        // Verificar si el usuario está activo
        if (!usuario.Activo) {
            return res.status(403).json({
                success: false,
                message: 'Usuario inactivo. Contacta al administrador'
            });
        }

        // Verificar contraseña
        const passwordValida = await bcrypt.compare(password, usuario.Password);

        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar token JWT
        const token = jwt.sign(
            {
                userId: usuario.Id,
                email: usuario.Email,
                rol: usuario.Rol
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION || '24h' }
        );

        // Guardar token en base de datos
        const expiracion = new Date();
        expiracion.setHours(expiracion.getHours() + 24); // 24 horas

        await db.query(
            'INSERT INTO Sesiones (UsuarioId, Token, FechaExpiracion) VALUES (?, ?, ?)',
            [usuario.Id, token, expiracion]
        );

        // Registrar auditoría
        await registrarAuditoria(
            usuario.Id,
            'LOGIN',
            'Usuarios',
            usuario.Id,
            { email },
            req.ip
        );

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                token,
                usuario: {
                    id: usuario.Id,
                    email: usuario.Email,
                    rol: usuario.Rol,
                    pais: usuario.Pais
                }
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
};

// Logout
exports.logout = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            // Eliminar token de la base de datos
            await db.query('DELETE FROM Sesiones WHERE Token = ?', [token]);

            // Registrar auditoría
            await registrarAuditoria(
                req.usuario.Id,
                'LOGOUT',
                'Usuarios',
                req.usuario.Id,
                { email: req.usuario.Email },
                req.ip
            );
        }

        res.json({
            success: true,
            message: 'Logout exitoso'
        });
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cerrar sesión',
            error: error.message
        });
    }
};

// Obtener perfil del usuario actual
exports.perfilActual = async (req, res) => {
    try {
        const [usuarios] = await db.query(
            'SELECT Id, Email, Rol, Pais, FechaCreacion FROM Usuarios WHERE Id = ?',
            [req.usuario.Id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: usuarios[0]
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener perfil',
            error: error.message
        });
    }
};

// Cambiar contraseña
exports.cambiarPassword = async (req, res) => {
    try {
        const { passwordActual, passwordNueva } = req.body;

        if (!passwordActual || !passwordNueva) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña actual y nueva son requeridas'
            });
        }

        if (passwordNueva.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña nueva debe tener al menos 6 caracteres'
            });
        }

        // Obtener usuario actual
        const [usuarios] = await db.query(
            'SELECT Password FROM Usuarios WHERE Id = ?',
            [req.usuario.Id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar contraseña actual
        const passwordValida = await bcrypt.compare(passwordActual, usuarios[0].Password);

        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña actual incorrecta'
            });
        }

        // Encriptar nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(passwordNueva, salt);

        // Actualizar contraseña
        await db.query(
            'UPDATE Usuarios SET Password = ? WHERE Id = ?',
            [passwordHash, req.usuario.Id]
        );

        // Invalidar todas las sesiones del usuario
        await db.query('DELETE FROM Sesiones WHERE UsuarioId = ?', [req.usuario.Id]);

        // Registrar auditoría
        await registrarAuditoria(
            req.usuario.Id,
            'CAMBIO_PASSWORD',
            'Usuarios',
            req.usuario.Id,
            {},
            req.ip
        );

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente. Por favor inicia sesión nuevamente'
        });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar contraseña',
            error: error.message
        });
    }
};

// Listar todos los usuarios (solo administradores)
exports.listarUsuarios = async (req, res) => {
    try {
        const { pais, rol, activo, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT Id, Email, Rol, Pais, Activo, FechaCreacion FROM Usuarios WHERE 1=1';
        const params = [];

        if (pais) {
            query += ' AND Pais = ?';
            params.push(pais);
        }

        if (rol) {
            query += ' AND Rol = ?';
            params.push(rol);
        }

        if (activo !== undefined) {
            query += ' AND Activo = ?';
            params.push(activo === 'true' ? 1 : 0);
        }

        query += ' ORDER BY FechaCreacion DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [usuarios] = await db.query(query, params);

        // Contar total
        let countQuery = 'SELECT COUNT(*) as total FROM Usuarios WHERE 1=1';
        const countParams = [];

        if (pais) {
            countQuery += ' AND Pais = ?';
            countParams.push(pais);
        }

        if (rol) {
            countQuery += ' AND Rol = ?';
            countParams.push(rol);
        }

        if (activo !== undefined) {
            countQuery += ' AND Activo = ?';
            countParams.push(activo === 'true' ? 1 : 0);
        }

        const [totalResult] = await db.query(countQuery, countParams);
        const total = totalResult[0].total;

        res.json({
            success: true,
            data: usuarios,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error al listar usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al listar usuarios',
            error: error.message
        });
    }
};

// Actualizar rol de usuario (solo administradores)
exports.actualizarRol = async (req, res) => {
    try {
        const { userId } = req.params;
        const { rol } = req.body;

        if (!['usuario', 'administrador'].includes(rol)) {
            return res.status(400).json({
                success: false,
                message: 'Rol inválido'
            });
        }

        // No permitir que un administrador se quite a sí mismo el rol
        if (parseInt(userId) === req.usuario.Id && rol === 'usuario') {
            return res.status(400).json({
                success: false,
                message: 'No puedes quitarte el rol de administrador a ti mismo'
            });
        }

        const [resultado] = await db.query(
            'UPDATE Usuarios SET Rol = ? WHERE Id = ?',
            [rol, userId]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Registrar auditoría
        await registrarAuditoria(
            req.usuario.Id,
            'ACTUALIZAR_ROL',
            'Usuarios',
            userId,
            { rol },
            req.ip
        );

        res.json({
            success: true,
            message: 'Rol actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar rol:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar rol',
            error: error.message
        });
    }
};

// Activar/desactivar usuario (solo administradores)
exports.toggleActivoUsuario = async (req, res) => {
    try {
        const { userId } = req.params;
        const { activo } = req.body;

        // No permitir que un administrador se desactive a sí mismo
        if (parseInt(userId) === req.usuario.Id && !activo) {
            return res.status(400).json({
                success: false,
                message: 'No puedes desactivarte a ti mismo'
            });
        }

        const [resultado] = await db.query(
            'UPDATE Usuarios SET Activo = ? WHERE Id = ?',
            [activo ? 1 : 0, userId]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Si se desactiva, eliminar todas sus sesiones
        if (!activo) {
            await db.query('DELETE FROM Sesiones WHERE UsuarioId = ?', [userId]);
        }

        // Registrar auditoría
        await registrarAuditoria(
            req.usuario.Id,
            activo ? 'ACTIVAR_USUARIO' : 'DESACTIVAR_USUARIO',
            'Usuarios',
            userId,
            { activo },
            req.ip
        );

        res.json({
            success: true,
            message: `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`
        });
    } catch (error) {
        console.error('Error al actualizar estado de usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar estado de usuario',
            error: error.message
        });
    }
};
