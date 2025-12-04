const db = require('../config/database');
const { eliminarArchivo } = require('../middleware/upload');

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

// Crear solicitud de carnet (usuarios autenticados)
exports.crearSolicitudCarnet = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { carnet, nombre, pais, union_federacion, bandera } = req.body;
        const usuarioId = req.usuario.Id;

        // Validaciones
        if (!carnet || !nombre || !pais) {
            return res.status(400).json({
                success: false,
                message: 'Carnet, nombre y país son requeridos'
            });
        }

        // Verificar si el carnet ya existe
        const [carnetsExistentes] = await connection.query(
            'SELECT Id FROM Carnets WHERE Carnet = ?',
            [carnet]
        );

        if (carnetsExistentes.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El carnet ya existe en el sistema'
            });
        }

        // Obtener URL de la foto si se subió
        let fotoUrl = null;
        if (req.file) {
            fotoUrl = '/uploads/fotos-carnets/' + req.file.filename;
        }

        // Insertar carnet con estatus 'pendiente'
        const [resultado] = await connection.query(
            `INSERT INTO Carnets (Carnet, Nombre, Pais, Bandera, Union_Federacion, FotoUrl, Estatus, UsuarioId)
             VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?)`,
            [carnet, nombre, pais, bandera || null, union_federacion || null, fotoUrl, usuarioId]
        );

        const carnetId = resultado.insertId;

        // Registrar auditoría
        await registrarAuditoria(
            usuarioId,
            'CREAR_SOLICITUD_CARNET',
            'Carnets',
            carnetId,
            { carnet, nombre, pais },
            req.ip
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Solicitud de carnet creada exitosamente. Pendiente de aprobación',
            data: {
                id: carnetId,
                carnet,
                nombre,
                pais,
                fotoUrl,
                estatus: 'pendiente'
            }
        });
    } catch (error) {
        await connection.rollback();

        // Si hubo error y se subió un archivo, eliminarlo
        if (req.file) {
            eliminarArchivo('/uploads/fotos-carnets/' + req.file.filename);
        }

        console.error('Error al crear solicitud de carnet:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear solicitud de carnet',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// Listar carnets con filtros
exports.listarCarnets = async (req, res) => {
    try {
        const { estatus, pais, page = 1, limit = 50, buscar } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM vista_carnets_completa WHERE 1=1';
        const params = [];

        // Filtros
        if (estatus) {
            query += ' AND Estatus = ?';
            params.push(estatus);
        }

        if (pais) {
            query += ' AND Pais = ?';
            params.push(pais);
        }

        if (buscar) {
            query += ' AND (Nombre LIKE ? OR Carnet LIKE ?)';
            params.push(`%${buscar}%`, `%${buscar}%`);
        }

        // Si es usuario regular, solo ver sus propios carnets
        if (req.usuario.Rol !== 'administrador') {
            query += ' AND UsuarioEmail = ?';
            params.push(req.usuario.Email);
        }

        query += ' ORDER BY FechaCreacion DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [carnets] = await db.query(query, params);

        // Contar total
        let countQuery = 'SELECT COUNT(*) as total FROM Carnets WHERE 1=1';
        const countParams = [];

        if (estatus) {
            countQuery += ' AND Estatus = ?';
            countParams.push(estatus);
        }

        if (pais) {
            countQuery += ' AND Pais = ?';
            countParams.push(pais);
        }

        if (buscar) {
            countQuery += ' AND (Nombre LIKE ? OR Carnet LIKE ?)';
            countParams.push(`%${buscar}%`, `%${buscar}%`);
        }

        if (req.usuario.Rol !== 'administrador') {
            countQuery += ' AND UsuarioId = ?';
            countParams.push(req.usuario.Id);
        }

        const [totalResult] = await db.query(countQuery, countParams);
        const total = totalResult[0].total;

        res.json({
            success: true,
            data: carnets,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error al listar carnets:', error);
        res.status(500).json({
            success: false,
            message: 'Error al listar carnets',
            error: error.message
        });
    }
};

// Obtener carnet por ID
exports.obtenerCarnet = async (req, res) => {
    try {
        const { id } = req.params;

        const [carnets] = await db.query(
            'SELECT * FROM vista_carnets_completa WHERE Id = ?',
            [id]
        );

        if (carnets.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Carnet no encontrado'
            });
        }

        const carnet = carnets[0];

        // Si es usuario regular, solo puede ver sus propios carnets
        if (req.usuario.Rol !== 'administrador' && carnet.UsuarioEmail !== req.usuario.Email) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para ver este carnet'
            });
        }

        res.json({
            success: true,
            data: carnet
        });
    } catch (error) {
        console.error('Error al obtener carnet:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener carnet',
            error: error.message
        });
    }
};

