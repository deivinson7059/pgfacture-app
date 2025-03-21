// src/app/accounting/dto/create-note-line.dto.ts
import { IsNotEmpty, IsString, Min, IsNumber, IsOptional, Length, ValidateIf, Validate, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'debitOrCreditValidator', async: false })
export class DebitOrCreditValidator implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        const obj = args.object as NoteLineDto;
        const hasDebit = obj.debit !== undefined && obj.debit !== null;
        const hasCredit = obj.credit !== undefined && obj.credit !== null;

        return (hasDebit && !hasCredit) || (!hasDebit && hasCredit);
    }

    defaultMessage() {
        return 'Cada línea debe tener un solo valor de débito o crédito, no ambos ni ninguno.';
    }
}

export class NoteLineDto {
    @IsOptional()
    id?: string;

    @IsNotEmpty()
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
    @IsNumber()
    @Min(0)
    @ValidateIf(o => o.credit === undefined || o.credit === null)
    debit: number | null;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @ValidateIf(o => o.debit === undefined || o.debit === null)
    credit: number | null;

    @IsOptional()
    @IsNumber()
    @Min(0)
    taxable_base?: number | null;

    @IsOptional()
    @IsNumber()
    @Min(0)
    exempt_base?: number | null;

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