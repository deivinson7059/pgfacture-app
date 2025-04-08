import { registerAs } from '@nestjs/config';

export default registerAs('security', () => ({
    // JWT (JSON Web Token) configuración
    jwt: {
        secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    },

    // Encriptación de contraseñas
    bcrypt: {
        saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS!, 10) || 10,
    },

    // Configuración CORS (Cross-Origin Resource Sharing)
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: process.env.CORS_CREDENTIALS === 'true',
    },

    // Límites de tasa (Rate Limiting)
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS!, 10) || 15 * 60 * 1000, // 15 minutos
        max: parseInt(process.env.RATE_LIMIT_MAX!, 10) || 100, // máximo 100 peticiones por ventana
    },

    // Configuración de Cookie
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    },

    // Configuración de Helmet (cabeceras HTTP)
    helmet: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:"],
            },
        },
        xssFilter: true,
        noSniff: true,
        referrerPolicy: { policy: 'no-referrer' },
    },

    // Throttling para protección de fuerza bruta
    throttle: {
        ttl: parseInt(process.env.THROTTLE_TTL!, 10) || 60, // TTL en segundos
        limit: parseInt(process.env.THROTTLE_LIMIT!, 10) || 10, // Número de peticiones
    },
}));