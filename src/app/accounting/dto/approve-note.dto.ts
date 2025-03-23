import { IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';

export class ApproveNoteDto {
    @IsNotEmpty()
    @IsString()
    @Length(1, 30)
    approved_by: string;

    @IsOptional()
    @IsString()
    @Length(0, 500)
    comments?: string; // Comentario opcional sobre la aprobación
}