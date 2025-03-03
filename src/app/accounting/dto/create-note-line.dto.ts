// src/app/accounting/dto/accounting-note-line.dto.ts
import { IsNotEmpty, IsString, Min, IsNumber, IsOptional, Length, ValidateIf, Validate, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'debitOrCreditValidator', async: false })
export class DebitOrCreditValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const obj = args.object as NoteLineDto;
    const hasDebit = obj.debit !== undefined && obj.debit > 0;
    const hasCredit = obj.credit !== undefined && obj.credit > 0;
    
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

  @IsNumber()
  @Min(0)
  @ValidateIf(o => !o.credit || o.credit === 0)
  debit: number;

  @IsNumber()
  @Min(0)
  @ValidateIf(o => !o.debit || o.debit === 0)
  credit: number;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  reference?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  tercero?: string;

  @Validate(DebitOrCreditValidator)
  validateDebitOrCredit: any;
}