// Actualizar carnet (usuario propietario o administrador)
exports.actualizarCarnet = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { nombre, pais, union_federacion, bandera } = req.body;

        // Obtener carnet actual
        const [carnetsActuales] = await connection.query(
            'SELECT * FROM Carnets WHERE Id = ?',
            [id]
        );

        if (carnetsActuales.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Carnet no encontrado'
            });
        }

        const carnetActual = carnetsActuales[0];

        // Verificar permisos
        if (req.usuario.Rol !== 'administrador' && carnetActual.UsuarioId !== req.usuario.Id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para actualizar este carnet'
            });
        }

        // Si el carnet ya fue aprobado, solo el administrador puede editarlo
        if (carnetActual.Estatus === 'aprobado' && req.usuario.Rol !== 'administrador') {
            return res.status(403).json({
                success: false,
                message: 'No puedes editar un carnet ya aprobado'
            });
        }

        // Obtener nueva foto si se subió
        let fotoUrl = carnetActual.FotoUrl;
        if (req.file) {
            fotoUrl = '/uploads/fotos-carnets/' + req.file.filename;

            // Eliminar foto anterior si existe
            if (carnetActual.FotoUrl) {
                eliminarArchivo(carnetActual.FotoUrl);
            }
        }

        // Actualizar carnet
        const [resultado] = await connection.query(
            `UPDATE Carnets
             SET Nombre = ?, Pais = ?, Bandera = ?, Union_Federacion = ?, FotoUrl = ?
             WHERE Id = ?`,
            [nombre || carnetActual.Nombre,
             pais || carnetActual.Pais,
             bandera !== undefined ? bandera : carnetActual.Bandera,
             union_federacion !== undefined ? union_federacion : carnetActual.Union_Federacion,
             fotoUrl,
             id]
        );

        // Registrar auditoría
        await registrarAuditoria(
            req.usuario.Id,
            'ACTUALIZAR_CARNET',
            'Carnets',
            id,
            { nombre, pais, union_federacion },
            req.ip
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Carnet actualizado exitosamente'
        });
    } catch (error) {
        await connection.rollback();

        // Si hubo error y se subió un archivo, eliminarlo
        if (req.file) {
            eliminarArchivo('/uploads/fotos-carnets/' + req.file.filename);
        }

        console.error('Error al actualizar carnet:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar carnet',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// Aprobar carnet (solo administradores)
exports.aprobarCarnet = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { comentarios } = req.body;

        // Verificar que el carnet existe y está pendiente
        const [carnets] = await connection.query(
            'SELECT * FROM Carnets WHERE Id = ?',
            [id]
        );

        if (carnets.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Carnet no encontrado'
            });
        }

        const carnet = carnets[0];

        if (carnet.Estatus !== 'pendiente') {
            return res.status(400).json({
                success: false,
                message: `El carnet ya fue ${carnet.Estatus}`
            });
        }

        // Aprobar carnet
        await connection.query(
            `UPDATE Carnets
             SET Estatus = 'aprobado',
                 AdministradorAprobadorId = ?,
                 FechaAprobacion = NOW(),
                 Comentarios = ?
             WHERE Id = ?`,
            [req.usuario.Id, comentarios || null, id]
        );

        // Registrar auditoría
        await registrarAuditoria(
            req.usuario.Id,
            'APROBAR_CARNET',
            'Carnets',
            id,
            { carnet: carnet.Carnet, nombre: carnet.Nombre, comentarios },
            req.ip
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Carnet aprobado exitosamente'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al aprobar carnet:', error);
        res.status(500).json({
            success: false,
            message: 'Error al aprobar carnet',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// Rechazar carnet (solo administradores)
exports.rechazarCarnet = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { comentarios } = req.body;

        if (!comentarios) {
            return res.status(400).json({
                success: false,
                message: 'Los comentarios son requeridos al rechazar un carnet'
            });
        }

        // Verificar que el carnet existe y está pendiente
        const [carnets] = await connection.query(
            'SELECT * FROM Carnets WHERE Id = ?',
            [id]
        );

        if (carnets.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Carnet no encontrado'
            });
        }

        const carnet = carnets[0];

        if (carnet.Estatus !== 'pendiente') {
            return res.status(400).json({
                success: false,
                message: `El carnet ya fue ${carnet.Estatus}`
            });
        }

        // Rechazar carnet
        await connection.query(
            `UPDATE Carnets
             SET Estatus = 'rechazado',
                 AdministradorAprobadorId = ?,
                 Comentarios = ?
             WHERE Id = ?`,
            [req.usuario.Id, comentarios, id]
        );

        // Registrar auditoría
        await registrarAuditoria(
            req.usuario.Id,
            'RECHAZAR_CARNET',
            'Carnets',
            id,
            { carnet: carnet.Carnet, nombre: carnet.Nombre, comentarios },
            req.ip
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Carnet rechazado'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al rechazar carnet:', error);
        res.status(500).json({
            success: false,
            message: 'Error al rechazar carnet',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// Eliminar carnet (solo administradores)
exports.eliminarCarnet = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;

        // Obtener carnet para eliminar la foto
        const [carnets] = await connection.query(
            'SELECT * FROM Carnets WHERE Id = ?',
            [id]
        );

        if (carnets.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Carnet no encontrado'
            });
        }

        const carnet = carnets[0];

        // Eliminar foto si existe
        if (carnet.FotoUrl) {
            eliminarArchivo(carnet.FotoUrl);
        }

        // Eliminar carnet
        await connection.query('DELETE FROM Carnets WHERE Id = ?', [id]);

        // Registrar auditoría
        await registrarAuditoria(
            req.usuario.Id,
            'ELIMINAR_CARNET',
            'Carnets',
            id,
            { carnet: carnet.Carnet, nombre: carnet.Nombre },
            req.ip
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Carnet eliminado exitosamente'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al eliminar carnet:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar carnet',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// Obtener estadísticas (solo administradores)
exports.obtenerEstadisticas = async (req, res) => {
    try {
        // Estadísticas generales
        const [stats] = await db.query(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN Estatus = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN Estatus = 'aprobado' THEN 1 ELSE 0 END) as aprobados,
                SUM(CASE WHEN Estatus = 'rechazado' THEN 1 ELSE 0 END) as rechazados
            FROM Carnets
        `);

        // Estadísticas por país
        const [estatsPais] = await db.query(
            'SELECT * FROM vista_estadisticas_pais ORDER BY TotalCarnets DESC LIMIT 10'
        );

        res.json({
            success: true,
            data: {
                general: stats[0],
                porPais: estatsPais
            }
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};

// Listar países disponibles
exports.listarPaises = async (req, res) => {
    try {
        const [paises] = await db.query(
            'SELECT * FROM Paises WHERE Activo = 1 ORDER BY Nombre'
        );

        res.json({
            success: true,
            data: paises
        });
    } catch (error) {
        console.error('Error al listar países:', error);
        res.status(500).json({
            success: false,
            message: 'Error al listar países',
            error: error.message
        });
    }
};
