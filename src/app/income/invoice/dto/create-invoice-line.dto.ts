import { IsString, IsNumber } from 'class-validator';

export class CreateInvoiceLineDto {
  @IsString()
  ware: string;

  @IsString()
  cust_id: string;

  @IsString()
  code: string;

  @IsString()
  description: string;

  @IsString()
  prod_type: string;

  @IsNumber()
  cost_uni: number;

  @IsNumber()
  list_amount: number;

  @IsNumber()
  disc_id: number;

  @IsNumber()
  disc_percent: number;

  @IsNumber()
  disc_amount: number;

  @IsNumber()
  tax_id: number;

  @IsNumber()
  tax_percent: number;

  @IsNumber()
  tax_amount: number;

  @IsNumber()
  amount: number;
}
