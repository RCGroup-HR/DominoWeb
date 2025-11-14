const pool = require('../config/database');

const colectivoController = {
  // Obtener nombre del torneo
  getNombreTorneo: async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          Nombre
        FROM Torneo
        WHERE Estatus = 'A'
      `);

      res.json({
        success: true,
        data: rows
      });
    } catch (error) {
      console.error('Error al obtener nombre del torneo:', error);
      res.status(510).json({
        success: false,
        message: 'Error al obtener el nombre del torneo',
        error: error.message
      });
    }
  },

  // Obtener ranking colectivo por torneo
  getRankingByTorneo: async (req, res) => {
    try {      
      const [rows] = await pool.query(`
        SELECT 
          * 
        FROM 
          RColectivo
        ORDER BY Ranking ASC
      `);

      // ✅ Calcular totales
      const totales = rows.reduce((acc, row) => ({
        Partidas: acc.Partidas + (row.Partidas || 0),
        Victorias: acc.Victorias + (row.Victorias || 0),
        Derrotas: acc.Derrotas + (row.Derrotas || 0),
        PtsObtenidos: acc.PtsObtenidos + (row.PtsObtenidos || 0),
        PtsPermitidos: acc.PtsPermitidos + (row.PtsPermitidos || 0),
        Efectividad: acc.Efectividad + (row.Efectividad || 0),
        TotalPts: acc.TotalPts + (row.TotalPts || 0)
      }), {
        Partidas: 0,
        Victorias: 0,
        Derrotas: 0,
        PtsObtenidos: 0,
        PtsPermitidos: 0,
        Efectividad: 0,
        TotalPts: 0
      });

      // ✅ Agregar fila de totales (opcional)
      const filaTotal = {
        ID: null,
        Ranking: null,
        Equipo: 'TOTAL',
        Partidas: totales.Partidas,
        Victorias: totales.Victorias,
        Derrotas: totales.Derrotas,
        PtsObtenidos: totales.PtsObtenidos,
        PtsPermitidos: totales.PtsPermitidos,
        Efectividad: totales.Efectividad,
        TotalPts: totales.TotalPts,
        Siglas: null,
        Pais: null,
        isTotal: true
      };

      res.json({
        success: true,
        data: [...rows, filaTotal],
        totales: totales
      });
    } catch (error) {
      console.error('Error al obtener ranking colectivo:', error);
      res.status(510).json({
        success: false,
        message: 'Error al obtener el ranking colectivo del torneo',
        error: error.message
      });
    }
  }

};

module.exports = colectivoController;