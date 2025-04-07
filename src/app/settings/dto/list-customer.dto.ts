import { IsOptional, IsString } from 'class-validator';

export class ListCustomerDto {
    @IsString()
    @IsOptional()
    cmpy: string;

    @IsString()
    @IsOptional()
    identification_number: string;
}