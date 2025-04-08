import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Logger } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    private readonly logger = new Logger(JwtAuthGuard.name);

    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        // Verificar si la ruta está marcada como pública
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Si la ruta es pública, permite el acceso sin verificar JWT
        if (isPublic) {
            return true;
        }

        // De lo contrario, ejecuta la verificación JWT estándar
        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        // Obtener información de la solicitud para registro
        const request = context.switchToHttp().getRequest();
        const { method, url, ip } = request;

        // Si hay un error o no hay usuario (token inválido/expirado)
        if (err || !user) {
            // Registrar el intento fallido
            const message = info?.message || 'Unauthorized access attempt';
            this.logger.warn(`${method} ${url} - ${ip} - ${message}`);

            throw new UnauthorizedException('No está autorizado para acceder a este recurso');
        }

        // Registrar acceso exitoso
        this.logger.debug(`Authenticated user ${user.username} - ${method} ${url} - ${ip}`);

        // Agregar información de usuario a la solicitud
        return user;
    }
}