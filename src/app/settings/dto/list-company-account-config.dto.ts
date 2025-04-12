import { IsString, IsOptional } from 'class-validator';

export class ListCompanyAccountConfigDto {
    @IsString()
    @IsOptional()
    cmpy: string;
}