import { IsString, IsNotEmpty, IsNumber, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class CreateMenuOptionDto {
    @IsNumber()
    @IsNotEmpty({ message: 'El ID del menú es requerido' })
    menu_id: number;

    @IsNumber()
    @IsOptional()
    parent_id?: number | null;

    @IsString()
    @IsNotEmpty({ message: 'El título es requerido' })
    title: string;

    @IsString()
    @IsNotEmpty({ message: 'La ruta es requerida' })
    path: string;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsString()
    @IsOptional()
    class?: string;

    @IsNumber()
    @IsOptional()
    level?: number = 1;

    @IsNumber()
    @IsOptional()
    order?: number = 1;

    @IsBoolean()
    @IsOptional()
    is_group_title?: boolean = false;

    @IsString()
    @IsOptional()
    @IsIn(['Y', 'N'], { message: 'El campo enabled solo puede ser Y o N' })
    enabled?: string = 'Y';
}