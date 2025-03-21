import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsDate, IsString, Length, IsInt, Min, Max, IsOptional, ValidateNested, ArrayMinSize, ValidatorConstraint, ValidatorConstraintInterface, Validate, IsEnum } from "class-validator";
import { MovimientoDto } from "./movimiento.dto";
import { SEAT_MODULE } from "src/app/common/enums";

@ValidatorConstraint({ name: 'partidaDobleValidator', async: false })
export class PartidaDobleValidator implements ValidatorConstraintInterface {
    validate(movimientos: MovimientoDto[]) {
        if (!movimientos || !Array.isArray(movimientos)) return false;

        const totalDebito = movimientos.reduce((sum, m) => sum + (m.debit || 0), 0);
        const totalCredito = movimientos.reduce((sum, m) => sum + (m.credit || 0), 0);

        return Math.abs(totalDebito - totalCredito) < 0.001; // Pequeño epsilon para comparación de punto flotante
    }

    defaultMessage() {
        return 'La suma total de débitos y créditos debe ser igual.';
    }
}

export class CrearSeatDto {
    @IsNotEmpty()
    @IsString()
    @Length(1, 10)
    cmpy: string;

    @IsNotEmpty()
    @IsString()
    @Length(1, 190)
    ware: string;

    @IsNotEmpty()
    @IsInt()
    year: number;

    @IsNotEmpty()
    @IsInt()
    @Min(1, { message: 'El período debe estar entre 1 y 13.' })
    @Max(13, { message: 'El período debe estar entre 1 y 13.' })
    per: number;

    @IsString()
    @Length(1, 60)
    customers: string;

    @IsOptional()
    @IsString()
    @Length(1, 60)
    customers_name?: string;

    @IsNotEmpty()
    @IsString()
    creation_by: string;

    @IsOptional()
    @IsString()
    @Length(1, 300)
    description?: string;

    @IsOptional()
    @IsString()
    @Length(1, 90)
    code?: string;

    // Nuevos campos para módulo y referencia
    @IsOptional()
    @IsEnum(SEAT_MODULE, { message: 'El módulo debe ser uno de los valores permitidos en el sistema.' })
    module?: SEAT_MODULE;

    // Nuevos campos adicionales
    @IsNotEmpty()
    @IsString()
    @Length(1, 20)
    document_type: string;

    @IsOptional()
    @IsString()
    @Length(1, 30)
    document_number?: string;

    @IsOptional()
    @IsString()
    @Length(1, 20)
    cost_center?: string | null;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    elaboration_date?: Date;

    @IsOptional()
    @IsString()
    @Length(0, 190)
    ref?: string;

    @ValidateNested({ each: true })
    @Type(() => MovimientoDto)
    @ArrayMinSize(1)
    @Validate(PartidaDobleValidator)
    movimientos: MovimientoDto[];
}