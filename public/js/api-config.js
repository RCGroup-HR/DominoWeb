// ============================================
// CONFIGURACIÓN DE API PARA EL FRONTEND
// Archivo: public/js/api-config.js
// ============================================

// Configuración simple de la API (para login y carnets)
const API_CONFIG = {
    BASE_URL: '/api'
};

// Clase DominoAPI para compatibilidad con el resto de páginas
class DominoAPI {
    constructor() {
        this.baseURL = '/api';
        this.apiKey = 'SDK_a9f8e7d6c5b4a3z2y1x0w9v8u7t6s5r4q3p2o1';
        this.initialized = true;
    }

    async init() {
        // Ya está inicializado con valores por defecto
        console.log('✅ API configurada correctamente');
    }

    _checkInitialized() {
        if (!this.initialized || !this.apiKey || !this.baseURL) {
            throw new Error('API no inicializada. Espera a que se complete la inicialización.');
        }
    }

    async get(endpoint) {
        this._checkInitialized();

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Error en petición GET:', error);
            throw error;
        }
    }

    async post(endpoint, data) {
        this._checkInitialized();

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Error en petición POST:', error);
            throw error;
        }
    }
}

const API = new DominoAPI();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => API.init());
} else {
    API.init();
}