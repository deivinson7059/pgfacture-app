import { IsString, IsOptional } from 'class-validator';

export class UpdateRoleDto {
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    @IsOptional()
    description?: string;

    @IsString({ message: 'El path debe ser una cadena de texto' })
    @IsOptional()
    path?: string;
}