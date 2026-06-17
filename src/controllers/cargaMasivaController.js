// ============================================================
// CARGA MASIVA - ScoreDomino
// POST /api/admin/carga/equipos  → inserta equipos + jugadores en torneo activo
// POST /api/admin/carga/carnets  → inserta / actualiza en carnetjugadores
// ============================================================
const pool = require('../config/database');
const XLSX = require('xlsx');

const FEMUNDO_ID = 2;
const DEFAULT_FECHA_NACIMIENTO = '1990-01-01';

// ── Helpers ─────────────────────────────────────────────────

/**
 * Normaliza texto: minúsculas, sin tildes, sin espacios/guiones/puntos/barras
 * Ej: "Atleta No." → "atletano"  |  "Equipo Número/Nombre" → "equiponumeronombre"
 */
function norm(str) {
    return String(str)
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[\s_.\/\-#]/g, '');
}

/**
 * Separa nombre completo en { nombre, apellidos }
 * Heurística para nombres latinos:
 *   1 palabra  → nombre=palabra,  apellidos=''
 *   2 palabras → nombre=p1,       apellidos=p2
 *   3 palabras → nombre=p1,       apellidos="p2 p3"
 *   4+ palabras→ nombre="p1 p2",  apellidos=resto
 */
function splitNombre(fullName) {
    const partes = (fullName || '').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return { nombre: '', apellidos: '' };
    if (partes.length === 1) return { nombre: partes[0], apellidos: '' };
    if (partes.length === 2) return { nombre: partes[0], apellidos: partes[1] };
    if (partes.length === 3) return { nombre: partes[0], apellidos: partes.slice(1).join(' ') };
    return { nombre: partes.slice(0, 2).join(' '), apellidos: partes.slice(2).join(' ') };
}

/** Normaliza género a 'M' o 'F' */
function normGenero(g) {
    const v = (g || '').toUpperCase().trim();
    if (v.startsWith('F')) return 'F';
    return 'M';
}

/** Extrae un valor de una fila de Excel buscando por lista de alias normalizados */
function getCol(row, aliases) {
    for (const [key, val] of Object.entries(row)) {
        if (aliases.includes(norm(key))) return String(val).trim();
    }
    return null;
}

/** Busca el Id de federación para un país, con fallback a FEMUNDO */
async function getFederacionId(conn, idPais) {
    const [rows] = await conn.query(
        "SELECT Id FROM federacion WHERE Id_Pais = ? AND Estatus = 'A' ORDER BY Id ASC LIMIT 1",
        [idPais]
    );
    return rows.length ? rows[0].Id : FEMUNDO_ID;
}

/** Fecha de hoy como string YYYY-MM-DD */
function hoy() {
    return new Date().toISOString().split('T')[0];
}

// ── Alias de columnas ────────────────────────────────────────
// Soporta el formato exacto del Excel de la foto + variantes comunes
const COLS_EQUIPO = {
    // "Atleta No." → "atletano" | "ID" | "Carnet" | "No"
    id_jugador:    ['atletano', 'atletanumero', 'idjugador', 'jugadorid', 'id', 'carnet', 'no', 'numero', 'nro'],
    // "Equipo Número/Nombre" → "equiponumeronombre" | "Equipo" | "Team"
    nombre_equipo: ['equiponumeronombre', 'equiponumero', 'equiponombre', 'nombreequipo', 'nombredelequipo', 'equipo', 'team'],
    // "País" → "pais" | "Siglas" | "Country"
    pais:          ['pais', 'siglas', 'siglasdelpais', 'country', 'codigopais'],
};

const COLS_CARNET = {
    carnet:  ['carnet', 'atletano', 'numerodecarnet', 'numerocarnet', 'numcarnet', 'id', 'numero', 'nro'],
    nombre:  ['nombreyapellido', 'nombre', 'nombreatleta', 'nombredelatleta', 'atleta', 'nombrecompletod', 'nombreapellido'],
    genero:  ['sexo', 'genero', 'gender'],
    siglas:  ['pais', 'siglas', 'siglasdelpais', 'country', 'codigopais'],
};

// ============================================================
// CARGA MASIVA DE EQUIPOS
// Formato foto: Atleta No. | Nombre y Apellido | País | Sexo | Individual si/x | Equipo Número/Nombre
// ============================================================
exports.bulkEquipos = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Archivo Excel requerido' });
        }

        // Parsear Excel
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!rawRows.length) {
            return res.status(400).json({ success: false, message: 'El archivo está vacío' });
        }

        await connection.beginTransaction();

        // Obtener torneo activo
        const [[torneo]] = await connection.query(
            "SELECT Id, Nombre FROM torneo WHERE Estatus = 'A' LIMIT 1"
        );
        if (!torneo) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'No hay torneo activo en el sistema' });
        }
        const torneoId = torneo.Id;

        // ID base para nuevos equipos (se genera en memoria para toda la carga)
        const [[{ maxId }]] = await connection.query(
            'SELECT COALESCE(MAX(ID), 0) AS maxId FROM equipo'
        );
        let nextEquipoId = maxId + 1;

        // Acumuladores agrupados por equipo para la respuesta
        // equiposMap: nombreEquipo → { id, pais, estado, jugadores: [] }
        const equiposMap = {};
        const errores    = [];

        for (let i = 0; i < rawRows.length; i++) {
            const row    = rawRows[i];
            const rowNum = i + 2; // fila real en Excel (1 = encabezado)

            const idJugadorStr = getCol(row, COLS_EQUIPO.id_jugador);
            const nombreEquipo = getCol(row, COLS_EQUIPO.nombre_equipo);
            const paisSiglas   = getCol(row, COLS_EQUIPO.pais);

            // Fila vacía o sin los campos clave → skip silencioso
            if (!idJugadorStr && !nombreEquipo && !paisSiglas) continue;

            // Validar datos básicos
            if (!idJugadorStr || !nombreEquipo || !paisSiglas) {
                errores.push({ fila: rowNum, error: 'Faltan columnas requeridas (ID Jugador, Equipo, País)' });
                continue;
            }

            const idJugador = parseInt(idJugadorStr);
            if (isNaN(idJugador) || idJugador <= 0) {
                errores.push({ fila: rowNum, error: `ID de jugador inválido: "${idJugadorStr}"` });
                continue;
            }

            try {
                // 1. Buscar datos del jugador en carnetjugadores
                const [jugRows] = await connection.query(
                    'SELECT Nombre, Apellidos, Genero FROM carnetjugadores WHERE Carnet = ? LIMIT 1',
                    [idJugador]
                );
                if (!jugRows.length) {
                    errores.push({ fila: rowNum, carnet: idJugador, error: `Carnet ${idJugador} no existe en carnetjugadores` });
                    continue;
                }
                const jug = jugRows[0];
                const nombreCompleto = [jug.Nombre, jug.Apellidos].filter(Boolean).join(' ');

                // 2. Buscar Id del país por siglas
                const [paisRows] = await connection.query(
                    'SELECT Id FROM paises WHERE UPPER(Siglas) = UPPER(?) LIMIT 1',
                    [paisSiglas]
                );
                if (!paisRows.length) {
                    errores.push({ fila: rowNum, carnet: idJugador, error: `País con siglas "${paisSiglas}" no encontrado` });
                    continue;
                }
                const idPais = paisRows[0].Id;

                // 3. Buscar o crear equipo para este torneo (una sola vez por nombre)
                const cacheKey = nombreEquipo.toLowerCase();
                if (!equiposMap[cacheKey]) {
                    const [eqRows] = await connection.query(
                        'SELECT ID FROM equipo WHERE Nombre = ? AND ID_Torneo = ? LIMIT 1',
                        [nombreEquipo, torneoId]
                    );
                    let equipoId;
                    let estadoEquipo;

                    if (eqRows.length) {
                        equipoId    = eqRows[0].ID;
                        estadoEquipo = 'existente';
                    } else {
                        equipoId    = nextEquipoId++;
                        estadoEquipo = 'creado';
                        const idUnion = await getFederacionId(connection, idPais);
                        await connection.query(
                            `INSERT INTO equipo
                             (ID, Nombre, Ciudad, Telefono, Correo, Comentarios,
                              FechaRegistro, Estatus, Usuario, ID_Torneo, Id_Union, Grupo, Id_Pais, Imagen)
                             VALUES (?, ?, '', '', '', '', ?, 'A', 'carga_masiva', ?, ?, '', ?, '')`,
                            [equipoId, nombreEquipo, hoy(), torneoId, idUnion, idPais]
                        );
                    }

                    equiposMap[cacheKey] = {
                        id:         equipoId,
                        nombre:     nombreEquipo,
                        pais:       paisSiglas.toUpperCase(),
                        estado:     estadoEquipo,
                        jugadores:  [],
                    };
                }

                const equipoId = equiposMap[cacheKey].id;

                // 4. Insertar jugador en torneo (IGNORE duplicados)
                const [ins] = await connection.query(
                    `INSERT IGNORE INTO jugador
                     (ID, Identificacion, Nombre, Apellidos, ID_Equipo, Direccion, Celular,
                      Comentarios, FechaRegistro, Estatus, Genero, Usuario, ID_Torneo, Id_Pais)
                     VALUES (?, '', ?, ?, ?, '', '', '', NOW(), 'A', ?, 'carga_masiva', ?, ?)`,
                    [
                        idJugador,
                        jug.Nombre,
                        jug.Apellidos,
                        equipoId,
                        normGenero(jug.Genero),
                        torneoId,
                        idPais,
                    ]
                );

                equiposMap[cacheKey].jugadores.push({
                    carnet:  idJugador,
                    nombre:  nombreCompleto,
                    estado:  ins.affectedRows > 0 ? 'registrado' : 'ya existia',
                });

            } catch (err) {
                errores.push({ fila: rowNum, carnet: idJugador, error: err.message });
            }
        }

        await connection.commit();

        // Construir respuesta agrupada por equipo
        const equipos         = Object.values(equiposMap);
        const totalEquiposNuevos = equipos.filter(e => e.estado === 'creado').length;
        const totalRegistrados   = equipos.flatMap(e => e.jugadores).filter(j => j.estado === 'registrado').length;
        const totalYaExistian    = equipos.flatMap(e => e.jugadores).filter(j => j.estado === 'ya existia').length;

        res.json({
            success: true,
            torneo:  { id: torneoId, nombre: torneo.Nombre },
            resumen: {
                filas_procesadas:  rawRows.length,
                equipos_creados:   totalEquiposNuevos,
                equipos_existentes: equipos.length - totalEquiposNuevos,
                jugadores_registrados: totalRegistrados,
                jugadores_ya_existian: totalYaExistian,
                errores:           errores.length,
            },
            equipos,   // detalle agrupado por equipo con sus jugadores
            errores,
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error en carga masiva de equipos:', error);
        res.status(500).json({ success: false, message: 'Error en carga masiva de equipos', error: error.message });
    } finally {
        connection.release();
    }
};

