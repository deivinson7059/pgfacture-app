import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ResponseData {
    message?: string;
    data?: any;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((responseData: any) => {
                const response = context.switchToHttp().getResponse();
                const statusCode = response.statusCode;

                // Si responseData es null o undefined, establecemos un objeto vacío
                const data = responseData || {};

                // Manejamos diferentes formatos de respuesta
                let formattedData: ResponseData = {};

                if (Array.isArray(data)) {
                    // Si es un array, lo tratamos como data directamente
                    formattedData = {
                        message: 'Operation successful',
                        data: data
                    };
                } else if (typeof data === 'object') {
                    // Si es un objeto, verificamos su estructura
                    formattedData = {
                        message: data.message || 'Operation successful',
                        data: data.data || (data.message ? undefined : data)
                    };
                } else {
                    // Si es un valor primitivo, lo tratamos como data
                    formattedData = {
                        message: 'Operation successful',
                        data: data
                    };
                }

                // Construimos la respuesta base
                const baseResponse = {
                    code: statusCode,
                    success: true,
                    messages: {
                        success: formattedData.message,
                    },
                };

                // Solo añadimos el campo data si no es null o undefined
                if (formattedData.data !== null && formattedData.data !== undefined) {
                    return {
                        ...baseResponse,
                        data: formattedData.data,
                    };
                }

                return baseResponse;
            }),
        );
    }
}