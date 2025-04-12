import { Controller, Post, Body } from '@nestjs/common';
import { Public } from '@auth/decorators';
import { AuthService } from '@auth/services';
import { CreateUserLoginDto, LoginStep1Dto, LoginStep2Dto, LoginTokenDto } from '@auth/dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('login')
    loginStep1(@Body() loginStep1Dto: LoginStep1Dto) {
        return this.authService.loginStep1(loginStep1Dto);
    }

    @Public()
    @Post('autenticate')
    loginStep2(@Body() loginStep2Dto: LoginStep2Dto) {
        return this.authService.loginStep2(loginStep2Dto);
    }

    @Public()
    @Post('autenticate-token')
    loginWithToken(@Body() loginTokenDto: LoginTokenDto) {
        return this.authService.loginWithToken(loginTokenDto);
    }

    @Public()
    @Post('create')
    createUser(@Body() createUserLoginDto: CreateUserLoginDto) {
        return this.authService.createUser(createUserLoginDto);
    }
}