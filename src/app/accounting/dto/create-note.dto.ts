import { IsNotEmpty, IsString, IsInt, Min, Max, IsOptional, Length, ValidateNested, ArrayMinSize, IsArray, IsIn, IsBoolean, IsDateString, IsNumber } from 'class-validator';
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
    @IsDateString()
    date: string;

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
    @Length(0, 190)
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

    // Campos adicionales
    @IsOptional()
    @IsString()
    @Length(0, 1000)
    observations?: string;

    @IsOptional()
    @IsString()
    @Length(0, 190)
    external_reference?: string;

    @IsOptional()
    @IsString()
    @Length(0, 50)
    doc_type?: string;

    @IsOptional()
    @IsString()
    @Length(0, 50)
    cost_center?: string;

    @IsOptional()
    @IsString()
    @Length(1, 1)
    @IsIn(['A', 'M', 'N', 'B'])
    priority?: string;

    @IsOptional()
    @IsBoolean()
    auto_accounting?: boolean;
}