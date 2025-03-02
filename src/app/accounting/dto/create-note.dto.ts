// src/app/accounting/dto/create-accounting-note.dto.ts
import { IsNotEmpty, IsString, IsInt, Min, Max, IsOptional, Length, ValidateNested, ArrayMinSize, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { NoteLineDto } from '.';

export class CreateNoteDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 10)
  cmpy: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 190)
  ware: string;

  @IsNotEmpty()
  @IsInt()
  year: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(13)
  per: number;

  @IsOptional()
  @IsString()
  @Length(0, 60)
  customer?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  customer_name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  reference?: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 30)
  creation_by: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => NoteLineDto)
  lines: NoteLineDto[];
}