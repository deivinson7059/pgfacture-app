import { IsString, MinLength, Matches } from 'class-validator';

export class UpdatePasswordDto {
    @IsString()
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        {
            message: 'La contraseña debe contener al menos una letra mayúscula, una minúscula, un número y un carácter especial',
        }
    )
    password: string;
}