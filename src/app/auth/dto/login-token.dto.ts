import { IsString, IsNotEmpty } from 'class-validator';

export class LoginTokenDto {
    @IsString({ message: 'El token debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El token es requerido' })
    token: string;
}