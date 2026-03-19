// ============================================
// ADMIN CONTROLLER - ScoreDomino
// Toda la lógica del módulo administrativo
// ============================================
const db = require('../config/database');

// ── Helper: auditoría ───────────────────────
const audit = async (usuarioId, accion, entidad, entidadId, detalles, ip) => {
    try {
        await db.query(
            'INSERT INTO AuditLog (UsuarioId, Accion, Entidad, EntidadId, Detalles, IPAddress) VALUES (?, ?, ?, ?, ?, ?)',
            [usuarioId, accion, entidad, entidadId, JSON.stringify(detalles), ip]
        );
    } catch (e) { console.error('Audit error:', e.message); }
};

// ══════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════
exports.getDashboard = async (req, res) => {
    try {
        // Métricas de usuarios
        const [[usuarios]] = await db.query(
            'SELECT COUNT(*) AS total, SUM(Activo) AS activos, SUM(Rol = "administrador") AS admins FROM Usuarios'
        );
        // Métricas de carnets
        const [[carnets]] = await db.query(`
            SELECT
                COUNT(*) AS total,
                SUM(Estatus = 'pendiente')  AS pendientes,
                SUM(Estatus = 'aprobado')   AS aprobados,
                SUM(Estatus = 'rechazado')  AS rechazados
            FROM Carnets
        `);
        // Sesiones activas
        const [[sesiones]] = await db.query(
            'SELECT COUNT(*) AS activas FROM Sesiones WHERE FechaExpiracion > NOW()'
        );
        // Países activos
        const [[paises]] = await db.query(
            'SELECT COUNT(*) AS activos FROM Paises WHERE Activo = 1'
        );
        // Actividad reciente (últimas 10 acciones)
        const [actividad] = await db.query(`
            SELECT a.Id, a.Accion, a.Entidad, a.IPAddress, a.FechaAccion, u.Email AS UsuarioEmail
            FROM AuditLog a
            LEFT JOIN Usuarios u ON a.UsuarioId = u.Id
            ORDER BY a.FechaAccion DESC LIMIT 10
        `);
        // Carnets pendientes más recientes
        const [carnetsPendientes] = await db.query(`
            SELECT Id, Carnet, Nombre, Pais, FechaCreacion
            FROM Carnets WHERE Estatus = 'pendiente'
            ORDER BY FechaCreacion ASC LIMIT 5
        `);
        // Registros por día (últimos 7 días)
        const [registrosSemana] = await db.query(`
            SELECT DATE(FechaCreacion) AS dia, COUNT(*) AS total
            FROM Usuarios
            WHERE FechaCreacion >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(FechaCreacion)
            ORDER BY dia
        `);

        res.json({
            success: true,
            data: { usuarios, carnets, sesiones, paises, actividad, carnetsPendientes, registrosSemana }
        });
    } catch (error) {
        console.error('Error getDashboard:', error);
        res.status(500).json({ success: false, message: 'Error al cargar el dashboard', error: error.message });
    }
};

// ══════════════════════════════════════════
// CONFIGURACIÓN
// ══════════════════════════════════════════

// Obtener toda la configuración (agrupada)
exports.getConfig = async (req, res) => {
    try {
        const [config] = await db.query(
            'SELECT Id, Clave, Valor, Tipo, Grupo, Descripcion, Editable, UpdatedAt FROM Configuracion ORDER BY Grupo, Clave'
        );
        // Agrupar por grupo
        const agrupada = config.reduce((acc, item) => {
            if (!acc[item.Grupo]) acc[item.Grupo] = [];
            // Ocultar valor de campos tipo password en la respuesta
            if (item.Tipo === 'password' && item.Valor) {
                item.Valor = '••••••••';
                item._hasValue = true;
            }
            acc[item.Grupo].push(item);
            return acc;
        }, {});
        res.json({ success: true, data: config, grouped: agrupada });
    } catch (error) {
        console.error('Error getConfig:', error);
        res.status(500).json({ success: false, message: 'Error al obtener configuración', error: error.message });
    }
};

// Obtener configuración pública (sin datos sensibles)
exports.getConfigPublica = async (req, res) => {
    try {
        const clavesPublicas = [
            'app_nombre', 'app_tagline', 'app_url',
            'color_primario', 'color_secundario', 'logo_url', 'favicon_url',
            'banner_activo', 'banner_mensaje', 'banner_tipo',
            'modo_mantenimiento', 'mensaje_mantenimiento',
            'registro_habilitado', 'ranking_visible_publico', 'contacto_email',
            // Homepage hero stats
            'hero_stat1_num', 'hero_stat1_lbl',
            'hero_stat2_num', 'hero_stat2_lbl',
            'hero_stat3_num', 'hero_stat3_lbl',
            // YouTube
            'youtube_canal_id', 'youtube_video_default'
        ];
        const [config] = await db.query(
            `SELECT Clave, Valor FROM Configuracion WHERE Clave IN (${clavesPublicas.map(() => '?').join(',')})`,
            clavesPublicas
        );
        const resultado = config.reduce((acc, { Clave, Valor }) => {
            acc[Clave] = Valor;
            return acc;
        }, {});
        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error', error: error.message });
    }
};

