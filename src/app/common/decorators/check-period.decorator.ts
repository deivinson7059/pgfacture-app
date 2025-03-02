import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';
import { CheckPeriodGuard } from '../guards';
import { ParamSource } from '../enums';

/**
 * Decorador que verifica si el periodo existe y está abierto
 * Permite especificar si los parámetros vienen de params, body o query
 * 
 * @param source - Fuente de donde se tomarán los parámetros cmpy, year y per
 * 
 * @example
 * // Para parámetros de ruta
 * @Get(':cmpy/:year/:per')
 * @CheckPeriodOpen()
 * async getBalance(...) { ... }
 * 
 * // Para parámetros en el body
 * @Post()
 * @CheckPeriodOpen(ParamSource.BODY)
 * async createEntry(@Body() data: EntryDto) { ... }
 * 
 * // Para parámetros en query
 * @Get()
 * @CheckPeriodOpen(ParamSource.QUERY)
 * async getReport(@Query() query) { ... }
 */
export function CheckPeriodOpen(source: ParamSource = ParamSource.PARAMS) {
  return applyDecorators(
    SetMetadata('paramSource', source),
    UseGuards(CheckPeriodGuard)
  );
}