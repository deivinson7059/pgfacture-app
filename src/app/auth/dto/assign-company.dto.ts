import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsIn } from 'class-validator';

export class AssignCompanyDto {
    @IsString({ message: 'El número de identificación debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El número de identificación es requerido' })
    identification_number: string;

    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El nombre es requerido' })
    person_name: string;

    @IsOptional()
    @IsString({ message: 'El apodo debe ser una cadena de texto' })
    nick?: string;

    @IsString({ message: 'El ID de la compañía debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El ID de la compañía es requerido' })
    cmpy: string;

    @IsString({ message: 'El nombre de la sucursal debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El nombre de la sucursal es requerido' })
    ware: string;

    @IsString({ message: 'El rol debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El rol es requerido' })
    role: string;

    @IsString({ message: 'La lista debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'La lista es requerida' })
    list: string;

    @IsNumber({}, { message: 'La comisión 1 debe ser un número' })
    @Min(0, { message: 'La comisión 1 debe ser mayor o igual a 0' })
    @IsOptional()
    commission_1?: number;

    @IsNumber({}, { message: 'La comisión 2 debe ser un número' })
    @Min(0, { message: 'La comisión 2 debe ser mayor o igual a 0' })
    @IsOptional()
    commission_2?: number;

    @IsNumber({}, { message: 'La comisión 3 debe ser un número' })
    @Min(0, { message: 'La comisión 3 debe ser mayor o igual a 0' })
    @IsOptional()
    commission_3?: number;

    @IsString({ message: 'El permiso de devolución debe ser Y o N' })
    @IsIn(['Y', 'N'], { message: 'El permiso de devolución debe ser Y o N' })
    @IsOptional()
    can_return?: string = 'Y';
}