import { IsArray, IsNotEmpty } from 'class-validator';

export class AssignRoleScopeDto {
    @IsArray({ message: 'Los scopes deben ser un array de cadenas de texto' })
    @IsNotEmpty({ message: 'Se requiere al menos un scope' })
    scopes: string[];
}