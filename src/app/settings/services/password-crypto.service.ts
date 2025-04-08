import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordCryptoService {
    private readonly saltRounds = 10;

    /**
     * Hashea una contraseña usando bcrypt
     * @param password La contraseña a hashear
     * @returns Hash de la contraseña
     */
    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.saltRounds);
    }

    /**
     * Verifica si una contraseña coincide con un hash
     * @param password La contraseña a verificar
     * @param hash El hash almacenado
     * @returns true si la contraseña coincide con el hash
     */
    async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}