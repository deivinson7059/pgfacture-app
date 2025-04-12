import { Controller, Post, Body, UseInterceptors, ClassSerializerInterceptor, UsePipes, ValidationPipe, HttpCode, HttpStatus, } from '@nestjs/common';
import { Public } from '@auth/decorators';
import { UserService } from '@auth/services';
import { CreateUserLoginDto } from '@auth/dto';
import { ApplyDecorators } from '@common/decorators';

@Controller('auth/users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
    constructor(private readonly usersService: UserService) { }

    @Public()
    @Post('create')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    createUser(@Body() createUserLoginDto: CreateUserLoginDto) {
        return this.usersService.createUser(createUserLoginDto);
    }


}