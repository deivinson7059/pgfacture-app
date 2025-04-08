import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard, ThrottlerModuleOptions } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ErrorInterceptor } from '../interceptors/error.interceptor';
import securityConfig from '../config/security.config';

// Servicios
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SecurityService } from './services/security.service';
import { EncryptionService } from './services/encryption.service';

@Global()
@Module({
    imports: [
        ConfigModule.forFeature(securityConfig),
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService): ThrottlerModuleOptions => ({
                throttlers: [
                    {
                        ttl: config.get<number>('security.throttle.ttl', 60),
                        limit: config.get<number>('security.throttle.limit', 10),
                    }
                ],
            }),
        }),
    ],
    providers: [
        // Servicios de seguridad
        SecurityService,
        EncryptionService,

        // Interceptor global para manejo de errores
        {
            provide: APP_INTERCEPTOR,
            useClass: ErrorInterceptor,
        },

        // Guardia para limitar la tasa de solicitudes
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },

        // Guardia para autenticación JWT (se puede habilitar por ruta)
        JwtAuthGuard,
    ],
    exports: [
        SecurityService,
        EncryptionService,
        JwtAuthGuard,
    ],
})
export class SecurityModule { }