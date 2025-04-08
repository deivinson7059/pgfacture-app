import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
    private readonly logger = new Logger('ErrorInterceptor');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            catchError(error => {
                // Obtener información de la solicitud para el log
                const request = context.switchToHttp().getRequest();
                const { ip, method, originalUrl } = request;
                const userAgent = request.get('user-agent') || 'unknown';

                // Crear mensaje de log con información relevante (sin datos sensibles)
                const requestInfo = `${method} ${originalUrl} - ${ip} - ${userAgent}`;

                if (error instanceof HttpException) {
                    // Si es un error HTTP, mantenerlo pero registrar en log
                    this.logger.error(`${requestInfo} - ${error.message}`, error.stack);
                    return throwError(() => error);
                }

                // Para errores de base de datos o con información sensible, crear respuesta genérica
                // y registrar el error real internamente
                this.logger.error(
                    `${requestInfo} - ${error.message || 'Unknown error'}`,
                    error.stack,
                );

                // Sanitizar mensajes de error para no exponer información sensible
                const sanitizedError = this.sanitizeError(error);

                // Devolver un error genérico para producción
                return throwError(() => new HttpException(
                    {
                        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                        message: sanitizedError,
                        error: 'Internal Server Error',
                    },
                    HttpStatus.INTERNAL_SERVER_ERROR,
                ));
            }),
        );
    }

    private sanitizeError(error: any): string {
        // En producción, no mostrar mensajes de error internos
        if (process.env.NODE_ENV === 'production') {
            return 'Ha ocurrido un error en el servidor';
        }

        const errorMsg = error.message || 'Unknown error';

        // Sanitizar información sensible en mensajes de error
        return errorMsg
            .replace(/password=[\w\d]+/g, 'password=[REDACTED]')
            .replace(/token=[\w\d.]+/g, 'token=[REDACTED]')
            .replace(/(secret|key|auth)=[\w\d]+/gi, '$1=[REDACTED]')
            .replace(/at\s+[^)]+\)/g, ''); // Eliminar información de stack trace
    }
}