import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformService } from '../services/platform.service';
import { IS_PUBLIC_KEY } from '@auth/decorators';

@Injectable()
export class PlatformGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private platformService: PlatformService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest();

        // Obtener platform_id del header
        const platformIdHeader = request.headers['platform-id'];

        // Si no se proporciona, validar contra el user-agent
        if (!platformIdHeader) {
            const userAgent = request.headers['user-agent'];
            if (!userAgent) {
                throw new UnauthorizedException('Información de plataforma no proporcionada');
            }

            // Detectar automáticamente la plataforma
            request.platformId = await this.platformService.identifyPlatform(userAgent);
            return true;
        }

        // Si se proporciona, validar que sea un valor válido
        const platformId = Number(platformIdHeader);
        if (isNaN(platformId)) {
            throw new UnauthorizedException('ID de plataforma inválido');
        }

        // Verificar que la plataforma exista
        const platform = await this.platformService.findById(platformId);
        if (!platform) {
            throw new UnauthorizedException('Plataforma no reconocida');
        }

        // Añadir el platform_id al request
        request.platformId = platformId;

        return true;
    }
}