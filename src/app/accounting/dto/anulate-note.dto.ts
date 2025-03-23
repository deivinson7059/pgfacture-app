import { IsNotEmpty, IsString, Length } from 'class-validator';

export class AnulateNoteDto {
    @IsNotEmpty()
    @IsString()
    @Length(1, 30)
    updated_by: string;

    @IsNotEmpty()
    @IsString()
    @Length(5, 500)
    justification: string; // Justificación obligatoria para anular la nota
}