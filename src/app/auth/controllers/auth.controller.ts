import { Controller, Post, Body, UseInterceptors, ClassSerializerInterceptor, HttpCode, ValidationPipe, UsePipes, HttpStatus, Request, Delete, UseGuards } from '@nestjs/common';
import { Public } from '@auth/decorators';
import { CreateUserLoginDto, LoginDto, AutenticateDto, AutenticateTokenDto } from '@auth/dto';
import { AuthService } from '@auth/services';
import { ApplyDecorators } from '@common/decorators';
import { JwtAuthGuard } from '@auth/guards';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    login(@Body() loginStep1Dto: LoginDto) {
        return this.authService.login(loginStep1Dto);
    }

    @Public()
    @Post('autenticate')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    autenticate(@Body() autenticateDto: AutenticateDto) {
        return this.authService.autenticate(autenticateDto);
    }

    @Public()
    @Post('autenticate-token')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    autenticateToken(@Body() autenticateTokenDto: AutenticateTokenDto) {
        return this.authService.autenticateToken(autenticateTokenDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('logout')
    @HttpCode(HttpStatus.OK)
    logout(@Request() req) {
        const authHeader = req.headers.authorization;
        const token = authHeader.split(' ')[1]; // Extraer el token JWT
        return this.authService.logout(token);
    }
}