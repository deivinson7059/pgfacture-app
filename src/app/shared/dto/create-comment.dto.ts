import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateCommentDto {
    @IsNotEmpty()
    @IsString()
    @Length(1, 10)
    cmpy: string;

    @IsNotEmpty()
    @IsString()
    @Length(1, 250)
    ware: string;

    @IsNotEmpty()
    @IsString()
    @Length(1, 60)
    ref: string;

    @IsNotEmpty()
    @IsString()
    @Length(1, 120)
    table: string;

    @IsNotEmpty()
    @IsString()
    @Length(1, 500)
    comment: string;

    @IsNotEmpty()
    @IsString()
    @Length(1, 300)
    enter: string;

    @IsNotEmpty()
    @IsString()
    @Length(1, 350)
    user_enter: string;
}