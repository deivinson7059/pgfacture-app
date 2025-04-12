import { IsString, IsNumber, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateCompanyAccountConfigDto {
    @IsString()
    @IsNotEmpty()
    cmpy: string;

    @IsNumber()
    @IsNotEmpty()
    level: number;

    @IsString()
    @IsOptional()
    account_number: string;

    @IsString()
    @IsOptional()
    description: string;

    @IsString()
    @IsOptional()
    modules: string;

    @IsString()
    @IsIn(['DB', 'CR', 'DB/CR'])
    @IsOptional()
    type: string;
}