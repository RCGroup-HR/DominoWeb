const pool = require('../config/database');

const rankingsController = {
  // Obtener ranking completo
  getNombreTorneo: async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          Nombre
        FROM Torneo
        Where Estatus = 'A'
      `);

      res.json({
        success: true,
        data: rows
      });
    } catch (error) {
      console.error('Error al obtener ranking:', error);
      res.status(510).json({
        success: false,
        message: 'Error al obtener el ranking',
        error: error.message
      });
    }
  },

  // Obtener ranking por torneo
  getRankingByTorneo: async (req, res) => {
    try {      
      const [rows] = await pool.query(`
      SELECT 
      * 
      FROM 
        RIndividual

      `);

      // Calcular totales
      const totales = rows.reduce((acc, row) => ({
        Partidas: acc.Partidas + (row.Partidas || 0),
        Victorias: acc.Victorias + (row.Victorias || 0),
        Derrotas: acc.Derrotas + (row.Derrotas || 0),
        PuntosOb: acc.PuntosOb + (row.PuntosOb || 0),
        PuntosPer: acc.PuntosPer + (row.PuntosPer || 0),
        Efectividad: acc.Efectividad + (row.Efectividad || 0),
        TotalPts: acc.TotalPts + (row.TotalPts || 0)
      }), {
        Partidas: 0,
        Victorias: 0,
        Derrotas: 0,
        PuntosOb: 0,
        PuntosPer: 0,
        Efectividad: 0,
        TotalPts: 0
      });

      // Agregar fila de totales al final
      const filaTotal = {
        ID: null,
        Jugador: 'TOTAL',
        NTorneo: '',
        NEquipo: '',
        Partidas: totales.Partidas,
        Total: totales.Total,
        Victorias: totales.Victorias,
        Derrotas: totales.Derrotas,
        PuntosOb: totales.PuntosOb,
        PuntosPer: totales.PuntosPer,
        Efectividad: totales.Efectividad,
        TotalPts: totales.TotalPts,
        Id_Union: null,
        Bandera: null,
        Pais: '',
        Id: null,
        isTotal: true
      };

      res.json({
        success: true,
        data: [...rows, filaTotal],
        totales: totales
      });
    } catch (error) {
      console.error('Error al obtener ranking:', error);
      res.status(510).json({
        success: false,
        message: 'Error al obtener el ranking del torneo',
        error: error.message
      });
    }
  },

};

module.exports = rankingsController;