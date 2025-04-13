import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';

export class CreateScopeDto {
    @IsString({ message: 'El ID del scope debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El ID del scope es requerido' })
    id: string;

    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'La descripción es requerida' })
    description: string;

    @IsOptional()
    @IsIn(['Y', 'N'], { message: 'El campo active solo puede ser Y o N' })
    active?: string = 'Y';
}