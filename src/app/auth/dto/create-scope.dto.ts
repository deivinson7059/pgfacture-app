import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateScopeDto {
    @IsString({ message: 'El ID del scope debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El ID del scope es requerido' })
    id: string;

    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'La descripción es requerida' })
    description: string;

    @IsOptional()
    @IsInt({ message: 'El campo active debe ser un entero' })
    @Min(0, { message: 'El valor mínimo para active es 0' })
    @Max(1, { message: 'El valor máximo para active es 1' })
    active?: number = 1;
}