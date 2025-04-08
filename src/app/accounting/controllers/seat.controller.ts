import { Controller, Get, Post, Body, Query, Param, ClassSerializerInterceptor, UseInterceptors, UsePipes, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';

import { SeatService } from '@accounting/services';

import { ApplyDecorators, CheckCmpy, CheckPeriodOpen, CheckWare, } from '@common/decorators';

import { AccountValidationPipe } from '@accounting/pipes';

import { CrearSeatDto } from '@accounting/dto';
import { ParamSource } from '@common/enums';

@Controller('accounting/seat')
@UseInterceptors(ClassSerializerInterceptor)
export class SeatController {
    constructor(private seatService: SeatService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.BODY),
        CheckWare(ParamSource.BODY),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async crearAsiento(
        @Body(AccountValidationPipe) data: CrearSeatDto,
    ) {
        return this.seatService.crearAsiento(data);
    }

    @Get('resumen')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.QUERY),
        CheckWare(ParamSource.QUERY),
        CheckPeriodOpen(ParamSource.QUERY),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async obtenerResumen(
        @Query('cmpy') cmpy: string,
        @Query('ware') ware: string,
        @Query('year') year: number,
        @Query('per') per: number,
    ) {
        return this.seatService.obtenerResumenPorFechas(cmpy, ware, year, per);
    }

    @Get(':cmpy/codigo/:code')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async obtenerPorCodigo(@Param('cmpy') cmpy: string, @Param('code') code: string) {
        return this.seatService.buscarPorCodigo(cmpy, code);
    }
}