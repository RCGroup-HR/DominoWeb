const db = require('../config/db');
const path = require('path');

// Obtener toda la configuración del sistema
exports.obtenerConfiguracion = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT clave, valor FROM carnet_configuracion'
        );

        // Convertir array a objeto key-value
        const config = {};
        rows.forEach(row => {
            config[row.clave] = row.valor;
        });

        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error al obtener configuración:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener configuración'
        });
    }
};

// Actualizar una configuración específica (Solo administradores)
exports.actualizarConfiguracion = async (req, res) => {
    try {
        const { clave, valor } = req.body;

        if (!clave) {
            return res.status(400).json({
                success: false,
                message: 'La clave es requerida'
            });
        }

        await db.query(
            'UPDATE carnet_configuracion SET valor = ?, modificado_por = ? WHERE clave = ?',
            [valor, req.usuario.id, clave]
        );

        res.json({
            success: true,
            message: 'Configuración actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar configuración:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar configuración'
        });
    }
};

// Subir logo de la entidad (Solo administradores)
exports.subirLogo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionó ningún archivo'
            });
        }

        // Construir la URL del logo
        const logoUrl = `/uploads/logos/${req.file.filename}`;

        // Actualizar la configuración
        await db.query(
            'UPDATE carnet_configuracion SET valor = ?, modificado_por = ? WHERE clave = ?',
            [logoUrl, req.usuario.id, 'logo_entidad_url']
        );

        res.json({
            success: true,
            message: 'Logo subido exitosamente',
            data: {
                logoUrl: logoUrl
            }
        });
    } catch (error) {
        console.error('Error al subir logo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al subir logo'
        });
    }
};

// Actualizar múltiples configuraciones a la vez
exports.actualizarMultiplesConfiguraciones = async (req, res) => {
    try {
        const configuraciones = req.body.configuraciones;

        if (!Array.isArray(configuraciones)) {
            return res.status(400).json({
                success: false,
                message: 'Se esperaba un array de configuraciones'
            });
        }

        // Ejecutar todas las actualizaciones
        const promises = configuraciones.map(({ clave, valor }) => {
            return db.query(
                'UPDATE carnet_configuracion SET valor = ?, modificado_por = ? WHERE clave = ?',
                [valor, req.usuario.id, clave]
            );
        });

        await Promise.all(promises);

        res.json({
            success: true,
            message: 'Configuraciones actualizadas exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar configuraciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar configuraciones'
        });
    }
};
