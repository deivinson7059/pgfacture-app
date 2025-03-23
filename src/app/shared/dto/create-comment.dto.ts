import { IsNotEmpty, IsString, Length, IsBoolean, IsOptional } from 'class-validator';

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

    @IsOptional()
    @IsString()
    @Length(1, 60)
    ref2: string | null;

    @IsNotEmpty()
    @IsString()
    @Length(1, 120)
    module: string;

    @IsNotEmpty()
    @IsString()
    @Length(1, 500)
    comment: string;

    @IsNotEmpty()
    @IsString()
    @Length(1, 350)
    user_enter: string;

    @IsOptional()
    @IsBoolean()
    private?: boolean;

    @IsOptional()
    @IsBoolean()
    system_generated?: boolean;
}