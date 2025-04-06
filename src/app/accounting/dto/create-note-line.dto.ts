import {
    IsNotEmpty, IsString, Min, IsNumber, IsOptional, Length, ValidateIf,
    Validate, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments,
    registerDecorator, ValidationOptions
} from 'class-validator';
import { Type } from 'class-transformer';

// Validador para cada línea (débito o crédito, no ambos ni ninguno)
@ValidatorConstraint({ name: 'debitOrCreditValidator', async: false })
export class DebitOrCreditValidator implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        const obj = args.object as NoteLineDto;

        // Verificamos que tenga exactamente uno de los dos valores
        const hasDebit = obj.debit !== undefined && obj.debit !== null && obj.debit > 0;
        const hasCredit = obj.credit !== undefined && obj.credit !== null && obj.credit > 0;

        // XOR - debe tener uno y solo uno de los dos valores
        return (hasDebit && !hasCredit) || (!hasDebit && hasCredit);
    }

    defaultMessage() {
        return 'Cada línea debe tener un solo valor de débito o crédito, no ambos ni ninguno.';
    }
}

// Validador para la igualdad entre débitos y créditos
@ValidatorConstraint({ name: 'balanceValidator', async: false })
export class BalanceValidator implements ValidatorConstraintInterface {
    validate(value: NoteLineDto[], args: ValidationArguments) {
        if (!value || !Array.isArray(value) || value.length === 0) {
            return true; // Si no hay líneas, se considera válido
        }

        const sumDebits = value.reduce((sum, line) =>
            sum + (line.debit || 0), 0);

        const sumCredits = value.reduce((sum, line) =>
            sum + (line.credit || 0), 0);

        // Comparamos con una pequeña tolerancia para evitar problemas de redondeo
        return Math.abs(sumDebits - sumCredits) < 0.01;
    }

    defaultMessage() {
        return 'La suma de los débitos debe ser igual a la suma de los créditos.';
    }
}

// Decorador personalizado para validar el balance
export function IsBalanced(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isBalanced',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: BalanceValidator,
        });
    };
}

// DTO para cada línea
export class NoteLineDto {
    @IsOptional()
    id?: string;

    @IsNotEmpty({ message: 'La cuenta es obligatoria' })
    @IsString()
    @Length(6, 10)
    account: string;

    @IsOptional()
    @IsString()
    account_name?: string;

    @IsOptional()
    @IsString()
    @Length(0, 500)
    description?: string;

    @IsOptional()
    @IsNumber({}, { message: 'El débito debe ser un número' })
    @Min(0, { message: 'El débito no puede ser negativo' })
    debit?: number;

    @IsOptional()
    @IsNumber({}, { message: 'El crédito debe ser un número' })
    @Min(0, { message: 'El crédito no puede ser negativo' })
    credit?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    taxable_base?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    exempt_base?: number;

    @IsOptional()
    @IsString()
    @Length(0, 60)
    customer?: string;

    @IsOptional()
    @IsString()
    @Length(0, 200)
    customer_name?: string;

    @Validate(DebitOrCreditValidator)
    validateDebitOrCredit: any;
}

// DTO para la nota completa que contiene las líneas
export class AccountingNoteDto {
    @IsNotEmpty({ message: 'Debe proporcionar al menos una línea' })
    @Type(() => NoteLineDto)
    @IsBalanced({
        message: 'La suma de los débitos debe ser igual a la suma de los créditos'
    })
    lines: NoteLineDto[];

    // Otros campos de la nota contable
    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    reference?: string;

    @IsOptional()
    @IsString()
    date?: string;

    @IsOptional()
    @IsString()
    customer?: string;
}