import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserLoginDto, LoginStep1Dto, LoginStep2Dto, LoginTokenDto } from './dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    loginStep1(@Body() loginStep1Dto: LoginStep1Dto) {
        return this.authService.loginStep1(loginStep1Dto);
    }

    @Post('autenticate')
    loginStep2(@Body() loginStep2Dto: LoginStep2Dto) {
        return this.authService.loginStep1(loginStep2Dto);
    }

    @Post('autenticate-token')
    loginWithToken(@Body() loginTokenDto: LoginTokenDto) {
        return this.authService.loginWithToken(loginTokenDto);
    }

    @Post('create')
    createUser(@Body() createUserLoginDto: CreateUserLoginDto) {
        return this.authService.createUser(createUserLoginDto);
    }

}