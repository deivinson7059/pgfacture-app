import { IsString, IsDateString, IsNotEmpty, IsInt, Max, Min } from 'class-validator';

export class GenerarNiifReporteDto {
    @IsNotEmpty()
    @IsString()
    cmpy: string;

    @IsNotEmpty()
    @IsString()
    ware: string;

    @IsNotEmpty()
    @IsInt()
    year: number;

    @IsNotEmpty()
    @IsInt()
    @Min(1, { message: 'El período debe estar entre 1 y 13.' })
    @Max(13, { message: 'El período debe estar entre 1 y 13.' })
    per: number;
}