import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateCompanyPayrollConfigDto {
    @IsString()
    @IsNotEmpty()
    cmpy: string;

    @IsString()
    @IsNotEmpty()
    concept: string;

    @IsString()
    @IsNotEmpty()
    db_account: string;

    @IsString()
    @IsNotEmpty()
    db_description: string;

    @IsString()
    @IsOptional()
    cr_account?: string;

    @IsString()
    @IsOptional()
    cr_description?: string;

    @IsString()
    @IsIn(['DB', 'CR', 'DB/CR'])
    @IsNotEmpty()
    type: string;

    @IsString()
    @IsIn(['Empleado', 'EPS/Fondo'])
    @IsNotEmpty()
    third_type: string;
}