// Actualizar un parámetro de configuración
exports.updateConfig = async (req, res) => {
    try {
        const { clave } = req.params;
        const { valor }  = req.body;

        if (valor === undefined || valor === null) {
            return res.status(400).json({ success: false, message: 'El valor es requerido' });
        }

        // Verificar existencia y editabilidad
        const [configs] = await db.query('SELECT * FROM Configuracion WHERE Clave = ?', [clave]);
        if (configs.length === 0) {
            return res.status(404).json({ success: false, message: 'Parámetro no encontrado' });
        }
        if (!configs[0].Editable) {
            return res.status(403).json({ success: false, message: 'Este parámetro no es editable' });
        }

        const valorStr = String(valor).trim();

        // Validar tipo
        const tipo = configs[0].Tipo;
        if (tipo === 'numero' && isNaN(Number(valorStr))) {
            return res.status(400).json({ success: false, message: 'El valor debe ser un número' });
        }
        if (tipo === 'booleano' && !['true', 'false', '1', '0'].includes(valorStr.toLowerCase())) {
            return res.status(400).json({ success: false, message: 'El valor debe ser true o false' });
        }
        if (tipo === 'color' && !/^#[0-9A-Fa-f]{3,8}$/.test(valorStr)) {
            return res.status(400).json({ success: false, message: 'Formato de color inválido (#RRGGBB)' });
        }

        await db.query(
            'UPDATE Configuracion SET Valor = ?, UpdatedBy = ? WHERE Clave = ?',
            [valorStr, req.usuario.Id, clave]
        );

        await audit(req.usuario.Id, 'UPDATE_CONFIG', 'Configuracion', configs[0].Id,
            { clave, valorAnterior: configs[0].Tipo === 'password' ? '***' : configs[0].Valor, valorNuevo: tipo === 'password' ? '***' : valorStr },
            req.ip
        );

        res.json({ success: true, message: 'Configuración actualizada exitosamente' });
    } catch (error) {
        console.error('Error updateConfig:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar configuración', error: error.message });
    }
};

// Actualizar múltiples parámetros de un grupo
exports.bulkUpdateConfig = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { params } = req.body; // Array de { clave, valor }
        if (!Array.isArray(params) || params.length === 0) {
            return res.status(400).json({ success: false, message: 'Se requiere un array de parámetros' });
        }

        const resultados = [];
        for (const { clave, valor } of params) {
            const [configs] = await connection.query('SELECT * FROM Configuracion WHERE Clave = ?', [clave]);
            if (configs.length === 0 || !configs[0].Editable) continue;

            const valorStr = String(valor ?? '').trim();
            await connection.query(
                'UPDATE Configuracion SET Valor = ?, UpdatedBy = ? WHERE Clave = ?',
                [valorStr, req.usuario.Id, clave]
            );
            resultados.push(clave);
        }

        await connection.commit();

        await audit(req.usuario.Id, 'BULK_UPDATE_CONFIG', 'Configuracion', null,
            { claves: resultados }, req.ip
        );

        res.json({
            success:      true,
            message:      `${resultados.length} parámetro(s) actualizado(s)`,
            actualizados: resultados
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error bulkUpdateConfig:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar configuración', error: error.message });
    } finally {
        connection.release();
    }
};

// ══════════════════════════════════════════
// USUARIOS
// ══════════════════════════════════════════

