import { IsString, IsNotEmpty, IsEmail, MinLength, IsOptional } from 'class-validator';

export class CreateUserLoginDto {

    @IsString({ message: 'El número de identificación debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El número de identificación es requerido' })
    identification_number: string;

    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El nombre es requerido' })
    name: string;

    @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido' })
    @IsNotEmpty({ message: 'El correo electrónico es requerido' })
    email: string;

    @IsString({ message: 'La contraseña debe ser una cadena de texto' })
    @IsOptional()
    @MinLength(4, { message: 'La contraseña debe tener al menos 4 caracteres' })
    password?: string;

    @IsOptional()
    @IsString({ message: 'Las notas deben ser una cadena de texto' })
    notes?: string;
}