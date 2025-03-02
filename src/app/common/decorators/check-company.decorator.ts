import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';
import { CheckCompanyGuard } from '../guards';
import { ParamSource } from '../enums';

/**
 * Decorador que verifica si la compañía existe
 * Permite especificar si el parámetro cmpy viene de params, body o query
 * 
 * @param source - Fuente de donde se tomará el parámetro cmpy
 * 
 * @example
 * // Para parámetro de ruta
 * @Get(':cmpy')
 * @CheckCompanyExists()
 * async findAll(...) { ... }
 * 
 * // Para parámetro en el body
 * @Post()
 * @CheckCompanyExists(ParamSource.BODY)
 * async create(@Body() data: CreateDto) { ... }
 * 
 * // Para parámetro en query
 * @Get()
 * @CheckCompanyExists(ParamSource.QUERY)
 * async getReport(@Query() query) { ... }
 */
export function CheckCmpy(source: ParamSource = ParamSource.PARAMS) {
  return applyDecorators(
    SetMetadata('paramSource', source),
    UseGuards(CheckCompanyGuard)
  );
}