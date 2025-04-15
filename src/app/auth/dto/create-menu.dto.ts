import { IsString, IsNotEmpty, IsNumber, IsOptional, IsIn } from 'class-validator';

export class CreateMenuDto {
    @IsString()
    @IsNotEmpty({ message: 'El título es requerido' })
    title: string;

    @IsString()
    @IsNotEmpty({ message: 'El ícono es requerido' })
    icon: string;

    @IsNumber()
    @IsOptional()
    order?: number;

    @IsString()
    @IsOptional()
    @IsIn(['Y', 'N'], { message: 'El campo enabled solo puede ser Y o N' })
    enabled?: string = 'Y';
}