import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';
import { CheckSucursalGuard } from '../guards';
import { ParamSource } from '../enums';

/**
 * Decorador que verifica si la sucursal existe y pertenece a la compañía
 * Permite especificar si los parámetros cmpy y ware vienen de params, body o query
 * 
 * @param source - Fuente de donde se tomarán los parámetros cmpy y ware
 * 
 * @example
 * // Para parámetros de ruta
 * @Get(':cmpy/:ware')
 * @CheckSucursalExists()
 * async findOne(...) { ... }
 * 
 * // Para parámetros en el body
 * @Post()
 * @CheckSucursalExists(ParamSource.BODY)
 * async create(@Body() data: CreateDto) { ... }
 * 
 * // Para parámetros en query
 * @Get()
 * @CheckSucursalExists(ParamSource.QUERY)
 * async getItems(@Query() query) { ... }
 */
export function CheckWare(source: ParamSource = ParamSource.PARAMS) {
  return applyDecorators(
    SetMetadata('paramSource', source),
    UseGuards(CheckSucursalGuard)
  );
}