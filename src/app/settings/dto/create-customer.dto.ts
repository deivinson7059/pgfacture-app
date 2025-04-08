import { IsString, IsOptional, IsNumber, IsEmail, IsIn } from 'class-validator';

export class CreateCustomerDto {
    @IsString()
    cmpy: string;

    @IsString()
    @IsIn(['Y', 'N'])
    @IsOptional()
    active: string = 'Y';

    @IsString()
    identification_number: string;

    @IsString()
    @IsOptional()
    dv: string;

    @IsNumber()
    type_document_identification_id: number;

    @IsString()
    type_document_identification: string;

    @IsNumber()
    type_organization_id: number;

    @IsString()
    type_organization: string;

    @IsNumber()
    type_regime_id: number;

    @IsString()
    type_regime: string;

    @IsNumber()
    type_liability_id: number;

    @IsString()
    type_liability: string;

    @IsString()
    @IsOptional()
    name: string;

    @IsString()
    @IsOptional()
    given_names: string;

    @IsString()
    @IsOptional()
    family_names: string;

    @IsString()
    @IsOptional()
    contact_name: string;

    @IsString()
    @IsOptional()
    additional_info: string;

    @IsEmail()
    @IsOptional()
    email: string;

    @IsString()
    @IsOptional()
    address: string;

    @IsNumber()
    municipality_id: number;

    @IsString()
    municipality: string;

    @IsNumber()
    dep_id: number;

    @IsString()
    @IsOptional()
    dep: string;

    @IsNumber()
    country_id: number;

    @IsString()
    country: string;

    @IsString()
    @IsOptional()
    phone: string;

    @IsString()
    @IsOptional()
    mobile: string;

    @IsString()
    @IsOptional()
    password: string;

    @IsString()
    @IsOptional()
    new_password: string;

    @IsString()
    @IsOptional()
    auth: string;
}