import { IsNotEmpty, IsOptional, IsString, Min, ValidateIf, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface, Validate, IsNumber } from 'class-validator';
import { Length } from 'class-validator';

@ValidatorConstraint({ name: 'debitOrCreditValidator', async: false })
export class DebitOrCreditValidator implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        const obj = args.object as MovimientoDto;
        const hasDebit = obj.debit !== undefined && obj.debit > 0;
        const hasCredit = obj.credit !== undefined && obj.credit > 0;

        return (hasDebit && !hasCredit) || (!hasDebit && hasCredit);
    }

    defaultMessage() {
        return 'Cada movimiento debe tener un solo valor de débito o crédito, no ambos ni ninguno.';
    }
}

export class MovimientoDto {
    @IsNotEmpty()
    @IsString()
    @Length(6, 10, { message: 'La cuenta debe tener 6, 8 o 10 dígitos.' })
    account: string;

    @IsNumber()
    @ValidateIf(o => !o.credit || o.credit === 0)
    @Min(0, { message: 'El débito debe ser mayor o igual a 0.' })
    debit: number;

    @IsNumber()
    @ValidateIf(o => !o.debit || o.debit === 0)
    @Min(0, { message: 'El crédito debe ser mayor o igual a 0.' })
    credit: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    taxable_base?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    exempt_base?: number;

    @Validate(DebitOrCreditValidator)
    debitOrCredit: any;
}