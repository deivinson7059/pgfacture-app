import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
    @IsString({ message: 'El número de identificación debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El número de identificación es requerido' })
    identification_number: string;

    @IsString({ message: 'La contraseña debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'La contraseña es requerida' })
    password: string;

    @IsString({ message: 'El ID de la compañía debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El ID de la compañía es requerido' })
    cmpy: string;

    @IsString({ message: 'El nombre de la sucursal debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El nombre de la sucursal es requerido' })
    ware: string;
}