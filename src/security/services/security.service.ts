import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';
import * as xss from 'xss';


@Injectable()
export class SecurityService {
    private readonly logger = new Logger(SecurityService.name);

    constructor(
        private configService: ConfigService,
        private encryptionService: EncryptionService,
    ) { }

    /**
     * Sanitiza valores de entrada para prevenir XSS
     * @param input Cadena de texto a sanitizar
     * @returns Cadena sanitizada segura para mostrar en HTML
     */
    sanitizeInput(input: string): string {
        if (!input) return input;

        // Usar librería xss para limitar caracteres peligrosos
        const xssFilter = new xss.FilterXSS({
            whiteList: {}, // No permitir ninguna etiqueta HTML
            stripIgnoreTag: true, // Eliminar todas las etiquetas
            stripIgnoreTagBody: ['script'], // Eliminar contenido de script
        });
        return xssFilter.process(input);
    }

    /**
     * Sanitiza valores de entrada para uso en SQL
     * @param input Cadena de texto a sanitizar
     * @returns Cadena sanitizada segura para usar en consultas SQL
     */
    sanitizeSqlInput(input: string): string {
        if (!input) return input;

        // Eliminar caracteres peligrosos para SQL
        return input
            .replace(/'/g, "''") // Escapar comillas simples
            .replace(/\\/g, '\\\\') // Escapar barras invertidas
            .replace(/\0/g, '\\0') // Escapar bytes nulos
            .replace(/\n/g, '\\n') // Escapar saltos de línea
            .replace(/\r/g, '\\r') // Escapar retornos de carro
            .replace(/\x1a/g, '\\Z'); // Escapar EOF
    }

    /**
     * Valida una contraseña según reglas de seguridad
     * @param password Contraseña a validar
     * @returns Objeto con resultado de validación y mensajes de error
     */
    validatePassword(password: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Obtener configuración de reglas de contraseña
        const minLength = this.configService.get<number>('PASSWORD_MIN_LENGTH', 8);
        const requireUppercase = this.configService.get<boolean>('PASSWORD_REQUIRE_UPPERCASE', true);
        const requireLowercase = this.configService.get<boolean>('PASSWORD_REQUIRE_LOWERCASE', true);
        const requireNumbers = this.configService.get<boolean>('PASSWORD_REQUIRE_NUMBERS', true);
        const requireSpecial = this.configService.get<boolean>('PASSWORD_REQUIRE_SPECIAL', true);

        // Validar longitud mínima
        if (password.length < minLength) {
            errors.push(`La contraseña debe tener al menos ${minLength} caracteres`);
        }

        // Validar mayúsculas
        if (requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('La contraseña debe contener al menos una letra mayúscula');
        }

        // Validar minúsculas
        if (requireLowercase && !/[a-z]/.test(password)) {
            errors.push('La contraseña debe contener al menos una letra minúscula');
        }

        // Validar números
        if (requireNumbers && !/\d/.test(password)) {
            errors.push('La contraseña debe contener al menos un número');
        }

        // Validar caracteres especiales
        if (requireSpecial && !/[^A-Za-z0-9]/.test(password)) {
            errors.push('La contraseña debe contener al menos un carácter especial');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Registra un intento de acceso fallido
     * @param username Nombre de usuario que intentó acceder
     * @param ip Dirección IP del cliente
     * @param reason Motivo del fallo
     */
    logFailedAccessAttempt(username: string, ip: string, reason: string): void {
        this.logger.warn(`Failed access attempt - User: ${username} - IP: ${ip} - Reason: ${reason}`);

        // Aquí se podría implementar lógica adicional como:
        // - Incrementar contador de intentos fallidos
        // - Bloquear temporalmente el acceso después de X intentos
        // - Enviar alertas de seguridad
    }

    /**
     * Registra un evento de seguridad importante
     * @param eventType Tipo de evento de seguridad
     * @param details Detalles del evento
     * @param userId ID del usuario relacionado (si aplica)
     */
    logSecurityEvent(eventType: string, details: any, userId?: string): void {
        this.logger.log(`Security Event - Type: ${eventType} - User: ${userId || 'anonymous'} - Details: ${JSON.stringify(details)}`);

        // Aquí se podría implementar lógica adicional como:
        // - Almacenar eventos en base de datos para auditoría
        // - Enviar notificaciones para eventos críticos
    }
}