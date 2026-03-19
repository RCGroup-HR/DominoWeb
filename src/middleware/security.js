// ============================================
// MIDDLEWARE DE SEGURIDAD - ScoreDomino
// Headers HTTP + Rate Limiting en memoria
// ============================================

// ── Almacén en memoria para rate limiting ──
const requestStore = new Map();   // { ip -> [timestamps] }
const loginStore   = new Map();   // { ip -> { count, blockedUntil } }

// Limpiar entradas expiradas cada 5 minutos
setInterval(() => {
    const now = Date.now();
    for (const [key, times] of requestStore.entries()) {
        const fresh = times.filter(t => t > now - 60000);
        if (fresh.length === 0) requestStore.delete(key);
        else requestStore.set(key, fresh);
    }
    for (const [key, data] of loginStore.entries()) {
        if (data.blockedUntil && now > data.blockedUntil) {
            loginStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

// ── 1. Headers de Seguridad ─────────────────
const setSecurityHeaders = (req, res, next) => {
    // Evita que el navegador haga MIME-type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Impide embeber la página en un iframe (clickjacking)
    res.setHeader('X-Frame-Options', 'DENY');
    // Activa el filtro XSS del navegador
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Controla información de referencia
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Deshabilita APIs sensibles del navegador
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    // Content Security Policy
    res.setHeader('Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com data:; " +
        "img-src 'self' data: blob: https:; " +
        "frame-src https://www.youtube.com https://youtube.com; " +
        "connect-src 'self' https://www.googleapis.com https://www.google-analytics.com;"
    );
    // Ocultar información del servidor
    res.removeHeader('X-Powered-By');
    next();
};

// ── 2. Rate Limiter General ─────────────────
/**
 * Limita peticiones por IP en una ventana de tiempo
 * @param {number} maxRequests - Máximo de requests permitidos
 * @param {number} windowMs    - Ventana en milisegundos (default: 1 minuto)
 */
const rateLimiter = (maxRequests = 60, windowMs = 60 * 1000) => {
    return (req, res, next) => {
        const ip  = req.ip || req.connection.remoteAddress || 'unknown';
        const now = Date.now();
        const windowStart = now - windowMs;

        // Obtener/inicializar historial de esta IP
        const times = (requestStore.get(ip) || []).filter(t => t > windowStart);
        requestStore.set(ip, times);

        if (times.length >= maxRequests) {
            const resetAt = new Date(Math.min(...times) + windowMs);
            res.setHeader('X-RateLimit-Limit',     maxRequests);
            res.setHeader('X-RateLimit-Remaining', 0);
            res.setHeader('X-RateLimit-Reset',     resetAt.toISOString());
            return res.status(429).json({
                success: false,
                message:  'Demasiadas solicitudes. Espera un momento antes de intentar de nuevo.',
                retryAfter: Math.ceil((Math.min(...times) + windowMs - now) / 1000)
            });
        }

        times.push(now);
        requestStore.set(ip, times);
        res.setHeader('X-RateLimit-Limit',     maxRequests);
        res.setHeader('X-RateLimit-Remaining', maxRequests - times.length);
        next();
    };
};

// ── 3. Rate Limiter específico para Login ───
/**
 * Bloquea la IP tras demasiados intentos fallidos
 * @param {number} maxAttempts  - Intentos antes de bloquear
 * @param {number} blockMinutes - Minutos de bloqueo
 */
const loginRateLimiter = (maxAttempts = 5, blockMinutes = 30) => {
    return (req, res, next) => {
        const ip  = req.ip || req.connection.remoteAddress || 'unknown';
        const now = Date.now();
        const data = loginStore.get(ip);

        if (data?.blockedUntil && now < data.blockedUntil) {
            const minutesLeft = Math.ceil((data.blockedUntil - now) / 60000);
            return res.status(429).json({
                success:      false,
                message:      `IP bloqueada por exceso de intentos. Reintenta en ${minutesLeft} minuto(s).`,
                blockedUntil: new Date(data.blockedUntil).toISOString(),
                minutesLeft
            });
        }

        // Adjuntar helpers al request para que el controlador los llame
        req._loginStore      = loginStore;
        req._loginIp         = ip;
        req._maxAttempts     = maxAttempts;
        req._blockMs         = blockMinutes * 60 * 1000;
        next();
    };
};

// ── 4. Helpers exportados ──────────────────
/**
 * Llamar desde el controlador de auth cuando el login FALLA
 */
const registerFailedLogin = (req) => {
    if (!req._loginStore) return;
    const ip   = req._loginIp;
    const data = req._loginStore.get(ip) || { count: 0, blockedUntil: null };
    data.count += 1;
    if (data.count >= req._maxAttempts) {
        data.blockedUntil = Date.now() + req._blockMs;
        data.count        = 0; // reset para el próximo ciclo
        console.warn(`🔒 IP bloqueada: ${ip} - demasiados intentos de login`);
    }
    req._loginStore.set(ip, data);
};

/**
 * Llamar desde el controlador de auth cuando el login tiene ÉXITO
 */
const resetLoginAttempts = (req) => {
    if (!req._loginStore) return;
    req._loginStore.delete(req._loginIp);
};

module.exports = {
    setSecurityHeaders,
    rateLimiter,
    loginRateLimiter,
    registerFailedLogin,
    resetLoginAttempts
};
