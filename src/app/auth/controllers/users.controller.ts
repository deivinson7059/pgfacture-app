import { Controller, Post, Body, UseInterceptors, ClassSerializerInterceptor, UsePipes, ValidationPipe, HttpCode, HttpStatus, Param, Get, Delete, } from '@nestjs/common';
import { Public } from '@auth/decorators';
import { UserService } from '@auth/services';
import { AssignUserWareDto, CreateUserLoginDto } from '@auth/dto';
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

    @Public()
    @Post('ware')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    assignWareToUser(@Body() assignUserWareDto: AssignUserWareDto) {
        return this.usersService.assignWareToUser(assignUserWareDto);
    }

    @Public()
    @Get('wares/:identification')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    getUserWares(@Param('identification') identification: string) {
        return this.usersService.getUserWareAssignments(identification);
    }

    @Public()
    @Delete('ware/:cmpy/:ware/:identification')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    removeUserWare(
        @Param('identification') identification: string,
        @Param('cmpy') cmpy: string,
        @Param('ware') ware: string
    ) {
        return this.usersService.removeUserWareAssignment(identification, cmpy, ware);
    }


}