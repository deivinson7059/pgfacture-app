import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';

export class CreateRoleDto {
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El nombre es requerido' })
    name: string;

    @IsOptional()
    @IsIn(['Y', 'N'], { message: 'El campo enabled solo puede ser Y o N' })
    enabled?: string = 'Y';

    @IsString({ message: 'El path debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El path es requerido' })
    path: string = 'user';
}