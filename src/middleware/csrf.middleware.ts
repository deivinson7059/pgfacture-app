import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as csrf from 'csurf';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
    private csrfProtection;

    constructor(private configService: ConfigService) {
        // Configurar CSRF con opciones seguras
        this.csrfProtection = csrf({
            cookie: {
                key: '_csrf',
                path: '/',
                httpOnly: true,
                secure: this.configService.get('NODE_ENV') === 'production',
                sameSite: 'strict',
                maxAge: 3600, // 1 hora en segundos
            },
        });
    }

    use(req: Request, res: Response, next: NextFunction) {
        // Skip CSRF protection for specified paths (like login or public APIs)
        const skipPaths = ['/api/v1/auth/login', '/api/v1/public'];
        if (skipPaths.some(path => req.path.startsWith(path))) {
            return next();
        }

        // Apply CSRF protection for all other routes
        this.csrfProtection(req, res, (err) => {
            if (err) {
                // Manejar error CSRF
                return res.status(403).json({
                    message: 'CSRF token inválido o faltante',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Forbidden'
                });
            }
            next();
        });
    }
}