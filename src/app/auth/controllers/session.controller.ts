import { Controller, Get, Post, Delete, Param, UseGuards, UseInterceptors, ClassSerializerInterceptor, HttpCode, HttpStatus, Request } from '@nestjs/common';
import { Public } from '@auth/decorators';
import { JwtAuthGuard } from '@auth/guards';
import { SessionService } from '@auth/services';
import { apiResponse } from '@common/interfaces';
import { Session } from '@auth/entities';

@Controller('auth/sessions')
@UseInterceptors(ClassSerializerInterceptor)
export class SessionController {
    constructor(private readonly sessionService: SessionService) { }

    @UseGuards(JwtAuthGuard)
    @Get('active')
    @HttpCode(HttpStatus.OK)
    async getActiveSessions(@Request() req): Promise<apiResponse<Session[]>> {
        return this.sessionService.getUserActiveSessions(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Request() req): Promise<apiResponse<void>> {
        const authHeader = req.headers.authorization;
        const token = authHeader.split(' ')[1]; // Extraer el token JWT del header
        return this.sessionService.closeSession(token);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('logout/all')
    @HttpCode(HttpStatus.OK)
    async logoutAll(@Request() req): Promise<apiResponse<void>> {
        return this.sessionService.closeAllUserSessions(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async closeSpecificSession(
        @Param('id') sessionId: string,
        @Request() req
    ): Promise<apiResponse<void>> {
        // Implementar lógica para cerrar una sesión específica
        // Esto requerirá una modificación en SessionService para permitir cerrar por ID
        throw new Error('Método no implementado');
    }

    // Este endpoint es para propósitos administrativos y debe estar protegido adecuadamente
    @Public()
    @Post('cleanup')
    @HttpCode(HttpStatus.OK)
    async cleanupInactiveSessions(): Promise<apiResponse<void>> {
        return this.sessionService.cleanupExpiredSessions(); // Limpiar sesiones inactivas de más de 30 días
    }
}