// ============================================================
// CARGA MASIVA DE CARNETS
// Formato foto: Atleta No. | Nombre y Apellido | País | Sexo | ...
// ============================================================
exports.bulkCarnets = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Archivo Excel requerido' });
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheet    = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows  = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!rawRows.length) {
            return res.status(400).json({ success: false, message: 'El archivo está vacío' });
        }

        await connection.beginTransaction();

        const insertados   = [];
        const actualizados = [];
        const errores      = [];

        for (let i = 0; i < rawRows.length; i++) {
            const row    = rawRows[i];
            const rowNum = i + 2;

            const carnetStr      = getCol(row, COLS_CARNET.carnet);
            const nombreCompleto = getCol(row, COLS_CARNET.nombre);
            const generoRaw      = getCol(row, COLS_CARNET.genero);
            const siglasPais     = getCol(row, COLS_CARNET.siglas);

            // Fila vacía → skip
            if (!carnetStr && !nombreCompleto && !siglasPais) continue;

            // Validar datos básicos
            if (!carnetStr || !nombreCompleto || !siglasPais) {
                errores.push({ fila: rowNum, error: 'Faltan columnas requeridas (Carnet, Nombre, País)' });
                continue;
            }

            const carnetNum = parseInt(carnetStr);
            if (isNaN(carnetNum) || carnetNum <= 0) {
                errores.push({ fila: rowNum, error: `Número de carnet inválido: "${carnetStr}"` });
                continue;
            }

            const genero = normGenero(generoRaw);
            const { nombre, apellidos } = splitNombre(nombreCompleto);

            try {
                // 1. Buscar país por siglas
                const [paisRows] = await connection.query(
                    'SELECT Id FROM paises WHERE UPPER(Siglas) = UPPER(?) LIMIT 1',
                    [siglasPais]
                );
                if (!paisRows.length) {
                    errores.push({ fila: rowNum, carnet: carnetNum, error: `País con siglas "${siglasPais}" no encontrado` });
                    continue;
                }
                const idPais = paisRows[0].Id;

                // 2. Federación del país; fallback FEMUNDO (el país del atleta se conserva)
                const idFederacion = await getFederacionId(connection, idPais);

                // 3. ¿El carnet ya existe?
                const [existentes] = await connection.query(
                    'SELECT Id FROM carnetjugadores WHERE Carnet = ? LIMIT 1',
                    [carnetNum]
                );

                if (existentes.length) {
                    // Solo actualizar nombre y apellidos
                    await connection.query(
                        'UPDATE carnetjugadores SET Nombre = ?, Apellidos = ? WHERE Carnet = ?',
                        [nombre, apellidos, carnetNum]
                    );
                    actualizados.push({
                        fila:      rowNum,
                        carnet:    carnetNum,
                        nombre:    nombre,
                        apellidos: apellidos,
                        pais:      siglasPais.toUpperCase(),
                    });
                } else {
                    // Insertar nuevo con defaults
                    await connection.query(
                        `INSERT INTO carnetjugadores
                         (Carnet, Identificacion, Nombre, Apellidos, Club, ID_Provincia,
                          Celular, Estatus, Comentarios, FechaRegistro, Id_Equipo,
                          Genero, Usuario, FechaNacimiento, Id_Federacion)
                         VALUES (?, '', ?, ?, 0, 0, '', 1, '', ?, 0, ?, 'carga_masiva', ?, ?)`,
                        [carnetNum, nombre, apellidos, hoy(), genero, DEFAULT_FECHA_NACIMIENTO, idFederacion]
                    );
                    insertados.push({
                        fila:        rowNum,
                        carnet:      carnetNum,
                        nombre:      nombre,
                        apellidos:   apellidos,
                        pais:        siglasPais.toUpperCase(),
                        federacion:  idFederacion,
                        genero,
                    });
                }

            } catch (err) {
                errores.push({ fila: rowNum, carnet: carnetNum, error: err.message });
            }
        }

        await connection.commit();

        res.json({
            success: true,
            resumen: {
                filas_procesadas: rawRows.length,
                insertados:       insertados.length,
                actualizados:     actualizados.length,
                errores:          errores.length,
            },
            insertados,
            actualizados,
            errores,
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error en carga masiva de carnets:', error);
        res.status(500).json({ success: false, message: 'Error en carga masiva de carnets', error: error.message });
    } finally {
        connection.release();
    }
};
