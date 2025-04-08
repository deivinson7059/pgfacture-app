import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class PasswordCryptoService {
    private readonly algorithm = 'aes-256-cbc';
    private readonly key = Buffer.from(process.env.PASSWORD_ENCRYPTION_KEY || 'una-clave-segura-de-32-caracteres!', 'utf8'); // Debe ser de 32 bytes
    private readonly iv = Buffer.from(process.env.PASSWORD_IV || '1234567890123456', 'utf8'); // Debe ser de 16 bytes

    /**
     * Cifra una contraseña para almacenarla de forma segura
     * @param password La contraseña a cifrar
     * @returns Contraseña cifrada en formato base64
     */
    encrypt(password: string): string {
        const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
        let encrypted = cipher.update(password, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
    }

    /**
     * Descifra una contraseña previamente cifrada
     * @param encryptedPassword La contraseña cifrada en formato base64
     * @returns La contraseña original
     */
    decrypt(encryptedPassword: string): string {
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
        let decrypted = decipher.update(encryptedPassword, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}