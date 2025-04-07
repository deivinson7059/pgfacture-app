import { IsOptional, IsString, Length, IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateNoteStatusDto {
    @IsNotEmpty()
    @IsString()
    id: string;

    @IsNotEmpty()
    @IsEnum(['P', 'C', 'R', 'X'], { message: 'Estado debe ser P: Pendiente, C: Aprobado, R: Rechazado, X: Anulado' })
    status: string;

    @IsNotEmpty()
    @IsString()
    @Length(1, 30)
    updated_by: string;

    @IsOptional()
    @IsString()
    @Length(0, 500)
    comments?: string;
}