import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsArray } from 'class-validator';

export class CreateCompanyRoleDto {
    @IsString({ message: 'El ID del rol debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El ID del rol es requerido' })
    id: string;

    @IsString({ message: 'El ID de la compañía debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El ID de la compañía es requerido' })
    company_id: string;

    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El nombre es requerido' })
    name: string;

    @IsOptional()
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    description?: string;

    @IsOptional()
    @IsInt({ message: 'El campo active debe ser un entero' })
    @Min(0, { message: 'El valor mínimo para active es 0' })
    @Max(1, { message: 'El valor máximo para active es 1' })
    active?: number = 1;

    @IsArray({ message: 'Los scopes deben ser un array de cadenas de texto' })
    @IsNotEmpty({ message: 'Se requiere al menos un scope' })
    scopes: string[];
}