// Obtener todos los usuarios con estadísticas
exports.getUsuarios = async (req, res) => {
    try {
        const { page = 1, limit = 50, rol, activo, buscar } = req.query;
        const offset = (page - 1) * limit;

        let where   = 'WHERE 1=1';
        const params = [];
        if (rol)    { where += ' AND Rol = ?';    params.push(rol); }
        if (activo !== undefined) { where += ' AND Activo = ?'; params.push(activo === 'true' ? 1 : 0); }
        if (buscar) { where += ' AND (Email LIKE ? OR Pais LIKE ?)'; params.push(`%${buscar}%`, `%${buscar}%`); }

        const [usuarios] = await db.query(
            `SELECT u.Id, u.Email, u.Rol, u.Pais, u.Activo, u.FechaCreacion,
                    (SELECT COUNT(*) FROM Carnets WHERE UsuarioId = u.Id) AS totalCarnets,
                    (SELECT COUNT(*) FROM Sesiones WHERE UsuarioId = u.Id AND FechaExpiracion > NOW()) AS sesionesActivas
             FROM Usuarios u ${where}
             ORDER BY u.FechaCreacion DESC LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM Usuarios ${where}`, params);

        res.json({
            success: true, data: usuarios,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Error getUsuarios:', error);
        res.status(500).json({ success: false, message: 'Error al obtener usuarios', error: error.message });
    }
};

// Obtener detalle de un usuario
exports.getUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const [usuarios] = await db.query(
            'SELECT Id, Email, Rol, Pais, Activo, FechaCreacion FROM Usuarios WHERE Id = ?', [id]
        );
        if (usuarios.length === 0) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

        const [carnets] = await db.query(
            'SELECT Id, Carnet, Nombre, Estatus, FechaCreacion FROM Carnets WHERE UsuarioId = ? ORDER BY FechaCreacion DESC',
            [id]
        );
        const [logs] = await db.query(
            'SELECT Accion, Entidad, IPAddress, FechaAccion FROM AuditLog WHERE UsuarioId = ? ORDER BY FechaAccion DESC LIMIT 20',
            [id]
        );

        res.json({ success: true, data: { ...usuarios[0], carnets, logs } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener usuario', error: error.message });
    }
};

// Revocar todas las sesiones de un usuario
exports.revocarSesiones = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM Sesiones WHERE UsuarioId = ?', [id]);
        await audit(req.usuario.Id, 'REVOCAR_SESIONES', 'Sesiones', id, { sesionesEliminadas: result.affectedRows }, req.ip);
        res.json({ success: true, message: `${result.affectedRows} sesión(es) revocada(s)` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al revocar sesiones', error: error.message });
    }
};

// ══════════════════════════════════════════
// SESIONES
// ══════════════════════════════════════════
exports.getSesionesActivas = async (req, res) => {
    try {
        const [sesiones] = await db.query(
            'SELECT * FROM vista_sesiones_activas ORDER BY FechaCreacion DESC'
        );
        res.json({ success: true, data: sesiones, total: sesiones.length });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener sesiones', error: error.message });
    }
};

exports.revocarSesion = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM Sesiones WHERE Id = ?', [id]);
        await audit(req.usuario.Id, 'REVOCAR_SESION', 'Sesiones', id, {}, req.ip);
        res.json({ success: true, message: 'Sesión revocada exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al revocar sesión', error: error.message });
    }
};

