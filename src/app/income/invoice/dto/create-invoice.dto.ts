import { Type } from "class-transformer";
import { IsString, IsNumber, IsOptional, IsDateString, IsArray, ValidateNested, IsBoolean } from "class-validator";
import { CreateInvoiceLineDto } from "./create-invoice-line.dto";

export class CreateInvoiceDto {
    @IsString()
    cmpy: string;
   
    @IsString()
    suc_name: string;

    @IsString()
    @IsOptional()
    type?: string;  
    
    @IsNumber()
    type_document_id: number;

    @IsString()
    prefix: string;

    @IsString()
    resolution_number: string;

    @IsDateString()
    @IsOptional()
    date?: string;

    @IsString()
    cust_identification_number: string;

    @IsString()
    @IsOptional()
    cust_name?: string;

    @IsString()
    @IsOptional()
    ih_cmpy_name?: string;

    @IsString()
    @IsOptional()
    ih_cmpy_address?: string;

    @IsString()
    @IsOptional()
    ih_cmpy_phone?: string;

    @IsString()
    @IsOptional()
    ih_cmpy_municipality?: number;

    @IsString()
    @IsOptional()
    ih_cmpy_email?: string;

    @IsString()
    @IsOptional()
    ih_suc_address?: string;

    @IsString()
    @IsOptional()
    ih_suc_email?: string;

    @IsString()
    @IsOptional()
    ih_suc_phone?: string;

    @IsString()
    @IsOptional()
    ih_suc_municipality?: number;

    @IsString()
    @IsOptional()
    ih_is_el?: string;

    @IsString()
    @IsOptional()
    ih_resolution_number?: string;

    @IsString()
    @IsOptional()
    ih_seze?: string;

    @IsNumber()
    @IsOptional()
    ih_type_document_id?: number;

    @IsNumber()
    @IsOptional()
    ih_term?: number;

    @IsString()
    @IsOptional()
    ih_date_end?: string;

    @IsNumber()
    @IsOptional()
    ih_year?: number;

    @IsString()
    @IsOptional()
    ih_month?: string;

    @IsString()
    @IsOptional()
    ih_time?: string;

    @IsNumber()
    @IsOptional()
    ih_cust_id?: number;

    @IsNumber()
    @IsOptional()
    ih_lines?: number;

    @IsNumber()
    @IsOptional()
    ih_line_extension_amount?: number;

    @IsString()
    @IsOptional()
    ih_tax_exclusive_amount?: number;

    @IsNumber()
    @IsOptional()
    ih_tax_inclusive_amount?: number;

    @IsNumber()
    @IsOptional()
    ih_tax_amount?: number;

    @IsString()
    @IsOptional()
    ih_dis_amount?: number;

    @IsNumber()
    @IsOptional()
    ih_total_amount?: number;

    @IsNumber()
    @IsOptional()
    ih_payable_amount?: number;

    @IsNumber()
    @IsOptional()
    ih_cust_paid_total?: number;

    @IsNumber()
    @IsOptional()
    ih_paid_pos?: number;

    @IsNumber()
    @IsOptional()
    ih_paid_turns?: number;

    @IsString()
    @IsOptional()
    ih_paid_ref?: string;

    @IsString()
    @IsOptional()
    ih_paid_cta?: string;

    @IsBoolean()
    @IsOptional()
    ih_disable_confirmation_text?: boolean;

    @IsString()
    @IsOptional()
    ih_update_ucid?: string;

    @IsString()
    @IsOptional()
    ih_update_date?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateInvoiceLineDto)
    lines: CreateInvoiceLineDto[];
}