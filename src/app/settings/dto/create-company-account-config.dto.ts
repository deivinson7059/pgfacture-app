import { IsString, IsNumber, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateCompanyAccountConfigDto {
    @IsString()
    @IsNotEmpty()
    cmpy: string;

    @IsNumber()
    @IsNotEmpty()
    order: number;

    @IsString()
    @IsNotEmpty()
    account_number: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsOptional()
    modules: string;

    @IsString()
    @IsIn(['DB', 'CR', 'DB/CR'])
    type: string;
}