
import { IsString, IsOptional } from 'class-validator';

export class ListCompanyPayrollConfigDto {
    @IsString()
    @IsOptional()
    cmpy: string;
}