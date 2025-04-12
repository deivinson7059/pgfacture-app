import { Type } from "class-transformer";
import { IsString, IsOptional, IsNumber, IsIn } from "class-validator";

export class CreateSucursalDto {
    @IsString()
    cmpy: string;

    @IsString()
    name: string;

    @IsString()
    address: string;

    @IsString()
    email: string;

    @IsString()
    department: string;

    @IsString()
    city: string;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    city_id?: number;

    @IsString()
    phone: string;

    @IsString()
    mobile: string;

    @IsString()
    reason: string;

    @IsString()
    nit: string;

    @IsString()
    logo: string;

    @IsString()
    @IsOptional()
    @IsIn(['NO', 'SI'])
    different_reason?: string = 'NO';

    @IsString()
    @IsOptional()
    @IsIn(['NO', 'SI'])
    zero_invoice?: string = 'NO';

    @IsString()
    @IsOptional()
    @IsIn(['OFF', 'ON'])
    sw_code?: string = 'OFF';

    @IsString()
    @IsOptional()
    @IsIn(['OFF', 'ON'])
    sw?: string = 'OFF';

    @IsString()
    @IsOptional()
    @IsIn(['NO', 'SI'])
    include_vat?: string = 'NO';

    @IsString()
    @IsOptional()
    @IsIn(['NO', 'SI'])
    show_users?: string = 'SI';

    @IsString()
    @IsOptional()
    @IsIn(['NO', 'SI'])
    electronic_invoice?: string = 'NO';

    @IsString()
    @IsOptional()
    @IsIn(['NO', 'SI'])
    active?: string = 'SI';

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    reteica?: number = 0.00;

    @IsString()
    @IsOptional()
    terms?: string;

    @IsString()
    @IsOptional()
    list?: string = 'P1';
}