import { applyDecorators } from "@nestjs/common";

/**
 * Función utilitaria que permite aplicar múltiples decoradores en una secuencia específica.
 * Se ejecutarán en el orden en que se especifican (de arriba a abajo).
 * 
 * @param decorators - Lista de decoradores a aplicar en secuencia
 * @returns Un decorador compuesto que aplica todos los decoradores en orden
 * 
 * @example
 * // Aplicar decoradores en orden: primero CheckCmpy, luego CheckWare, después CheckPeriodOpen
 * @ApplyDecorators([
 *   CheckCmpy(ParamSource.BODY),
 *   CheckWare(ParamSource.BODY),
 *   CheckPeriodOpen(ParamSource.BODY),
 *   UsePipes(new ValidationPipe({ transform: true }))
 * ])
 * async crearAsiento(...) { ... }
 */
export function ApplyDecorators(decorators: Array<MethodDecorator | ClassDecorator>) {
    return applyDecorators(...decorators);
}
  