import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPES_KEY } from '../decorators/scopes.decorator';

@Injectable()
export class ScopesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredScopes = this.reflector.getAllAndOverride<string[]>(SCOPES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredScopes || requiredScopes.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user || !user.scopes) {
            throw new ForbiddenException('Usuario sin permisos');
        }

        // Verificar si el usuario tiene al menos uno de los scopes requeridos
        const hasRequiredScope = requiredScopes.some((scope) =>
            user.scopes.includes(scope)
        );

        if (!hasRequiredScope) {
            throw new ForbiddenException(`Acceso denegado: Se requieren los permisos ${requiredScopes.join(', ')}`);
        }

        return true;
    }
}