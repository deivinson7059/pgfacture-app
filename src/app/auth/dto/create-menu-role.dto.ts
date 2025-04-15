import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateMenuRoleDto {
    @IsString()
    @IsNotEmpty({ message: 'La compañía es requerida' })
    cmpy: string;

    @IsString()
    @IsNotEmpty({ message: 'El ID del rol es requerido' })
    role_id: string;

    @IsNumber()
    @IsNotEmpty({ message: 'El ID del menú es requerido' })
    menu_id: number;

    @IsNumber()
    @IsNotEmpty({ message: 'El ID de la opción de menú es requerido' })
    menu_option_id: number;

    @IsString()
    @IsOptional()
    menu_option_title?: string;
}