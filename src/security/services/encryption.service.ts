import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EncryptionService {
    private readonly algorithm: string = 'aes-256-gcm'; // GCM es más seguro que CBC
    private readonly key: Buffer;
    private readonly ivLength: number = 16;
    private readonly saltRounds: number;

    constructor(private configService: ConfigService) {
        // Obtener clave secreta desde configuración
        const secretKey = this.configService.get<string>('ENCRYPTION_KEY');

        // Si no hay clave, generamos una y avisamos que debe configurarse
        if (!secretKey) {
            console.warn('WARNING: ENCRYPTION_KEY not set. Using a generated key. This is NOT secure for production.');
            this.key = crypto.randomBytes(32);
        } else {
            // Usamos PBKDF2 para derivar una clave fuerte de 32 bytes desde la clave secreta
            const salt = this.configService.get<string>('ENCRYPTION_SALT', 'default-salt-change-me');
            this.key = crypto.pbkdf2Sync(secretKey, salt, 10000, 32, 'sha512');
        }

        // Obtener configuración de bcrypt
        this.saltRounds = this.configService.get<number>('security.bcrypt.saltRounds', 10);
    }

    /**
     * Cifra un texto con AES-256-GCM
     * @param plaintext Texto a cifrar
     * @returns Texto cifrado en formato [iv]:[auth tag]:[cifrado] (en base64)
     */
    encrypt(plaintext: string): string {
        // Generar IV aleatorio
        const iv = crypto.randomBytes(this.ivLength);

        // Crear cipher con IV
        const cipher: any = crypto.createCipheriv(this.algorithm, this.key, iv);

        // Cifrar el texto
        let encrypted = cipher.update(plaintext, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        // Obtener etiqueta de autenticación
        const authTag = cipher.getAuthTag().toString('base64');

        // Combinar IV, etiqueta de autenticación y texto cifrado
        return `${iv.toString('base64')}:${authTag}:${encrypted}`;
    }

    /**
     * Descifra un texto cifrado con AES-256-GCM
     * @param ciphertext Texto cifrado en formato [iv]:[auth tag]:[cifrado] (en base64)
     * @returns Texto descifrado
     */
    decrypt(ciphertext: string): string {
        try {
            // Separar IV, etiqueta de autenticación y texto cifrado
            const [ivBase64, authTagBase64, encryptedBase64] = ciphertext.split(':');

            if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
                throw new Error('Invalid ciphertext format');
            }

            // Convertir de base64 a buffers
            const iv = Buffer.from(ivBase64, 'base64');
            const authTag = Buffer.from(authTagBase64, 'base64');

            // Crear decipher
            const decipher: any = crypto.createDecipheriv(this.algorithm, this.key, iv);

            // Establecer etiqueta de autenticación
            decipher.setAuthTag(authTag);

            // Descifrar
            let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            // Si hay algún error (datos manipulados, clave incorrecta, etc.)
            throw new Error('Decryption failed: Data may be corrupted or tampered');
        }
    }

    /**
     * Hashea una contraseña usando bcrypt
     * @param password Contraseña a hashear
     * @returns Hash de la contraseña
     */
    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.saltRounds);
    }

    /**
     * Verifica si una contraseña coincide con un hash
     * @param password Contraseña a verificar
     * @param hash Hash almacenado
     * @returns true si la contraseña coincide con el hash
     */
    async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    /**
     * Genera un hash seguro de un solo sentido (para valores que no necesitan recuperarse)
     * @param data Datos a hashear
     * @returns Hash SHA-256 en formato hexadecimal
     */
    hash(data: string): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Genera un token seguro aleatorio
     * @param length Longitud del token en bytes (por defecto 32 bytes = 256 bits)
     * @returns Token en formato base64url (seguro para URLs)
     */
    generateSecureToken(length: number = 32): string {
        return crypto.randomBytes(length).toString('base64url');
    }
}