exports.revocarTodasSesiones = async (req, res) => {
    try {
        // Conservar la sesión del admin actual
        const authHeader = req.headers['authorization'];
        const tokenActual = authHeader && authHeader.split(' ')[1];

        const [result] = await db.query(
            'DELETE FROM Sesiones WHERE Token != ? AND FechaExpiracion > NOW()',
            [tokenActual || '']
        );
        await audit(req.usuario.Id, 'REVOCAR_TODAS_SESIONES', 'Sesiones', null,
            { sesionesEliminadas: result.affectedRows }, req.ip
        );
        res.json({ success: true, message: `${result.affectedRows} sesión(es) activa(s) revocada(s)` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error', error: error.message });
    }
};

// ══════════════════════════════════════════
// PAÍSES
// ══════════════════════════════════════════
exports.getPaises = async (req, res) => {
    try {
        const { activo } = req.query;
        let query  = 'SELECT p.*, (SELECT COUNT(*) FROM Carnets WHERE Pais = p.Codigo) AS totalCarnets FROM Paises p';
        const params = [];
        if (activo !== undefined) { query += ' WHERE p.Activo = ?'; params.push(activo === 'true' ? 1 : 0); }
        query += ' ORDER BY p.Nombre';
        const [paises] = await db.query(query, params);
        res.json({ success: true, data: paises, total: paises.length });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener países', error: error.message });
    }
};

exports.createPais = async (req, res) => {
    try {
        const { Codigo, Nombre, BanderaUrl } = req.body;
        if (!Codigo || !Nombre) {
            return res.status(400).json({ success: false, message: 'Código y nombre son requeridos' });
        }
        const codigo = Codigo.toUpperCase().trim().substring(0, 3);

        const [existe] = await db.query('SELECT Id FROM Paises WHERE Codigo = ?', [codigo]);
        if (existe.length > 0) {
            return res.status(400).json({ success: false, message: `El código ${codigo} ya existe` });
        }

        const [result] = await db.query(
            'INSERT INTO Paises (Codigo, Nombre, BanderaUrl, Activo) VALUES (?, ?, ?, 1)',
            [codigo, Nombre.trim(), BanderaUrl?.trim() || null]
        );
        await audit(req.usuario.Id, 'CREATE_PAIS', 'Paises', result.insertId, { Codigo: codigo, Nombre }, req.ip);
        res.status(201).json({ success: true, message: 'País creado exitosamente', data: { Id: result.insertId } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al crear país', error: error.message });
    }
};

exports.updatePais = async (req, res) => {
    try {
        const { id } = req.params;
        const { Codigo, Nombre, BanderaUrl } = req.body;
        if (!Codigo || !Nombre) {
            return res.status(400).json({ success: false, message: 'Código y nombre son requeridos' });
        }
        const [result] = await db.query(
            'UPDATE Paises SET Codigo = ?, Nombre = ?, BanderaUrl = ? WHERE Id = ?',
            [Codigo.toUpperCase().trim(), Nombre.trim(), BanderaUrl?.trim() || null, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'País no encontrado' });
        await audit(req.usuario.Id, 'UPDATE_PAIS', 'Paises', id, { Codigo, Nombre }, req.ip);
        res.json({ success: true, message: 'País actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar país', error: error.message });
    }
};

exports.togglePaisActivo = async (req, res) => {
    try {
        const { id } = req.params;
        const [pais] = await db.query('SELECT * FROM Paises WHERE Id = ?', [id]);
        if (pais.length === 0) return res.status(404).json({ success: false, message: 'País no encontrado' });
        const nuevoEstado = !pais[0].Activo;
        await db.query('UPDATE Paises SET Activo = ? WHERE Id = ?', [nuevoEstado ? 1 : 0, id]);
        await audit(req.usuario.Id, nuevoEstado ? 'ACTIVAR_PAIS' : 'DESACTIVAR_PAIS', 'Paises', id, { Nombre: pais[0].Nombre }, req.ip);
        res.json({ success: true, message: `País ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar estado del país', error: error.message });
    }
};

// ══════════════════════════════════════════
// AUDITORÍA
// ══════════════════════════════════════════
exports.getAuditLogs = async (req, res) => {
    try {
        const { page = 1, limit = 50, accion, entidad, usuarioId, desde, hasta } = req.query;
        const offset = (page - 1) * limit;

        let where   = 'WHERE 1=1';
        const params = [];

        if (accion)    { where += ' AND a.Accion = ?';    params.push(accion); }
        if (entidad)   { where += ' AND a.Entidad = ?';   params.push(entidad); }
        if (usuarioId) { where += ' AND a.UsuarioId = ?'; params.push(usuarioId); }
        if (desde)     { where += ' AND a.FechaAccion >= ?'; params.push(desde); }
        if (hasta)     { where += ' AND a.FechaAccion <= ?'; params.push(hasta + ' 23:59:59'); }

        const [logs] = await db.query(
            `SELECT a.Id, a.Accion, a.Entidad, a.EntidadId, a.Detalles, a.IPAddress, a.FechaAccion,
                    u.Email AS UsuarioEmail, u.Rol AS UsuarioRol
             FROM AuditLog a
             LEFT JOIN Usuarios u ON a.UsuarioId = u.Id
             ${where}
             ORDER BY a.FechaAccion DESC LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total FROM AuditLog a ${where}`, params
        );

        // Obtener acciones únicas para el filtro
        const [acciones] = await db.query('SELECT DISTINCT Accion FROM AuditLog ORDER BY Accion');

        res.json({
            success: true, data: logs, acciones: acciones.map(a => a.Accion),
            pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Error getAuditLogs:', error);
        res.status(500).json({ success: false, message: 'Error al obtener logs', error: error.message });
    }
};

// ══════════════════════════════════════════
// INFO DEL SISTEMA
// ══════════════════════════════════════════
exports.getSystemInfo = async (req, res) => {
    try {
        const uptime  = process.uptime();
        const memory  = process.memoryUsage();
        const [dbVer] = await db.query('SELECT VERSION() AS version');

        res.json({
            success: true,
            data: {
                node:    process.version,
                env:     process.env.NODE_ENV || 'development',
                uptime:  Math.floor(uptime),
                uptimeH: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
                memory: {
                    heapUsed:  Math.round(memory.heapUsed  / 1024 / 1024) + ' MB',
                    heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + ' MB',
                    rss:       Math.round(memory.rss       / 1024 / 1024) + ' MB'
                },
                database: { version: dbVer[0].version, name: process.env.DB_NAME },
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener info del sistema', error: error.message });
    }
};
