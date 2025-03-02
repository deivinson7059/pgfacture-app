import { Injectable } from '@nestjs/common';
import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TrimInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Recorrer todos los objetos en el body y aplicar trim() en las propiedades de tipo string
    this.trimRequestBody(request.body);

    return next.handle();
  }

  // Función recursiva para recorrer los objetos y hacer trim en las cadenas de texto
  private trimRequestBody(obj: any): void {
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'string') {
        obj[key] = obj[key].trim();  // Eliminar espacios de la cadena
      } else if (obj[key] && typeof obj[key] === 'object') {
        this.trimRequestBody(obj[key]);  // Recursión para objetos anidados
      }
    }
  }
}
