import { IsNotEmpty, IsString, IsInt, Min, Max, IsOptional, Length, ValidateNested, ArrayMinSize, IsArray, IsIn, IsBoolean, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { NoteLineDto } from './create-note-line.dto';

export class EditNoteDto {
    @IsNotEmpty()
    @IsString()
    @Length(1, 10)
    cmpy: string;

    @IsNotEmpty()
    @IsString()
    @Length(1, 190)
    ware: string;

    @IsOptional()
    @IsInt()
    year?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(13)
    per?: number;

    @IsNotEmpty()
    @IsDateString()
    date: string;

    @IsNotEmpty()
    @IsString()
    @Length(0, 60)
    customer: string;

    @IsOptional()
    @IsString()
    @Length(0, 200)
    customer_name?: string;

    @IsOptional()
    @IsString()
    @Length(0, 190)
    reference?: string;

    @IsOptional()
    @IsString()
    @Length(0, 50)
    cost_center?: string;

    @IsNotEmpty()
    @IsString()
    @Length(1, 30)
    updated_by: string;

    @IsNotEmpty()
    @IsString()
    @Length(0, 1000)
    edit_comments: string; // Comentario que explica los cambios realizados

    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @Type(() => NoteLineDto)
    lines: NoteLineDto[];
}