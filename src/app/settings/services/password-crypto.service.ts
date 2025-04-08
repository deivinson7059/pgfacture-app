import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class PasswordCryptoService {
    private readonly saltRounds = 10;
    private readonly logger = new Logger(PasswordCryptoService.name);
    private readonly pepper = process.env.PASSWORD_PEPPER;

    /**
     * Hashea una contraseña usando bcrypt con pepper adicional
     * @param password La contraseña a hashear
     * @returns Hash de la contraseña
     */
    async hashPassword(password: string): Promise<string> {
        try {
            // Agregar "pepper" a la contraseña antes de hashear para mayor seguridad
            const pepperedPassword = this.applyPepper(password);

            // Hashear la contraseña con bcrypt
            return await bcrypt.hash(pepperedPassword, this.saltRounds);
        } catch (error) {
            this.logger.error('Error al hashear contraseña', error.stack);
            throw new Error('Error al procesar la contraseña');
        }
    }

    /**
     * Verifica si una contraseña coincide con un hash
     * @param password La contraseña a verificar
     * @param hash El hash almacenado
     * @returns true si la contraseña coincide con el hash
     */
    async comparePassword(password: string, hash: string): Promise<boolean> {
        try {
            // Agregar "pepper" a la contraseña antes de comparar
            const pepperedPassword = this.applyPepper(password);

            // Comparar con bcrypt
            return await bcrypt.compare(pepperedPassword, hash);
        } catch (error) {
            this.logger.error('Error al comparar contraseña', error.stack);
            return false;
        }
    }

    /**
     * Genera un token seguro para restablecer contraseñas
     * @returns Un token aleatorio y su hash para almacenar
     */
    generateResetToken(): { token: string, hash: string, expiresAt: Date } {
        // Generar token aleatorio de 32 bytes
        const token = crypto.randomBytes(32).toString('hex');

        // Generar hash del token para almacenar
        const hash = crypto.createHash('sha256').update(token).digest('hex');

        // Token válido por 1 hora
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        return { token, hash, expiresAt };
    }

    /**
     * Verifica si un token de restablecimiento es válido
     * @param token Token proporcionado por el usuario
     * @param storedHash Hash almacenado en la base de datos
     * @returns true si el token es válido
     */
    verifyResetToken(token: string, storedHash: string): boolean {
        const hash = crypto.createHash('sha256').update(token).digest('hex');
        return hash === storedHash;
    }

    /**
     * Aplica un "pepper" a la contraseña para mayor seguridad
     * El pepper es un valor secreto de servidor que se añade a todas las contraseñas
     */
    private applyPepper(password: string): string {
        return password + this.pepper;
    }
}