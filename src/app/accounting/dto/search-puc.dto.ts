import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class SearchPucDto {
    @IsString()
    @Matches(/^(?!0{1,10}$)([1-9]{1}[0-9]{0,9})$/, { message: 'La cuenta debe ser un número entero de entre 1 y 10 dígitos, y no puede comenzar con ceros ni ser solo ceros' })
    account: string;

    @IsNotEmpty()
    @IsString()
    @Length(1, 10)
    cmpy: string;
}
