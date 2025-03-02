import { IsNotEmpty, IsString, IsInt, Min, Max, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePeriodDto {
  @IsNotEmpty()
  @IsString()
  cmpy: string;

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  year: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(13)
  @Type(() => Number)
  per: number;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsDateString()
  start_date: string;

  @IsNotEmpty()
  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsBoolean()
  is_closing_period?: boolean;

  @IsNotEmpty()
  @IsString()
  creation_by: string;
}

export class CreateYearPeriodsDto {
  @IsNotEmpty()
  @IsString()
  cmpy: string;

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  year: number;

  @IsNotEmpty()
  @IsString()
  creation_by: string;
}