// ============================================
// CONFIGURACIÓN DE API PARA EL FRONTEND
// Archivo: public/js/api-config.js
// ============================================

class DominoAPI {
    constructor() {
        this.baseURL = null;
        this.apiKey = null;
        this.initialized = false;
    }
    
    async init() {
        try {
            const response = await fetch('/api-config');
            const data = await response.json();
            
            if (data.success && data.apiKey && data.apiBaseUrl) {
                this.apiKey = data.apiKey;
                this.baseURL = data.apiBaseUrl;
                this.initialized = true;
                console.log('✅ API configurada correctamente');
                console.log('🔒 Configuración cargada desde el servidor (segura)');
            } else {
                console.error('❌ Error al obtener configuración de API');
            }
        } catch (error) {
            console.error('❌ Error al inicializar API:', error);
        }
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