import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class SearchPucDto {
    @IsString()
    @IsNotEmpty()
    account: string;

    @IsNotEmpty()
    @IsString()
    @Length(1, 10)
    cmpy: string;
}
