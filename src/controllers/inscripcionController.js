// ============================================================
// MÓDULO DE INSCRIPCIÓN DE EQUIPOS - ScoreDomino
// Público: inscribir, buscar equipos, buscar jugadores,
//          acceder/editar equipo con el código.
// Admin:   torneos, listar equipos, aprobar/rechazar, stats.
// ============================================================
const pool = require('../config/database');
const XLSX = require('xlsx');

// ── Helpers ─────────────────────────────────────────────────

// Caracteres sin ambigüedad (sin 0/O/1/I) para los códigos
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(len) {
    let s = '';
    for (let i = 0; i < len; i++) {
        s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return s;
}

/** Genera un CodigoEquipo único (EQ-XXXXXXXXX) */
async function generarCodigoEquipo(conn) {
    for (let intento = 0; intento < 10; intento++) {
        const codigo = 'EQ-' + randomCode(9);
        const [rows] = await conn.query('SELECT Id FROM insc_equipos WHERE CodigoEquipo = ?', [codigo]);
        if (rows.length === 0) return codigo;
    }
    throw new Error('No se pudo generar un código de equipo único');
}

/** Genera un CodigoJugador único (JG-XXXXXXXX) */
async function generarCodigoJugador(conn) {
    for (let intento = 0; intento < 10; intento++) {
        const codigo = 'JG-' + randomCode(8);
        const [rows] = await conn.query('SELECT Id FROM insc_jugadores WHERE CodigoJugador = ?', [codigo]);
        if (rows.length === 0) return codigo;
    }
    throw new Error('No se pudo generar un código de jugador único');
}

/** Normaliza un nombre para comparar (minúsculas, sin tildes, espacios colapsados) */
function normNombre(str) {
    return String(str || '')
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Valida género contra el ENUM; null si vacío/no válido */
function normGenero(g) {
    const v = normNombre(g);
    if (v.startsWith('masc') || v === 'm') return 'masculino';
    if (v.startsWith('fem') || v === 'f') return 'femenino';
    if (v === 'otro' || v === 'o') return 'otro';
    return null;
}

// Diccionarios de primer nombre para inferir género automáticamente
const NOMBRES_M = new Set('jose juan jesus luis carlos miguel angel manuel rafael pedro antonio francisco javier daniel david fernando jorge alberto alejandro andres sergio pablo ramon ruben ivan oscar raul victor adrian mario diego marcos hector hugo gabriel samuel emilio felipe gustavo enrique eduardo roberto ricardo armando wilson franklin starling yunior junior nelson cristian christian elvis wander wandy jhon john johan jeison cesar elias isaac isaias abel noe simon tomas nicolas matias santiago benjamin lucas martin agustin joaquin ignacio emanuel emmanuel kelvin yael axel dylan derek brandon bryan kevin steven jefferson maximo aquiles dario amaury freddy genaro evaristo gregorio domingo bienvenido radhames confesor leonel danilo hipolito'.split(' '));
const NOMBRES_F = new Set('maria ana carmen rosa laura sofia sara lucia paula martina valentina camila isabella isabel daniela gabriela mariana valeria victoria julia carla claudia patricia veronica monica raquel elena cristina beatriz silvia andrea natalia alejandra adriana carolina catalina diana fabiola yokasta yamilet yaritza yesenia yuderka dahiana massiel madeline noelia esther ruth noemi abigail irene ines mercedes nieves pilar dolores soledad consuelo guadalupe rocio luz cruz reyes milagros amparo soraya scarlet scarlett genesis ashley britney emely emily kimberly nicole melany melanie estefany estefania damaris altagracia francisca felicia juana ramona mirian miriam wendy yari katherine katerin clara'.split(' '));

/** Infiere el género a partir del nombre (primer nombre + terminación). null si no es claro. */
function inferGenero(nombre) {
    const first = normNombre(nombre).split(' ')[0];
    if (!first) return null;
    if (NOMBRES_F.has(first)) return 'femenino';
    if (NOMBRES_M.has(first)) return 'masculino';
    if (/a$/.test(first))      return 'femenino';
    if (/(o|os)$/.test(first)) return 'masculino';
    return null;
}

function emailValido(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim());
}

// ============================================================
// PÚBLICO
// ============================================================

// GET /api/inscripcion/torneos  → torneos con inscripciones abiertas
exports.listarTorneosAbiertos = async (req, res) => {
    try {
        const [torneos] = await pool.query(
            `SELECT Id, Nombre, Lugar, FechaInicio, FechaFin, JugadoresPorEquipo, BusquedaJugadores, Estado
             FROM insc_torneos
             WHERE Estado = 'abierto'
             ORDER BY FechaInicio IS NULL, FechaInicio ASC, Id DESC`
        );
        res.json({ success: true, data: torneos });
    } catch (error) {
        console.error('listarTorneosAbiertos:', error.message);
        res.status(500).json({ success: false, message: 'Error al listar torneos' });
    }
};

// GET /api/inscripcion/torneos/:id
exports.getTorneo = async (req, res) => {
    try {
        const [[torneo]] = await pool.query(
            `SELECT Id, Nombre, Lugar, FechaInicio, FechaFin, JugadoresPorEquipo,
                    FechaLimiteModificacion, BusquedaJugadores, Estado
             FROM insc_torneos WHERE Id = ?`,
            [req.params.id]
        );
        if (!torneo) return res.status(404).json({ success: false, message: 'Torneo no encontrado' });
        res.json({ success: true, data: torneo });
    } catch (error) {
        console.error('getTorneo:', error.message);
        res.status(500).json({ success: false, message: 'Error al obtener el torneo' });
    }
};

// GET /api/inscripcion/jugadores?q=  → autocompletado de jugadores existentes
exports.buscarJugadores = async (req, res) => {
    try {
        const q = normNombre(req.query.q);
        if (q.length < 2) return res.json({ success: true, data: [] });
        const [rows] = await pool.query(
            `SELECT Id, CodigoJugador, NombreCompleto, Genero
             FROM insc_jugadores
             WHERE NombreCompleto LIKE ?
             ORDER BY NombreCompleto ASC LIMIT 10`,
            ['%' + req.query.q.trim() + '%']
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('buscarJugadores:', error.message);
        res.status(500).json({ success: false, message: 'Error al buscar jugadores' });
    }
};

// GET /api/inscripcion/equipos?torneo=&q=&pais=  → búsqueda pública (sin datos sensibles)
exports.buscarEquiposPublico = async (req, res) => {
    try {
        const { torneo, q, pais } = req.query;
        const where = ["Estado <> 'rechazado'"];
        const params = [];
        if (torneo) { where.push('TorneoId = ?'); params.push(torneo); }
        if (pais)   { where.push('Pais = ?'); params.push(pais); }
        if (q) {
            where.push('(NombreEquipo LIKE ? OR Club LIKE ? OR Representante LIKE ?)');
            const like = '%' + q.trim() + '%';
            params.push(like, like, like);
        }
        const [equipos] = await pool.query(
            `SELECT Id, NombreEquipo, Club, Pais, Estado, FechaRegistro,
                    TorneoNombre, JugadoresPorEquipo, TotalJugadores
             FROM vista_insc_equipos_publica
             WHERE ${where.join(' AND ')}
             ORDER BY FechaRegistro DESC`,
            params
        );
        // Adjuntar nombres de jugadores (sin datos sensibles)
        for (const eq of equipos) {
            const [jugs] = await pool.query(
                `SELECT j.NombreCompleto
                 FROM insc_equipo_jugador ej
                 JOIN insc_jugadores j ON j.Id = ej.JugadorId
                 WHERE ej.EquipoId = ? ORDER BY ej.Posicion ASC`,
                [eq.Id]
            );
            eq.Jugadores = jugs.map(j => j.NombreCompleto);
        }
        res.json({ success: true, data: equipos });
    } catch (error) {
        console.error('buscarEquiposPublico:', error.message);
        res.status(500).json({ success: false, message: 'Error al buscar equipos' });
    }
};

// POST /api/inscripcion/equipos  → inscribir un equipo
// body: { torneoId, nombreEquipo, club, pais, representante, correoRepresentante, telefono, jugadores:[{nombre,genero,fechaNacimiento,telefono}] }
exports.inscribirEquipo = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const b = req.body || {};
        const torneoId = parseInt(b.torneoId);
        const nombreEquipo = (b.nombreEquipo || '').trim();
        const representante = (b.representante || '').trim();
        const correo = (b.correoRepresentante || '').trim();
        const jugadores = Array.isArray(b.jugadores) ? b.jugadores : [];

        // Validaciones
        if (!torneoId) return res.status(400).json({ success: false, message: 'Torneo requerido' });
        if (!nombreEquipo) return res.status(400).json({ success: false, message: 'El nombre del equipo es requerido' });
        if (!representante) return res.status(400).json({ success: false, message: 'El representante es requerido' });
        if (!emailValido(correo)) return res.status(400).json({ success: false, message: 'Correo del representante inválido' });

        const jugadoresValidos = jugadores.filter(j => (j.nombre || '').trim());
        if (jugadoresValidos.length === 0) {
            return res.status(400).json({ success: false, message: 'Agrega al menos un jugador' });
        }

        await conn.beginTransaction();

        // Torneo válido y abierto
        const [[torneo]] = await conn.query(
            'SELECT Id, JugadoresPorEquipo, BusquedaJugadores, Estado FROM insc_torneos WHERE Id = ?',
            [torneoId]
        );
        if (!torneo) { await conn.rollback(); return res.status(404).json({ success: false, message: 'Torneo no encontrado' }); }
        if (torneo.Estado !== 'abierto') {
            await conn.rollback();
            return res.status(400).json({ success: false, message: 'Las inscripciones de este torneo están cerradas' });
        }
        if (jugadoresValidos.length > torneo.JugadoresPorEquipo) {
            await conn.rollback();
            return res.status(400).json({ success: false, message: `Máximo ${torneo.JugadoresPorEquipo} jugadores por equipo` });
        }

        // Crear equipo
        const codigoEquipo = await generarCodigoEquipo(conn);
        const [eqRes] = await conn.query(
            `INSERT INTO insc_equipos
             (CodigoEquipo, TorneoId, NombreEquipo, Club, Pais, Representante, CorreoRepresentante, Telefono, Estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
            [codigoEquipo, torneoId, nombreEquipo, (b.club || '').trim() || null,
             (b.pais || '').trim() || null, representante, correo, (b.telefono || '').trim() || null]
        );
        const equipoId = eqRes.insertId;

        // Jugadores: reutilizar si la búsqueda está activa y hay coincidencia exacta de nombre
        let posicion = 1;
        for (const j of jugadoresValidos) {
            const nombre = j.nombre.trim();
            let jugadorId = null;

            if (torneo.BusquedaJugadores) {
                const [match] = await conn.query(
                    'SELECT Id FROM insc_jugadores WHERE LOWER(NombreCompleto) = LOWER(?) LIMIT 1',
                    [nombre]
                );
                if (match.length) jugadorId = match[0].Id;
            }

            if (!jugadorId) {
                const codigoJugador = await generarCodigoJugador(conn);
                const [jRes] = await conn.query(
                    `INSERT INTO insc_jugadores (CodigoJugador, NombreCompleto, Genero, FechaNacimiento, Telefono)
                     VALUES (?, ?, ?, ?, ?)`,
                    [codigoJugador, nombre, normGenero(j.genero) || inferGenero(nombre),
                     (j.fechaNacimiento || '').trim() || null, (j.telefono || '').trim() || null]
                );
                jugadorId = jRes.insertId;
            }

            await conn.query(
                'INSERT IGNORE INTO insc_equipo_jugador (EquipoId, JugadorId, Posicion) VALUES (?, ?, ?)',
                [equipoId, jugadorId, posicion++]
            );
        }

        await conn.commit();
        res.json({
            success: true,
            message: 'Equipo inscrito correctamente',
            data: { codigoEquipo, equipoId, estado: 'pendiente' }
        });
    } catch (error) {
        await conn.rollback();
        console.error('inscribirEquipo:', error.message);
        res.status(500).json({ success: false, message: 'Error al inscribir el equipo' });
    } finally {
        conn.release();
    }
};

// POST /api/inscripcion/equipos/acceso  → obtener equipo por código (para editar)
// body: { codigo }
exports.accederEquipo = async (req, res) => {
    try {
        const codigo = (req.body.codigo || '').trim().toUpperCase();
        if (!codigo) return res.status(400).json({ success: false, message: 'Código requerido' });

        const [[equipo]] = await pool.query(
            `SELECT e.Id, e.CodigoEquipo, e.TorneoId, e.NombreEquipo, e.Club, e.Pais,
                    e.Representante, e.CorreoRepresentante, e.Telefono, e.Estado,
                    t.Nombre AS TorneoNombre, t.JugadoresPorEquipo, t.Estado AS TorneoEstado,
                    t.FechaLimiteModificacion
             FROM insc_equipos e JOIN insc_torneos t ON e.TorneoId = t.Id
             WHERE e.CodigoEquipo = ?`,
            [codigo]
        );
        if (!equipo) return res.status(404).json({ success: false, message: 'Código no encontrado' });

        const [jugadores] = await pool.query(
            `SELECT j.Id, j.NombreCompleto, j.Genero, j.FechaNacimiento, j.Telefono, ej.Posicion
             FROM insc_equipo_jugador ej JOIN insc_jugadores j ON j.Id = ej.JugadorId
             WHERE ej.EquipoId = ? ORDER BY ej.Posicion ASC`,
            [equipo.Id]
        );
        equipo.Jugadores = jugadores;

        // ¿Edición permitida? (no rechazado y dentro de fecha límite)
        const limite = equipo.FechaLimiteModificacion ? new Date(equipo.FechaLimiteModificacion) : null;
        equipo.PuedeEditar = equipo.TorneoEstado === 'abierto'
            && (!limite || limite > new Date());

        res.json({ success: true, data: equipo });
    } catch (error) {
        console.error('accederEquipo:', error.message);
        res.status(500).json({ success: false, message: 'Error al acceder al equipo' });
    }
};

// PUT /api/inscripcion/equipos  → actualizar equipo (autorizado por código)
// body: { codigo, nombreEquipo, club, pais, representante, telefono, jugadores:[...] }
exports.actualizarEquipo = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const codigo = (req.body.codigo || '').trim().toUpperCase();
        if (!codigo) return res.status(400).json({ success: false, message: 'Código requerido' });

        await conn.beginTransaction();
        const [[equipo]] = await conn.query(
            `SELECT e.Id, e.TorneoId, t.JugadoresPorEquipo, t.BusquedaJugadores, t.Estado AS TorneoEstado,
                    t.FechaLimiteModificacion
             FROM insc_equipos e JOIN insc_torneos t ON e.TorneoId = t.Id
             WHERE e.CodigoEquipo = ?`,
            [codigo]
        );
        if (!equipo) { await conn.rollback(); return res.status(404).json({ success: false, message: 'Código no encontrado' }); }

        const limite = equipo.FechaLimiteModificacion ? new Date(equipo.FechaLimiteModificacion) : null;
        if (equipo.TorneoEstado !== 'abierto' || (limite && limite <= new Date())) {
            await conn.rollback();
            return res.status(403).json({ success: false, message: 'El plazo de modificación ha finalizado. Contacta a la organización.' });
        }

        const b = req.body;
        const jugadoresValidos = (Array.isArray(b.jugadores) ? b.jugadores : []).filter(j => (j.nombre || '').trim());
        if (!(b.nombreEquipo || '').trim()) { await conn.rollback(); return res.status(400).json({ success: false, message: 'Nombre de equipo requerido' }); }
        if (jugadoresValidos.length === 0) { await conn.rollback(); return res.status(400).json({ success: false, message: 'Agrega al menos un jugador' }); }
        if (jugadoresValidos.length > equipo.JugadoresPorEquipo) { await conn.rollback(); return res.status(400).json({ success: false, message: `Máximo ${equipo.JugadoresPorEquipo} jugadores` }); }

        // Actualizar datos del equipo (al editarse vuelve a 'pendiente' de revisión)
        await conn.query(
            `UPDATE insc_equipos
             SET NombreEquipo = ?, Club = ?, Pais = ?, Representante = ?, Telefono = ?, Estado = 'pendiente'
             WHERE Id = ?`,
            [b.nombreEquipo.trim(), (b.club || '').trim() || null, (b.pais || '').trim() || null,
             (b.representante || '').trim(), (b.telefono || '').trim() || null, equipo.Id]
        );

        // Rehacer la lista de jugadores
        await conn.query('DELETE FROM insc_equipo_jugador WHERE EquipoId = ?', [equipo.Id]);
        let posicion = 1;
        for (const j of jugadoresValidos) {
            const nombre = j.nombre.trim();
            let jugadorId = null;
            if (equipo.BusquedaJugadores) {
                const [match] = await conn.query('SELECT Id FROM insc_jugadores WHERE LOWER(NombreCompleto) = LOWER(?) LIMIT 1', [nombre]);
                if (match.length) jugadorId = match[0].Id;
            }
            if (!jugadorId) {
                const cj = await generarCodigoJugador(conn);
                const [jRes] = await conn.query(
                    'INSERT INTO insc_jugadores (CodigoJugador, NombreCompleto, Genero, FechaNacimiento, Telefono) VALUES (?, ?, ?, ?, ?)',
                    [cj, nombre, normGenero(j.genero) || inferGenero(nombre), (j.fechaNacimiento || '').trim() || null, (j.telefono || '').trim() || null]
                );
                jugadorId = jRes.insertId;
            }
            await conn.query('INSERT IGNORE INTO insc_equipo_jugador (EquipoId, JugadorId, Posicion) VALUES (?, ?, ?)', [equipo.Id, jugadorId, posicion++]);
        }

        await conn.commit();
        res.json({ success: true, message: 'Equipo actualizado correctamente' });
    } catch (error) {
        await conn.rollback();
        console.error('actualizarEquipo:', error.message);
        res.status(500).json({ success: false, message: 'Error al actualizar el equipo' });
    } finally {
        conn.release();
    }
};

// ============================================================
// ADMIN (JWT + rol administrador)
// ============================================================

// GET /api/admin/inscripcion/torneos
exports.adminListarTorneos = async (req, res) => {
    try {
        const [torneos] = await pool.query(
            `SELECT t.*, (SELECT COUNT(*) FROM insc_equipos e WHERE e.TorneoId = t.Id) AS TotalEquipos
             FROM insc_torneos t ORDER BY t.Id DESC`
        );
        res.json({ success: true, data: torneos });
    } catch (error) {
        console.error('adminListarTorneos:', error.message);
        res.status(500).json({ success: false, message: 'Error al listar torneos' });
    }
};

// POST /api/admin/inscripcion/torneos
exports.adminCrearTorneo = async (req, res) => {
    try {
        const b = req.body;
        if (!(b.nombre || '').trim()) return res.status(400).json({ success: false, message: 'Nombre requerido' });
        const [r] = await pool.query(
            `INSERT INTO insc_torneos
             (Nombre, Lugar, FechaInicio, FechaFin, JugadoresPorEquipo, FechaLimiteModificacion, BusquedaJugadores, Estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [b.nombre.trim(), (b.lugar || '').trim() || null, b.fechaInicio || null, b.fechaFin || null,
             parseInt(b.jugadoresPorEquipo) || 4, b.fechaLimiteModificacion || null,
             b.busquedaJugadores ? 1 : 0, b.estado || 'borrador']
        );
        res.json({ success: true, message: 'Torneo creado', data: { id: r.insertId } });
    } catch (error) {
        console.error('adminCrearTorneo:', error.message);
        res.status(500).json({ success: false, message: 'Error al crear el torneo' });
    }
};

// PUT /api/admin/inscripcion/torneos/:id
exports.adminActualizarTorneo = async (req, res) => {
    try {
        const b = req.body;
        await pool.query(
            `UPDATE insc_torneos
             SET Nombre = ?, Lugar = ?, FechaInicio = ?, FechaFin = ?, JugadoresPorEquipo = ?,
                 FechaLimiteModificacion = ?, BusquedaJugadores = ?, Estado = ?
             WHERE Id = ?`,
            [b.nombre, (b.lugar || '').trim() || null, b.fechaInicio || null, b.fechaFin || null,
             parseInt(b.jugadoresPorEquipo) || 4,
             b.fechaLimiteModificacion || null, b.busquedaJugadores ? 1 : 0, b.estado, req.params.id]
        );
        res.json({ success: true, message: 'Torneo actualizado' });
    } catch (error) {
        console.error('adminActualizarTorneo:', error.message);
        res.status(500).json({ success: false, message: 'Error al actualizar el torneo' });
    }
};

// GET /api/admin/inscripcion/equipos?torneo=&estado=&q=
exports.adminListarEquipos = async (req, res) => {
    try {
        const { torneo, estado, q } = req.query;
        const where = [];
        const params = [];
        if (torneo) { where.push('TorneoId = ?'); params.push(torneo); }
        if (estado) { where.push('Estado = ?'); params.push(estado); }
        if (q) { where.push('(NombreEquipo LIKE ? OR CodigoEquipo LIKE ? OR Representante LIKE ?)'); const l = '%' + q.trim() + '%'; params.push(l, l, l); }
        const sql = `SELECT * FROM vista_insc_equipos_admin ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY FechaRegistro DESC`;
        const [equipos] = await pool.query(sql, params);
        res.json({ success: true, data: equipos });
    } catch (error) {
        console.error('adminListarEquipos:', error.message);
        res.status(500).json({ success: false, message: 'Error al listar equipos' });
    }
};

// GET /api/admin/inscripcion/equipos/:id  → detalle con jugadores
exports.adminGetEquipo = async (req, res) => {
    try {
        const [[equipo]] = await pool.query('SELECT * FROM vista_insc_equipos_admin WHERE Id = ?', [req.params.id]);
        if (!equipo) return res.status(404).json({ success: false, message: 'Equipo no encontrado' });
        const [jugadores] = await pool.query(
            `SELECT j.Id, j.CodigoJugador, j.NombreCompleto, j.Genero, j.FechaNacimiento, j.Telefono, ej.Posicion
             FROM insc_equipo_jugador ej JOIN insc_jugadores j ON j.Id = ej.JugadorId
             WHERE ej.EquipoId = ? ORDER BY ej.Posicion ASC`,
            [equipo.Id]
        );
        equipo.Jugadores = jugadores;
        res.json({ success: true, data: equipo });
    } catch (error) {
        console.error('adminGetEquipo:', error.message);
        res.status(500).json({ success: false, message: 'Error al obtener el equipo' });
    }
};

// PATCH /api/admin/inscripcion/equipos/:id/estado  body: { estado, comentarios }
exports.adminCambiarEstado = async (req, res) => {
    try {
        const { estado, comentarios } = req.body;
        if (!['pendiente', 'aprobado', 'rechazado'].includes(estado)) {
            return res.status(400).json({ success: false, message: 'Estado inválido' });
        }
        const adminId = req.usuario ? req.usuario.Id : null;
        await pool.query(
            'UPDATE insc_equipos SET Estado = ?, Comentarios = ?, AdministradorAprobadorId = ? WHERE Id = ?',
            [estado, (comentarios || '').trim() || null, adminId, req.params.id]
        );
        res.json({ success: true, message: `Equipo ${estado}` });
    } catch (error) {
        console.error('adminCambiarEstado:', error.message);
        res.status(500).json({ success: false, message: 'Error al cambiar el estado' });
    }
};

// GET /api/admin/inscripcion/stats?torneo=
exports.adminStats = async (req, res) => {
    try {
        const torneo = req.query.torneo;
        const params = torneo ? [torneo] : [];
        const filtro = torneo ? 'WHERE TorneoId = ?' : '';
        const [[stats]] = await pool.query(
            `SELECT
                COUNT(*) AS total,
                SUM(Estado = 'pendiente') AS pendientes,
                SUM(Estado = 'aprobado') AS aprobados,
                SUM(Estado = 'rechazado') AS rechazados,
                COUNT(DISTINCT Pais) AS paises
             FROM insc_equipos ${filtro}`,
            params
        );
        const [[{ jugadores }]] = await pool.query(
            `SELECT COUNT(*) AS jugadores FROM insc_equipo_jugador ej
             JOIN insc_equipos e ON e.Id = ej.EquipoId ${torneo ? 'WHERE e.TorneoId = ?' : ''}`,
            params
        );
        res.json({ success: true, data: { ...stats, jugadores } });
    } catch (error) {
        console.error('adminStats:', error.message);
        res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
    }
};

// Consulta de jugadores ordenados por equipo (reutilizada por grid y export)
async function consultarJugadoresPorEquipo(torneo) {
    const params = torneo ? [torneo] : [];
    const filtro = torneo ? 'WHERE e.TorneoId = ?' : '';
    const [rows] = await pool.query(
        `SELECT e.NombreEquipo, e.CodigoEquipo, e.Pais, e.Estado AS EstadoEquipo,
                ej.Posicion, j.NombreCompleto, j.Genero, j.CodigoJugador
         FROM insc_equipo_jugador ej
         JOIN insc_equipos e   ON e.Id = ej.EquipoId
         JOIN insc_jugadores j ON j.Id = ej.JugadorId
         ${filtro}
         ORDER BY e.NombreEquipo ASC, ej.Posicion ASC`,
        params
    );
    return rows;
}

// GET /api/admin/inscripcion/jugadores?torneo=
exports.adminListarJugadores = async (req, res) => {
    try {
        const data = await consultarJugadoresPorEquipo(req.query.torneo);
        res.json({ success: true, data });
    } catch (error) {
        console.error('adminListarJugadores:', error.message);
        res.status(500).json({ success: false, message: 'Error al listar jugadores' });
    }
};

// GET /api/admin/inscripcion/jugadores/export?torneo=  → descarga Excel
exports.adminExportJugadores = async (req, res) => {
    try {
        const rows = await consultarJugadoresPorEquipo(req.query.torneo);
        const data = rows.map(r => ({
            'Equipo':         r.NombreEquipo,
            'Código equipo':  r.CodigoEquipo,
            'País':           r.Pais || '',
            'Pos.':           r.Posicion,
            'Jugador':        r.NombreCompleto,
            'Género':         r.Genero || '',
            'Código jugador': r.CodigoJugador,
            'Estado equipo':  r.EstadoEquipo
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        ws['!cols'] = [{ wch: 26 }, { wch: 14 }, { wch: 16 }, { wch: 6 }, { wch: 28 }, { wch: 12 }, { wch: 14 }, { wch: 14 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Jugadores');
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename="jugadores_por_equipo.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buf);
    } catch (error) {
        console.error('adminExportJugadores:', error.message);
        res.status(500).json({ success: false, message: 'Error al exportar jugadores' });
    }
};

// DELETE /api/admin/inscripcion/equipos/:id  → eliminar equipo (y jugadores huérfanos)
exports.adminEliminarEquipo = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [[eq]] = await conn.query('SELECT Id, NombreEquipo FROM insc_equipos WHERE Id = ?', [req.params.id]);
        if (!eq) { await conn.rollback(); return res.status(404).json({ success: false, message: 'Equipo no encontrado' }); }
        // Borra el equipo (cascade quita sus relaciones) y limpia jugadores que queden sin equipo
        await conn.query('DELETE FROM insc_equipos WHERE Id = ?', [req.params.id]);
        await conn.query(
            `DELETE j FROM insc_jugadores j
             LEFT JOIN insc_equipo_jugador ej ON ej.JugadorId = j.Id
             WHERE ej.Id IS NULL`
        );
        await conn.commit();
        res.json({ success: true, message: `Equipo "${eq.NombreEquipo}" eliminado` });
    } catch (error) {
        await conn.rollback();
        console.error('adminEliminarEquipo:', error.message);
        res.status(500).json({ success: false, message: 'Error al eliminar el equipo' });
    } finally {
        conn.release();
    }
};

// POST /api/admin/inscripcion/reorganizar  → renumera Ids de equipos y jugadores de forma secuencial
// (los códigos EQ-/JG- NO cambian; solo se compactan los Id numéricos)
exports.adminReorganizarIds = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        await conn.beginTransaction();

        // Equipos: asigna Id negativo temporal y actualiza la relación, luego invierte el signo
        const [eqs] = await conn.query('SELECT Id FROM insc_equipos ORDER BY Id');
        let i = 1;
        for (const row of eqs) {
            const nuevo = i++;
            await conn.query('UPDATE insc_equipos SET Id = ? WHERE Id = ?', [-nuevo, row.Id]);
            await conn.query('UPDATE insc_equipo_jugador SET EquipoId = ? WHERE EquipoId = ?', [-nuevo, row.Id]);
        }
        await conn.query('UPDATE insc_equipos SET Id = -Id WHERE Id < 0');
        await conn.query('UPDATE insc_equipo_jugador SET EquipoId = -EquipoId WHERE EquipoId < 0');

        // Jugadores: mismo procedimiento
        const [jugs] = await conn.query('SELECT Id FROM insc_jugadores ORDER BY Id');
        let k = 1;
        for (const row of jugs) {
            const nuevo = k++;
            await conn.query('UPDATE insc_jugadores SET Id = ? WHERE Id = ?', [-nuevo, row.Id]);
            await conn.query('UPDATE insc_equipo_jugador SET JugadorId = ? WHERE JugadorId = ?', [-nuevo, row.Id]);
        }
        await conn.query('UPDATE insc_jugadores SET Id = -Id WHERE Id < 0');
        await conn.query('UPDATE insc_equipo_jugador SET JugadorId = -JugadorId WHERE JugadorId < 0');

        await conn.commit();
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        // Reinicia los contadores AUTO_INCREMENT (DDL, fuera de la transacción)
        await conn.query(`ALTER TABLE insc_equipos   AUTO_INCREMENT = ${eqs.length + 1}`);
        await conn.query(`ALTER TABLE insc_jugadores AUTO_INCREMENT = ${jugs.length + 1}`);

        res.json({ success: true, message: `IDs reorganizados: ${eqs.length} equipos y ${jugs.length} jugadores` });
    } catch (error) {
        await conn.rollback().catch(() => {});
        await conn.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
        console.error('adminReorganizarIds:', error.message);
        res.status(500).json({ success: false, message: 'Error al reorganizar los IDs' });
    } finally {
        conn.release();
    }
};
